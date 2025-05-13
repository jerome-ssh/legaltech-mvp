"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import { Loader2, Pencil, Trash, X, Camera, UserCircle2, Phone, MapPin, Building, Briefcase } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import 'react-image-crop/dist/ReactCrop.css';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  phone_number?: string;
  address?: string;
  firm_name?: string;
  specialization?: string;
  bar_number?: string;
  years_of_practice?: number;
  created_at: string;
  updated_at: string;
}

const supabase = createClientComponentClient();

const centerAspectCrop = (mediaWidth: number, mediaHeight: number, aspect: number) => {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
};

export default function ProfileSettings() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Image cropping state
  const [showCrop, setShowCrop] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect] = useState<number>(1);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoaded || !user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        setFormData(data || {});
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isLoaded, user]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
        setShowCrop(true);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current || !user) return;

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
      const fileName = `${user.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setShowCrop(false);
      setPreviewUrl(null);
      setCrop(undefined);
      setCompletedCrop(undefined);

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError('Failed to upload profile picture');
      toast({
        title: 'Error',
        description: 'Failed to upload profile picture',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePicture = async () => {
    if (!user) return;
    
    try {
      setUploading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
      
      toast({
        title: 'Success',
        description: 'Profile picture deleted successfully',
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to delete profile picture',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      setUploading(true);
      setError(null);

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...formData
        });

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md">
                {error}
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="relative">
                {profile?.avatar_url ? (
                  <div className="relative w-24 h-24">
                    <Image
                      src={profile.avatar_url}
                      alt="Profile picture"
                      width={96}
                      height={96}
                      className="rounded-full object-cover"
                    />
                    <button
                      onClick={handleDeletePicture}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <UserCircle2 className="w-24 h-24 text-gray-400" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="hidden"
                  disabled={uploading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600"
                  disabled={uploading}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {showCrop && previewUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Crop Image</h3>
                      <button
                        onClick={() => {
                          setShowCrop(false);
                          setPreviewUrl(null);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="relative aspect-square overflow-hidden rounded-lg">
                      <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspect}
                      >
                        <Image
                          ref={imgRef}
                          alt="Crop me"
                          src={previewUrl}
                          width={400}
                          height={400}
                          onLoad={(e) => {
                            const { width, height } = e.currentTarget;
                            setCrop(centerAspectCrop(width, height, aspect));
                          }}
                        />
                      </ReactCrop>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCrop(false);
                          setPreviewUrl(null);
                        }}
                        disabled={uploading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCropComplete}
                        disabled={uploading || !completedCrop}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </div>
                    <canvas
                      ref={previewCanvasRef}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-2xl font-semibold">{user?.fullName || 'User'}</h2>
                <p className="text-gray-500">{user?.emailAddresses[0]?.emailAddress}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4" /> Phone Number
                </label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone_number"
                  value={formData.phone_number || ''}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  disabled={!isEditing || uploading}
                />
              </div>

              <div>
                <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4" /> Address
                </label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, State, ZIP"
                  disabled={!isEditing || uploading}
                />
              </div>

              <div>
                <label htmlFor="firm" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Building className="w-4 h-4" /> Law Firm
                </label>
                <Input
                  type="text"
                  id="firm"
                  name="firm_name"
                  value={formData.firm_name || ''}
                  onChange={handleInputChange}
                  placeholder="Law Firm Name"
                  disabled={!isEditing || uploading}
                />
              </div>

              <div>
                <label htmlFor="specialization" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Briefcase className="w-4 h-4" /> Specialization
                </label>
                <Input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Criminal Law, Family Law"
                  disabled={!isEditing || uploading}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    disabled={uploading}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 