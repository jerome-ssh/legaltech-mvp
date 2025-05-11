'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function DebugPage() {
    const { isSignedIn, isLoaded: authLoaded } = useAuth();
    const { user, isLoaded: userLoaded } = useUser();
    const [authState, setAuthState] = useState<any>(null);

    useEffect(() => {
        const state = {
            isSignedIn,
            authLoaded,
            userLoaded,
            user: user ? {
                id: user.id,
                emailAddresses: user.emailAddresses,
                primaryEmailAddress: user.primaryEmailAddress,
                publicMetadata: user.publicMetadata,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            } : null,
            timestamp: new Date().toISOString(),
        };
        setAuthState(state);
        console.log('Auth State:', state);
    }, [isSignedIn, authLoaded, userLoaded, user]);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
            <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap">
                    {JSON.stringify(authState, null, 2)}
                </pre>
            </div>
        </div>
    );
} 