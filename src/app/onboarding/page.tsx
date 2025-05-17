'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Plus, Upload, MapPin, Home } from "lucide-react";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { ProfileStrength } from "@/components/onboarding/ProfileStrength";
import { getSpecializationsByBarNumber, getFirmSuggestions, socialProofData, specializationsByBar } from "@/lib/onboarding-utils";
import countryList from 'react-select-country-list';
import { v5 as uuidv5 } from 'uuid';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
const supabase = createClientComponentClient();

interface OnboardingForm {
    firm_name: string;
    specialization: string;
    years_of_practice: string;
    phone_number: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    address?: string; // office address
    home_address?: string;
    gender: string;
}

const onboardingSteps = [
    {
        id: 1,
        title: "Personal Info",
        description: "Basic details",
    },
    {
        id: 2,
        title: "Professional Info",
        description: "Bar & firm details",
    },
    {
        id: 3,
        title: "Specialization",
        description: "Area of practice",
    }
];

// Tooltip/help text by country
const idTooltips: Record<string, string> = {
    "United States": "Enter your state bar number (e.g., NY123456). Find it on your state bar's website.",
    "United Kingdom": "Enter your SRA number (for solicitors) or leave blank if not applicable.",
    "India": "Enter your Bar Council enrollment number or leave blank.",
    "default": "Enter any professional registration or license number, or leave blank if none applies."
};
function getIdTooltip(country: string) {
    return idTooltips[country] || idTooltips["default"];
}

const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

// Professional ID entry type
interface ProfessionalIdEntry {
    country: string;
    state?: string;
    id: string;
    yearIssued?: string;
    noId: boolean;
}

// Function to convert Clerk ID to UUID
function clerkIdToUUID(clerkId: string): string {
    return uuidv5(clerkId, '6ba7b810-9dad-11d1-80b4-00c04fd430c8');
}

export default function Onboarding() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    // Debug log for Clerk state
    console.log('Onboarding render', { isLoaded, user });
    const isAuthenticated = isLoaded && !!user;
    console.log('isAuthenticated:', isAuthenticated);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(1);
    const [form, setForm] = useState<OnboardingForm>({
        firm_name: "",
        specialization: "",
        years_of_practice: "",
        phone_number: "",
        email: "",
        first_name: "",
        last_name: "",
        avatar_url: "",
        address: "",
        home_address: "",
        gender: "",
    });
    const [firmSuggestions, setFirmSuggestions] = useState<string[]>([]);
    const [specializationSuggestions, setSpecializationSuggestions] = useState<string[]>([]);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [showNameErrors, setShowNameErrors] = useState(false);
    const [specializationFocused, setSpecializationFocused] = useState(false);
    const [specializationSearch, setSpecializationSearch] = useState("");
    const specializationDropdownRef = useRef<HTMLDivElement>(null);
    const [professionalIds, setProfessionalIds] = useState<ProfessionalIdEntry[]>([{
        country: '',
        state: '',
        id: '',
        yearIssued: '',
        noId: false
    }]);
    const [consent, setConsent] = useState(false);
    const [showHomeAddress, setShowHomeAddress] = useState(false);
    const [validation, setValidation] = useState({
        firstName: true,
        lastName: true,
        email: true,
        country: professionalIds[0]?.country ? true : false,
        professionalId: professionalIds[0]?.id || professionalIds[0]?.noId ? true : false,
        gender: true,
    });
    const [showValidationPrompt, setShowValidationPrompt] = useState(false);
    const [isCheckingProfile, setIsCheckingProfile] = useState(false);
    const checkTimeoutRef = useRef<NodeJS.Timeout>();
    const mountedRef = useRef(true);
    const [roles, setRoles] = useState<{ id: string, name: string }[]>([]);
    const [roleId, setRoleId] = useState<string | null>(null);
    const [role, setRole] = useState('attorney');
    const [onboardingPath, setOnboardingPath] = useState<string | null>(null);

    // Handle component mount/unmount
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (checkTimeoutRef.current) {
                clearTimeout(checkTimeoutRef.current);
            }
        };
    }, []);

    // Replace unauthenticated redirect effect
    useEffect(() => {
        if (isLoaded && !user && mountedRef.current) {
            console.log('[Onboarding] User unauthenticated, redirecting to login');
            window.location.href = '/login';
        }
    }, [isLoaded, user]);

    // Update profile check effect to use isAuthenticated
    useEffect(() => {
        if (!isAuthenticated || !mountedRef.current) {
            console.log('[Onboarding] Skipping profile check:', {
                isAuthenticated,
                isMounted: mountedRef.current
            });
            return;
        }
        // If we're already on the onboarding page and the profile exists, don't redirect
        if (window.location.pathname === '/onboarding') {
            console.log('[Onboarding] Already on onboarding page, skipping redirect check');
            return;
        }
        // ... rest of the effect remains unchanged ...
    }, [isAuthenticated, user, isCheckingProfile, currentStep, getToken]);

    useEffect(() => {
        // Disable all dashboard-related API calls while on onboarding page
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [resource] = args;
            if (typeof resource === 'string' &&
                (resource.includes('/tasks') ||
                    resource.includes('/messages') ||
                    resource.includes('/billing') ||
                    resource.includes('/activity'))) {
                return new Response(JSON.stringify({ data: [], error: null }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            return originalFetch(...args);
        };

        // Cleanup function to restore original fetch
        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    useEffect(() => {
        if (isLoaded && user) {
            // Only pre-fill form with Clerk user data
            setForm(prev => ({
                ...prev,
                phone_number: user.phoneNumbers[0]?.phoneNumber || "",
                email: user.primaryEmailAddress?.emailAddress || "",
                first_name: user.firstName || "",
                last_name: user.lastName || "",
            }));
        }
    }, [isLoaded, user]);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarUploading(true);
            try {
                // Create form data
                const formData = new FormData();
                formData.append('file', file);

                console.log('Uploading file:', {
                    name: file.name,
                    type: file.type,
                    size: file.size
                });

                // Upload using the API route
                const response = await fetch('/api/profile/avatar', {
                    method: 'POST',
                    body: formData,
                });

                // Get the response text first
                const responseText = await response.text();
                console.log('Raw response:', responseText);

                // Try to parse the response as JSON
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Failed to parse response:', parseError);
                    console.error('Response text:', responseText);
                    throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}...`);
                }

                if (!response.ok) {
                    throw new Error(data.error || `Server error: ${response.status}`);
                }

                if (!data.success || !data.url) {
                    throw new Error('Failed to get avatar URL');
                }

                console.log('Avatar uploaded successfully:', data.url);
                setForm(prev => ({ ...prev, avatar_url: data.url }));
                toast.success('Avatar uploaded successfully!');
            } catch (err) {
                console.error('Avatar upload error:', err);
                toast.error(err instanceof Error ? err.message : 'Failed to upload avatar. Please try again.');
            } finally {
                setAvatarUploading(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (name === 'firm_name') {
            setFirmSuggestions(getFirmSuggestions(value));
        }
    };

    const handleFirmSuggestionClick = (suggestion: string) => {
        setForm(prev => ({ ...prev, firm_name: suggestion }));
        setFirmSuggestions([]);
    };

    const handleSpecializationSuggestionClick = (suggestion: string) => {
        setForm(prev => ({ ...prev, specialization: suggestion }));
        setSpecializationSearch("");
        setSpecializationFocused(false);
        setSpecializationSuggestions([]);
    };

    const handleNext = () => {
        if (currentStep === 1 && (!form.first_name || !form.last_name)) {
            setShowNameErrors(true);
            return;
        }
        setShowNameErrors(false);
        setCurrentStep(prev => prev + 1);
    };

    function allRequiredFieldsValid() {
        const entry = professionalIds[0];
        if (currentStep === 1) {
            return (
                validateField('firstName', form.first_name) &&
                validateField('lastName', form.last_name) &&
                validateField('gender', form.gender)
            );
        }
        if (currentStep === 2) {
            return (
                validateField('firstName', form.first_name) &&
                validateField('lastName', form.last_name) &&
                validateField('email', form.email) &&
                validateField('country', entry.country) &&
                validateField('professionalId', entry.noId ? true : entry.id) &&
                validateField('gender', form.gender)
            );
        }
        return true;
    }

    const handleNextWithValidation = () => {
        if (!allRequiredFieldsValid()) {
            setShowValidationPrompt(true);
            setValidation({
                firstName: validateField('firstName', form.first_name),
                lastName: validateField('lastName', form.last_name),
                email: validateField('email', form.email),
                country: validateField('country', professionalIds[0].country),
                professionalId: validateField('professionalId', professionalIds[0].noId ? true : professionalIds[0].id),
                gender: validateField('gender', form.gender),
            });
            return;
        }
        setShowValidationPrompt(false);
        handleNext();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setShowValidationPrompt(false);

        try {
            console.log('[Onboarding] Starting form submission:', {
                hasUser: !!user,
                userId: user?.id,
                currentStep,
                formData: {
                    ...form,
                    professionalIds,
                    role
                }
            });

            if (!user) {
                console.error('[Onboarding] No user found during form submission');
                toast.error('User not found. Please try logging in again.');
                return;
            }

            // Update profile in Supabase
            console.log('[Onboarding] Updating profile in Supabase...');
            const payload = {
                firmName: form.firm_name,
                specialization: form.specialization,
                yearsOfPractice: form.years_of_practice,
                avatarUrl: form.avatar_url,
                address: form.address,
                homeAddress: form.home_address,
                gender: form.gender,
                professionalIds,
                firstName: form.first_name,
                lastName: form.last_name,
                onboarding_completed: true,
                role_id: roleId
            };

            console.log('[Onboarding] Sending profile update payload:', payload);

            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('[Onboarding] Profile update response:', {
                status: response.status,
                statusText: response.statusText
            });

            let responseData;
            try {
                responseData = await response.json();
            } catch (e) {
                toast.error('Server returned invalid JSON for profile update.');
                throw new Error('Server returned invalid JSON');
            }

            console.log('[Onboarding] Profile update response data:', responseData);

            if (!responseData.success && responseData.code === 'PHONE_NUMBER_IN_USE') {
                toast.error('This phone number is already associated with another account. Please use a different phone number.');
                setLoading(false);
                return;
            }

            if (!response.ok || !responseData.success) {
                throw new Error(responseData.error || 'Failed to update profile');
            }

            // Update Clerk metadata
            await user.update({
                unsafeMetadata: {
                    onboardingCompleted: true,
                    firmName: form.firm_name,
                    specialization: form.specialization,
                    yearsOfPractice: form.years_of_practice,
                    gender: form.gender,
                    role
                }
            });

            toast.success('Profile completed successfully!');

            // Small delay to ensure all state updates are complete
            await new Promise(resolve => setTimeout(resolve, 500));

            // Redirect to dashboard
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('[Onboarding] Error in form submission:', {
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            toast.error(error instanceof Error ? error.message : 'Failed to complete profile');
            setLoading(false);
        }
    };

    // Replace allSpecializations with the provided list
    const allSpecializations = [
        "Administrative Law",
        "Admiralty (Maritime) Law",
        "Animal Law",
        "Antitrust Law",
        "Aviation and Space Law",
        "Banking and Finance Law",
        "Bankruptcy Law",
        "Business (Corporate) Law",
        "Civil Rights Law",
        "Commercial Law",
        "Constitutional Law",
        "Consumer Protection Law",
        "Contract Law",
        "Criminal Law",
        "Cybersecurity (Cyber) Law",
        "Education Law",
        "Elder Law",
        "Employment and Labor Law",
        "Energy and Infrastructure Law",
        "Entertainment Law",
        "Environmental Law",
        "Estate Planning (Wills and Trusts)",
        "Family Law",
        "Gaming Law",
        "Health Law",
        "Human Rights Law",
        "Immigration Law",
        "Intellectual Property (IP) Law",
        "International Law",
        "Media Law",
        "Personal Injury Law",
        "Product Liability Law",
        "Public Interest Law",
        "Real Estate (Property) Law",
        "Sports Law",
        "Tax Law",
        "Technology Law (Fintech, Blockchain, AI)",
        "Tort Law"
    ];
    const filteredSpecializations = allSpecializations.filter(s => s.toLowerCase().includes(specializationSearch.toLowerCase()));

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                specializationDropdownRef.current &&
                !specializationDropdownRef.current.contains(event.target as Node)
            ) {
                setSpecializationFocused(false);
            }
        }
        if (specializationFocused) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [specializationFocused]);

    function handleProfessionalIdChange(idx: number, field: keyof ProfessionalIdEntry, value: string | boolean) {
        setProfessionalIds(prev => prev.map((entry, i) =>
            i === idx ? { ...entry, [field]: value } : entry
        ));
    }
    function addProfessionalId() {
        setProfessionalIds(prev => [...prev, {
            country: '',
            state: '',
            id: '',
            yearIssued: '',
            noId: false
        }]);
    }
    function removeProfessionalId(idx: number) {
        setProfessionalIds(prev => prev.filter((_, i) => i !== idx));
    }

    function validateField(field: string, value: string | boolean) {
        switch (field) {
            case 'firstName':
                return !!value && value.toString().trim().length > 0;
            case 'lastName':
                return !!value && value.toString().trim().length > 0;
            case 'email':
                return !!value && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.toString());
            case 'country':
                return !!value && value.toString().trim().length > 0;
            case 'professionalId':
                return (typeof value === 'string' && value.trim().length > 0 && value.length <= 50 && /^[a-zA-Z0-9\-/ ]*$/.test(value)) || value === true;
            case 'gender':
                return !!value && value.toString().trim().length > 0;
            default:
                return true;
        }
    }

    // Fetch roles from Supabase on mount
    const fetchRoles = async () => {
        try {
            const response = await fetch('/api/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId: 'dummy' })
            });
            const data = await response.json();
            if (data.success) {
                setRoles(data.roles);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        // Fetch onboarding_path from profile (or session)
        const fetchPath = async () => {
            try {
                const response = await fetch('/api/profile/onboarding-path', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileId: 'dummy' })
                });
                const data = await response.json();
                if (data.success) {
                    setOnboardingPath(data.onboarding_path);
                }
            } catch (error) {
                console.error('Error fetching onboarding path:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPath();
    }, []);

    useEffect(() => {
        if (!loading) {
            if (!onboardingPath) {
                router.replace('/onboarding/choose-path');
            } else if (onboardingPath === 'firm') {
                router.replace('/onboarding/firm');
            } else if (onboardingPath === 'solo') {
                router.replace('/onboarding/solo');
            }
        }
    }, [loading, onboardingPath, router]);

    // Minimal fallback render for debugging Clerk
    if (!isLoaded) {
        return (
            <div style={{ padding: 40 }}>
                <h1>Clerk is not loaded</h1>
                <pre>{JSON.stringify({ isLoaded, user }, null, 2)}</pre>
            </div>
        );
    }

    // Show loading state while Clerk is loading or user is not authenticated
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse w-24 h-24 bg-gray-200 rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-100 via-white to-pink-100">
            <div className="w-full max-w-4xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
                    <p className="text-gray-600">Let's get you set up with your professional profile</p>
                </div>

                <ProgressIndicator steps={onboardingSteps} currentStep={currentStep} />

                <form onSubmit={handleSubmit} className="mt-8" noValidate>
                    {currentStep === 1 && (
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            First Name
                                        </label>
                                        <Input
                                            type="text"
                                            name="first_name"
                                            value={form.first_name}
                                            onChange={handleChange}
                                            required
                                            className={`w-full bg-gray-50${showNameErrors && !form.first_name ? ' border border-red-500' : ''}`}
                                        />
                                        {showNameErrors && !form.first_name && (
                                            <span className="text-red-500 text-xs">First name is required</span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Last Name
                                        </label>
                                        <Input
                                            type="text"
                                            name="last_name"
                                            value={form.last_name}
                                            onChange={handleChange}
                                            required
                                            className={`w-full bg-gray-50${showNameErrors && !form.last_name ? ' border border-red-500' : ''}`}
                                        />
                                        {showNameErrors && !form.last_name && (
                                            <span className="text-red-500 text-xs">Last name is required</span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <Input
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            disabled
                                            className="w-full bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number (Optional)
                                        </label>
                                        <Input
                                            type="tel"
                                            name="phone_number"
                                            value={form.phone_number}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Gender <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="gender"
                                            value={form.gender}
                                            onChange={e => {
                                                handleChange(e);
                                                if (showValidationPrompt) {
                                                    setValidation(v => ({ ...v, gender: validateField('gender', e.target.value) }));
                                                }
                                            }}
                                            required
                                            className={`w-full border rounded px-3 py-2${showValidationPrompt && !validateField('gender', form.gender) ? ' border-red-500' : ''}`}
                                        >
                                            <option value="">Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                        {showValidationPrompt && !validateField('gender', form.gender) && (
                                            <span className="text-red-500 text-xs">Gender is required</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentStep === 2 && (
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Professional Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Firm Name
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                name="firm_name"
                                                value={form.firm_name}
                                                onChange={handleChange}
                                                placeholder="Enter your firm name"
                                                className="w-full"
                                            />
                                            {firmSuggestions.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
                                                    {firmSuggestions.map((suggestion, index) => (
                                                        <div
                                                            key={index}
                                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                            onClick={() => handleFirmSuggestionClick(suggestion)}
                                                        >
                                                            {suggestion}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Years of Practice
                                        </label>
                                        <Input
                                            type="number"
                                            name="years_of_practice"
                                            value={form.years_of_practice}
                                            onChange={handleChange}
                                            placeholder="Enter years of practice"
                                            className="w-full"
                                            min={0}
                                            max={70}
                                        />
                                        <span className="text-xs text-gray-500">Enter a value between 0 and 70</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Professional Identification</h3>
                                        {professionalIds.map((entry, idx) => (
                                            <div key={idx} className="mb-6 border p-4 rounded bg-gray-50">
                                                <div className="mb-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country/Jurisdiction <span className="text-red-500">*</span></label>
                                                    <select
                                                        className={`w-full border rounded px-3 py-2 ${showValidationPrompt && !validateField('country', entry.country) ? 'border-red-500' : ''}`}
                                                        value={entry.country}
                                                        onChange={e => {
                                                            handleProfessionalIdChange(idx, 'country', e.target.value);
                                                            setValidation(v => ({ ...v, country: validateField('country', e.target.value) }));
                                                        }}
                                                        required
                                                    >
                                                        <option value="">Select country</option>
                                                        {countryList().getData().map((c: { value: string; label: string }) => (
                                                            <option key={c.value} value={c.label}>{c.label}</option>
                                                        ))}
                                                    </select>
                                                    {showValidationPrompt && !validateField('country', entry.country) && <span className="text-xs text-red-500">Country is required</span>}
                                                </div>
                                                {entry.country === 'United States' && (
                                                    <div className="mb-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                                                        <select
                                                            className="w-full border rounded px-3 py-2"
                                                            value={entry.state}
                                                            onChange={e => handleProfessionalIdChange(idx, 'state', e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Select state</option>
                                                            {usStates.map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                                <div className="mb-2 flex items-center gap-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional ID <span className="text-red-500">*</span></label>
                                                    <span className="text-xs text-gray-400" title={getIdTooltip(entry.country)}>?</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    className={`w-full border rounded px-3 py-2 mb-1 ${showValidationPrompt && !validateField('professionalId', entry.noId ? true : entry.id) ? 'border-red-500' : ''}`}
                                                    value={entry.id}
                                                    onChange={e => {
                                                        handleProfessionalIdChange(idx, 'id', e.target.value);
                                                        setValidation(v => ({ ...v, professionalId: validateField('professionalId', entry.noId ? true : e.target.value) }));
                                                    }}
                                                    maxLength={50}
                                                    disabled={entry.noId}
                                                    placeholder="Enter your professional ID or leave blank"
                                                    required={!entry.noId}
                                                />
                                                {showValidationPrompt && !validateField('professionalId', entry.noId ? true : entry.id) && <span className="text-xs text-red-500">Professional ID is required or check the box</span>}
                                                <div className="flex items-center mb-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={entry.noId}
                                                        onChange={e => {
                                                            handleProfessionalIdChange(idx, 'noId', e.target.checked);
                                                            setValidation(v => ({ ...v, professionalId: validateField('professionalId', e.target.checked ? true : entry.id) }));
                                                        }}
                                                        id={`noid-${idx}`}
                                                        className="mr-2"
                                                    />
                                                    <label htmlFor={`noid-${idx}`} className="text-sm">My jurisdiction does not issue a professional ID</label>
                                                </div>
                                                <div className="mb-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Issued (optional)</label>
                                                    <select
                                                        className="w-full border rounded px-3 py-2"
                                                        value={entry.yearIssued || new Date().getFullYear().toString()}
                                                        onChange={e => handleProfessionalIdChange(idx, "yearIssued", e.target.value)}
                                                    >
                                                        <option value="">Select year</option>
                                                        {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => {
                                                            const year = new Date().getFullYear() - i;
                                                            return (
                                                                <option key={year} value={year}>
                                                                    {year}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                                {professionalIds.length > 1 && (
                                                    <button type="button" className="text-red-500 text-xs underline" onClick={() => removeProfessionalId(idx)}>Remove</button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" className="text-blue-600 text-sm underline mb-4" onClick={addProfessionalId}>Add Another ID</button>
                                        <div className="mb-2">
                                            <a href="/help/professional-id" target="_blank" className="text-blue-500 text-xs underline">What is a Professional ID?</a>
                                            <a href="/privacy" target="_blank" className="text-blue-500 text-xs underline ml-4">Privacy Policy</a>
                                        </div>
                                        <div className="flex items-center mb-2">
                                            <input
                                                type="checkbox"
                                                checked={consent}
                                                onChange={e => setConsent(e.target.checked)}
                                                id="consent"
                                                className="mr-2"
                                                required
                                            />
                                            <label htmlFor="consent" className="text-sm">I consent to the collection and storage of my professional ID for app functionality and verification.</label>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentStep === 3 && (
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Specialization</h2>
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center mb-6">
                                        <label htmlFor="avatar-upload" className="relative cursor-pointer group">
                                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 via-white to-pink-100 flex items-center justify-center border-4 border-blue-300 shadow-lg relative overflow-hidden transition-all duration-300 group-hover:scale-105">
                                                {form.avatar_url ? (
                                                    <img src={form.avatar_url} alt="Profile" className="object-cover w-full h-full rounded-full" />
                                                ) : (
                                                    <>
                                                        <span className="absolute inset-0 flex flex-col items-center justify-center text-blue-400">
                                                            <Upload className="w-8 h-8 mb-1 opacity-80" />
                                                            <span className="font-semibold text-base">Photo</span>
                                                        </span>
                                                    </>
                                                )}
                                                <span className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-2 shadow-xl border-2 border-white group-hover:bg-blue-700 transition-colors">
                                                    {avatarUploading ? (
                                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                        </svg>
                                                    ) : (
                                                        <Plus className="w-5 h-5" />
                                                    )}
                                                </span>
                                            </div>
                                            <input id="avatar-upload" name="avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Area of Practice
                                        </label>
                                        <div className="relative" ref={specializationDropdownRef}>
                                            <Input
                                                type="text"
                                                name="specialization"
                                                value={form.specialization}
                                                onChange={handleChange}
                                                placeholder="Enter your specialization"
                                                className="w-full"
                                                onFocus={() => setSpecializationFocused(true)}
                                            />
                                            {specializationFocused && allSpecializations.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                                                    <input
                                                        type="text"
                                                        value={specializationSearch}
                                                        onChange={e => setSpecializationSearch(e.target.value)}
                                                        placeholder="Search specialization..."
                                                        className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
                                                        autoFocus
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                    {filteredSpecializations.length > 0 ? (
                                                        filteredSpecializations.map((specialization, index) => (
                                                            <div
                                                                key={index}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onMouseDown={() => {
                                                                    handleSpecializationSuggestionClick(specialization);
                                                                    setSpecializationSearch("");
                                                                }}
                                                            >
                                                                {specialization}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-gray-400">No results found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-blue-400" />
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Office Address
                                        </label>
                                    </div>
                                    <Input
                                        type="text"
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        placeholder="Enter your office address"
                                        className="w-full mb-4"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Home className="w-5 h-5 text-pink-400" />
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Home Address
                                        </label>
                                    </div>
                                    <div className="flex items-center mb-2">
                                        <input
                                            type="checkbox"
                                            checked={showHomeAddress}
                                            onChange={e => setShowHomeAddress(e.target.checked)}
                                            id="showHomeAddress"
                                            className="mr-2"
                                        />
                                        <label htmlFor="showHomeAddress" className="text-sm">Add Home Address</label>
                                    </div>
                                    {showHomeAddress && (
                                        <Input
                                            type="text"
                                            name="home_address"
                                            value={form.home_address}
                                            onChange={handleChange}
                                            placeholder="Enter your home address"
                                            className="w-full mb-4"
                                        />
                                    )}
                                    <div className="mb-4">
                                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <select
                                            id="role"
                                            name="role"
                                            value={roleId ?? ''}
                                            onChange={e => {
                                                const selectedId = e.target.value;
                                                setRoleId(selectedId);
                                                const selected = roles.find(r => r.id === selectedId);
                                                setRole(selected ? selected.name : '');
                                            }}
                                            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            {roles.map(r => (
                                                <option key={r.id} value={r.id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-between mt-6">
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                variant="outline"
                            >
                                Previous
                            </Button>
                        )}
                        {currentStep < onboardingSteps.length ? (
                            <Button
                                type="button"
                                onClick={handleNextWithValidation}
                                className="ml-auto"
                                disabled={currentStep === 2 && !allRequiredFieldsValid()}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                disabled={loading}
                                className="ml-auto"
                                onClick={handleSubmit}
                            >
                                {loading ? 'Saving...' : 'Complete Profile'}
                            </Button>
                        )}
                    </div>

                    {showValidationPrompt && (
                        <div className="text-red-600 text-sm font-semibold mt-2">Please make sure to fill all the required fields.</div>
                    )}
                </form>
            </div>
        </div>
    );
} 