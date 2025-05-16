"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUser, useAuth } from "@clerk/nextjs";
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
import { Dialog, DialogContent, DialogOverlay } from '@radix-ui/react-dialog';
import countryList from 'react-select-country-list';
import { Select } from "@/components/ui/select";
import { User } from '@clerk/nextjs/server';
import { getAuthenticatedSupabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

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

interface ProfileFormData {
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
  bar_number?: string;
  role: string;
  onboarding_completed: string | boolean;
  language?: string;
  timezone?: string;
  practice_area_id: string;
  jurisdiction_id?: string;
  avatar_url: string;
}

interface ProfessionalId {
  id: string;
  profile_id: string;
  country: string;
  state: string | null;
  professional_id: string | null;
  year_issued: number | null;
  verification_status: string;
  no_id: boolean;
  created_at: string;
  document_url?: string;
  document_name?: string;
  issuing_authority?: string;
  issue_date?: string;
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
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [isSupabaseInitialized, setIsSupabaseInitialized] = useState(false);
  
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
    bar_number: '',
    role: '',
    onboarding_completed: 'No',
    language: '',
    timezone: '',
    practice_area_id: '',
    jurisdiction_id: '',
    avatar_url: '',
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
  const [professionalIds, setProfessionalIds] = useState<ProfessionalId[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingProfessionalIds, setEditingProfessionalIds] = useState<Record<string, ProfessionalId>>({});

  // Helper for country dropdown
  const countryOptions = countryList().getData();
  const verificationStatusOptions = [
    { value: 'verified', label: 'Verified' },
    { value: 'not_verified', label: 'Not Verified' },
    { value: 'pending', label: 'Pending' },
  ];
  const noIdOptions = [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ];

  const [practiceAreas, setPracticeAreas] = useState<any[]>([]);
  const [jurisdictions, setJurisdictions] = useState<any[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // 1. Add a state for roles and role_id
  const [roles, setRoles] = useState<{ id: string, name: string }[]>([]);
  const [roleId, setRoleId] = useState<string | null>(null);

  // Add inside the UserProfile component, after the existing state declarations
  const [countrySearch, setCountrySearch] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<{value: string, label: string}[]>([]);

  // Add a new state variable to track the active tab
  const [activeTab, setActiveTab] = useState<string>("personal");

  // Initialize Supabase client with anon key
  useEffect(() => {
    let mounted = true;
    let initializationTimeout: NodeJS.Timeout;

    async function initSupabase() {
      if (!clerkUser || !isClerkLoaded) {
        console.log('Waiting for Clerk user to load...');
        return;
      }
      
      try {
        // Create a new Supabase client with anon key
        const client = createClientComponentClient({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        });
        
        if (mounted) {
          // Add a small delay to ensure state updates are processed
          initializationTimeout = setTimeout(() => {
            setSupabaseClient(client);
            setIsSupabaseInitialized(true);
            console.log('Supabase client initialized successfully with anon key');
          }, 100);
        }
      } catch (error: unknown) {
        console.error('Error initializing Supabase client:', error);
        if (error instanceof Error && mounted) {
          toast({
            title: 'Error',
            description: `Failed to initialize Supabase client: ${error.message}`,
            variant: 'destructive'
          });
        }
      }
    }

    initSupabase();

    return () => {
      mounted = false;
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
    };
  }, [clerkUser, isClerkLoaded, toast]);

  // Load profile data
  const fetchUserData = useCallback(async () => {
    if (!clerkUser || !isClerkLoaded) {
      console.log('Waiting for Clerk user to load...', { clerkUser, isClerkLoaded });
      return;
    }

    if (!supabaseClient || !isSupabaseInitialized) {
      console.log('Waiting for Supabase client to initialize...', { supabaseClient, isSupabaseInitialized });
      return;
    }
    
    try {
      const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
      console.log('Starting to fetch user data...', { 
        clerkId: clerkUser.id,
        email: userEmail
      });
      setLoading(true);
      setError(null);

      // Use the profile check API endpoint to check if profile exists
      console.log('Fetching profile data from API...');
      const response = await fetch('/api/profile/check', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Profile check failed with status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Profile check API response:', responseData);
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Profile check returned unsuccessful');
      }

      if (!responseData.exists) {
        throw new Error('Profile not found. Please complete the onboarding process first.');
      }

      // Use the profile data returned from the API
      const profile = responseData.profile;
      if (!profile) {
        throw new Error('Profile data not returned from API');
      }

      console.log('Found existing profile:', profile);
      
      // Get the role ID for setting the dropdown
      if (profile.role_id) {
        setRoleId(profile.role_id);
      }
      
      setProfile(profile);
      // Set form data with available profile fields
      // Note: bar_number, language, timezone, and jurisdiction_id are optional fields 
      // that may not exist in the database schema
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        home_address: profile.home_address || '',
        gender: profile.gender || '',
        firm_name: profile.firm_name || '',
        specialization: profile.specialization || '',
        years_of_practice: profile.years_of_practice?.toString() || '',
        bar_number: profile.bar_number || '',
        role: profile.role_id || '',
        onboarding_completed: profile.onboarding_completed || false,
        language: profile.language || '',
        timezone: profile.timezone || '',
        practice_area_id: profile.practice_area_id || '',
        jurisdiction_id: profile.jurisdiction_id || '',
        avatar_url: profile.avatar_url || ''
      });
    } catch (error) {
      console.error('Error in profile operation:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile data');
      toast({
        title: 'Error',
        description: error instanceof Error && error.message.includes('onboarding') 
          ? 'Please complete the onboarding process first.'
          : 'Failed to load profile data. Please try refreshing the page.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [clerkUser, isClerkLoaded, supabaseClient, isSupabaseInitialized, toast]);

  // Only fetch user data when both Clerk and Supabase are ready
  useEffect(() => {
    let mounted = true;
    let fetchTimeout: NodeJS.Timeout;

    if (clerkUser && isClerkLoaded && supabaseClient && isSupabaseInitialized) {
      console.log('All dependencies ready, preparing to fetch user data...', {
        clerkUser: !!clerkUser,
        isClerkLoaded,
        supabaseClient: !!supabaseClient,
        isSupabaseInitialized
      });
      
      // Add a small delay to ensure all state updates are processed
      fetchTimeout = setTimeout(() => {
        if (mounted) {
          console.log('Starting fetchUserData...');
          fetchUserData();
        }
      }, 200);
    }

    return () => {
      mounted = false;
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
    };
  }, [clerkUser, isClerkLoaded, supabaseClient, isSupabaseInitialized, fetchUserData]);

  useEffect(() => {
    async function fetchOptions() {
      if (!supabaseClient || !isSupabaseInitialized) {
        console.log('Waiting for Supabase client to initialize...');
        return;
      }
      
      setOptionsLoading(true);
      setOptionsError(null);
      try {
        const [{ data: paData, error: paError }, { data: jData, error: jError }] = await Promise.all([
          supabaseClient.from("practice_areas").select("id, name"),
          supabaseClient.from("jurisdictions").select("id, name")
        ]);
        if (paError) setOptionsError(paError.message);
        else setPracticeAreas(paData || []);
        if (jError) setOptionsError(jError.message);
        else setJurisdictions(jData || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setOptionsError(err.message);
        }
      }
      setOptionsLoading(false);
    }
    fetchOptions();
  }, [supabaseClient, isSupabaseInitialized]);

  // 2. Fetch roles from Supabase on mount
  useEffect(() => {
    async function fetchRoles() {
      if (!supabaseClient || !isSupabaseInitialized) {
        console.log('Waiting for Supabase client to initialize...');
        return;
      }
      
      try {
        const { data, error } = await supabaseClient.from('roles').select('id, name');
        if (error) throw error;
        if (data) setRoles(data);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    }
    fetchRoles();
  }, [supabaseClient, isSupabaseInitialized]);

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

      console.log('Starting profile picture update process');
      console.log('Profile ID:', profile.id);
      console.log('Clerk ID:', clerkUser.id);

      // First, try to delete any existing avatar
      if (profile.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').pop();
        if (oldFileName) {
          console.log('Deleting old avatar file:', oldFileName);
          await supabaseClient!
            .storage
            .from('avatars')
            .remove([oldFileName])
            .catch(error => console.log('Error deleting old avatar:', error));
        }
      }

      // Upload new avatar
      console.log('Uploading new avatar file:', fileName);
      const { error: uploadError, data: uploadData } = await supabaseClient!
        .storage
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

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabaseClient!
        .storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Avatar uploaded successfully, public URL:', publicUrl);

      // Update profile with new avatar URL - use both id and clerk_id for reliability
      console.log('Updating profile with new avatar URL');
      
      // First try using profile ID
      const { error: updateError, data: updateData } = await supabaseClient!
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select('*');

      if (updateError) {
        console.error('Update error using profile ID:', updateError);
        
        // Try using clerk_id as fallback
        const { error: updateError2, data: updateData2 } = await supabaseClient!
          .from('profiles')
          .update({ 
            avatar_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('clerk_id', clerkUser.id)
          .select('*');
          
        if (updateError2) {
          console.error('Update error using clerk_id:', updateError2);
          throw updateError2;
        } else {
          console.log('Profile updated successfully using clerk_id:', updateData2);
        }
      } else {
        console.log('Profile updated successfully using profile ID:', updateData);
      }

      // For debugging, verify the update by fetching the profile again
      const { data: verifyProfile, error: verifyError } = await supabaseClient!
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
        
      if (verifyError) {
        console.error('Error verifying profile update:', verifyError);
      } else {
        console.log('Verified profile after update:', verifyProfile);
        console.log('Avatar URL in database:', verifyProfile.avatar_url);
      }

      // Update local state to show the new avatar immediately
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
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

  const handleDeletePicture = async () => {
    if (!profile || !clerkUser) return;
    
    try {
      setUploading(true);
      setError(null);
      
      console.log('Starting profile picture deletion process');
      console.log('Profile ID:', profile.id);
      console.log('Clerk ID:', clerkUser.id);

      // Delete the file from storage if it exists
      if (profile.avatar_url) {
        const fileName = profile.avatar_url.split('/').pop();
        if (fileName) {
          console.log('Deleting avatar file from storage:', fileName);
          const { error: deleteError, data: deleteData } = await supabaseClient!
            .storage
            .from('avatars')
            .remove([fileName]);
          
          if (deleteError) {
            console.error('Error deleting avatar from storage:', deleteError);
            // Continue anyway, as we still want to update the profile
          } else {
            console.log('Avatar file successfully deleted from storage:', deleteData);
          }
        }
      }

      // Update profile in database - try both methods for reliability
      console.log('Updating profile to remove avatar URL');
      
      // First try using profile ID
      const { error: updateError, data: updateData } = await supabaseClient!
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', profile.id)
        .select('*');

      if (updateError) {
        console.error('Error updating profile with ID:', updateError);
        
        // Try using clerk_id as fallback
        const { error: updateError2, data: updateData2 } = await supabaseClient!
          .from('profiles')
          .update({ 
            avatar_url: null,
            updated_at: new Date().toISOString() 
          })
          .eq('clerk_id', clerkUser.id)
          .select('*');
          
        if (updateError2) {
          console.error('Error updating profile with clerk_id:', updateError2);
          throw updateError2;
        } else {
          console.log('Profile successfully updated using clerk_id:', updateData2);
        }
      } else {
        console.log('Profile successfully updated using ID:', updateData);
      }

      // For debugging, verify the update by fetching the profile again
      const { data: verifyProfile, error: verifyError } = await supabaseClient!
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
        
      if (verifyError) {
        console.error('Error verifying profile update:', verifyError);
      } else {
        console.log('Verified profile after update:', verifyProfile);
        console.log('Avatar URL in database should be null:', verifyProfile.avatar_url);
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
      setFormData(prev => ({ ...prev, avatar_url: '' }));
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkUser) return;

    setUploading(true);
    try {
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
        years_of_practice: formData.years_of_practice ? parseInt(formData.years_of_practice) : null,
        role_id: formData.role,
        onboarding_completed: formData.onboarding_completed === 'Yes',
        practice_area_id: formData.practice_area_id,
        updated_at: new Date().toISOString()
      };

      console.log('Updating profile with data:', updateData);

      const { data: updatedProfile, error } = await supabaseClient!
        .from('profiles')
        .update(updateData)
        .eq('clerk_id', clerkUser.id)
        .select('*')
        .single();

      if (error) throw error;

      console.log('Profile updated successfully:', updatedProfile);
      setProfile(prev => prev ? { ...prev, ...updateData } as UserProfile : null);
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

  const handleProfessionalIdChange = (id: string, field: string, value: any) => {
    setEditingProfessionalIds((prev: Record<string, ProfessionalId>) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleUpdateProfessionalId = async (id: string) => {
    const updated = editingProfessionalIds[id];
    if (!updated) return;
    setUploading(true);
    
    // Ensure we're not in global editing mode when updating jurisdiction records
    if (isEditing) {
      setIsEditing(false);
    }
    
    try {
      const { data: updatedProfId, error } = await supabaseClient!
        .from('professional_ids')
        .upsert({
          id: id,
          profile_id: profile?.id,
          country: updated.country,
          state: updated.state,
          professional_id: updated.professional_id,
          no_id: typeof updated.no_id === 'string' ? updated.no_id === 'true' : Boolean(updated.no_id),
          issuing_authority: updated.issuing_authority || null,
          issue_date: updated.issue_date || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Jurisdiction details updated.' });
      
      // Update local state - preserve other professional IDs
      if (updatedProfId) {
        setProfessionalIds(prev => 
          prev.map(profId => profId.id === updatedProfId.id ? updatedProfId : profId)
        );
        
        setEditingProfessionalIds(prev => ({
          ...prev,
          [updatedProfId.id]: { ...updatedProfId }
        }));
      }
    } catch (error) {
      console.error('Error updating professional ID:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update jurisdiction details.', 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  };

  // Add a function to fetch professional IDs
  const fetchProfessionalIds = useCallback(async () => {
    if (!profile || !supabaseClient || !isSupabaseInitialized) {
      return;
    }

    try {
      console.log('Fetching professional IDs for profile:', profile.id);
      const { data, error } = await supabaseClient
        .from('professional_ids')
        .select('*')
        .eq('profile_id', profile.id);

      if (error) {
        console.error('Error fetching professional IDs:', error);
        return;
      }

      console.log('Professional IDs fetched:', data);
      setProfessionalIds(data || []);
      
      // Initialize editing state for each professional ID
      const editingState: Record<string, ProfessionalId> = {};
      data?.forEach(profId => {
        editingState[profId.id] = { ...profId };
      });
      setEditingProfessionalIds(editingState);
    } catch (error) {
      console.error('Unexpected error fetching professional IDs:', error);
    }
  }, [profile, supabaseClient, isSupabaseInitialized]);

  // Call fetchProfessionalIds when profile is loaded
  useEffect(() => {
    if (profile) {
      fetchProfessionalIds();
    }
  }, [profile, fetchProfessionalIds]);

  // Function to add a new professional ID
  const handleAddProfessionalId = async () => {
    if (!profile || !supabaseClient) return;
    
    try {
      setUploading(true);
      
      // Ensure we're not in global editing mode when adding jurisdiction records
      if (isEditing) {
        setIsEditing(false);
      }
      
      // Create a new empty professional ID record
      const newProfId = {
        profile_id: profile.id,
        country: '',
        state: null,
        professional_id: null,
        no_id: false,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabaseClient
        .from('professional_ids')
        .insert(newProfId)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Add to local state
        setProfessionalIds(prev => [...prev, data]);
        setEditingProfessionalIds(prev => ({
          ...prev,
          [data.id]: { ...data }
        }));
        
        toast({
          title: 'Success',
          description: 'New jurisdiction record created'
        });
      }
    } catch (error) {
      console.error('Error creating new professional ID:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create new jurisdiction record', 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  };

  // Function to delete a professional ID
  const handleDeleteProfessionalId = async (id: string) => {
    if (!supabaseClient) return;
    
    try {
      setUploading(true);
      
      // Ensure we're not in global editing mode when deleting jurisdiction records
      if (isEditing) {
        setIsEditing(false);
      }
      
      const { error } = await supabaseClient
        .from('professional_ids')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setProfessionalIds(prev => prev.filter(profId => profId.id !== id));
      setEditingProfessionalIds(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      
      toast({
        title: 'Success',
        description: 'Jurisdiction record deleted'
      });
    } catch (error) {
      console.error('Error deleting professional ID:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete jurisdiction record', 
        variant: 'destructive' 
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

  // Filter countries based on search input
  useEffect(() => {
    if (countrySearch.trim() === '') {
      // Show common countries first when no search term
      const commonCountries = ['US', 'CA', 'GB', 'AU'].map(code => 
        countryOptions.find(c => c.value === code)
      ).filter(Boolean) as {value: string, label: string}[];
      
      // Then add all other countries
      const otherCountries = countryOptions.filter(c => 
        !commonCountries.some(common => common && common.value === c.value)
      );
      
      setFilteredCountries([...commonCountries, ...otherCountries]);
    } else {
      // Filter based on search term
      setFilteredCountries(
        countryOptions.filter(
          c => c.label.toLowerCase().includes(countrySearch.toLowerCase())
        )
      );
    }
  }, [countrySearch]);

  // Handle country search input
  const handleCountrySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCountrySearch(e.target.value);
  };

  // Handle country selection
  const handleCountrySelect = (id: string, value: string) => {
    handleProfessionalIdChange(id, 'country', value);
    setCountrySearch('');
  };

  // Handle document upload
  const handleDocumentUpload = async (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    
    // Ensure we're not in global editing mode when uploading documents
    if (isEditing) {
      setIsEditing(false);
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('professionalId', id);
      
      const response = await fetch('/api/certificate/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update the local state with the document URL
        setEditingProfessionalIds(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            document_url: result.url,
            document_name: file.name
          }
        }));
        
        toast({
          title: 'Success',
          description: 'Certificate document uploaded successfully.',
        });
        
        // Refresh the professional IDs to get the updated data
        if (supabaseClient) {
          const { data } = await supabaseClient
            .from('professional_ids')
            .select('*')
            .eq('profile_id', profile?.id);
            
          if (data) {
            // Preserve the current array structure by mapping over the updated data
            setProfessionalIds(data);
            
            // Update the editing state with the refreshed data
            const editingState: Record<string, ProfessionalId> = { ...editingProfessionalIds };
            data.forEach(profId => {
              editingState[profId.id] = { 
                ...editingState[profId.id] || {}, 
                ...profId 
              };
            });
            setEditingProfessionalIds(editingState);
          }
        }
      } else {
        throw new Error(result.error || 'Failed to upload document');
      }
    } catch (error: any) {
      console.error('Document upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (id: string) => {
    if (!supabaseClient) return;
    
    try {
      setUploading(true);
      
      // Ensure we're not in global editing mode when deleting documents
      if (isEditing) {
        setIsEditing(false);
      }
      
      const profId = editingProfessionalIds[id];
      if (!profId || !profId.document_url) return;
      
      // Extract the file name from the URL
      const fileName = profId.document_url.split('/').pop()?.split('?')[0];
      
      if (fileName) {
        // Delete from storage
        await supabaseClient.storage.from('certificates').remove([fileName]);
      }
      
      // Update the record to remove document reference
      const { error } = await supabaseClient
        .from('professional_ids')
        .update({
          document_url: null,
          document_name: null
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setEditingProfessionalIds(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          document_url: undefined,
          document_name: undefined
        }
      }));
      
      toast({
        title: 'Success',
        description: 'Document deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  // Add error boundary
  if (error) {
    return (
      <LayoutWithSidebar>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-red-600 mb-4">Error Loading Profile</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </LayoutWithSidebar>
    );
  }

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
                  {profile?.avatar_url ? (
                    <div className="relative w-24 h-24 cursor-pointer" onClick={() => setShowPreview(true)}>
                      <Image
                        src={`${profile.avatar_url}?t=${new Date().getTime()}`}
                        alt="Profile picture"
                        width={96}
                        height={96}
                        style={{ height: "auto" }}
                        className="rounded-full object-cover"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center bg-gray-200 rounded-full cursor-pointer" onClick={() => setShowPreview(true)}>
                      <span className="text-3xl font-bold text-gray-500">{profile?.first_name?.[0] || clerkUser?.firstName?.[0]}{profile?.last_name?.[0] || clerkUser?.lastName?.[0]}</span>
                    </div>
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
            <Tabs defaultValue="personal" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                <TabsTrigger value="jurisdiction">Jurisdiction Details</TabsTrigger>
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
                  <div className="mb-4">
                    <label className="block font-medium">Practice Area</label>
                    {optionsLoading ? (
                      <div>Loading practice areas...</div>
                    ) : optionsError ? (
                      <div className="text-red-500">{optionsError}</div>
                    ) : (
                      <Select
                        name="practice_area_id"
                        value={formData.practice_area_id || ""}
                        onValueChange={value => setFormData(prev => ({ ...prev, practice_area_id: value }))}
                        disabled={!isEditing || uploading}
                      >
                        <option value="">Select a practice area</option>
                        {practiceAreas.map(pa => (
                          <option key={pa.id} value={pa.id}>{pa.name}</option>
                        ))}
                      </Select>
                    )}
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
                      value={roleId || ''}
                      onChange={e => {
                        const selectedId = e.target.value;
                        setRoleId(selectedId);
                        setFormData(prev => ({ ...prev, role: selectedId }));
                      }}
                      disabled={!isEditing || uploading}
                      className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select Role</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                      ))}
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
              <TabsContent value="jurisdiction" className="space-y-4">
                {professionalIds.length === 0 ? (
                  <div className="text-center p-8">
                    <div className="text-gray-500 mb-4">No jurisdiction records found.</div>
                    <Button onClick={handleAddProfessionalId} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Add Jurisdiction Record
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {professionalIds.map((profId) => {
                      const editing = editingProfessionalIds[profId.id] || profId;
                      return (
                        <div key={profId.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-md font-medium">
                              {editing.country || 'New'} {editing.state ? `- ${editing.state}` : ''} Record
                            </h3>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDeleteProfessionalId(profId.id)}
                              disabled={uploading}
                            >
                              <Trash className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <Label>Certification Name/Type</Label>
                              <Input
                                value={editing.professional_id || ''}
                                onChange={e => handleProfessionalIdChange(profId.id, 'professional_id', e.target.value)}
                                placeholder="Bar Admission, Specialist Certification, etc."
                                disabled={uploading}
                              />
                              <div className="text-xs text-gray-500 mt-1">Enter the name of your certification or license</div>
                            </div>
                            
                            <div>
                              <Label>Country</Label>
                              <div className="relative">
                                <Input
                                  type="text"
                                  placeholder="Search countries..."
                                  value={countrySearch}
                                  onChange={handleCountrySearch}
                                  disabled={uploading}
                                  className="mb-1"
                                />
                                {countrySearch && (
                                  <div className="absolute z-10 w-full max-h-40 overflow-y-auto border rounded-md bg-white shadow-lg">
                                    {filteredCountries.map((c) => (
                                      <div
                                        key={c.value}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                          handleCountrySelect(profId.id, c.value);
                                          setCountrySearch('');
                                        }}
                                      >
                                        {c.label}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center mt-1">
                                  <span className="text-sm">Selected: </span>
                                  <span className="text-sm font-medium ml-1">
                                    {editing.country ? countryOptions.find(c => c.value === editing.country)?.label || editing.country : 'None'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <Label>State/Province</Label>
                              <Input
                                value={editing.state || ''}
                                onChange={e => handleProfessionalIdChange(profId.id, 'state', e.target.value)}
                                placeholder="State or Province"
                                disabled={uploading}
                              />
                            </div>
                            
                            <div>
                              <Label>Issuing Authority</Label>
                              <Input
                                value={editing.issuing_authority || ''}
                                onChange={e => handleProfessionalIdChange(profId.id, 'issuing_authority', e.target.value)}
                                placeholder="State Bar, Law Society, etc."
                                disabled={uploading}
                              />
                            </div>
                            
                            <div>
                              <Label>Issue Date</Label>
                              <Input
                                type="date"
                                value={editing.issue_date || ''}
                                onChange={e => handleProfessionalIdChange(profId.id, 'issue_date', e.target.value)}
                                disabled={uploading}
                              />
                            </div>
                            
                            <div className="md:col-span-2">
                              <Label>Certification Document</Label>
                              <div className="mt-1 space-y-2">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                  <Input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    onChange={(e) => handleDocumentUpload(profId.id, e)}
                                    disabled={uploading}
                                    className="hidden"
                                    id={`file-upload-${profId.id}`}
                                  />
                                  <label 
                                    htmlFor={`file-upload-${profId.id}`}
                                    className="cursor-pointer text-blue-600 hover:text-blue-800"
                                  >
                                    {editing.document_url ? "Replace document" : "Upload certificate"}
                                  </label>
                                  <p className="text-xs text-gray-500 mt-1">PDF, JPEG or PNG, max 5MB</p>
                                </div>
                                
                                {editing.document_url && (
                                  <div className="flex items-center justify-between p-2 bg-gray-100 rounded">
                                    <span className="text-sm truncate">{editing.document_name || 'Document'}</span>
                                    <div className="flex gap-2">
                                      <a 
                                        href={editing.document_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 text-sm hover:underline"
                                      >
                                        View
                                      </a>
                                      <button
                                        onClick={() => handleDeleteDocument(profId.id)}
                                        className="text-red-600 text-sm hover:underline"
                                        type="button"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end mt-4">
                            <Button
                              onClick={() => handleUpdateProfessionalId(profId.id)}
                              disabled={uploading}
                            >
                              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                              Update
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-center mt-4">
                      <Button onClick={handleAddProfessionalId} disabled={uploading}>
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Add Another Jurisdiction
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            {/* Only show the Edit Profile button for Personal and Professional tabs */}
            {activeTab !== "jurisdiction" && (
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
                      onClick={handleSubmit}
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
            )}
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
                  style={{ height: "auto" }}
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
      {/* Profile Picture Preview Modal */}
      {showPreview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <DialogContent className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full flex flex-col items-center">
              <button
                onClick={() => setShowPreview(false)}
                className="self-end text-gray-500 hover:text-gray-700 mb-2"
              >
                <X className="w-6 h-6" />
              </button>
              {displayProfile.avatar_url ? (
                <Image
                  src={`${displayProfile.avatar_url}?t=${new Date().getTime()}`}
                  alt="Profile picture preview"
                  width={256}
                  height={256}
                  style={{ height: "auto" }}
                  className="rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-full mb-4">
                  <span className="text-6xl font-bold text-gray-500">{clerkUser?.firstName?.[0]}{clerkUser?.lastName?.[0]}</span>
                </div>
              )}
              <div className="text-lg font-semibold mt-2">{clerkUser?.fullName || 'User'}</div>
              <div className="text-gray-500">{clerkUser?.emailAddresses[0]?.emailAddress}</div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </LayoutWithSidebar>
  );
} 