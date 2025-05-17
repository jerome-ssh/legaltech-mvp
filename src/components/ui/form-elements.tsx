import React from 'react';
import { SearchableSelect, Option } from '@/components/ui/searchable-select';
import { Label } from '@/components/ui/label';
import { getCountriesWithPopularFirst, getStatesByCountry, getCountryNameByCode, getStateNameByCode } from '@/lib/geo-data';

// Reusable gender selection dropdown
export const GenderSelect = ({
  value,
  onChange,
  disabled = false,
  className = '',
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  error?: string;
}) => {
  const options: Option[] = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div className={className}>
      <Label>Gender</Label>
      <SearchableSelect
        options={options}
        value={value ? { value, label: value } : null}
        onChange={(option) => onChange(option ? option.value : '')}
        placeholder="Select gender"
        isDisabled={disabled}
        error={error}
      />
    </div>
  );
};

// Reusable yes/no dropdown (for onboarding_completed, etc.)
export const YesNoSelect = ({
  value,
  onChange,
  disabled = false,
  className = '',
  label = 'Status',
  error,
}: {
  value: boolean | string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}) => {
  // Convert boolean or string to proper value
  const normalizedValue = typeof value === 'boolean' 
    ? (value ? 'Yes' : 'No')
    : value;

  const options: Option[] = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
  ];

  return (
    <div className={className}>
      <Label>{label}</Label>
      <SearchableSelect
        options={options}
        value={normalizedValue ? { value: normalizedValue, label: normalizedValue } : null}
        onChange={(option) => onChange(option ? option.value : 'No')}
        placeholder="Select option"
        isDisabled={disabled}
        error={error}
      />
    </div>
  );
};

// Country select with proper geo data
export const CountrySelect = ({
  value,
  onChange,
  disabled = false,
  className = '',
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  error?: string;
}) => {
  const countries = getCountriesWithPopularFirst();

  return (
    <div className={className}>
      <Label>Country</Label>
      <SearchableSelect
        options={countries}
        value={value ? { value, label: getCountryNameByCode(value) || value } : null}
        onChange={(option) => onChange(option ? option.value : '')}
        placeholder="Select country"
        isDisabled={disabled}
        error={error}
      />
    </div>
  );
};

// State/Province select that depends on country
export const StateSelect = ({
  countryCode,
  value,
  onChange,
  disabled = false,
  className = '',
  error,
}: {
  countryCode: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  error?: string;
}) => {
  const states = getStatesByCountry(countryCode);
  const hasStates = states.length > 0;

  return (
    <div className={className}>
      <Label>State/Province</Label>
      <SearchableSelect
        options={states}
        value={value && countryCode ? { 
          value, 
          label: getStateNameByCode(countryCode, value) || value 
        } : null}
        onChange={(option) => onChange(option ? option.value : '')}
        placeholder={!countryCode 
          ? "Select a country first" 
          : hasStates 
            ? "Select state/province" 
            : "No states available"
        }
        isDisabled={disabled || !countryCode || !hasStates}
        noOptionsMessage={() => "No states/provinces found for this country"}
        error={error}
      />
    </div>
  );
}; 