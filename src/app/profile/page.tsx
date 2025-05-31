"use client";
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { ProfileFormData } from '@/types/profile';
import { useEffect } from 'react';

const updateProfile = async (profileData: ProfileFormData) => {
  const { user } = useUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Debug logging
  console.log('Clerk User:', {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses[0]?.emailAddress
  });

  // First, check if we have a mapping in the user_mappings table
  const { data: mapping, error: mappingError } = await supabase
    .from('user_mappings')
    .select('supabase_user_id')
    .eq('clerk_user_id', user.id)
    .single();

  console.log('User Mapping:', { mapping, mappingError });

  let supabaseUserId;

  if (mappingError) {
    if (mappingError.code === 'PGRST116') {
      // No mapping exists, create one
      const { data: newMapping, error: createMappingError } = await supabase
        .from('user_mappings')
        .insert([
          {
            clerk_user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select('supabase_user_id')
        .single();

      if (createMappingError) {
        console.error('Failed to create user mapping:', createMappingError);
        throw new Error(`Failed to create user mapping: ${createMappingError.message}`);
      }

      supabaseUserId = newMapping.supabase_user_id;
    } else {
      console.error('Failed to fetch user mapping:', mappingError);
      throw new Error(`Failed to fetch user mapping: ${mappingError.message}`);
    }
  } else {
    if (mapping) {
      supabaseUserId = mapping.supabase_user_id;
    } else {
      console.error('User mapping is null');
      return;
    }
  }

  console.log('Using Supabase User ID:', supabaseUserId);

  // Check if the profile exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', supabaseUserId)
    .single();

  console.log('Existing Profile:', { existingProfile, fetchError });

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch profile: ${fetchError.message}`);
  }

  if (!existingProfile) {
    // Create a new profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: supabaseUserId,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Failed to create profile:', createError);
      throw new Error(`Failed to create profile: ${createError.message}`);
    }

    return newProfile;
  }

  // Update the existing profile
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', supabaseUserId);

  if (error) {
    console.error('Failed to update profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data;
};

export default function ProfilePage() {
  useEffect(() => {
    const createInitialProfile = async () => {
      const { user } = useUser();

      if (!user) {
        return;
      }

      console.log('Creating initial profile for user:', user.id);

      // First, check if we have a mapping
      const { data: mapping, error: mappingError } = await supabase
        .from('user_mappings')
        .select('supabase_user_id')
        .eq('clerk_user_id', user.id)
        .single();

      if (mappingError && mappingError.code !== 'PGRST116') {
        console.error('Failed to fetch user mapping:', mappingError);
        return;
      }

      let supabaseUserId;

      if (mappingError && mappingError.code === 'PGRST116') {
        // Create new mapping
        const { data: newMapping, error: createMappingError } = await supabase
          .from('user_mappings')
          .insert([
            {
              clerk_user_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select('supabase_user_id')
          .single();

        if (createMappingError) {
          console.error('Failed to create user mapping:', createMappingError);
          return;
        }

        supabaseUserId = newMapping.supabase_user_id;
      } else {
        if (mapping) {
          supabaseUserId = mapping.supabase_user_id;
        } else {
          console.error('User mapping is null');
          return;
        }
      }

      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', supabaseUserId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Failed to fetch profile:', fetchError);
        return;
      }

      if (!existingProfile) {
        const { error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: supabaseUserId,
              first_name: user.firstName,
              last_name: user.lastName,
              email: user.emailAddresses[0]?.emailAddress,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

        if (createError) {
          console.error('Failed to create profile:', createError);
        }
      }
    };

    createInitialProfile();
  }, []);

  return (
    <div>
      <h1>Profile Page</h1>
      {/* Add your profile form or info here */}
    </div>
  );
} 