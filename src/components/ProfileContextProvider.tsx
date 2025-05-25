"use client";
import { useUser } from '@clerk/nextjs';
import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ProfileContext } from './LayoutWithSidebar';

export default function ProfileContextProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarUpdateSignal, setAvatarUpdateSignal] = useState(0);

  // Listen for storage events from other tabs/components and directly triggered events
  useEffect(() => {
    const handleStorageChange = (event?: StorageEvent) => {
      // If this is a storage event, check if it's our key
      if (event && event.key !== 'profile_avatar_updated') return;
      
      // Check if the avatar update signal was triggered
      const lastUpdate = localStorage.getItem('profile_avatar_updated');
      if (lastUpdate) {
        console.log('[ProfileContextProvider] Detected avatar update:', lastUpdate);
        setAvatarUpdateSignal(prev => prev + 1);
        
        // Force a complete refetch of the avatar
        fetchProfileAvatar(user?.id);
      }
    };
    
    // Custom event listener for same-page notifications
    const handleCustomEvent = () => {
      console.log('[ProfileContextProvider] Detected custom storage event');
      handleStorageChange();
    };

    // Listen for storage events (triggered by the profile page from other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom storage events (triggered within the same page)
    window.addEventListener('storage-event', handleCustomEvent);
    
    // Also check once on mount
    handleStorageChange();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage-event', handleCustomEvent);
    };
  }, [user?.id]);
  
  // Function to fetch profile avatar
  const fetchProfileAvatar = async (userId: string | undefined) => {
    if (!userId) {
      setAvatarUrl(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClientComponentClient();
      console.log('[ProfileContextProvider] Fetching avatar for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('clerk_id', userId)
        .single();

      if (error) {
        console.error('[ProfileContextProvider] Error fetching avatar:', error);
      }

      console.log('[ProfileContextProvider] Fetched avatar data:', data);
      setAvatarUrl(data?.avatar_url || null);
    } catch (error) {
      console.error('[ProfileContextProvider] Error in fetchAvatar:', error);
      setAvatarUrl(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    avatarUrl: avatarUrl ? `${avatarUrl}?t=${avatarUpdateSignal}` : null,
    clerkImageUrl: user?.imageUrl || null,
    isLoading: isLoading || !isClerkLoaded
  }), [avatarUrl, user?.imageUrl, isLoading, isClerkLoaded, avatarUpdateSignal]);

  // Initial avatar fetch on user change
  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      setIsLoading(false);
      return;
    }
    
    // Use our centralized fetch function
    fetchProfileAvatar(user.id);
    
    // The profile avatar fetch is now also triggered by:
    // 1. The storage event listener for cross-tab notifications
    // 2. The custom storage-event for same-page notifications
    // 3. Realtime subscription updates
    
  }, [user]);

  // Setup Realtime subscription for profile changes
  useEffect(() => {
    if (!user) return;

    const supabase = createClientComponentClient();
    const channel = supabase
      .channel(`profile_changes:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `clerk_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[ProfileContextProvider] Profile update received via Realtime:', payload);
          // Increment signal to refresh cached images
          setAvatarUpdateSignal(prev => prev + 1);
          
          // Directly fetch the latest avatar
          if (user?.id) {
            fetchProfileAvatar(user.id);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[ProfileContextProvider] Unsubscribing from Realtime profile changes');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
} 