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

  // Show splash screen only on auth routes (login, signup, etc.)
  useEffect(() => {
    if (!isLoaded) {
      setShowSplash(true);
      return;
    }
    // Only show splash screen for auth routes
    if (authRoutes.some(route => pathname.startsWith(route))) {
      setShowSplash(false); // Optionally, you can keep a short delay if you want
    } else {
      setShowSplash(false);
    }
  }, [isLoaded, pathname]);

  // Show splash screen only on auth routes
  if (!isLoaded || (showSplash && authRoutes.some(route => pathname.startsWith(route)))) {
    return <SplashScreen />;
  }

  // For authenticated users on protected routes, render the dashboard layout
  if (isSignedIn && protectedRoutes.some(route => pathname.startsWith(route))) {
    return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
  }

  // For onboarding and public routes, render without the dashboard layout
  return children;
} 