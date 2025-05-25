'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import '@/app/globals.css';
import '@/styles/react-select.css';
import { Inter } from 'next/font/google';
import ClientLayout from './ClientLayout';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import ProfileContextProvider from '@/components/ProfileContextProvider';
import ThemeProvider from '@/components/providers/MuiThemeProvider';
import { Toaster as SonnerToaster } from 'sonner';
import { useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          
          if (registration.installing) {
            console.log('Service worker installing');
          } else if (registration.waiting) {
            console.log('Service worker installed');
          } else if (registration.active) {
            console.log('Service worker active');
          }
        } catch (error) {
          console.error('Service worker registration failed:', error);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LawMate" />
      </head>
      <body className={cn('min-h-screen antialiased', inter.className)}>
        <ThemeProvider>
          <ClerkProvider
            appearance={{
              variables: {
                colorPrimary: 'hsl(222.2 47.4% 11.2%)',
                colorTextOnPrimaryBackground: 'hsl(210 40% 98%)',
              },
              elements: {
                formButtonPrimary: 'bg-gradient-to-r from-sky-400 to-pink-400 hover:from-sky-500 hover:to-pink-500',
                card: 'bg-white/90 shadow-xl rounded-xl',
                socialButtonsBlockButton: 'border border-gray-200 hover:bg-gray-50/50',
                formFieldInput: 'rounded-lg border-gray-200 focus:border-sky-400 focus:ring-sky-400',
              }
            }}
            signInUrl="/login"
            signUpUrl="/signup"
            afterSignInUrl="/onboarding"
            afterSignUpUrl="/onboarding"
          >
            <ProfileContextProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
              <Toaster />
              <SonnerToaster />
              <InstallPrompt />
            </ProfileContextProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 