"use client";
import React, { useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { client } = useClerk();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await client.signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setMessage('Password reset code sent! Please check your email and enter the code on the login page.');
      // Redirect to login with reset param and email after 2 seconds
      setTimeout(() => {
        router.push(`/login?reset=1&email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password?" subtitle="Enter your email to reset your password">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white/70 text-base"
            placeholder="Enter your email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-sky-400 to-pink-400 hover:from-sky-500 hover:to-pink-500 text-white font-medium rounded-lg shadow-lg !border-0 !border-none transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send reset code'}
        </button>
        <div className="text-center mt-2">
          <Link href="/login" className="text-sm text-sky-600 hover:text-pink-500 font-medium transition">
            Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
} 