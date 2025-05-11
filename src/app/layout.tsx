import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'LegalTech MVP',
  description: 'A modern legal tech platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background antialiased', inter.className)}>
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
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ClientLayout>
              {children}
            </ClientLayout>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
