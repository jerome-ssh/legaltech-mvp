const handleCropComplete = async () => {
  if (!completedCrop || !previewCanvasRef.current || !imgRef.current || !profile || !clerkUser) return;

  try {
    setUploading(true);
    setError(null);

    const canvas = previewCanvasRef.current;
    const img = imgRef.current;

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
    );

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', 0.95);
    });

    const file = new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' });

    // Use the avatar service to upload the file
    const result = await uploadAvatar(file, clerkUser.id);

    if (result.success) {
      // Update local state with the new avatar URL
      setProfile(prev => prev ? { ...prev, avatar_url: result.url } : null);
      setFormData(prev => ({ ...prev, avatar_url: result.url }));
      setLastAvatarUpdate(Date.now());
      setShowCrop(false);
      setPreviewUrl(null);
      setCrop(undefined);
      setCompletedCrop(undefined);

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      });
    }
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    setError(error instanceof Error ? error.message : 'Failed to upload profile picture');
    toast({
      title: 'Error',
      description: 'Failed to upload profile picture. Please try again.',
      variant: 'destructive',
    });
  } finally {
    setUploading(false);
  }
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!clerkUser) return;

  setUploading(true);
  try {
    // Prepare the payload to match the API route
    const payload: any = { // Use any for now to allow conditional properties
      firmName: formData.firm_name,
      specialization: formData.specialization,
      years_of_practice: parseInt(formData.years_of_practice) || 0, // Ensure it's a number
      address: formData.address,
      homeAddress: formData.home_address,
      gender: formData.gender,
      professionalIds: professionalIds, // send as-is
      firstName: formData.first_name,
      lastName: formData.last_name,
      onboarding_completed: formData.onboarding_completed === 'Yes' || formData.onboarding_completed === true,
      role: roleId ? (roles.find(r => r.id === roleId)?.name || 'attorney') : 'attorney',
      email: formData.email,
      phoneNumber: formData.phone_number
    };

    // ONLY include avatarUrl in the payload if it's not null or empty
    if (formData.avatar_url) {
      payload.avatarUrl = formData.avatar_url;
    }

    console.log('Submitting profile update to API:', payload);

    const response = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      // Handle successful response
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } else {
      // Handle error
      console.error('Error updating profile:', response.statusText);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    toast({
      title: 'Error',
      description: 'Failed to update profile. Please try again.',
      variant: 'destructive',
    });
  } finally {
    setUploading(false);
  }
};

<Input
  name="years_of_practice"
  value={formData.years_of_practice || ''}
  onChange={handleInputChange}
  placeholder="Years of Practice"
  className="bg-white text-black dark:bg-white dark:text-black"
  disabled={!isEditing || uploading}
/> 