import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from '@/components/ui/use-toast';

export async function uploadAvatar(file: File, userId: string) {
  const supabase = createClientComponentClient();
  
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    console.log('Starting avatar upload:', {
      fileName,
      fileType: file.type,
      fileSize: file.size,
      userId
    });

    // Start a transaction
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    // Upload to Supabase Storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload avatar: ${uploadError.message}`);
    }

    if (!uploadData?.path) {
      throw new Error('Upload succeeded but no path returned');
    }

    // Get public URL
    const { data: urlData, error: urlError } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path);

    if (urlError || !urlData?.publicUrl) {
      // If getting URL fails, try to delete the uploaded file
      await supabase.storage
        .from('avatars')
        .remove([fileName]);
      throw new Error('Failed to get public URL for uploaded avatar');
    }

    // Update profile with new avatar URL using the stored procedure
    const { error: updateError } = await supabase.rpc('update_profile_with_related', {
      p_clerk_user_id: userId,
      p_avatar_url: urlData.publicUrl,
      p_onboarding_completed: true
    });

    if (updateError) {
      // If profile update fails, try to delete the uploaded file
      await supabase.storage
        .from('avatars')
        .remove([fileName]);
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    // Return the base URL without any cache-busting parameters
    const baseUrl = urlData.publicUrl.split('?')[0];
    return {
      success: true,
      url: baseUrl
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }
}

export async function deleteAvatar(userId: string, currentAvatarUrl: string | null) {
  const supabase = createClientComponentClient();
  
  try {
    // Delete the file from storage if it exists
    if (currentAvatarUrl) {
      const fileName = currentAvatarUrl.split('/').pop()?.split('?')[0];
      if (fileName) {
        console.log('Deleting avatar file:', fileName);
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([fileName]);
        
        if (deleteError) {
          console.warn('Error deleting avatar from storage:', deleteError);
          // Continue anyway, as we still want to update the profile
        }
      }
    }

    // Update profile to remove avatar URL using the stored procedure
    const { error: updateError } = await supabase.rpc('update_profile_with_related', {
      p_clerk_user_id: userId,
      p_avatar_url: null,
      p_onboarding_completed: true
    });

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Avatar deletion error:', error);
    throw error;
  }
} 