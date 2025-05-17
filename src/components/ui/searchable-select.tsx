import React, { forwardRef, ForwardedRef } from 'react';
import Select, { StylesConfig, Props as SelectProps } from 'react-select';
import { Label } from '@/components/ui/label';

export interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps extends Omit<SelectProps<Option, false>, 'classNames'> {
  label?: string;
  options: Option[];
  value?: Option | null;
  onChange: (option: Option | null) => void;
  placeholder?: string;
  isSearchable?: boolean;
  isDisabled?: boolean;
  className?: string;
  error?: string;
  isClearable?: boolean;
  noOptionsMessage?: () => string;
}

export const SearchableSelect = forwardRef<HTMLDivElement, SearchableSelectProps>(({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  isSearchable = true,
  isDisabled = false,
  className = '',
  error,
  isClearable = true,
  noOptionsMessage,
  ...props
}, ref) => {
  const customStyles: StylesConfig<Option, false> = {
    // Style the control/input element
    control: (provided, state) => ({
      ...provided,
      backgroundColor: state.isDisabled ? '#f1f5f9' : 'white',
      borderColor: error ? '#ef4444' : state.isFocused ? '#6366f1' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#6366f1' : '#cbd5e1',
      },
      borderRadius: '0.375rem',
      padding: '1px',
      fontSize: '0.875rem',
      minHeight: '2.5rem',
    }),
    // Style the dropdown menu
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.375rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      zIndex: 50,
    }),
    // Style menu items
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#f1f5f9' : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      cursor: 'pointer',
      fontSize: '0.875rem',
      padding: '8px 12px',
    }),
    // Style the container
    container: (provided) => ({
      ...provided,
      width: '100%',
    }),
    // Style the value container
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 8px',
    }),
    // Style the placeholder
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.875rem',
    }),
    // Style the dropdown indicator
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused ? '#6366f1' : '#94a3b8',
      '&:hover': {
        color: state.isFocused ? '#4f46e5' : '#64748b',
      },
      padding: '4px 8px',
    }),
    // Style the indicator separator
    indicatorSeparator: (provided) => ({
      ...provided,
      display: 'none',
    }),
    // Style the single value
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontSize: '0.875rem',
    }),
    // Style the input
    input: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontSize: '0.875rem',
    }),
  };

  return (
    <div className={`space-y-1 ${className}`} ref={ref}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <Select<Option, false>
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        isClearable={isClearable}
        styles={customStyles}
        className="react-select"
        classNamePrefix="react-select"
        noOptionsMessage={noOptionsMessage}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

SearchableSelect.displayName = 'SearchableSelect'; 