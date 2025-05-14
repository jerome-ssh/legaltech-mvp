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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import 'react-image-crop/dist/ReactCrop.css';
import LayoutWithSidebar from '@/components/LayoutWithSidebar';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Award, 
  Clock, 
  Star, 
  Users, 
  Zap, 
  Brain, 
  Shield, 
  Target,
  TrendingUp,
  MessageSquare,
  Lightbulb
} from "lucide-react";
import { UserMetrics, updateUserMetrics } from '@/lib/metrics';
import { Skeleton } from '@/components/ui/skeleton';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  language?: string;
  timezone?: string;
  first_name?: string;
  last_name?: string;
  home_address?: string;
  gender?: string;
  role?: string;
  onboarding_completed?: boolean;
}

type ProfileFormData = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  home_address: string;
  gender: string;
  firm_name: string;
  specialization: string;
  years_of_practice: string;
  role: string;
  onboarding_completed: string;
  language: string;
  timezone: string;
};

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

// Role mapping between DB and UI
const dbToUiRole = (dbRole: string) => {
  if (dbRole === 'attorney') return 'Lawyer';
  return dbRole;
};
const uiToDbRole = (uiRole: string) => {
  if (uiRole === 'Lawyer') return 'attorney';
  return uiRole;
};

export default function UserProfile() {
  const { user: clerkUser, isLoaded } = useUser();
  const { toast } = useToast();
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    home_address: '',
    gender: '',
    firm_name: '',
    specialization: '',
    years_of_practice: '',
    role: '',
    onboarding_completed: 'No',
    language: '',
    timezone: '',
  });
  const [loading, setLoading] = useState(true);
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

  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [professionalIds, setProfessionalIds] = useState<any[]>([]);

  // Load profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!isLoaded || !clerkUser) return;
        setLoading(true);
        
        console.log('Current Clerk User ID:', clerkUser.id);
        
        // Try fetching profile with different keys
        const possibleKeys = [
          { key: 'clerk_id', value: clerkUser.id },
          { key: 'id', value: clerkUser.id },
          { key: 'user_id', value: clerkUser.id }
        ];

        let profileData = null;
        let usedKey = '';

        for (const { key, value } of possibleKeys) {
          console.log(`Trying to fetch profile with ${key}:`, value);
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq(key, value)
            .single();

          if (error) {
            console.log(`Error fetching with ${key}:`, error);
            continue;
          }

          if (data) {
            console.log(`Found profile using ${key}:`, data);
            profileData = data;
            usedKey = key;
            break;
          }
        }

        if (profileData) {
          console.log('Setting profile data:', profileData);
          setProfile(profileData as UserProfile);
          setFormData({
            first_name: profileData.first_name ?? '',
            last_name: profileData.last_name ?? '',
            email: profileData.email ?? '',
            phone_number: profileData.phone_number ?? '',
            address: profileData.address ?? '',
            home_address: profileData.home_address ?? '',
            gender: profileData.gender ?? '',
            firm_name: profileData.firm_name ?? '',
            specialization: profileData.specialization ?? '',
            years_of_practice: profileData.years_of_practice !== undefined && profileData.years_of_practice !== null ? String(profileData.years_of_practice) : '',
            role: dbToUiRole(profileData.role || 'attorney'),
            onboarding_completed: profileData.onboarding_completed ? 'Yes' : 'No',
            language: profileData.language ?? '',
            timezone: profileData.timezone ?? '',
          });

          // Fetch professional IDs for this user
          const { data: profIds } = await supabase
            .from('professional_ids')
            .select('*')
            .eq('profile_id', profileData.id);
          setProfessionalIds(profIds || []);

          // Fetch and update metrics
          let channel: RealtimeChannel | undefined;
          try {
            await updateUserMetrics(profileData.id);
            
            // Subscribe to metrics changes
            channel = supabase
              .channel('user_metrics')
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'user_metrics',
                  filter: `user_id=eq.${profileData.id}`
                },
                (payload) => {
                  setMetrics(payload.new as UserMetrics);
                }
              )
              .subscribe();

            // Initial metrics fetch
            const { data: metricsData } = await supabase
              .from('user_metrics')
              .select('*')
              .eq('user_id', profileData.id)
              .single();
            if (metricsData) {
              setMetrics(metricsData as UserMetrics);
            }
          } catch (error) {
            console.log('Metrics not available yet:', error);
            // Set default metrics
            setMetrics({
              profile_completion: 0,
              productivity_score: 0,
              client_feedback: 0,
              time_saved: 0,
              ai_interactions: 0,
              networking_score: 0,
              compliance_score: 0,
              billing_efficiency: 0,
              workflow_efficiency: 0,
              learning_progress: 0,
            });
          }

          return () => {
            channel?.unsubscribe();
          };
        } else {
          console.log('No profile found with any key');
          toast({
            title: 'Error',
            description: 'Profile not found. Please complete your profile setup.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [isLoaded, clerkUser]);

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
      const fileName = `${clerkUser.id}-${Date.now()}.jpg`;

      const session = await supabase.auth.getSession();
      console.log('Supabase session at upload:', session);
      console.log('File name at upload:', fileName);
      console.log('Clerk user ID:', clerkUser.id);

      // First, try to delete any existing avatar
      if (profile.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('avatars')
            .remove([oldFileName])
            .catch(error => console.log('Error deleting old avatar:', error));
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .match({ 
          id: profile.id,
          clerk_id: clerkUser.id 
        });

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

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
        description: 'Failed to upload profile picture. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePicture = async () => {
    if (!profile) return;
    
    try {
      setUploading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id);

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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    try {
      setUploading(true);
      setError(null);
      
      // Only include fields that exist in the database
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        address: formData.address,
        home_address: formData.home_address,
        gender: formData.gender,
        firm_name: formData.firm_name,
        specialization: formData.specialization,
        years_of_practice: formData.years_of_practice ? Number(formData.years_of_practice) : undefined,
        role: uiToDbRole(formData.role),
        onboarding_completed: formData.onboarding_completed === 'Yes',
      };

      console.log('Updating profile with data:', updateData);
      console.log('Using profile ID:', profile.id);

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      if (!updatedProfile) {
        throw new Error('Profile not found after update');
      }

      console.log('Profile updated successfully:', updatedProfile);
      setProfile(prev => prev ? {
        ...prev,
        ...updateData,
        years_of_practice: updateData.years_of_practice !== undefined ? updateData.years_of_practice : prev.years_of_practice,
        onboarding_completed: updateData.onboarding_completed !== undefined ? updateData.onboarding_completed : prev.onboarding_completed,
      } as UserProfile : null);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
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

  // Fallbacks for profile fields
  const displayProfile: Partial<UserProfile> = profile || {};
  const displayMetrics = metrics || {
    profile_completion: 0,
    productivity_score: 0,
    client_feedback: 0,
    time_saved: 0,
    ai_interactions: 0,
    networking_score: 0,
    compliance_score: 0,
    billing_efficiency: 0,
    workflow_efficiency: 0,
    learning_progress: 0,
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-6">
          <Skeleton className="h-[200px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[150px] w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <LayoutWithSidebar>
      <div className="container mx-auto py-8 space-y-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  {displayProfile.avatar_url ? (
                    <div className="relative w-24 h-24">
                      <Image
                        src={displayProfile.avatar_url}
                        alt="Profile picture"
                        width={96}
                        height={96}
                        className="rounded-full object-cover"
                        priority
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

                <div className="flex-1">
                  <h2 className="text-2xl font-semibold">{clerkUser?.fullName || 'User'}</h2>
                  <p className="text-gray-500">{clerkUser?.emailAddresses[0]?.emailAddress}</p>
                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {displayProfile.specialization || 'Legal Professional'}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {displayProfile.firm_name || 'Independent Practice'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Profile Completion</h3>
                    <span className="text-sm font-medium">{displayMetrics.profile_completion}%</span>
                  </div>
                  <Progress value={displayMetrics.profile_completion} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Workflow Efficiency</h3>
                    <span className="text-sm font-medium">{displayMetrics.workflow_efficiency}%</span>
                  </div>
                  <Progress value={displayMetrics.workflow_efficiency} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Client Satisfaction</h3>
                    <span className="text-sm font-medium">{displayMetrics.client_feedback}/5</span>
                  </div>
                  <Progress value={displayMetrics.client_feedback * 20} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Personal Productivity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayMetrics.productivity_score}%</div>
              <p className="text-xs text-gray-500 mt-1">Weekly efficiency score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayMetrics.time_saved}h</div>
              <p className="text-xs text-gray-500 mt-1">This month through automation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayMetrics.ai_interactions}</div>
              <p className="text-xs text-gray-500 mt-1">AI features used this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Networking Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayMetrics.networking_score}%</div>
              <p className="text-xs text-gray-500 mt-1">Professional connections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayMetrics.compliance_score}%</div>
              <p className="text-xs text-gray-500 mt-1">Data security & compliance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Billing Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayMetrics.billing_efficiency}%</div>
              <p className="text-xs text-gray-500 mt-1">Invoice processing speed</p>
            </CardContent>
          </Card>
        </div>

        {/* Professional Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>Update your professional details</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal">
              <TabsList>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      name="first_name"
                      value={formData.first_name || ''}
                      onChange={handleInputChange}
                      placeholder="First Name"
                      className="mb-2"
                      disabled={!isEditing || uploading}
                    />
                    <Input
                      name="last_name"
                      value={formData.last_name || ''}
                      onChange={handleInputChange}
                      placeholder="Last Name"
                      disabled={!isEditing || uploading}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      placeholder="Email"
                      disabled={!isEditing || uploading}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      name="phone_number"
                      value={formData.phone_number || ''}
                      onChange={handleInputChange}
                      placeholder="Phone Number"
                      disabled={!isEditing || uploading}
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      placeholder="Address"
                      disabled={!isEditing || uploading}
                    />
                  </div>
                  <div>
                    <Label>Home Address</Label>
                    <Input
                      name="home_address"
                      value={formData.home_address || ''}
                      onChange={handleInputChange}
                      placeholder="Home Address"
                      disabled={!isEditing || uploading}
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <select
                      name="gender"
                      value={formData.gender || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing || uploading}
                      className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="professional" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Law Firm</Label>
                    <Input
                      name="firm_name"
                      value={formData.firm_name || ''}
                      onChange={handleInputChange}
                      placeholder="Law Firm"
                      disabled={!isEditing || uploading}
                    />
                  </div>
                  <div>
                    <Label>Specialization</Label>
                    <Input
                      name="specialization"
                      value={formData.specialization || ''}
                      onChange={handleInputChange}
                      placeholder="Specialization"
                      disabled={!isEditing || uploading}
                    />
                  </div>
                  <div>
                    <Label>Years of Practice</Label>
                    <Input
                      name="years_of_practice"
                      value={formData.years_of_practice || ''}
                      onChange={handleInputChange}
                      placeholder="Years of Practice"
                      disabled={!isEditing || uploading}
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <select
                      name="role"
                      value={formData.role || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing || uploading}
                      className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select Role</option>
                      <option value="Lawyer">Lawyer</option>
                      <option value="Paralegal">Paralegal</option>
                      <option value="Legal Assistant">Legal Assistant</option>
                      <option value="Legal Secretary">Legal Secretary</option>
                      <option value="Legal Consultant">Legal Consultant</option>
                    </select>
                  </div>
                  <div>
                    <Label>Onboarding Completed</Label>
                    <select
                      name="onboarding_completed"
                      value={typeof formData.onboarding_completed === 'string' ? formData.onboarding_completed : (formData.onboarding_completed ? 'Yes' : 'No')}
                      onChange={handleInputChange}
                      disabled={!isEditing || uploading}
                      className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="preferences" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Language</Label>
                    <Input
                      name="language"
                      value={formData.language || ''}
                      onChange={handleInputChange}
                      placeholder="Language"
                      disabled={!isEditing || uploading}
                    />
                  </div>
                  <div>
                    <Label>Time Zone</Label>
                    <Input
                      name="timezone"
                      value={formData.timezone || ''}
                      onChange={handleInputChange}
                      placeholder="Time Zone"
                      disabled={!isEditing || uploading}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
          </CardContent>
        </Card>
      </div>

      {/* Image Crop Modal */}
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
    </LayoutWithSidebar>
  );
} 