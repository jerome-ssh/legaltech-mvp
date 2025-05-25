"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUser, useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import { Loader2, Pencil, Trash, X, Camera, UserCircle2, Phone, MapPin, Building, Briefcase, Check, Mail } from "lucide-react";
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
import { SearchableSelect, Option } from '@/components/ui/searchable-select';
import { 
  getAllCountries, 
  getStatesByCountry, 
  getCountriesWithPopularFirst,
  getCountryNameByCode,
  getStateNameByCode
} from '@/lib/geo-data';
import { Select } from "@/components/ui/select";
import { User } from '@clerk/nextjs/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { CountrySelect, StateSelect } from "@/components/ui/form-elements";
import { getFirmSuggestions } from "@/lib/onboarding-utils";
import { ProfileContext } from '@/components/LayoutWithSidebar';
import { createClient } from '@supabase/supabase-js';
import { uploadAvatar, deleteAvatar } from '@/lib/services/avatar-service';

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
  // verification_status field removed
  no_id: boolean;
  created_at: string;
  document_url?: string;
  document_name?: string;
  issuing_authority?: string;
  issue_date?: string;
  certifications?: Certification[];
  parent_id?: string; // Parent record ID for the certifications JSONB approach
}

interface Certification {
  id: string;
  name: string;
  country: string;
  state?: string | null; // Allow null for state
  issuing_authority?: string;
  issue_date?: string;
  document_url?: string;
  document_name?: string;
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

// Add this function after the imports to fetch practice areas directly from the API
const fetchPracticeAreas = async () => {
  try {
    const response = await fetch('/api/practice-areas', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch practice areas: ${response.status}`);
    }
    
    const data = await response.json();
    return data.practice_areas || [];
  } catch (error) {
    console.error('Error fetching practice areas:', error);
    return [];
  }
};

// Comprehensive list of specializations matching the onboarding page
const allSpecializations = [
  "Administrative Law",
  "Admiralty (Maritime) Law",
  "Animal Law",
  "Antitrust Law",
  "Aviation and Space Law",
  "Banking and Finance Law",
  "Bankruptcy Law",
  "Business (Corporate) Law",
  "Civil Rights Law",
  "Commercial Law",
  "Constitutional Law",
  "Consumer Protection Law",
  "Contract Law",
  "Criminal Law",
  "Cybersecurity (Cyber) Law",
  "Education Law",
  "Elder Law",
  "Employment and Labor Law",
  "Energy and Infrastructure Law",
  "Entertainment Law",
  "Environmental Law",
  "Estate Planning (Wills and Trusts)",
  "Family Law",
  "Gaming Law",
  "Health Law",
  "Human Rights Law",
  "Immigration Law",
  "Intellectual Property (IP) Law",
  "International Law",
  "Media Law",
  "Personal Injury Law",
  "Product Liability Law",
  "Public Interest Law",
  "Real Estate (Property) Law",
  "Sports Law",
  "Tax Law",
  "Technology Law (Fintech, Blockchain, AI)",
  "Tort Law"
];

const defaultAvatar = '/default-avatar.png'; // Use your own placeholder image path

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
  const [lastAvatarUpdate, setLastAvatarUpdate] = useState<number>(Date.now());

  // Helper for country dropdown
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

  // Replace the stateOptions state and filter countries state
  const [stateOptions, setStateOptions] = useState<Option[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Option | null>(null);
  const [selectedState, setSelectedState] = useState<Option | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [countryOptions] = useState<Option[]>(getAllCountries());

  // Replace the getStatesForCountry function with our new implementation
  const loadStatesForCountry = useCallback((countryCode: string) => {
    const states = getStatesByCountry(countryCode);
    setStateOptions(states);
  }, []);
    
  // Replace filtered countries state
  const [popularCountries] = useState<Option[]>(getCountriesWithPopularFirst());

  // Add a new state variable to track the active tab
  const [activeTab, setActiveTab] = useState<string>("personal");

  // Add new state variables to track open/completed forms
  const [openForms, setOpenForms] = useState<Set<string>>(new Set());
  const [completedForms, setCompletedForms] = useState<Set<string>>(new Set());

  // 1. Add a state for roles and role_id
  const [roles, setRoles] = useState<{ id: string, name: string }[]>([]);
  const [roleId, setRoleId] = useState<string | null>(null);

  // Add these state variables in the UserProfile component after the existing state declarations
  const [firmSuggestions, setFirmSuggestions] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<Option[]>(
    allSpecializations.map(spec => ({ label: spec, value: spec.toLowerCase().replace(/\s+/g, '_') }))
  );
  const [specializationFocused, setSpecializationFocused] = useState(false);
  const [specializationSearch, setSpecializationSearch] = useState("");
  const specializationDropdownRef = useRef<HTMLDivElement>(null);
  const firmInputRef = useRef<HTMLInputElement>(null);
  
  // Add this effect to handle clicks outside the specialization dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        specializationDropdownRef.current &&
        !specializationDropdownRef.current.contains(event.target as Node)
      ) {
        setSpecializationFocused(false);
      }
    }
    
    if (specializationFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [specializationFocused]);

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
        // Fetch practice areas in a better way, with fallback
        const [{ data: paData, error: paError }, { data: jData, error: jError }] = await Promise.all([
          supabaseClient.from("practice_areas").select("id, name"),
          supabaseClient.from("jurisdictions").select("id, name")
        ]);
        
        if (paError || !paData || paData.length === 0) {
          // If we can't get practice areas from Supabase, try the API
          console.log('Falling back to API for practice areas');
          const apiPracticeAreas = await fetchPracticeAreas();
          // Convert API format to Supabase format
          const formattedAreas = apiPracticeAreas.map((name: string) => ({
            id: name.toLowerCase().replace(/\s+/g, '_'),
            name
          }));
          setPracticeAreas(formattedAreas);
        } else {
          setPracticeAreas(paData);
        }
        
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

      // Use the avatar service to upload the file
      const result = await uploadAvatar(file, clerkUser.id);

      if (result.success) {
        // Update local state with the new avatar URL (base only)
        setProfile(prev => prev ? { ...prev, avatar_url: result.url } : null);
        setFormData(prev => ({ ...prev, avatar_url: result.url }));
        setLastAvatarUpdate(Date.now());
        
        // Notify other pages about avatar update
        try {
          localStorage.setItem('profile_avatar_updated', new Date().toISOString());
          
          // Trigger storage event for cross-tab listeners
          window.dispatchEvent(new Event('storage'));
          
          // Also dispatch custom event for same-page listeners
          window.dispatchEvent(new CustomEvent('storage-event'));
          
          console.log('Avatar update notification sent from upload handler');
        } catch (error) {
          console.error('Error triggering avatar refresh:', error);
        }
        
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

  const handleDeletePicture = async () => {
    if (!profile || !clerkUser) return;
    try {
      setUploading(true);
      setError(null);
      // Use the avatar service to delete the avatar
      const result = await deleteAvatar(clerkUser.id, profile.avatar_url);
      if (result.success) {
        setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
        setFormData(prev => ({ ...prev, avatar_url: '' }));
        setLastAvatarUpdate(Date.now());
        toast({
          title: 'Success',
          description: 'Profile picture deleted successfully',
        });
      }
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

  // Update handleInputChange to handle firm suggestions
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Generate firm suggestions if changing firm name
    if (name === 'firm_name') {
      setFirmSuggestions(getFirmSuggestions(value));
    }
  };
  
  // Add functions for handling firm and specialization suggestions
  const handleFirmSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, firm_name: suggestion }));
    setFirmSuggestions([]);
  };
  
  const handleSpecializationSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpecializationSearch(e.target.value);
  };
  
  const handleSpecializationSuggestionClick = (suggestion: Option) => {
    setFormData(prev => ({ 
      ...prev, 
      specialization: suggestion.label 
    }));
    setSpecializationSearch("");
    setSpecializationFocused(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkUser) return;

    setUploading(true);
    try {
      // Prepare the payload to match the API route
      const payload: any = {
        firmName: formData.firm_name,
        specialization: formData.specialization,
        yearsOfPractice: formData.years_of_practice ? parseInt(formData.years_of_practice) : null,
        address: formData.address,
        homeAddress: formData.home_address,
        gender: formData.gender,
        professionalIds: professionalIds,
        firstName: formData.first_name,
        lastName: formData.last_name,
        onboarding_completed: formData.onboarding_completed === 'Yes' || formData.onboarding_completed === true,
        role: roleId ? (roles.find(r => r.id === roleId)?.name || 'attorney') : 'attorney',
        email: formData.email,
        phoneNumber: formData.phone_number
      };

      // Only include avatarUrl if it is non-empty and different from the current profile
      if (formData.avatar_url && formData.avatar_url !== profile?.avatar_url) {
        payload.avatarUrl = formData.avatar_url;
      }

      console.log('Submitting profile update to API:', payload);

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local state with returned profile
      setProfile(data.profile);
      setIsEditing(false);
      
      // Notify other pages about avatar update
      if (data.profile.avatar_url) {
        try {
          // Update timestamp in localStorage
          localStorage.setItem('profile_avatar_updated', new Date().toISOString());
          
          // Trigger storage event for cross-tab listeners
          // Note: storage event only fires in OTHER tabs, not the current one
          window.dispatchEvent(new Event('storage'));
          
          // Also dispatch custom event for same-page listeners
          window.dispatchEvent(new CustomEvent('storage-event'));
          
          console.log('Avatar update notification sent');
        } catch (error) {
          console.error('Error triggering avatar refresh:', error);
        }
      }
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please check console for details.',
        variant: 'destructive',
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
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) {
        console.error('Error fetching professional IDs:', error);
        return;
      }

      console.log('Professional IDs fetched:', data);
      
      // Check if we have a record with certifications JSONB array
      if (data && data.length > 0 && data[0].certifications && Array.isArray(data[0].certifications) && data[0].certifications.length > 0) {
        // If we have certifications in JSONB, use those
        console.log('Found certifications in JSONB:', data[0].certifications);
        
        // Convert certifications from JSONB array to professional_ids records
        const certificationRecords = data[0].certifications.map((cert: Certification) => ({
          id: cert.id,
          profile_id: profile.id,
          country: cert.country || '',
          state: cert.state || null,
          professional_id: cert.name || null,
          no_id: false,
          created_at: new Date().toISOString(),
          document_url: cert.document_url || null,
          document_name: cert.document_name || null,
          issuing_authority: cert.issuing_authority || null,
          issue_date: cert.issue_date || null,
          // Include the parent record id for updates
          parent_id: data[0].id
        }));
        
        setProfessionalIds(certificationRecords);
        
        // Initialize editing state for each certification
        const editingState: Record<string, ProfessionalId> = {};
        certificationRecords.forEach((profId: ProfessionalId) => {
          editingState[profId.id] = { ...profId };
        });
        setEditingProfessionalIds(editingState);
      } else {
        // No certifications in JSONB or no records found
      setProfessionalIds(data || []);
      
      // Initialize editing state for each professional ID
      const editingState: Record<string, ProfessionalId> = {};
        data?.forEach((profId: any) => {
        editingState[profId.id] = { ...profId };
      });
      setEditingProfessionalIds(editingState);
      }
    } catch (error) {
      console.error('Unexpected error fetching professional IDs:', error);
    }
  }, [profile, supabaseClient, isSupabaseInitialized]);

  // Call fetchProfessionalIds when profile is loaded (needed for profile card)
  useEffect(() => {
    if (profile) {
      fetchProfessionalIds();
    }
  }, [profile, fetchProfessionalIds]);
  
  // Refresh professional IDs when switching to jurisdiction tab
  useEffect(() => {
    if (profile && activeTab === 'jurisdiction') {
      fetchProfessionalIds();
    }
  }, [activeTab, profile, fetchProfessionalIds]);

  // Function to fetch user metrics from the database
  const fetchUserMetrics = useCallback(async () => {
    if (!clerkUser || !profile) {
      console.log('Missing dependencies for fetchUserMetrics:', {
        hasClerkUser: !!clerkUser,
        hasProfile: !!profile
      });
      return;
    }
    
    try {
      console.log('Starting metrics fetch for user:', clerkUser.id);
      
      // Fetch metrics using the API route
      const response = await fetch(`/api/metrics?profile_id=${profile.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }
      
      const metricsData = await response.json();
      
      if (metricsData) {
        console.log('Found existing metrics:', metricsData);
        setMetrics(metricsData);
        
        // Check if metrics need to be updated (e.g., if profile_completion is 0)
        if (metricsData.profile_completion === 0) {
          console.log('Metrics need updating, calculating new metrics...');
          try {
            // Calculate new metrics
            const calculatedMetrics = await updateUserMetrics(profile.id);
            
            // Post the new metrics to the API
            const updateResponse = await fetch('/api/metrics', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                profile_id: profile.id,
                user_id: profile.id, // Use the UUID, not the Clerk ID
                ...calculatedMetrics
              }),
            });
            
            if (!updateResponse.ok) {
              throw new Error(`Failed to update metrics: ${updateResponse.status}`);
            }
            
            const updatedMetrics = await updateResponse.json();
            console.log('Updated metrics:', updatedMetrics);
            setMetrics(updatedMetrics);
          } catch (calcError) {
            console.error('Error calculating metrics:', calcError);
          }
        }
      } else {
        console.log('No metrics found, calculating new metrics');
        try {
          // Calculate new metrics
          const calculatedMetrics = await updateUserMetrics(profile.id);
          
          // Post the new metrics to the API
          const updateResponse = await fetch('/api/metrics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              profile_id: profile.id,
              user_id: profile.id, // Use the UUID, not the Clerk ID
              ...calculatedMetrics
            }),
          });
          
          if (!updateResponse.ok) {
            throw new Error(`Failed to update metrics: ${updateResponse.status}`);
          }
          
          const updatedMetrics = await updateResponse.json();
          console.log('Updated metrics:', updatedMetrics);
          setMetrics(updatedMetrics);
        } catch (calcError) {
          console.error('Error calculating metrics:', calcError);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserMetrics:', error);
    }
  }, [clerkUser, profile]);
  
  // Add a useEffect to refetch metrics when profile changes
  useEffect(() => {
    if (profile && clerkUser && supabaseClient) {
      console.log('Profile changed, refetching metrics...');
      fetchUserMetrics();
    }
  }, [profile, clerkUser, supabaseClient, fetchUserMetrics]);

  // Modified initialization to consider all existing forms as open initially
  // Reset form state when professional IDs are loaded or changed
  useEffect(() => {
    // When initial records load, consider all non-filled forms as open
    const openFormIds = new Set<string>();
    const completedFormIds = new Set<string>();
    
    professionalIds.forEach(profId => {
      // Check if form has required fields filled in
      const isComplete = Boolean(
        profId.country && 
        profId.professional_id && 
        (profId.state || profId.issuing_authority || profId.issue_date || profId.document_url)
      );
      
      if (isComplete) {
        completedFormIds.add(profId.id);
      } else {
        openFormIds.add(profId.id);
      }
    });
    
    setOpenForms(openFormIds);
    setCompletedForms(completedFormIds);
  }, [professionalIds.length]);

  // Function to check if the form can be opened
  const handleAddProfessionalId = async () => {
    if (!profile || !supabaseClient) return;
    
    console.log("Open forms count:", openForms.size, Array.from(openForms));
    
    // Check if we already have 2 open forms - with stronger enforcement
    if (openForms.size >= 2) {
      toast({
        title: 'Too many open forms',
        description: 'Please complete at least one of your open forms before adding a new one.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // First check if we have a parent record
      const { data: parentRecords, error: parentError } = await supabaseClient
        .from('professional_ids')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: true })
        .limit(1);
        
      if (parentError) {
        console.error('Error checking for parent record:', parentError);
        throw parentError;
      }
      
      let parentId: string;
      
      // If no parent record exists, create one
      if (!parentRecords || parentRecords.length === 0) {
        const { data: newParent, error: createError } = await supabaseClient
          .from('professional_ids')
          .insert({
        profile_id: profile.id,
        country: '',
        state: null,
        professional_id: null,
        no_id: false,
            certifications: []
          })
        .select()
        .single();
        
        if (createError) {
          console.error('Error creating parent record:', createError);
          throw createError;
        }
        
        parentId = newParent.id;
      } else {
        parentId = parentRecords[0].id;
      }
      
      // Generate a new certification ID with timestamp to ensure uniqueness
      const newCertId = `cert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      // Create a new certification record in memory
      const newCertification: ProfessionalId = {
        id: newCertId,
        profile_id: profile.id,
        country: '',
        state: null,
        professional_id: null,
        year_issued: null,
        // verification_status field removed
        no_id: false,
        created_at: new Date().toISOString(),
        parent_id: parentId
      };
      
        // Add to local state
      setProfessionalIds(prev => [...prev, newCertification]);
        setEditingProfessionalIds(prev => ({
          ...prev,
        [newCertId]: { ...newCertification }
        }));
        
      // Mark this form as open
      setOpenForms(prev => {
        // Ensure we don't exceed the limit
        if (prev.size >= 2) {
        toast({
            title: 'Too many open forms',
            description: 'Please complete at least one of your open forms first.',
            variant: 'destructive'
          });
          return prev;
        }
        return new Set([...prev, newCertId]);
      });
      
      toast({
        title: 'New form created',
        description: 'Please fill out the jurisdiction details and save to complete.'
      });
    } catch (error) {
      console.error('Error creating new professional ID:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create new jurisdiction record. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  };

  // Also modify the button click handler for Edit to respect the limit
  const handleEditButtonClick = (id: string) => {
    // If we already have 2 open forms and this isn't one of them, show warning
    if (openForms.size >= 2 && !openForms.has(id)) {
      toast({
        title: 'Too many open forms',
        description: 'Please complete at least one of your open forms before editing another.',
        variant: 'destructive'
      });
      return;
    }
    
    // Otherwise, open this form for editing
    setCompletedForms(prev => {
      const newSet = new Set([...prev]);
      newSet.delete(id);
      return newSet;
    });
    setOpenForms(prev => new Set([...prev, id]));
  };

  // Function to delete a professional ID
  const handleDeleteProfessionalId = async (id: string | number) => {
    if (!supabaseClient || !profile) return;
    
    try {
      setUploading(true);
      
      // Log important debugging information
      console.log('Deleting professional ID:', {
        id,
        profileId: profile.id,
        type: typeof id,
        isTemporary: typeof id === 'string' && id.startsWith('cert-')
      });
      
      // Ensure we're not in global editing mode when deleting jurisdiction records
      if (isEditing) {
        setIsEditing(false);
      }
      
      // Get the record to be deleted from our local state for better context
      const recordToDelete = professionalIds.find(p => p.id === id);
      if (!recordToDelete) {
        throw new Error(`Record with ID ${id} not found in local state`);
      }
      
      console.log('Record to delete:', recordToDelete);
      
      // Check if this is a temporary certification ID (starts with "cert-")
      // These are records that haven't been saved to the database yet
      if (typeof id === 'string' && id.startsWith('cert-')) {
        console.log('This is a temporary record that has not been saved to the database yet');
        
        // For temporary records, we only need to update the local state
        // No database operation is needed since it doesn't exist in the database yet
        
        // Just remove from local state and continue
      } else {
        // This is a record that exists in the database and needs to be deleted
        
        // Check if this record has a parent_id (meaning it's part of a certification array)
        if (recordToDelete.parent_id) {
          // This is a certification in the certifications JSONB array
          console.log('Deleting a certification from parent record:', recordToDelete.parent_id);
          
          try {
            // First, get the parent record with its current certifications
            const { data: parentRecord, error: fetchError } = await supabaseClient
              .from('professional_ids')
              .select('*')
              .eq('profile_id', profile.id)  // Ensure we're only getting records for this profile
              .eq('id', recordToDelete.parent_id)
              .single();
              
            if (fetchError) {
              console.error('Error fetching parent record:', fetchError);
              throw fetchError;
            }
            
            console.log('Parent record before update:', parentRecord);
            
            // Filter out this certification from the array
            const certifications = (parentRecord.certifications || [])
              .filter((cert: Certification) => cert.id !== id);
            
            console.log('Updated certifications array:', certifications);
            
            // Update the parent record with the modified certifications array
            const { data: updateResult, error: updateError } = await supabaseClient
              .from('professional_ids')
              .update({
                certifications: certifications
              })
              .eq('profile_id', profile.id)  // Added RLS policy check for profile_id
              .eq('id', recordToDelete.parent_id)
              .select();
              
            if (updateError) {
              console.error('Error updating certifications array:', updateError);
              throw updateError;
            }
            
            console.log('Update result:', updateResult);
          } catch (error) {
            console.error('Error processing certification in JSONB array:', error);
            // Continue with local state updates even if the database operation failed
          }
        } else {
          // This is a direct database record
          console.log('Deleting professional ID record directly from database');
          
          try {
            // Create a record ID to use for deletion
            let recordId = id;
            if (typeof id === 'string') {
              // Try to convert string to UUID if it's a UUID format
              const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              if (!uuidPattern.test(id)) {
                // If not a UUID, try to convert to number
                const numericId = parseInt(id, 10);
                if (isNaN(numericId)) {
                  console.error('Invalid ID format:', id);
                  throw new Error(`Invalid ID format: ${id}`);
                }
                recordId = numericId;
              }
            }
            
            console.log('Using record ID for deletion:', recordId);
            
            // First try with explicit profile_id check for RLS
            const { data, error } = await supabaseClient
              .from('professional_ids')
              .delete()
              .eq('profile_id', profile.id)
              .eq('id', recordId)
              .select();
            
            if (error) {
              console.error('Error deleting professional ID with profile check:', error);
              
              // If that fails, try a different approach: update the record to mark it as deleted
              // This can work around some RLS policies
              const { error: updateError } = await supabaseClient
                .from('professional_ids')
                .update({
                  deleted_at: new Date().toISOString(),
                  is_deleted: true
                })
                .eq('profile_id', profile.id)
                .eq('id', recordId);
                
              if (updateError) {
                console.error('Error marking record as deleted:', updateError);
                throw updateError;
              }
            }
            
            console.log('Delete operation completed');
          } catch (error) {
            console.error('Error deleting database record:', error);
            // Continue with local state updates even if the database operation failed
          }
        }
      }
      
      // Always update local state regardless of which method was used or whether
      // the database operation succeeded
      setProfessionalIds(prev => prev.filter(profId => profId.id !== id));
      setEditingProfessionalIds(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      
      // Remove from open/completed forms sets
      setOpenForms(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(id.toString());
        return newSet;
      });
      setCompletedForms(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(id.toString());
        return newSet;
      });
      
      // Force a refresh of the profile IDs to ensure we have latest data
      // Only if it's not a temporary record (no need to refresh for those)
      if (!(typeof id === 'string' && id.startsWith('cert-'))) {
        setTimeout(() => {
          fetchProfessionalIds();
        }, 500);
      }
      
      toast({
        title: 'Success',
        description: 'Jurisdiction record removed'
      });
    } catch (error) {
      console.error('Error deleting professional ID:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete jurisdiction record. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Add missing handleProfessionalIdChange function
  const handleProfessionalIdChange = (id: string, field: string, value: any) => {
    setEditingProfessionalIds(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };
  
  // Add missing handleUpdateProfessionalId function
  const handleUpdateProfessionalId = async (id: string) => {
    if (!profile || !supabaseClient) return;
    
    try {
      setUploading(true);
      
      const profId = editingProfessionalIds[id];
      if (!profId) {
        throw new Error('Professional ID not found in editing state');
      }
      
      // Validate required fields
      if (!profId.country || !profId.professional_id) {
        toast({
          title: 'Missing information',
          description: 'Country and certification name are required fields',
          variant: 'destructive'
        });
        return;
      }
      
      // Check if we have a parent record to update
      if (profId.parent_id) {
        // Get the current certifications array from the parent record
        const { data: parentRecord, error: fetchError } = await supabaseClient
          .from('professional_ids')
          .select('certifications')
          .eq('id', profId.parent_id)
          .single();
          
        if (fetchError) {
          console.error('Error fetching parent record:', fetchError);
          throw fetchError;
        }
        
        // Create or update the certification in the certifications array
        const certifications = parentRecord.certifications || [];
        const certIndex = certifications.findIndex((c: Certification) => c.id === id);
        
        const certData: Certification = {
          id: profId.id,
          name: profId.professional_id || '',
          country: profId.country,
          state: profId.state || null,
          issuing_authority: profId.issuing_authority,
          issue_date: profId.issue_date,
          document_url: profId.document_url,
          document_name: profId.document_name
        };
        
        if (certIndex >= 0) {
          // Update existing certification
          certifications[certIndex] = certData;
        } else {
          // Add new certification
          certifications.push(certData);
        }
        
        // Update the parent record with the updated certifications array
        const { error: updateError } = await supabaseClient
          .from('professional_ids')
          .update({ certifications })
          .eq('id', profId.parent_id);
          
        if (updateError) {
          console.error('Error updating parent record:', updateError);
          throw updateError;
        }
      } else {
        // Direct update to the record if no parent_id
        const { error: updateError } = await supabaseClient
          .from('professional_ids')
          .update({
            country: profId.country,
            state: profId.state,
            professional_id: profId.professional_id,
            no_id: profId.no_id || false,
            issuing_authority: profId.issuing_authority,
            issue_date: profId.issue_date,
            // verification_status field removed
          })
          .eq('id', id);
          
        if (updateError) {
          console.error('Error updating professional ID:', updateError);
          throw updateError;
        }
      }
      
      // Mark this form as completed
      setCompletedForms(prev => new Set([...prev, id]));
      setOpenForms(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(id);
        return newSet;
      });
      
      toast({
        title: 'Success',
        description: 'Jurisdiction details saved successfully'
      });
    } catch (error) {
      console.error('Error updating professional ID:', error);
      toast({
        title: 'Error',
        description: 'Failed to save jurisdiction details',
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

  // Handle document upload
  const handleDocumentUpload = async (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent default browser behavior that might cause form reloading
    event.preventDefault();
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      // Create form data with the file and ids
      const formData = new FormData();
      formData.append('file', file);
      formData.append('professionalId', id);
      
      // Find the record to get the parent_id if available
      const record = editingProfessionalIds[id];
      if (record?.parent_id) {
        formData.append('parentId', record.parent_id);
      }
      
      // Upload the file
      const response = await fetch('/api/certificate/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update only the document fields in the local state without affecting other inputs
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
      
      // Reset the file input to allow selecting the same file again if needed
      if (event.target) {
        event.target.value = '';
      }
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

  // Function to migrate legacy records to the new certifications JSONB approach
  const migrateToCertificationsJSONB = async () => {
    if (!profile || !supabaseClient) return;
    
    try {
      setUploading(true);
      console.log('Migrating to certifications JSONB approach...');
      
      // Get all professional_ids for this profile
      const { data: allRecords, error: fetchError } = await supabaseClient
        .from('professional_ids')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: true });
        
      if (fetchError) {
        console.error('Error fetching records for migration:', fetchError);
        throw fetchError;
      }
      
      if (!allRecords || allRecords.length === 0) {
        console.log('No records to migrate');
        return;
      }
      
      // First record will be the parent
      const parentRecord = allRecords[0];
      
      // Check if already migrated
      if (parentRecord.certifications && Array.isArray(parentRecord.certifications) && parentRecord.certifications.length > 0) {
        console.log('Already migrated to certifications JSONB');
        return;
      }
      
      // Convert all records to certifications array
      const certifications = allRecords.map(record => ({
        id: record.id.toString(),
        name: record.professional_id || 'Certification',
        country: record.country || '',
        state: record.state || null,
        issuing_authority: record.issuing_authority || null,
        issue_date: record.issue_date || null,
        document_url: record.document_url || null,
        document_name: record.document_name || null
      }));
      
      // Update the parent record with the certifications array
      const { error: updateError } = await supabaseClient
        .from('professional_ids')
        .update({ certifications })
        .eq('id', parentRecord.id);
        
      if (updateError) {
        console.error('Error updating parent record with certifications:', updateError);
        throw updateError;
      }
      
      console.log('Successfully updated parent record with certifications');
      
      // Delete all records except the parent
      if (allRecords.length > 1) {
        const recordIdsToDelete = allRecords.slice(1).map(r => r.id);
        const { error: deleteError } = await supabaseClient
          .from('professional_ids')
          .delete()
          .in('id', recordIdsToDelete);
          
        if (deleteError) {
          console.error('Error deleting redundant records:', deleteError);
        } else {
          console.log(`Deleted ${recordIdsToDelete.length} redundant records`);
        }
      }
      
      // Refresh the records to get the updated data
      await fetchProfessionalIds();
      
      toast({
        title: 'Success',
        description: 'Migrated to new data structure'
      });
    } catch (error) {
      console.error('Error migrating to certifications JSONB:', error);
      toast({
        title: 'Error',
        description: 'Failed to migrate data structure',
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

  
  // Create a local profile context value with the profile's avatar URL
  // Note: We're triggering the avatar update in the handleSubmit function when avatar changes
  const profileContextValue = {
    avatarUrl: profile?.avatar_url || null,
    clerkImageUrl: clerkUser?.imageUrl || null,
    isLoading: false
  };

  return (
    <ProfileContext.Provider value={profileContextValue}>
      <LayoutWithSidebar>
      <div className="container mx-auto py-8 space-y-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 overflow-hidden shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative">
                  {profile?.avatar_url ? (
                      <div className="relative w-28 h-28 cursor-pointer" onClick={() => setShowPreview(true)}>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-blue-400 opacity-70 blur-sm"></div>
                      <Image
                        src={`${profile.avatar_url}?t=${lastAvatarUpdate}`}
                        alt="Profile picture"
                          width={112}
                          height={112}
                          style={{ height: "112px", objectFit: "cover" }}
                          className="rounded-full z-10 relative border-2 border-white"
                        priority
                      />
                    </div>
                  ) : (
                      <div className="relative w-28 h-28 flex items-center justify-center rounded-full cursor-pointer" onClick={() => setShowPreview(true)}>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-blue-400 opacity-70 blur-sm"></div>
                        <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white to-blue-50 flex items-center justify-center z-10">
                          <span className="text-3xl font-bold text-indigo-700">
                            {(profile?.first_name?.[0] || clerkUser?.firstName?.[0] || '').toUpperCase()}
                            {(profile?.last_name?.[0] || clerkUser?.lastName?.[0] || '').toUpperCase()}
                          </span>
                        </div>
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
                      className="absolute bottom-0 right-0 bg-indigo-500 text-white rounded-full p-2 hover:bg-indigo-600 transition-colors duration-200 shadow-md z-20"
                    disabled={uploading}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-800 dark:text-[#6C63FF]">{clerkUser?.fullName || 'User'}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-100 shadow-sm dark:text-[#6C63FF] dark:border-[#6C63FF]">
                        {roleId && roles.find(r => r.id === roleId)?.name ? 
                          (roles.find(r => r.id === roleId)?.name || '').split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ') : 
                          'Legal Professional'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-[#6C63FF]">
                        <Mail className="w-4 h-4 mr-2 text-indigo-500 dark:text-[#6C63FF]" />
                        {clerkUser?.emailAddresses[0]?.emailAddress}
                      </div>
                      
                      {displayProfile.phone_number && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-[#6C63FF]">
                          <Phone className="w-4 h-4 mr-2 text-indigo-500 dark:text-[#6C63FF]" />
                          {displayProfile.phone_number}
                        </div>
                      )}
                      
                      {displayProfile.firm_name && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-[#6C63FF]">
                          <Building className="w-4 h-4 mr-2 text-indigo-500 dark:text-[#6C63FF]" />
                          {displayProfile.firm_name}
                        </div>
                      )}
                      
                      {displayProfile.address && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-[#6C63FF]">
                          <MapPin className="w-4 h-4 mr-2 text-indigo-500 dark:text-[#6C63FF]" />
                          {displayProfile.address}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {displayProfile.specialization && (
                        <Badge variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-100 shadow-sm dark:text-[#6C63FF] dark:border-[#6C63FF]">
                          <Award className="w-3 h-3 dark:text-[#6C63FF]" />
                          {displayProfile.specialization}
                      </Badge>
                      )}
                      
                      {professionalIds && professionalIds.length > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1 border-indigo-200 shadow-sm dark:text-[#6C63FF] dark:border-[#6C63FF]">
                          <Shield className="w-3 h-3 text-indigo-500 dark:text-[#6C63FF]" />
                          {professionalIds.length} {professionalIds.length === 1 ? 'Certification' : 'Certifications'}
                      </Badge>
                      )}
                      
                      {displayProfile.years_of_practice && (
                        <Badge variant="outline" className="flex items-center gap-1 border-indigo-200 shadow-sm dark:text-[#6C63FF] dark:border-[#6C63FF]">
                          <Clock className="w-3 h-3 text-indigo-500 dark:text-[#6C63FF]" />
                          {displayProfile.years_of_practice} {Number(displayProfile.years_of_practice) === 1 ? 'Year' : 'Years'} of Practice
                        </Badge>
                      )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

            <Card className="shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
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
            <Card className="shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Personal Productivity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-black">{displayMetrics.productivity_score}%</div>
              <p className="text-xs text-gray-700 mt-1 dark:text-black">Weekly efficiency score</p>
            </CardContent>
          </Card>

            <Card className="shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-black">{displayMetrics.time_saved}h</div>
              <p className="text-xs text-gray-700 mt-1 dark:text-black">This month through automation</p>
            </CardContent>
          </Card>

            <Card className="shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-black">{displayMetrics.ai_interactions}</div>
              <p className="text-xs text-gray-700 mt-1 dark:text-black">AI features used this month</p>
            </CardContent>
          </Card>

            <Card className="shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Networking Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-black">{displayMetrics.networking_score}%</div>
              <p className="text-xs text-gray-700 mt-1 dark:text-black">Professional connections</p>
            </CardContent>
          </Card>

            <Card className="shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-black">{displayMetrics.compliance_score}%</div>
              <p className="text-xs text-gray-700 mt-1 dark:text-black">Data security & compliance</p>
            </CardContent>
          </Card>

            <Card className="shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Billing Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-black">{displayMetrics.billing_efficiency}%</div>
              <p className="text-xs text-gray-700 mt-1 dark:text-black">Invoice processing speed</p>
            </CardContent>
          </Card>
        </div>

        {/* Professional Information Card */}
          <Card className="shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
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
                      className="mb-2 bg-white text-black dark:bg-white dark:text-black"
                      disabled={!isEditing || uploading}
                    />
                    <Input
                      name="last_name"
                      value={formData.last_name || ''}
                      onChange={handleInputChange}
                      placeholder="Last Name"
                      className="bg-white text-black dark:bg-white dark:text-black"
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
                      className="bg-white text-black dark:bg-white dark:text-black"
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
                      className="bg-white text-black dark:bg-white dark:text-black"
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
                      className="bg-white text-black dark:bg-white dark:text-black"
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
                      className="bg-white text-black dark:bg-white dark:text-black"
                      disabled={!isEditing || uploading}
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                      <SearchableSelect
                        options={[
                          { value: 'Male', label: 'Male' },
                          { value: 'Female', label: 'Female' },
                          { value: 'Other', label: 'Other' }
                        ]}
                        value={formData.gender ? { value: formData.gender, label: formData.gender } : null}
                        onChange={(selected) => 
                          setFormData(prev => ({ ...prev, gender: selected ? selected.value : '' }))
                        }
                        placeholder="Select gender"
                        isDisabled={!isEditing || uploading}
                      />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="professional" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Law Firm</Label>
                      <div className="relative">
                    <Input
                      name="firm_name"
                      value={formData.firm_name || ''}
                      onChange={handleInputChange}
                          placeholder="Enter your law firm name"
                      className="bg-white text-black dark:bg-white dark:text-black"
                      disabled={!isEditing || uploading}
                          ref={firmInputRef}
                        />
                        {firmSuggestions.length > 0 && isEditing && !uploading && (
                          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
                            {firmSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleFirmSuggestionClick(suggestion)}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Start typing for suggestions</div>
                  </div>
                  <div className="mb-4">
                    <label className="block font-medium">Practice Area</label>
                    {optionsLoading ? (
                      <div>Loading practice areas...</div>
                    ) : optionsError ? (
                      <div className="text-red-500">{optionsError}</div>
                    ) : (
                        <div className="relative" ref={specializationDropdownRef}>
                          <Input
                            name="specialization"
                            value={formData.specialization || ''}
                            onChange={handleInputChange}
                            placeholder="Enter your practice area"
                            className="bg-white text-black dark:bg-white dark:text-black"
                        disabled={!isEditing || uploading}
                            onFocus={() => isEditing && !uploading && setSpecializationFocused(true)}
                          />
                          {specializationFocused && !uploading && (
                            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
                              <input
                                type="text"
                                value={specializationSearch}
                                onChange={handleSpecializationSearch}
                                placeholder="Search specialization..."
                                className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
                                autoFocus
                                onClick={e => e.stopPropagation()}
                              />
                              {specializations
                                .filter(s => s.label.toLowerCase().includes(specializationSearch.toLowerCase()))
                                .map((specialization, index) => (
                                  <div
                                    key={index}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onMouseDown={() => handleSpecializationSuggestionClick(specialization)}
                                  >
                                    {specialization.label}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">Your primary area of legal practice</div>
                  </div>
                  <div>
                    <Label>Years of Practice</Label>
                    <Input
                      name="years_of_practice"
                      value={formData.years_of_practice || ''}
                      onChange={handleInputChange}
                      placeholder="Years of Practice"
                      className="bg-white text-black dark:bg-white dark:text-black"
                      disabled={!isEditing || uploading}
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                      <SearchableSelect
                        options={roles.map(r => ({ 
                          value: r.id, 
                          label: r.name.split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                        }))}
                        value={roleId ? { 
                          value: roleId,
                          label: roles.find(r => r.id === roleId)?.name.split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ') || ''
                        } : null}
                        onChange={(selected) => {
                          const selectedId = selected ? selected.value : '';
                          setRoleId(selectedId || null);
                        setFormData(prev => ({ ...prev, role: selectedId }));
                      }}
                        placeholder="Select a role"
                        isDisabled={!isEditing || uploading}
                      />
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
                        
                        // If this form is marked as completed and not open, don't show the edit form
                        const isCompleted = completedForms.has(profId.id) && !openForms.has(profId.id);
                        
                        return isCompleted ? (
                          <div key={profId.id} className="border rounded-lg p-4 bg-gradient-to-r from-white to-green-50 dark:from-[#26304a] dark:to-green-200/20 shadow-sm transition-all duration-300 dark:text-blue-100">
                            <div className="flex justify-between items-center mb-1">
                              <h3 className="text-md font-medium flex items-center">
                                <Check className="w-5 h-5 mr-2 text-green-500" />
                                {editing.country || 'New'} {editing.state ? `- ${editing.state}` : ''} Record
                              </h3>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditButtonClick(profId.id)}
                                disabled={uploading}
                                className="hover:bg-green-100"
                              >
                                <Pencil className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                            <div className="text-sm text-gray-600 flex items-center">
                              <span className="mr-2">{editing.professional_id}</span>
                              {editing.document_url && (
                                <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
                                  Document attached
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div key={profId.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-md font-medium">
                              {editing.country || 'New'} {editing.state ? `- ${editing.state}` : ''} Record
                            </h3>
                              <div className="flex gap-2">
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
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <Label>Certification Name/Type</Label>
                                <Input
                                  value={editing.professional_id || ''}
                                  onChange={e => handleProfessionalIdChange(profId.id, 'professional_id', e.target.value)}
                                  placeholder="Bar Admission, Specialist Certification, etc."
                                  className="bg-white text-black dark:bg-white dark:text-black"
                                  disabled={uploading}
                                />
                                <div className="text-xs text-gray-500 mt-1">Enter the name of your certification or license</div>
                              </div>
                              
                            <div>
                              <Label>Country</Label>
                                <SearchableSelect
                                  options={popularCountries}
                                  value={editing.country ? { label: getCountryNameByCode(editing.country), value: editing.country } : null}
                                  onChange={(selectedOption) => {
                                    if (selectedOption) {
                                      // When country changes, update country value and load states
                                      handleProfessionalIdChange(profId.id, 'country', selectedOption.value);
                                      
                                      // Update states dropdown
                                      loadStatesForCountry(selectedOption.value);
                                      
                                      // Clear the state field when country changes
                                      handleProfessionalIdChange(profId.id, 'state', '');
                                    } else {
                                      // Handle clearing the selection
                                      handleProfessionalIdChange(profId.id, 'country', '');
                                      handleProfessionalIdChange(profId.id, 'state', '');
                                      setStateOptions([]);
                                    }
                                  }}
                                  placeholder="Select a country"
                                  isDisabled={uploading}
                                />
                            </div>
                              
                            <div>
                              <Label>State/Province</Label>
                                <SearchableSelect
                                  options={editing.country ? getStatesByCountry(editing.country) : []}
                                  value={editing.state && editing.country ? 
                                    { 
                                      label: getStateNameByCode(editing.country, editing.state) || editing.state, 
                                      value: editing.state 
                                    } : null
                                  }
                                  onChange={(selectedOption) => {
                                    handleProfessionalIdChange(
                                      profId.id, 
                                      'state', 
                                      selectedOption ? selectedOption.value : ''
                                    );
                                  }}
                                  placeholder={editing.country ? "Select a state/province" : "Select a country first"}
                                  isDisabled={uploading || !editing.country}
                                  noOptionsMessage={() => "No states/provinces found for this country"}
                              />
                            </div>
                              
                            <div>
                                <Label>Issuing Authority</Label>
                              <Input
                                  value={editing.issuing_authority || ''}
                                  onChange={e => handleProfessionalIdChange(profId.id, 'issuing_authority', e.target.value)}
                                  placeholder="State Bar, Law Society, etc."
                                  className="bg-white text-black dark:bg-white dark:text-black"
                                disabled={uploading}
                              />
                            </div>
                              
                            <div>
                                <Label>Issue Date</Label>
                                <div className="relative">
                              <Input
                                    type="date"
                                    value={editing.issue_date || ''}
                                    onChange={e => handleProfessionalIdChange(profId.id, 'issue_date', e.target.value)}
                                    className="pr-10 bg-white text-black dark:bg-white dark:text-black"
                                disabled={uploading}
                                    max={new Date().toISOString().split('T')[0]} // Restrict to today and earlier
                                    onClick={(e) => e.currentTarget.showPicker()} // Only open picker on click
                                    onFocus={(e) => e.target.blur()} // Prevent auto-focus from opening the picker
                              />
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <Clock className="h-4 w-4 text-gray-400" />
                            </div>
                            </div>
                                <p className="text-xs text-gray-500 mt-1">Click to select a date</p>
                              </div>
                              
                              <div className="md:col-span-2">
                                <Label>Certification Document</Label>
                                <div className="mt-1 space-y-2">
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <form onSubmit={e => e.preventDefault()}>
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
                                    </form>
                                    
                                    {editing.document_url && (
                                      <div className="flex items-center justify-between p-2 mt-2 bg-gray-100 rounded">
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
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handleDeleteDocument(profId.id);
                                            }}
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
                          </div>
                          <div className="flex justify-end mt-4">
                            <Button
                              onClick={() => handleUpdateProfessionalId(profId.id)}
                              disabled={uploading}
                                className="bg-indigo-600 hover:bg-indigo-700"
                              >
                                {uploading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Save & Submit
                                  </>
                                )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-center mt-4">
                        <Button 
                          onClick={handleAddProfessionalId} 
                          disabled={uploading || openForms.size >= 2}
                        >
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
    </ProfileContext.Provider>
  );
} 