import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs";
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the profile ID for the current user
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const professionalId = formData.get('professionalId') as string;
    const parentId = formData.get('parentId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!professionalId) {
      return NextResponse.json(
        { success: false, error: 'No professional ID provided' },
        { status: 400 }
      );
    }

    // Check ownership - handle both direct records and JSONB certifications
    let isOwned = false;
    let parentRecord = null;
    
    // First try to find it as a direct record (legacy approach)
    const { data: directRecord, error: directError } = await supabase
      .from('professional_ids')
      .select('*')
      .eq('id', professionalId)
      .eq('profile_id', profileData.id)
      .single();
      
    if (!directError && directRecord) {
      // Found as direct record
      isOwned = true;
    } else if (parentId) {
      // Try to find it within the parent's certifications array
      const { data: parent, error: parentError } = await supabase
        .from('professional_ids')
        .select('*')
        .eq('id', parentId)
        .eq('profile_id', profileData.id)
        .single();
        
      if (!parentError && parent && parent.certifications) {
        // Check if the certification exists in the parent's array
        const certification = parent.certifications.find((cert: any) => cert.id === professionalId);
        if (certification) {
          isOwned = true;
          parentRecord = parent;
        }
      }
    } else {
      // Try to find any parent record with this certification ID
      const { data: allParents, error: allParentsError } = await supabase
        .from('professional_ids')
        .select('*')
        .eq('profile_id', profileData.id);
        
      if (!allParentsError && allParents) {
        // Check each parent for the certification
        for (const parent of allParents) {
          if (parent.certifications && Array.isArray(parent.certifications)) {
            const certification = parent.certifications.find((cert: any) => cert.id === professionalId);
            if (certification) {
              isOwned = true;
              parentRecord = parent;
              break;
            }
          }
        }
      }
    }

    if (!isOwned) {
      return NextResponse.json(
        { success: false, error: 'Professional ID not found or not owned by user' },
        { status: 404 }
      );
    }

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Supported types: PDF, JPG, JPEG, PNG, DOC, DOCX' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const fileName = `certificate_${userId}_${professionalId}_${Date.now()}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Certificate upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    if (!uploadData?.path) {
      return NextResponse.json(
        { success: false, error: 'Upload succeeded but no path returned' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(uploadData.path);

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to get public URL for uploaded document' },
        { status: 500 }
      );
    }

    // Update record based on the type (direct or JSONB)
    if (parentRecord && parentRecord.certifications) {
      // JSONB approach - update the certification within the array
      const certifications = [...parentRecord.certifications];
      const certIndex = certifications.findIndex((cert: any) => cert.id === professionalId);
      
      if (certIndex >= 0) {
        // Update existing certification
        certifications[certIndex] = {
          ...certifications[certIndex],
          document_url: publicUrlData.publicUrl,
          document_name: file.name
        };
      } else {
        // Add as new certification
        certifications.push({
          id: professionalId,
          document_url: publicUrlData.publicUrl,
          document_name: file.name
        });
      }
      
      // Update the parent record
      const { error: updateError } = await supabase
        .from('professional_ids')
        .update({ 
          certifications: certifications 
        })
        .eq('id', parentRecord.id);

      if (updateError) {
        console.error('Error updating certifications:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update certifications with document URL' },
          { status: 500 }
        );
      }
    } else {
      // Legacy approach - direct update
      const { error: updateError } = await supabase
        .from('professional_ids')
        .update({
          document_url: publicUrlData.publicUrl,
          document_name: file.name,
          no_id: false
        })
        .eq('id', professionalId);

      if (updateError) {
        console.error('Error updating professional ID:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update professional ID with document URL' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: file.name
    });
  } catch (error: any) {
    console.error('Certificate upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 