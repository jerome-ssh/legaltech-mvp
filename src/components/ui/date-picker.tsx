'use client';

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';

export interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
}

export const DatePicker = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  className,
  error,
  disabled = false,
  minDate,
  maxDate,
  required = false,
}: DatePickerProps) => {
  // Custom input component
  const CustomInput = forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
    ({ value, onClick }, ref) => (
      <div
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-red-500',
          'cursor-pointer flex items-center justify-between',
          className
        )}
        onClick={onClick}
        ref={ref}
      >
        <span className={!value ? 'text-muted-foreground' : ''}>
          {value || placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 opacity-50" />
      </div>
    )
  );

  CustomInput.displayName = 'DatePickerCustomInput';

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <ReactDatePicker
        selected={value}
        onChange={onChange}
        customInput={<CustomInput />}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        dateFormat="MMM d, yyyy"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
