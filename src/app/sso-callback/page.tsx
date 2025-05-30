'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';

export default function SSOCallback() {
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const [redirectAttempted, setRedirectAttempted] = useState(false);

    useEffect(() => {
        const handleRedirect = async () => {
            if (isLoaded && !redirectAttempted) {
                setRedirectAttempted(true);
                console.log('SSO callback - Auth state:', { isSignedIn, isLoaded, userId: user?.id });

                if (isSignedIn && user) {
                    try {
                        // Wait for Clerk to fully process the sign-in
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // Force a hard navigation to onboarding
                        window.location.href = '/onboarding';
                    } catch (error) {
                        console.error('SSO callback redirect error:', error);
                        window.location.href = '/login';
                    }
                } else {
                    console.log('SSO callback - Not signed in, redirecting to login');
                    window.location.href = '/login';
                }
            }
        };

        handleRedirect();
    }, [isLoaded, isSignedIn, user, redirectAttempted]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
} 