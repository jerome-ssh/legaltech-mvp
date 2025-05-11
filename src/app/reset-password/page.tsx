"use client";

import React, { useState, useEffect } from 'react';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signIn } = useSignIn();
    const router = useRouter();

    // Validate password strength
    const validatePassword = (password: string) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            return 'Password must be at least 8 characters long';
        }
        if (!hasUpperCase) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!hasLowerCase) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!hasNumbers) {
            return 'Password must contain at least one number';
        }
        if (!hasSpecialChar) {
            return 'Password must contain at least one special character';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate code
            if (!code.trim()) {
                throw new Error('Please enter the reset code');
            }

            // Validate password
            const passwordError = validatePassword(newPassword);
            if (passwordError) {
                throw new Error(passwordError);
            }

            // Get the email from localStorage
            const email = localStorage.getItem('resetEmail');
            if (!email) {
                throw new Error('Reset session expired. Please request a new reset code.');
            }

            // Attempt to reset the password
            const result = await signIn?.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code,
                password: newPassword
            });

            if (!result) {
                throw new Error('Failed to reset password. Please try again.');
            }

            if (result.status === 'complete') {
                // Clear reset-related data from localStorage
                localStorage.removeItem('resetEmail');
                localStorage.removeItem('lastPasswordResetAttempt');

                toast.success('Password reset successful! Please sign in with your new password.');
                router.push('/login');
            } else {
                throw new Error('Failed to reset password. Please try again.');
            }
        } catch (err: any) {
            console.error('Password reset error:', err);
            toast.error(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Check if we have a valid reset session
    useEffect(() => {
        const email = localStorage.getItem('resetEmail');
        if (!email) {
            toast.error('Reset session expired. Please request a new reset code.');
            router.push('/forgot-password');
        }
    }, [router]);

    return (
        <AuthLayout
            title="Set New Password"
            subtitle="Enter the code from your email and your new password"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Reset Code
                    </label>
                    <input
                        type="text"
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.trim())}
                        required
                        className="mt-1 block w-full h-11 px-4 rounded-lg border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 bg-white/70 text-base dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 transition-colors"
                        placeholder="Enter reset code"
                        disabled={loading}
                        maxLength={8}
                    />
                </div>
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="mt-1 block w-full h-11 px-4 rounded-lg border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 bg-white/70 text-base dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 transition-colors pr-12"
                            placeholder="Enter new password"
                            disabled={loading}
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.
                    </p>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-sky-400 to-pink-400 hover:from-sky-500 hover:to-pink-500 text-base normal-case font-medium rounded-lg py-3 shadow-lg text-white disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <div className="text-center">
                    <Link
                        href="/login"
                        className="text-sm text-sky-600 hover:text-pink-500 font-medium transition-colors"
                    >
                        Back to login
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
} 