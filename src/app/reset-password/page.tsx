"use client";

import React, { useState } from 'react';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate password
            if (newPassword.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }

            // Attempt to reset the password
            const result = await signIn?.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code,
                password: newPassword,
            });

            if (result?.status === 'complete') {
                toast.success('Password reset successful!');
                router.push('/login');
            } else {
                throw new Error('Failed to reset password. Please try again.');
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                        onChange={(e) => setCode(e.target.value)}
                        required
                        className="mt-1 block w-full h-11 px-4 rounded-lg border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 bg-white/70 text-base dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 transition-colors"
                        placeholder="Enter reset code"
                        disabled={loading}
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