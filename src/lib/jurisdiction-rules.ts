import { specializationsByBar } from './onboarding-utils';

export interface JurisdictionRule {
  country: string;
  state?: string;
  requiredFields: string[];
  allowedSpecializations: string[];
  minYearsOfPractice?: number;
  maxYearsOfPractice?: number;
  requiresBarNumber: boolean;
  requiresDocumentation: boolean;
  allowedRoles: string[];
}

// Define jurisdiction-specific rules
export const jurisdictionRules: Record<string, JurisdictionRule> = {
  'US-CA': {
    country: 'United States',
    state: 'California',
    requiredFields: ['state', 'professional_id', 'year_issued'],
    allowedSpecializations: specializationsByBar['CA'],
    minYearsOfPractice: 0,
    maxYearsOfPractice: 70,
    requiresBarNumber: true,
    requiresDocumentation: true,
    allowedRoles: ['attorney', 'paralegal', 'legal_assistant']
  },
  'US-NY': {
    country: 'United States',
    state: 'New York',
    requiredFields: ['state', 'professional_id', 'year_issued'],
    allowedSpecializations: specializationsByBar['NY'],
    minYearsOfPractice: 0,
    maxYearsOfPractice: 70,
    requiresBarNumber: true,
    requiresDocumentation: true,
    allowedRoles: ['attorney', 'paralegal', 'legal_assistant']
  },
  'US-TX': {
    country: 'United States',
    state: 'Texas',
    requiredFields: ['state', 'professional_id', 'year_issued'],
    allowedSpecializations: specializationsByBar['TX'],
    minYearsOfPractice: 0,
    maxYearsOfPractice: 70,
    requiresBarNumber: true,
    requiresDocumentation: true,
    allowedRoles: ['attorney', 'paralegal', 'legal_assistant']
  },
  'UK': {
    country: 'United Kingdom',
    requiredFields: ['professional_id', 'year_issued'],
    allowedSpecializations: [
      'Corporate Law',
      'Commercial Law',
      'Criminal Law',
      'Family Law',
      'Property Law',
      'Employment Law',
      'Intellectual Property',
      'Tax Law'
    ],
    minYearsOfPractice: 0,
    maxYearsOfPractice: 70,
    requiresBarNumber: true,
    requiresDocumentation: true,
    allowedRoles: ['solicitor', 'barrister', 'paralegal', 'legal_assistant']
  }
};

// Helper function to get jurisdiction rule
export function getJurisdictionRule(country: string, state?: string): JurisdictionRule | undefined {
  const key = state ? `US-${state}` : country;
  return jurisdictionRules[key];
}

// Helper function to validate specialization against jurisdiction
export function validateSpecialization(specialization: string, country: string, state?: string): boolean {
  const rule = getJurisdictionRule(country, state);
  if (!rule) return true; // If no specific rule, allow any specialization
  return rule.allowedSpecializations.includes(specialization);
}

// Helper function to validate professional ID against jurisdiction rules
export function validateProfessionalId(professionalId: any, rule: JurisdictionRule): string[] {
  const errors: string[] = [];

  // Check required fields
  rule.requiredFields.forEach(field => {
    if (!professionalId[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate bar number requirement
  if (rule.requiresBarNumber && !professionalId.professional_id && !professionalId.no_id) {
    errors.push('Bar number is required for this jurisdiction');
  }

  // Validate documentation requirement
  if (rule.requiresDocumentation && !professionalId.document_url) {
    errors.push('Documentation is required for this jurisdiction');
  }

  // Validate years of practice
  if (professionalId.years_of_practice) {
    if (rule.minYearsOfPractice !== undefined && professionalId.years_of_practice < rule.minYearsOfPractice) {
      errors.push(`Years of practice must be at least ${rule.minYearsOfPractice}`);
    }
    if (rule.maxYearsOfPractice !== undefined && professionalId.years_of_practice > rule.maxYearsOfPractice) {
      errors.push(`Years of practice must be at most ${rule.maxYearsOfPractice}`);
    }
  }

  return errors;
}

// Helper function to validate role against jurisdiction
export function validateRole(role: string, country: string, state?: string): boolean {
  const rule = getJurisdictionRule(country, state);
  if (!rule) return true; // If no specific rule, allow any role
  return rule.allowedRoles.includes(role);
} 