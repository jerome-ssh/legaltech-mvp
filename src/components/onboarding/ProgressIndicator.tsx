import React from 'react';

interface Step {
    id: number;
    title: string;
    description: string;
}

interface ProgressIndicatorProps {
    currentStep: number;
    steps: Step[];
}

export function ProgressIndicator({ currentStep, steps }: ProgressIndicatorProps) {
    return (
        <div className="w-full max-w-3xl mx-auto mb-8">
            <div className="flex justify-between relative">
                {/* Progress bar */}
                <div className="absolute top-4 left-0 w-full h-1 bg-gray-200">
                    <div
                        className="h-full bg-gradient-to-r from-sky-400 to-pink-400 transition-all duration-300"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {/* Steps */}
                {steps.map((step) => (
                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step.id <= currentStep
                                    ? 'bg-gradient-to-r from-sky-400 to-pink-400 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                        >
                            {step.id}
                        </div>
                        <div className="mt-2 text-center">
                            <div className={`text-sm font-medium ${step.id <= currentStep ? 'text-gray-900' : 'text-gray-500'
                                }`}>
                                {step.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {step.description}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 