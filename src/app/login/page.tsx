"use client";

import { SignIn } from '@clerk/nextjs';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  const isReset = searchParams.get('reset') === '1';
  const resetEmail = searchParams.get('email') || '';

  return (
    <AuthLayout 
      title={isReset ? "Password Reset" : "Welcome Back"}
      subtitle={isReset ? undefined : "Sign in to your account to continue"}
    >
      <div className="space-y-6">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 
                isReset
                  ? 'bg-gradient-to-r from-sky-400 to-pink-400 hover:from-sky-500 hover:to-pink-500 text-base normal-case font-medium rounded-lg py-3 shadow-lg !border-0 !border-none flex items-center justify-center gap-2'
                  : 'bg-gradient-to-r from-sky-400 to-pink-400 hover:from-sky-500 hover:to-pink-500 text-base normal-case font-medium rounded-lg py-3 shadow-lg !border-0 !border-none',
              formButtonPrimaryText: isReset ? 'flex items-center gap-2' : '',
              card: 'bg-white/90 shadow-xl rounded-xl p-8 border-0',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: isReset ? 'hidden' : 'border border-gray-200 hover:bg-gray-50/50 text-base normal-case rounded-lg',
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
            variables: isReset ? { formButtonPrimaryText: 'Next →' } : {},
          }}
          initialValues={isReset && resetEmail ? { identifier: resetEmail } : undefined}
          routing="path"
          path="/login"
          signUpUrl="/signup"
          redirectUrl="/dashboard"
          afterSignInUrl="/dashboard"
        />
        {isReset && (
          <div className="text-center text-sm text-gray-700 bg-sky-50/60 rounded-lg px-4 py-3 mb-2">
            Enter your email and the code you received to set a new password.
          </div>
        )}
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