"use client";

import { SignIn } from '@clerk/nextjs';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function useJsonErrorCatcher() {
    const router = useRouter();
    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;
        // Check if the page is showing a raw JSON error (e.g. from a failed fetch)
        const pre = document.querySelector('pre');
        if (pre) {
            try {
                const json = JSON.parse(pre.textContent || '');
                if (json && json.error) {
                    toast.error(json.error || 'An error occurred.');
                    // Optionally, redirect to login or clear the error
                    setTimeout(() => {
                        router.replace('/login');
                    }, 2000);
                }
            } catch (e) {
                // Not JSON, ignore
            }
        }
    }, [router]);
}

export default function Page() {
    useJsonErrorCatcher();
    // Custom error handler for Clerk SignIn
    const handleSignInError = (error: any) => {
        if (error?.code === 'PHONE_NUMBER_IN_USE' || error?.message?.includes('phone number')) {
            toast.error('This phone number is already associated with another account. Please use a different phone number.');
        } else if (error?.message) {
            toast.error(error.message);
        } else {
            toast.error('Sign in failed. Please try again.');
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to your account to continue"
        >
            <div className="space-y-6">
                <SignIn
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
                            formFieldAction: 'hidden',
                            formFieldLabel: 'text-gray-700 font-medium',
                            formFieldInputShowPasswordButton: 'text-sky-600 hover:text-pink-500',
                            formFieldInputShowPasswordIcon: 'text-sky-600 hover:text-pink-500',
                            formFieldInputShowPasswordButtonHover: 'text-pink-500',
                            formFieldInputShowPasswordIconHover: 'text-pink-500',
                            footerAction: 'hidden',
                            alternativeMethodsBlockButton: 'hidden',
                            formFieldHintText: 'hidden',
                            formFieldSuccessText: 'hidden',
                            dividerLine: 'hidden',
                            dividerText: 'hidden',
                            badge: '!hidden',
                        },
                        layout: {
                            socialButtonsPlacement: 'bottom',
                            showOptionalFields: false,
                        },
                    }}
                    routing="path"
                    path="/login"
                    signUpUrl="/signup"
                    afterSignInUrl="/dashboard"
                />
                <div className="flex flex-col items-center gap-2 mt-2">
                    <Link
                        href="/forgot-password"
                        className="text-sm text-sky-600 hover:text-pink-500 font-medium transition cursor-pointer hover:underline"
                    >
                        Forgot password?
                    </Link>
                    <span className="text-gray-500 text-sm">Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-pink-600 hover:text-sky-500 font-semibold transition">Sign up</Link>
                    </span>
                </div>
            </div>
        </AuthLayout>
    );
} 