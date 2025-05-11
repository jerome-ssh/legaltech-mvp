import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { createClient } from '@supabase/supabase-js';

// Add proper headers to all responses
const jsonResponse = (data: any, status = 200) => {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export async function POST(request: Request) {
  try {
    // Get user ID from Clerk
    const { userId } = auth();
    if (!userId) {
      console.error('No user ID found in request');
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Parse form data
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('Error parsing form data:', error);
      return jsonResponse({ error: 'Invalid form data' }, 400);
    }

    // Get file from form data
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      console.error('No file found in form data or invalid file type');
      return jsonResponse({ error: 'No file provided or invalid file type' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type:', file.type);
      return jsonResponse({ error: 'File must be an image' }, 400);
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('File too large:', file.size);
      return jsonResponse({ error: 'File size must be less than 5MB' }, 400);
    }

    // Generate unique filename with user ID
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    console.log('Starting file upload:', {
      fileName,
      fileType: file.type,
      fileSize: file.size,
      userId
    });

    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return jsonResponse({ error: uploadError.message }, 500);
    }

    if (!data?.path) {
      console.error('No path returned from upload');
      return jsonResponse({ error: 'Upload succeeded but no path returned' }, 500);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      console.error('No public URL returned');
      return jsonResponse({ error: 'Failed to get public URL for uploaded avatar' }, 500);
    }

    console.log('Upload successful:', {
      path: data.path,
      publicUrl: publicUrlData.publicUrl
    });

    return jsonResponse({ 
      success: true, 
      url: publicUrlData.publicUrl 
    });

  } catch (error) {
    console.error('Unexpected error in avatar upload:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to upload avatar' },
      500
    );
  }
} 