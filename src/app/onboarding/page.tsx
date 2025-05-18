"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Plus, Upload, MapPin, Home } from "lucide-react";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import countryList from 'react-select-country-list';
import { v5 as uuidv5 } from 'uuid';
import { commonFirmNames } from "@/lib/onboarding-utils";
import { createClient } from '@supabase/supabase-js';

interface OnboardingForm {
    firm_name: string;
    specialization: string;
    years_of_practice: string;
    phone_number: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    address?: string;
    home_address?: string;
    gender: string;
    role?: string;
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

const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

interface ProfessionalIdEntry {
    country: string;
    state?: string;
    id: string;
    yearIssued?: string;
    noId: boolean;
}

function clerkIdToUUID(clerkId: string): string {
    return uuidv5(clerkId, '6ba7b810-9dad-11d1-80b4-00c04fd430c8');
}

const practiceAreas = [
    "Administrative Law",
    "Bankruptcy Law",
    "Business Law",
    "Civil Rights Law",
    "Class Action Litigation",
    "Commercial Law",
    "Construction Law",
    "Consumer Protection Law",
    "Contract Law",
    "Corporate Law",
    "Employment Law",
    "Environmental Law",
    "Family Law",
    "Health Care Law",
    "Immigration Law",
    "Insurance Law",
    "Intellectual Property Law",
    "Labor Law",
    "Landlord-Tenant Law",
    "Personal Injury Law",
    "Product Liability Law",
    "Real Estate Law",
    "Tax Law",
    "Tort Law",
    "Workers' Compensation Law",
    "Criminal Defense",
    "Criminal Prosecution",
    "DUI/DWI Law",
    "Juvenile Law",
    "White Collar Crime",
    "Admiralty Law",
    "Aviation Law",
    "Banking Law",
    "Elder Law",
    "Entertainment Law",
    "Estate Planning",
    "International Law",
    "Military Law",
    "Nonprofit Law",
    "Patent Law",
    "Privacy Law",
    "Securities Law",
    "Sports Law",
    "Technology Law",
    "Trusts and Estates"
];

// Reusable SearchableSelect component
function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
    required = false,
    className = "",
    disabled = false,
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);
    // Show all options if search is empty and dropdown is open
    const filtered = open && search === "" ? options : options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
    return (
        <div ref={ref} className={`relative ${className}`}>
            <input
                type="text"
                value={search || options.find(opt => opt.value === value)?.label || ""}
                onChange={e => {
                    setSearch(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                className="w-full border rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                readOnly={disabled}
                required={required}
            />
            {open && !disabled && (
                <div className="absolute z-20 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                    {filtered.length > 0 ? filtered.map(opt => (
                        <div
                            key={opt.value}
                            className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${value === opt.value ? 'bg-blue-100 font-semibold' : ''}`}
                            onMouseDown={() => {
                                onChange(opt.value);
                                setSearch(opt.label);
                                setOpen(false);
                            }}
                        >
                            {opt.label}
                        </div>
                    )) : (
                        <div className="px-4 py-2 text-gray-400">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
}

const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
    { value: "Prefer not to say", label: "Prefer not to say" },
];
const countryOptions = countryList().getData().map(c => ({ value: c.label, label: c.label }));
const stateOptions = usStates.map(s => ({ value: s, label: s }));
const yearOptions = [
    { value: '', label: 'Enter year' },
    ...Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => {
        const year = new Date().getFullYear() - i;
        return { value: year.toString(), label: year.toString() };
    })
];
const practiceAreaOptions = practiceAreas.map(area => ({ value: area, label: area }));
const firmNameOptions = commonFirmNames.map(name => ({ value: name, label: name }));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Onboarding() {
    const router = useRouter();
    const { user, isLoaded: isUserLoaded } = useUser();
    const { getToken } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<OnboardingForm>({
        firm_name: '',
        specialization: '',
        years_of_practice: '',
        phone_number: '',
        email: '',
        first_name: '',
        last_name: '',
        gender: '',
        avatar_url: '',
        address: '',
        home_address: '',
        role: '',
    });
    const [professionalIds, setProfessionalIds] = useState<ProfessionalIdEntry[]>([{
        country: '',
        state: '',
        id: '',
        yearIssued: new Date().getFullYear().toString(),
        noId: false
    }]);
    const [consent, setConsent] = useState(false);
    const [showHomeAddress, setShowHomeAddress] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [practiceAreaSearch, setPracticeAreaSearch] = useState("");
    const [practiceAreaDropdownOpen, setPracticeAreaDropdownOpen] = useState(false);
    const practiceAreaRef = useRef<HTMLDivElement>(null);
    const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isUserLoaded && user) {
            setFormData(prev => ({
                ...prev,
                email: user.primaryEmailAddress?.emailAddress || '',
                first_name: user.firstName || '',
                last_name: user.lastName || '',
                phone_number: user.phoneNumbers[0]?.phoneNumber || '',
            }));
        }
    }, [isUserLoaded, user]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (practiceAreaRef.current && !practiceAreaRef.current.contains(event.target as Node)) {
                setPracticeAreaDropdownOpen(false);
            }
        }
        if (practiceAreaDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [practiceAreaDropdownOpen]);

    useEffect(() => {
        async function fetchRoles() {
            const { data, error } = await supabase.from('roles').select('name');
            if (!error && data) {
                setRoleOptions(
                    data
                        .map((r: { name: string }) => ({ value: r.name, label: r.name.charAt(0).toUpperCase() + r.name.slice(1) }))
                        .filter(r => r.value.toLowerCase() !== 'admin')
                );
            }
        }
        fetchRoles();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfessionalIdChange = (index: number, field: keyof ProfessionalIdEntry, value: string | boolean) => {
        setProfessionalIds(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const addProfessionalId = () => {
        setProfessionalIds(prev => [...prev, { country: '', state: '', id: '', yearIssued: new Date().getFullYear().toString(), noId: false }]);
    };

    const removeProfessionalId = (index: number) => {
        setProfessionalIds(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Implement your upload logic here
        // For now, just set a placeholder
        setFormData(prev => ({ ...prev, avatar_url: URL.createObjectURL(file) }));
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentStep < onboardingSteps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setIsSubmitting(true);
            setError(null);

            // Prepare the payload
            const payload = {
                firm_name: formData.firm_name,
                specialization: formData.specialization,
                years_of_practice: formData.years_of_practice,
                phone_number: formData.phone_number,
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                avatar_url: formData.avatar_url,
                address: formData.address,
                home_address: formData.home_address,
                gender: formData.gender,
                role: formData.role,
                onboarding_completed: true
            };

            console.log('Submitting payload:', payload);

            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            // Show success message
            toast.success('Profile updated successfully');

            // Immediately redirect to dashboard
            console.log('Redirecting to dashboard...');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
            toast.error('Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        if (currentStep === 1) {
            return (
                <Card className="w-full max-w-2xl mx-auto">
                    <CardContent className="p-8">
                        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">First Name</label>
                                <Input name="first_name" value={formData.first_name} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Last Name</label>
                                <Input name="last_name" value={formData.last_name} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <Input name="email" value={formData.email} disabled />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone Number (Optional)</label>
                                <Input name="phone_number" value={formData.phone_number} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Gender <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={genderOptions}
                                    value={formData.gender}
                                    onChange={val => setFormData(prev => ({ ...prev, gender: val }))}
                                    placeholder="Select gender"
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }
        if (currentStep === 2) {
            return (
                <Card className="w-full max-w-3xl mx-auto">
                    <CardContent className="p-8">
                        <h2 className="text-xl font-semibold mb-6">Professional Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Firm Name</label>
                                <SearchableSelect
                                    options={firmNameOptions}
                                    value={formData.firm_name}
                                    onChange={val => setFormData(prev => ({ ...prev, firm_name: val }))}
                                    placeholder="Select or search your firm name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Years of Practice <span className="text-red-500">*</span></label>
                                <Input
                                    name="years_of_practice"
                                    value={formData.years_of_practice}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (!val || Number(val) <= 70) handleInputChange(e);
                                    }}
                                    placeholder="Enter years of practice"
                                    type="number"
                                    min={0}
                                    max={70}
                                    required
                                />
                                <span className="text-xs text-gray-500">Enter a value between 0 and 70</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Role <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={roleOptions}
                                    value={formData.role || ""}
                                    onChange={val => setFormData(prev => ({ ...prev, role: val }))}
                                    placeholder="Select your role"
                                    required
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Professional Identification</h3>
                                {professionalIds.map((entry, idx) => (
                                    <div key={idx} className="mb-6 border p-4 rounded bg-gray-50">
                                        <div className="mb-2">
                                            <label className="block text-sm font-medium mb-1">Country/Jurisdiction <span className="text-red-500">*</span></label>
                                            <SearchableSelect
                                                options={countryOptions}
                                                value={entry.country}
                                                onChange={val => handleProfessionalIdChange(idx, 'country', val)}
                                                placeholder="Select country"
                                                required
                                            />
                                        </div>
                                        {entry.country === 'United States' && (
                                            <div className="mb-2">
                                                <label className="block text-sm font-medium mb-1">State <span className="text-red-500">*</span></label>
                                                <SearchableSelect
                                                    options={stateOptions}
                                                    value={entry.state || ''}
                                                    onChange={val => handleProfessionalIdChange(idx, 'state', val)}
                                                    placeholder="Select state"
                                                    required
                                                />
                                            </div>
                                        )}
                                        <div className="mb-2 flex items-center gap-2">
                                            <label className="block text-sm font-medium mb-1">Professional ID <span className="text-red-500">*</span></label>
                                            <span className="text-xs text-gray-400" title="Enter your professional ID or leave blank if not applicable.">?</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full border rounded px-3 py-2 mb-1"
                                            value={entry.id}
                                            onChange={e => handleProfessionalIdChange(idx, 'id', e.target.value)}
                                            maxLength={50}
                                            disabled={entry.noId}
                                            placeholder="Enter your professional ID or leave blank"
                                            required={!entry.noId}
                                        />
                                        <div className="flex items-center mb-2">
                                            <input
                                                type="checkbox"
                                                checked={entry.noId}
                                                onChange={e => handleProfessionalIdChange(idx, 'noId', e.target.checked)}
                                                id={`noid-${idx}`}
                                                className="mr-2"
                                            />
                                            <label htmlFor={`noid-${idx}`} className="text-sm">My jurisdiction does not issue a professional ID</label>
                                        </div>
                                        <div className="mb-2">
                                            <label className="block text-sm font-medium mb-1">Year Issued (optional)</label>
                                            <SearchableSelect
                                                options={yearOptions}
                                                value={entry.yearIssued || ''}
                                                onChange={val => handleProfessionalIdChange(idx, 'yearIssued', val)}
                                                placeholder="Enter year"
                                            />
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
            );
        }
        if (currentStep === 3) {
            return (
                <Card className="w-full max-w-2xl mx-auto">
                    <CardContent className="p-8">
                        <h2 className="text-xl font-semibold mb-6">Specialization</h2>
                        <div className="flex flex-col items-center mb-6">
                            <label htmlFor="avatar-upload" className="relative cursor-pointer group">
                                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 via-white to-pink-100 flex items-center justify-center border-4 border-blue-300 shadow-lg relative overflow-hidden transition-all duration-300 group-hover:scale-105">
                                    {formData.avatar_url ? (
                                        <img src={formData.avatar_url} alt="Profile" className="object-cover w-full h-full rounded-full" />
                                    ) : (
                                        <span className="absolute inset-0 flex flex-col items-center justify-center text-blue-400">
                                            <Upload className="w-8 h-8 mb-1 opacity-80" />
                                            <span className="font-semibold text-base">Photo</span>
                                        </span>
                                    )}
                                    <span className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-2 shadow-xl border-2 border-white group-hover:bg-blue-700 transition-colors">
                                        <Plus className="w-5 h-5" />
                                    </span>
                                </div>
                                <input id="avatar-upload" name="avatar" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Area of Practice <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={practiceAreaOptions}
                                    value={formData.specialization}
                                    onChange={val => setFormData(prev => ({ ...prev, specialization: val }))}
                                    placeholder="Select or search your practice area"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-400" /> Office Address</label>
                                <Input name="address" value={formData.address} onChange={handleInputChange} placeholder="Enter your office address" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="block text-sm font-medium mb-1 flex items-center gap-2"><Home className="w-5 h-5 text-pink-400" /> Home Address</label>
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
                                    value={formData.home_address}
                                    onChange={handleInputChange}
                                    placeholder="Enter your home address"
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-100 via-white to-pink-100">
            <div className="w-full max-w-4xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
                    <p className="text-gray-600">Let's get you set up with your professional profile</p>
                </div>
                <ProgressIndicator steps={onboardingSteps} currentStep={currentStep} />
                <form className="mt-8" onSubmit={currentStep === onboardingSteps.length ? handleSubmit : undefined}>
                    {renderStep()}
                    <div className="flex justify-between mt-6">
                        {currentStep > 1 && (
                            <Button type="button" onClick={() => setCurrentStep(currentStep - 1)} variant="outline">Previous</Button>
                        )}
                        {currentStep < onboardingSteps.length ? (
                            <Button type="button" className="ml-auto" onClick={handleNext}>Next</Button>
                        ) : (
                            <Button type="submit" className="ml-auto" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Complete Profile'}</Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
} 