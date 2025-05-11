'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function SocialCallback() {
    console.log('[DEBUG] SocialCallback page rendered');
    const { isSignedIn, isLoaded, getToken } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const [redirectAttempted, setRedirectAttempted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const maxRetries = 3;
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!isLoaded) {
            // Clerk is not ready, show loading spinner
            return;
        }
        if (!isSignedIn || !user) {
            // User is not signed in, show loading or redirect to login after a delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }

        const handleRedirect = async () => {
            if (redirectAttempted) {
                return;
            }

            console.log('Social callback - Auth state:', {
                isSignedIn,
                isLoaded,
                userId: user?.id,
                retryCount,
                timestamp: new Date().toISOString()
            });

            try {
                // Wait for Clerk to fully process the sign-in
                // Use exponential backoff for retries
                const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));

                if (!isSignedIn || !user) {
                    if (retryCount < maxRetries) {
                        console.log(`Retrying auth check (${retryCount + 1}/${maxRetries})...`);
                        setRetryCount(prev => prev + 1);
                        return;
                    }
                    throw new Error('Authentication failed after multiple retries');
                }

                setRedirectAttempted(true);

                // Check if user has completed onboarding
                const token = await getToken();
                const checkRes = await fetch('/api/profile/check', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });

                if (!checkRes.ok) {
                    let errorMsg = 'Failed to check profile status';
                    try {
                        const errorData = await checkRes.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch { }
                    toast.error(errorMsg);
                    setError(errorMsg);
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 3000);
                    return;
                }

                const checkData = await checkRes.json();
                console.log('Profile check response:', checkData);

                // Determine where to redirect based on profile status
                const redirectUrl = checkData.onboarding_completed ? '/dashboard' : '/onboarding';
                console.log('Redirecting to:', redirectUrl);

                // Use router.push for client-side navigation first
                router.push(redirectUrl);

                // Fallback to hard navigation after a short delay
                setTimeout(() => {
                    if (window.location.pathname !== redirectUrl) {
                        window.location.href = redirectUrl;
                    }
                }, 1000);

            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Authentication failed';
                toast.error(msg);
                setError(msg);
                setRedirectAttempted(true);
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            }
        };

        handleRedirect();
    }, [isLoaded, isSignedIn, user, redirectAttempted, retryCount, router]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">Authentication Error</div>
                    <div className="text-gray-600">{error}</div>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="text-red-500 font-bold mb-2">[DEBUG] SocialCallback page rendered</div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600">Completing sign in...</div>
                {retryCount > 0 && (
                    <div className="text-sm text-gray-500 mt-2">
                        Attempt {retryCount} of {maxRetries}
                    </div>
                )}
            </div>
        </div>
    );
} 