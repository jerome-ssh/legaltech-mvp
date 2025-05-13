'use client';

import { useUser } from '@clerk/nextjs';
import { usePathname } from "next/navigation";
import LayoutWithSidebar from "@/components/LayoutWithSidebar";
import SplashScreen from "@/components/SplashScreen";
import { useEffect, useState } from "react";

const protectedRoutes = [
  '/dashboard',
  '/documents',
  '/clients',
  '/billing',
  '/analytics',
  '/help',
  '/settings',
  '/crm'
];

const authRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password'
];

const onboardingRoutes = [
  '/onboarding',
  '/sso-callback',
  '/signup/social-callback'
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(true);

  // Handle initial load and auth state
  useEffect(() => {
    if (!isLoaded) {
      setShowSplash(true);
      return;
    }

    // Force splash screen to show for at least 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoaded]);

  // Show splash screen during initial load or when auth is not loaded
  if (!isLoaded || showSplash) {
    return <SplashScreen />;
  }

  // For authenticated users on protected routes, render the dashboard layout
  if (isSignedIn && protectedRoutes.some(route => pathname.startsWith(route))) {
    return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
  }

  // For onboarding and public routes, render without the dashboard layout
  return children;
} 