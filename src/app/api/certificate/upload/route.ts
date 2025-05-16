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

    // Check that the professional ID belongs to the user
    const { data: professionalIdData, error: professionalIdError } = await supabase
      .from('professional_ids')
      .select('id')
      .eq('id', professionalId)
      .eq('profile_id', profileData.id)
      .single();

    if (professionalIdError || !professionalIdData) {
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

    // Update professional ID record with document URL and name
    const { error: updateError } = await supabase
      .from('professional_ids')
      .update({
        document_url: publicUrlData.publicUrl,
        document_name: file.name,
        // If a document is uploaded, we assume no_id is false
        no_id: false
      })
      .eq('id', professionalId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update professional ID with document URL' },
        { status: 500 }
      );
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