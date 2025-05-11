"use client";

import React, { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useSignIn();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Rate limiting check
      const lastAttempt = localStorage.getItem('lastPasswordResetAttempt');
      if (lastAttempt) {
        const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
        if (timeSinceLastAttempt < 60000) { // 1 minute cooldown
          throw new Error('Please wait a moment before requesting another reset code');
        }
      }

      const result = await signIn?.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      if (!result) {
        throw new Error('Failed to initiate password reset');
      }

      // Store attempt timestamp and email for the reset page
      localStorage.setItem('lastPasswordResetAttempt', Date.now().toString());
      localStorage.setItem('resetEmail', email);
      console.log('[ForgotPassword] Set resetEmail in localStorage:', email);

      toast.success('Password reset code sent! Please check your email.');
      // Add a small delay to ensure localStorage is set before redirect
      setTimeout(() => {
        router.push('/reset-password');
      }, 100);
    } catch (err: any) {
      console.error('Password reset request error:', err);
      toast.error(err.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive a reset code"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full h-11 px-4 rounded-lg border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 bg-white/70 text-base dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 transition-colors"
            placeholder="Enter your email"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-sky-400 to-pink-400 hover:from-sky-500 hover:to-pink-500 text-base normal-case font-medium rounded-lg py-3 shadow-lg text-white disabled:opacity-50 transition-colors"
        >
          {loading ? 'Sending...' : 'Send Reset Code'}
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