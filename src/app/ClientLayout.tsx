'use client';

import { useUser } from '@clerk/nextjs';
import { usePathname, useRouter } from "next/navigation";
import { ThemeProvider } from "@/context/ThemeProvider";
import LayoutWithSidebar from "@/components/LayoutWithSidebar";
import SplashScreen from "@/components/SplashScreen";
import { useEffect, useState } from "react";

const protectedRoutes = [
  '/dashboard',
  '/settings',
  // add more protected routes here as needed
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
      if (isProtectedRoute && !isSignedIn) {
        router.replace('/login');
      }
      setIsChecking(false);
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  // For authenticated users, always render the dashboard layout
  if (isSignedIn) {
    return (
      <ThemeProvider>
        <LayoutWithSidebar>{children}</LayoutWithSidebar>
      </ThemeProvider>
    );
  }

  // For unauthenticated users, show splash during initial load
  if (!isLoaded || isChecking) {
    return <SplashScreen />;
  }

  // For public routes (like login), render without the dashboard layout
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
} 