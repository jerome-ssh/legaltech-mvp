"use client";

import { SignUp, useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';

export default function Page() {
    const { isSignedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isSignedIn) {
            router.push('/dashboard');
        }
    }, [isSignedIn, router]);

    if (isSignedIn) {
        return null;
    }

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Sign up to get started"
        >
            <div className="space-y-6">
                <SignUp
                    appearance={{
                        elements: {
                            formButtonPrimary:
                                'bg-gradient-to-r from-sky-400 to-pink-400 hover:from-sky-500 hover:to-pink-500 text-base normal-case font-medium rounded-lg py-3 shadow-lg !border-0 !border-none',
                            card: 'bg-white/90 shadow-xl rounded-xl p-8 border-0',
                            headerTitle: 'hidden',
                            headerSubtitle: 'hidden',
                            socialButtonsBlockButton: 'border border-gray-200 hover:bg-gray-50/50 text-base normal-case rounded-lg',
                            formFieldInput:
                                'rounded-lg border-gray-200 focus:border-sky-400 focus:ring-sky-400 bg-white/70 text-base',
                            footerActionLink:
                                'text-sky-600 hover:text-pink-500 font-medium transition',
                            footer: 'hidden',
                            rootBox: 'shadow-none',
                            main: 'gap-4',
                            formFieldAction: 'text-sky-600 hover:text-pink-500 font-medium transition',
                            formFieldLabel: 'text-gray-700 font-medium',
                            formFieldInputShowPasswordButton: 'text-sky-600 hover:text-pink-500',
                            formFieldInputShowPasswordIcon: 'text-sky-600 hover:text-pink-500',
                            formFieldInputShowPasswordButtonHover: 'text-pink-500',
                            formFieldInputShowPasswordIconHover: 'text-pink-500',
                        },
                    }}
                    routing="path"
                    path="/signup"
                    signInUrl="/login"
                    afterSignUpUrl="/dashboard"
                />
                <div className="text-sm text-center mt-4">
                    <span className="text-gray-500">Already have an account?{' '}
                        <Link href="/login" className="text-pink-600 hover:text-sky-500 font-semibold transition">Sign in</Link>
                    </span>
                </div>
            </div>
        </AuthLayout>
    );
} 