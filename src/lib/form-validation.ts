// Form validation utility functions
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Validates an email address
 * @param email Email to validate
 * @returns Error message or empty string if valid
 */
export const validateEmail = (email: string): string => {
  if (!email) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return '';
};

/**
 * Validates a phone number using a basic regex pattern
 * @param phone Phone number to validate
 * @returns Error message or empty string if valid
 */
export const validatePhone = (phone: string): string => {
  if (!phone) return 'Phone number is required';
  
  // Basic phone validation - allows for various formats including international
  // This accepts formats like: (123) 456-7890, 123-456-7890, 123.456.7890, +1 123 456 7890
  const phoneRegex = /^\+?[\d\s\(\)\-\.]{10,20}$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  
  return '';
};

/**
 * Validates required fields
 * @param value Value to check
 * @param fieldName Name of the field for the error message
 * @returns Error message or empty string if valid
 */
export const validateRequired = (value: any, fieldName: string): string => {
  if (value === undefined || value === null) {
    return `${fieldName} is required`;
  }

  if (typeof value === 'string') {
    if (value.trim() === '') {
      return `${fieldName} is required`;
    }
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${fieldName} is required`;
    }
  } else if (typeof value === 'object') {
    if (Object.keys(value).length === 0) {
      return `${fieldName} is required`;
    }
  }
  
  return '';
};

/**
 * Validates a date
 * @param date Date to validate
 * @param fieldName Name of the field for the error message
 * @param required Whether the field is required
 * @returns Error message or empty string if valid
 */
export const validateDate = (date: Date | null, fieldName: string, required = true): string => {
  if (required && !date) {
    return `${fieldName} is required`;
  }
  
  return '';
};

/**
 * Validates a numeric value
 * @param value Value to validate
 * @param fieldName Name of the field for the error message
 * @param required Whether the field is required
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @returns Error message or empty string if valid
 */
export const validateNumeric = (
  value: number | undefined, 
  fieldName: string, 
  required = true,
  min?: number,
  max?: number
): string => {
  if (required && (value === undefined || value === null)) {
    return `${fieldName} is required`;
  }
  
  if (value !== undefined && value !== null) {
    if (min !== undefined && value < min) {
      return `${fieldName} must be at least ${min}`;
    }
    
    if (max !== undefined && value > max) {
      return `${fieldName} must be no more than ${max}`;
    }
  }
  
  return '';
};
