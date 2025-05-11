'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';

export function ClerkProvider({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();

    return (
        <BaseClerkProvider
            appearance={{
                baseTheme: theme === 'dark' ? dark : undefined,
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
            {children}
        </BaseClerkProvider>
    );
} 