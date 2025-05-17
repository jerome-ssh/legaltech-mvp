"use client";
import { useUser } from '@clerk/nextjs';
import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ProfileContext } from './LayoutWithSidebar';

export default function ProfileContextProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    avatarUrl,
    clerkImageUrl: user?.imageUrl || null,
    isLoading: isLoading || !isClerkLoaded
  }), [avatarUrl, user?.imageUrl, isLoading, isClerkLoaded]);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user) {
        setAvatarUrl(null);
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('clerk_id', user.id)
          .single();

        if (error) {
          console.error('[ProfileContextProvider] Error fetching avatar:', error);
        }

        setAvatarUrl(data?.avatar_url || null);
      } catch (error) {
        console.error('[ProfileContextProvider] Error in fetchAvatar:', error);
        setAvatarUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatar();
  }, [user]);

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
} 