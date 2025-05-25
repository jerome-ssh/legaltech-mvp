'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Database } from 'lucide-react';
import { useSignIn, useSignUp, useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function TestPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const { signIn } = useSignIn();
    const { signUp } = useSignUp();
    const { isSignedIn, userId } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    // Set default email and password when user signs in
    useEffect(() => {
        if (isSignedIn && userId) {
            setEmail(`${userId}@test.com`);
            setPassword('Test123!');
        }
    }, [isSignedIn, userId]);

    const handleRateLimitError = (error: any) => {
        const waitTime = Math.min(30, Math.pow(2, retryCount)); // Exponential backoff, max 30 seconds
        setStatus({
            success: false,
            error: `Email rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
            retryAfter: waitTime
        });
        toast.error(`Email rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
        setRetryCount(prev => prev + 1);
    };

    const handleSignIn = async () => {
        if (isSignedIn) {
            setStatus({
                success: true,
                message: "Already signed in",
                userId: userId
            });
            toast.success('Already signed in');
            return;
        }

        setLoading(true);
        try {
            if (!signIn) throw new Error('Sign in not available');

            const result = await signIn.create({
                identifier: email,
                password,
            });

            if (result.status === 'complete') {
                setStatus({
                    success: true,
                    message: "Signed in successfully",
                    session: result.createdSessionId
                });
                toast.success('Signed in successfully');
                window.location.href = '/dashboard';
            } else {
                throw new Error('Sign in failed');
            }
        } catch (error: any) {
            if (error.message?.includes('rate limit')) {
                handleRateLimitError(error);
            } else {
                setStatus({
                    success: false,
                    error: error.message
                });
                toast.error(error.message || 'Failed to sign in');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (isSignedIn) {
            setStatus({
                success: true,
                message: "Already signed in",
                userId: userId
            });
            toast.success('Already signed in');
            return;
        }

        setLoading(true);
        try {
            if (!signUp) throw new Error('Sign up not available');

            const result = await signUp.create({
                emailAddress: email,
                password,
            });

            if (result.status === 'complete') {
                setStatus({
                    success: true,
                    message: "Signed up successfully. Please check your email for verification.",
                    session: result.createdSessionId
                });
                toast.success('Signed up successfully. Please check your email for verification.');
                window.location.href = '/dashboard';
            } else {
                throw new Error('Sign up failed');
            }
        } catch (error: any) {
            if (error.message?.includes('rate limit')) {
                handleRateLimitError(error);
            } else {
                setStatus({
                    success: false,
                    error: error.message
                });
                toast.error(error.message || 'Failed to sign up');
            }
        } finally {
            setLoading(false);
        }
    };

    const analyzeDatabase = async () => {
        setLoading(true);
        try {
            // Test database connection and get profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*');

            if (profilesError) throw profilesError;

            // Get matters
            const { data: matters, error: mattersError } = await supabase
                .from('matters')
                .select('*');

            if (mattersError) throw mattersError;

            // Get documents
            const { data: documents, error: documentsError } = await supabase
                .from('documents')
                .select('*');

            if (documentsError) throw documentsError;

            setStatus({
                success: true,
                message: "Database analysis completed",
                data: {
                    tables: {
                        profiles: {
                            count: profiles?.length || 0,
                            sample: profiles?.[0] || null
                        },
                        matters: {
                            count: matters?.length || 0,
                            sample: matters?.[0] || null
                        },
                        documents: {
                            count: documents?.length || 0,
                            sample: documents?.[0] || null
                        }
                    }
                }
            });
            toast.success('Database analysis completed');
        } catch (error: any) {
            setStatus({
                success: false,
                error: error.message
            });
            toast.error(error.message || 'Failed to analyze database');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-6 text-blue-400">Authentication Test</h1>

            {/* Authentication Form */}
            <div className="mb-8 p-6 bg-gray-800 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-blue-400">Authentication</h2>
                {isSignedIn ? (
                    <div className="text-green-400 mb-4">
                        ✓ Signed in as {userId}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full h-11 px-4 rounded-lg border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 bg-white/70 text-base dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 transition-colors"
                                placeholder="Enter your email"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full h-11 px-4 rounded-lg border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 bg-white/70 text-base dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 transition-colors"
                                    placeholder="Enter your password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleSignIn}
                                disabled={loading}
                                className="bg-gradient-to-r from-sky-400 to-pink-400 hover:from-sky-500 hover:to-pink-500 text-base normal-case font-medium rounded-lg py-3 shadow-lg text-white disabled:opacity-50 transition-colors px-6"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={handleSignUp}
                                disabled={loading}
                                className="bg-gradient-to-r from-sky-400 to-pink-400 hover:from-sky-500 hover:to-pink-500 text-base normal-case font-medium rounded-lg py-3 shadow-lg text-white disabled:opacity-50 transition-colors px-6"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Database Analysis */}
            <div className="mb-8 p-6 bg-gray-800 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-blue-400">Database Analysis</h2>
                <button
                    onClick={analyzeDatabase}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-gradient-to-r from-sky-400 to-pink-400 hover:from-sky-500 hover:to-pink-500 text-base normal-case font-medium rounded-lg py-3 shadow-lg text-white disabled:opacity-50 transition-colors px-6"
                >
                    <Database className="h-5 w-5" />
                    <span>Analyze Database</span>
                </button>
            </div>

            {/* Status Display */}
            {status && (
                <div className={`p-4 rounded-lg ${status.success ? 'bg-green-800' : 'bg-red-800'}`}>
                    <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(status, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
} 