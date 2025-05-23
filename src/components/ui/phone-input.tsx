'use client';

import React, { forwardRef } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  countrySelectProps?: any;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
  id?: string;
}

export const PhoneInputField = forwardRef<HTMLInputElement, PhoneInputFieldProps>(
  ({ label, value, onChange, error, className, required, disabled, placeholder, name, id }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <Label htmlFor="phone" className="flex items-center">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className={cn(
          "relative",
          className
        )}>
          <div className={cn(
            "phone-input-container rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            error ? "border-red-500" : "",
            disabled ? "opacity-50 cursor-not-allowed" : ""
          )}>
            <PhoneInput
              international
              defaultCountry="US"
              value={value}
              onChange={onChange as any}
              disabled={disabled}
              inputRef={ref}
              placeholder={placeholder}
              name={name}
              id={id}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 flex items-center mt-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }
);

PhoneInputField.displayName = 'PhoneInputField';

// Add custom styles to the global CSS file or include them here
const styles = `
  .PhoneInput {
    display: flex;
    align-items: center;
    padding: 0.5rem;
  }
  
  .PhoneInputCountry {
    margin-right: 0.5rem;
  }
  
  .PhoneInputCountryIcon {
    width: 1.5rem;
    height: 1rem;
  }
  
  .PhoneInputInput {
    flex: 1;
    border: none;
    padding: 0;
    outline: none;
    background: transparent;
  }
  
  .PhoneInputCountrySelectArrow {
    margin-right: 0.25rem;
    width: 0.3rem;
    height: 0.3rem;
    border-style: solid;
    border-color: currentColor transparent transparent;
    border-width: 0.3rem 0.3rem 0;
  }
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
