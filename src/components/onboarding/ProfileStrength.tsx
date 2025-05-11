import React from 'react';

interface ProfileStrengthProps {
    form: {
        avatar_url: string;
        bar_number: string;
        firm_name: string;
        specialization: string;
        years_of_practice: string;
    };
}

export function ProfileStrength({ form }: ProfileStrengthProps) {
    const calculateStrength = () => {
        let score = 0;
        const totalFields = 5;

        if (form.avatar_url) score++;
        if (form.bar_number) score++;
        if (form.firm_name) score++;
        if (form.specialization) score++;
        if (form.years_of_practice) score++;

        return (score / totalFields) * 100;
    };

    const strength = calculateStrength();
    const getStrengthColor = () => {
        if (strength < 40) return 'text-red-500';
        if (strength < 70) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getStrengthText = () => {
        if (strength < 40) return 'Basic';
        if (strength < 70) return 'Good';
        return 'Complete';
    };

    return (
        <div className="w-full bg-white/50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Profile Strength</span>
                <span className={`text-sm font-semibold ${getStrengthColor()}`}>
                    {getStrengthText()}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${strength < 40 ? 'bg-red-500' : strength < 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                    style={{ width: `${strength}%` }}
                />
            </div>
            <div className="mt-2 text-xs text-gray-500">
                {strength < 100 && 'Complete your profile to unlock all features'}
            </div>
        </div>
    );
} 