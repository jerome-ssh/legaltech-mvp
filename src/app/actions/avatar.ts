'use server';

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

export async function uploadAvatar(formData: FormData) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Generate unique filename with user ID
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    console.log('Uploading avatar:', {
      fileName,
      fileType: file.type,
      fileSize: file.size,
      userId
    });

    // Convert File to ArrayBuffer
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
      console.error('Avatar upload error:', uploadError);
      throw new Error(uploadError.message);
    }

    if (!data?.path) {
      throw new Error('Upload succeeded but no path returned');
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded avatar');
    }

    // Update user's profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq('clerk_id', userId);

    if (updateError) {
      throw new Error('Failed to update profile with new avatar URL');
    }

    return { success: true, url: publicUrlData.publicUrl };
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }
} 