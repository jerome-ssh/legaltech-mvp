'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import Select from 'react-select';
import { PhoneInputField } from '@/components/ui/phone-input';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, ArrowRight, Check, ChevronRight, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { validateEmail, validatePhone, validateRequired, validateDate } from '@/lib/form-validation';
import { countries } from '@/data/countries-list';
import { regions } from '@/data/regions-states';
import { useFormOptions } from '@/hooks/useFormOptions';

interface MatterIntakeWizardProps {
  onComplete?: (matter?: any) => void;
}

interface ClientDetails {
  first_name: string;
  last_name: string;
  title: string;
  preferred_language: string;
  client_type: string;
  email: string;
  phone: string;
  address?: string;
}

interface MatterFormData {
  title: string;
  description: string;
  client_id: string;
  priority: string;
  status: string;
  matter_type: string;
  sub_type: string;
  billing_method: string;
  currency: string;
  rate: string;
  estimated_hours: string;
  fixed_fee: string;
  retainer_amount: string;
  payment_schedule: string;
  payment_terms: string;
  client: ClientDetails;
}

interface ClientErrors {
  title?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  preferred_language?: string;
  client_type?: string;
  [key: string]: string | undefined;
}

interface Option {
  id?: string | number;
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

interface SubTypeOption extends Option {
  matter_type_id: string;
}

interface MatterType {
  id: number;
  value: string;
  label: string;
  subTypes: MatterSubType[];
}

interface MatterSubType {
  id: number;
  value: string;
  label: string;
}

interface MatterDetails {
  title?: string;
  matter_type_id: string | null;
  sub_type_id: string | null;
  description: string;
  jurisdiction_country: string;
  estimated_value?: number;
  start_date: Date | null;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Closed' | 'On Hold' | 'Pending';
}

interface MatterErrors {
  matter_type_id?: string;
  sub_type_id?: string;
  description?: string;
  jurisdiction_country?: string;
  estimated_value?: string;
  start_date?: string;
  [key: string]: string | undefined;
}

interface BillingDetails {
  billing_method_id: string | null;
  payment_pattern_id: string | null;
  currency_id: string | null;
  payment_medium_id: string | null;
  rate_value: string;
  terms_details: {
    standard: string;
    custom?: string;
  };
  billing_frequency_id: string | null;
  features: {
  automated_time_capture: boolean;
  blockchain_invoicing: boolean;
  send_invoice_on_approval: boolean;
  };
  notes: string | null;
}

interface BillingErrors {
  billing_method?: string;
  payment_pattern_id?: string;
  currency?: string;
  payment_medium?: string;
  terms?: string;
  rate?: string;
  billing_frequency_id?: string;
  custom_terms?: string;
  [key: string]: string | undefined;
}

interface BillingPayload {
  matter_id: string;
  payment_pattern_id: number | null;
  rate: number;
  currency_id: number | null;
  terms_details: {
    standard: string;
    custom?: string;
  };
  retainer_amount: number;
  retainer_balance: number;
  billing_frequency_id: string;
  custom_frequency: string | null;
  billing_notes: string | null;
  features: {
    automated_time_capture: boolean;
    blockchain_invoicing: boolean;
    send_invoice_on_approval: boolean;
  };
  payment_medium_id: string | null;
  billing_method_id: string;
  intake_data: {
    client_id: string;
    matter_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  [key: string]: any;
}

const FORM_MIN_HEIGHT = '600px'; // Match the minHeight used in CardContent for step 1

const billingMethodRequirements: Record<string, { requiresMedium: boolean; requiresFrequency: boolean }> = {
  'Hourly': { requiresMedium: true, requiresFrequency: true },
  'Flat Fee': { requiresMedium: true, requiresFrequency: true },
  'Subscription': { requiresMedium: true, requiresFrequency: true },
  'Hybrid': { requiresMedium: true, requiresFrequency: true },
  'Retainer': { requiresMedium: true, requiresFrequency: true },
  'Contingency': { requiresMedium: false, requiresFrequency: false },
  'Pro Bono': { requiresMedium: false, requiresFrequency: false },
  'Other': { requiresMedium: false, requiresFrequency: false },
};

// Payment Terms options
const paymentTermsOptions = [
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 7', label: 'Net 7' },
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Due on receipt', label: 'Due on receipt' },
  { value: 'Other', label: 'Other / Custom' },
];

export function MatterIntakeWizard({ onComplete }: MatterIntakeWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(25);
  const [loading, setLoading] = useState(false);
  const [sendEForm, setSendEForm] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<null | 'success' | 'error'>(null);
  
  // Use the new hook to get all form options
  const {
    titleOptions,
    clientTypeOptions,
    languageOptions,
    matterTypeOptions,
    matterSubTypeOptions,
    billingMethodOptions,
    paymentPatternOptions,
    currencyOptions,
    billingFrequencyOptions,
    paymentMediumOptions,
    isLoading: loadingOptions,
    error: optionsError
  } = useFormOptions();

  // Form state
  const [formData, setFormData] = useState<MatterFormData>({
        title: '',
    description: '',
    client_id: '',
    priority: 'medium',
    status: 'draft',
    matter_type: '',
    sub_type: '',
    billing_method: '',
    currency: '',
    rate: '',
    estimated_hours: '',
    fixed_fee: '',
    retainer_amount: '',
    payment_schedule: '',
    payment_terms: '',
    client: {
        first_name: '',
        last_name: '',
      title: '',
      preferred_language: '',
      client_type: '',
        email: '',
        phone: '',
    }
  });

  // Load saved client details from localStorage if available
  const [clientDetails, setClientDetails] = useState<ClientDetails>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('matter_intake_client_details');
      if (saved) return JSON.parse(saved);
    }
    return {
      first_name: '',
      last_name: '',
      title: '',
      preferred_language: '',
      client_type: '',
      email: '',
      phone: '',
      address: ''
    };
  });

  // Load saved matter details from localStorage if available
  const [matterDetails, setMatterDetails] = useState<MatterDetails>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('matter_intake_matter_details');
      const parsedData = savedData ? JSON.parse(savedData) : null;
      const sanitizeEstimatedValue = (val: any) => (typeof val === 'number' ? val : undefined);
      if (parsedData && parsedData.jurisdiction) {
        return {
          ...parsedData,
          jurisdiction_country: parsedData.jurisdiction,
          priority: parsedData.priority || 'Medium',
          status: parsedData.status || 'Active',
          title: '',
          start_date: parsedData.start_date ? new Date(parsedData.start_date) : null,
          estimated_value: sanitizeEstimatedValue(parsedData.estimated_value),
        };
      }
      return parsedData ? {
        ...parsedData,
        title: '',
        start_date: parsedData.start_date ? new Date(parsedData.start_date) : null,
        estimated_value: sanitizeEstimatedValue(parsedData.estimated_value),
      } : {
        title: '',
        matter_type_id: null,
        sub_type_id: null,
        description: '',
        jurisdiction_country: '',
        start_date: null,
        priority: 'Medium',
        status: 'Active',
        estimated_value: undefined,
      };
    }
    return {
      title: '',
      matter_type_id: null,
      sub_type_id: null,
      description: '',
      jurisdiction_country: '',
      start_date: null,
      priority: 'Medium',
      status: 'Active',
      estimated_value: undefined,
    };
  });
  
  // Form validation errors
  const [clientErrors, setClientErrors] = useState<ClientErrors>({});
  const [matterErrors, setMatterErrors] = useState<MatterErrors>({});
  const [billingErrors, setBillingErrors] = useState<BillingErrors>({});

  // Load saved billing details from localStorage if available
  const [billingDetails, setBillingDetails] = useState<BillingDetails>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('matter_intake_billing_details');
      return savedData ? JSON.parse(savedData) : {
        billing_method_id: null,
        payment_pattern_id: null,
        currency_id: null,
        payment_medium_id: null,
        rate_value: '',
        terms_details: {
          standard: 'Net 30',
          custom: undefined
        },
        billing_frequency_id: null,
        features: {
        automated_time_capture: true,
        blockchain_invoicing: false,
        send_invoice_on_approval: false
        },
        notes: null
      };
    }
    return {
      billing_method_id: null,
      payment_pattern_id: null,
      currency_id: null,
      payment_medium_id: null,
      rate_value: '',
      terms_details: {
        standard: 'Net 30',
        custom: undefined
      },
      billing_frequency_id: null,
      features: {
      automated_time_capture: true,
      blockchain_invoicing: false,
      send_invoice_on_approval: false
      },
      notes: null
    };
  });

  // Save client details to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('matter_intake_client_details', JSON.stringify(clientDetails));
    }
  }, [clientDetails]);

  // Save matter details to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('matter_intake_matter_details', JSON.stringify(matterDetails));
    }
  }, [matterDetails]);

  // Save billing details to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('matter_intake_billing_details', JSON.stringify(billingDetails));
    }
  }, [billingDetails]);

  // Set default values for fields with defaults when options load
  useEffect(() => {
    setClientDetails(prev => {
      let updated = { ...prev };
      if (!prev.client_type && clientTypeOptions.length > 0) {
        updated.client_type = clientTypeOptions[0].value;
      }
      if (!prev.title && titleOptions.length > 0) {
        updated.title = titleOptions[0].value;
      }
      if (!prev.preferred_language && languageOptions.length > 0) {
        updated.preferred_language = languageOptions[0].value;
      }
      return updated;
    });
  }, [clientTypeOptions, titleOptions, languageOptions]);

  // Update billing details when options are loaded
  useEffect(() => {
    if (billingMethodOptions?.length > 0 && currencyOptions?.length > 0) {
      setBillingDetails(prev => {
        let methodId: string | null = prev.billing_method_id;
        if (!methodId && billingMethodOptions[0]?.id) {
          methodId = String(billingMethodOptions[0].id);
        }
        let currencyId: string | null = prev.currency_id;
        if (!currencyId && currencyOptions[0]?.id) {
          currencyId = String(currencyOptions[0].id);
        }
        return {
          ...prev,
          billing_method_id: methodId,
          currency_id: currencyId
        };
      });
    }
  }, [billingMethodOptions, currencyOptions]);

  const validateClientForm = (): boolean => {
    const errors: ClientErrors = {};
    
    errors.title = validateRequired(clientDetails.title, 'Title');
    errors.first_name = validateRequired(clientDetails.first_name, 'First name');
    errors.last_name = validateRequired(clientDetails.last_name, 'Last name');
    errors.email = validateEmail(clientDetails.email);
    errors.phone = validatePhone(clientDetails.phone);
    errors.client_type = validateRequired(clientDetails.client_type, 'Client type');
    errors.preferred_language = validateRequired(clientDetails.preferred_language, 'Preferred language');
    
    // No validation for address as it's optional
    
    setClientErrors(errors);
    
    // Form is valid if there are no error messages
    return Object.values(errors).every(error => !error);
  };
  
  const validateMatterForm = (): boolean => {
    const errors: MatterErrors = {};
    
    errors.title = validateRequired(matterDetails.title, 'Matter title');
    errors.matter_type_id = validateRequired(matterDetails.matter_type_id, 'Matter type');
    errors.sub_type_id = validateRequired(matterDetails.sub_type_id, 'Sub-type');
    errors.description = validateRequired(matterDetails.description, 'Description');
    errors.jurisdiction_country = validateRequired(matterDetails.jurisdiction_country, 'Country');
    errors.start_date = validateDate(matterDetails.start_date, 'Start date');
    
    setMatterErrors(errors);
    
    return Object.values(errors).every(error => !error);
  };
  
  const validateBillingForm = (): boolean => {
    const errors: BillingErrors = {};
    const method = billingMethodOptions.find(
      option => String(option.id) === (billingDetails.billing_method_id ?? '')
    )?.value || '';

    // Always required
    errors.billing_method = validateRequired(method, 'Billing method');
    errors.payment_pattern_id = validateRequired(billingDetails.payment_pattern_id, 'Payment pattern');
    errors.terms = validateRequired(billingDetails.terms_details.standard, 'Payment terms');

    // Rate required for all except Pro Bono/Other
    if (!['Pro Bono', 'Other'].includes(method)) {
      const rateNum = Number(billingDetails.rate_value);
      if (!billingDetails.rate_value || isNaN(rateNum) || rateNum <= 0) {
        errors.rate = 'Rate is required';
      }
    }

    // Payment Medium required for all except Pro Bono
    if (method !== 'Pro Bono') {
      errors.payment_medium = validateRequired(billingDetails.payment_medium_id, 'Payment medium');
    }

    // Frequency required for recurring methods
    if (["Hourly", "Retainer", "Subscription", "Hybrid"].includes(method)) {
      errors.billing_frequency_id = validateRequired(billingDetails.billing_frequency_id, 'Billing frequency');
    }
    
    setBillingErrors(errors);
    return Object.values(errors).every(error => !error);
  };

  const handleNext = () => {
    // Validate current form before proceeding
    let isValid = true;
    let formName = '';
    let currentErrors: { [key: string]: string | undefined } = {};
    
    if (currentStep === 1) {
      formName = 'Client Information';
      isValid = validateClientForm();
      currentErrors = clientErrors;
      // Enforce client type required
      if (!clientDetails.client_type) {
        isValid = false;
        currentErrors = { ...currentErrors, client_type: 'Client type is required' };
        setClientErrors(currentErrors);
      }
    } else if (currentStep === 2) {
      formName = 'Matter Details';
      isValid = validateMatterForm();
      currentErrors = matterErrors;
    } else if (currentStep === 3) {
      formName = 'Billing Details';
      isValid = validateBillingForm();
      currentErrors = billingErrors;
    }
    
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setProgress(progress + 25);
    } else if (!isValid) {
      // Only show toast for step 1, not for steps 2 or 3
      if (currentStep === 1) {
      // Get error fields
      const errorFields = Object.entries(currentErrors)
        .filter(([_, value]) => value && value !== '')
        .map(([key, _]) => key.replace(/_/g, ' '));
      
      // Create error message
      const errorMessage = errorFields.length > 1 
        ? `Please complete the required fields: ${errorFields.join(', ')}` 
        : `Please complete the required field: ${errorFields[0]}`;
      
      // Show toast notification
      toast({
        title: `${formName} Incomplete`,
        description: errorMessage,
        variant: 'destructive'
      });
      
      // Focus on the first input with an error
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.border-red-500');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      }
      // For steps 2 and 3, do not show toast, just highlight fields
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setProgress(progress - 25);
    }
  };

  // Add mapping for status and priority to match DB enums
  const statusMap: Record<string, string> = {
    'Active': 'open',
    'Closed': 'closed',
    'On Hold': 'on_hold',
    'Pending': 'in_progress',
  };
  const priorityMap: Record<string, string> = {
    'High': 'high',
    'Medium': 'medium',
    'Low': 'low',
    'Urgent': 'urgent',
  };

  // Helper: Map label to ID for dropdowns
  const getIdFromOptions = (options: Option[], value: string): number | null => {
    const found = options.find(option => (option.value === value || option.label === value || (option.id !== undefined && option.id.toString() === value)));
    return found && found.id !== undefined ? Number(found.id) : null;
  };

  // Helper to normalize optional fields to null
  function normalizeNull(value: any) {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return null;
    return value;
  }

  const getTypeId = (typeValue: string | number | null) => {
    const type = matterTypeOptions.find(t => String(t.id) === String(typeValue) || t.value === typeValue);
    return type && type.id ? type.id : null;
  };
  const getSubTypeId = (typeId: string | number | null, subTypeValue: string | number | null) => {
    const type = matterTypeOptions.find(t => String(t.id) === String(typeId));
    if (!type || !type.subTypes) return null;
    const sub = type.subTypes.find(s => String(s.id) === String(subTypeValue) || s.value === subTypeValue);
    return sub && sub.id ? sub.id : null;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Map dropdowns to IDs (UUIDs)
      const title_id = getIdFromOptions(titleOptions, clientDetails.title);
      const client_type_id = getIdFromOptions(clientTypeOptions, clientDetails.client_type);
      const preferred_language_id = getIdFromOptions(languageOptions, clientDetails.preferred_language);
      const phone_number = clientDetails.phone.startsWith('+') ? clientDetails.phone : `+${clientDetails.phone}`;

      // Create client first
      const clientPayload = {
        title_id,
        first_name: clientDetails.first_name,
        last_name: clientDetails.last_name,
        email: clientDetails.email,
        address: clientDetails.address,
        preferred_language_id,
        client_type_id,
        phone_number
      };

      const clientResponse = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientPayload)
      });

      if (!clientResponse.ok) throw new Error('Failed to create client');
      const { id: clientId } = await clientResponse.json();

      // Validate matter_type_id and sub_type_id are valid numbers and exist in dropdowns
      let validMatterTypeId = getTypeId(matterDetails.matter_type_id);
      if (!validMatterTypeId || isNaN(Number(validMatterTypeId))) {
        toast({ title: 'Error', description: 'Invalid matter type selected.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      let validSubTypeId = getSubTypeId(validMatterTypeId, matterDetails.sub_type_id);
      if (!validSubTypeId || isNaN(Number(validSubTypeId))) {
        toast({ title: 'Error', description: 'Invalid sub-type selected.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Build the matter payload to match the DB schema
      const matterPayload: any = {
        client_id: clientId,
        title: matterDetails.title,
        description: matterDetails.description,
        jurisdiction: matterDetails.jurisdiction_country,
        estimated_value: normalizeNull(matterDetails.estimated_value),
        matter_date: matterDetails.start_date ? matterDetails.start_date.toISOString().split('T')[0] : null,
        type_id: Number(validMatterTypeId),
        sub_type_id: Number(validSubTypeId),
        priority: matterDetails.priority,
        intake_data: { send_eform: sendEForm },
        billing_method_id: billingDetails.billing_method_id,
        payment_pattern_id: normalizeNull(billingDetails.payment_pattern_id),
        rate: normalizeNull(billingDetails.rate_value === '' ? null : Number(billingDetails.rate_value)),
        currency: normalizeNull(billingDetails.currency_id),
        payment_terms: normalizeNull(billingDetails.terms_details.standard),
        payment_medium_id: normalizeNull(billingDetails.payment_medium_id),
        billing_frequency_id: normalizeNull(billingDetails.billing_frequency_id),
        notes: normalizeNull(billingDetails.notes),
        features: normalizeNull(billingDetails.features),
      };

      // Remove null/undefined fields in a type-safe way
      const cleanedMatterPayload = Object.fromEntries(
        Object.entries(matterPayload).filter(([_, value]) => value !== undefined && value !== null)
      );

      // Debug log
      console.log('Submitting matter payload:', cleanedMatterPayload);

      const matterResponse = await fetch('/api/matters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedMatterPayload)
      });

      const matterData = await matterResponse.json();
      if (matterResponse.ok && matterData?.success && matterData?.id) {
        // Success: clear form fields, show success UI, and close form
        setClientDetails({
          first_name: '', last_name: '', title: '', preferred_language: '', client_type: '', email: '', phone: '', address: ''
        });
        setMatterDetails({
          title: '', matter_type_id: null, sub_type_id: null, description: '', jurisdiction_country: '', start_date: null, priority: 'Medium', status: 'Active', estimated_value: undefined
        });
        setBillingDetails({
          billing_method_id: null, payment_pattern_id: null, currency_id: null, payment_medium_id: null, rate_value: '', terms_details: { standard: '', custom: undefined }, billing_frequency_id: null, features: { automated_time_capture: true, blockchain_invoicing: false, send_invoice_on_approval: false }, notes: null
        });
        setSubmissionResult('success');
        toast({ title: 'Success', description: 'Matter created successfully' });
        if (typeof onComplete === 'function') onComplete(matterData.matter);
        return;
      } else {
        let errorMsg = 'Failed to create matter';
        if (matterData && matterData.error) errorMsg = matterData.error;
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error creating matter:', error);
      setSubmissionResult('error');
      toast({
        title: 'Error',
        description: 'Failed to create matter. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (id: string) => {
    setClientDetails({ ...clientDetails, title: id });
  };

  const handleClientTypeChange = (id: string) => {
    setClientDetails({ ...clientDetails, client_type: id });
  };

  const handleLanguageChange = (id: string) => {
    setClientDetails({ ...clientDetails, preferred_language: id });
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFirstName = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
    setClientDetails(prev => ({ ...prev, first_name: newFirstName }));
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLastName = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
    setClientDetails(prev => ({ ...prev, last_name: newLastName }));
  };

  // Helper to get the selected billing method value (name)
  const selectedBillingMethodValue = billingMethodOptions.find(
    option => String(option.id) === (billingDetails.billing_method_id ?? '')
  )?.value || '';

  // Helper to determine if custom terms is active
  const isCustomTermsActive = billingDetails.terms_details.custom !== undefined;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ minHeight: FORM_MIN_HEIGHT }} className="grid gap-6">
            <div className="px-8 py-10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                  <UISelect
                    value={clientDetails.title ? clientDetails.title.toString() : ''}
                    onValueChange={handleTitleChange}
                  >
                    <SelectTrigger id="title" className="w-full">
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      {titleOptions.map((option) => (
                        <SelectItem key={option.id?.toString() ?? option.value} value={option.id?.toString() ?? option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </UISelect>
                {clientErrors.title && (
                  <div className="text-red-500 text-sm mt-1">{clientErrors.title}</div>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="client_type">Client Type <span className="text-red-500">*</span></Label>
                  <UISelect
                    value={clientDetails.client_type ? clientDetails.client_type.toString() : ''}
                    onValueChange={handleClientTypeChange}
                    required
                  >
                    <SelectTrigger id="client_type" className="w-full">
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypeOptions.map((option) => (
                        <SelectItem key={option.id?.toString() ?? option.value} value={option.id?.toString() ?? option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </UISelect>
                {clientErrors.client_type && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {clientErrors.client_type}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="first_name">First Name<span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="first_name"
                    type="text"
                  value={clientDetails.first_name}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                      setClientDetails(prev => ({ ...prev, first_name: value }));
                    }}
                    onPaste={(e) => {
                      const paste = e.clipboardData.getData('text');
                      if (/[^a-zA-Z\s'-]/.test(paste)) e.preventDefault();
                    }}
                  placeholder="John"
                  className={clientErrors.first_name ? 'border-red-500' : ''}
                />
                {clientErrors.first_name && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {clientErrors.first_name}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="last_name">Last Name<span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="last_name"
                    type="text"
                  value={clientDetails.last_name}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                      setClientDetails(prev => ({ ...prev, last_name: value }));
                    }}
                    onPaste={(e) => {
                      const paste = e.clipboardData.getData('text');
                      if (/[^a-zA-Z\s'-]/.test(paste)) e.preventDefault();
                    }}
                  placeholder="Smith"
                  className={clientErrors.last_name ? 'border-red-500' : ''}
                />
                {clientErrors.last_name && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {clientErrors.last_name}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={clientDetails.email}
                onChange={(e) => setClientDetails({ ...clientDetails, email: e.target.value })}
                placeholder="john.smith@email.com"
                className={clientErrors.email ? 'border-red-500' : ''}
              />
              {clientErrors.email && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {clientErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone">Client Phone Number <span className="text-red-500">*</span></Label>
              <div className={`rounded-md border ${clientErrors.phone ? 'border-red-500' : 'border-input'} focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`}>
                <PhoneInput
                  international
                  defaultCountry="US"
                  id="phone"
                  value={clientDetails.phone}
                    onChange={(value: string | undefined) => {
                      if (value) {
                        const plus = value.startsWith('+') ? '+' : '';
                        const digits = value.replace(/\D/g, '');
                        const truncated = digits.slice(0, 15);
                        setClientDetails({ ...clientDetails, phone: plus + truncated });
                      } else {
                        setClientDetails({ ...clientDetails, phone: '' });
                      }
                    }}
                  placeholder="Enter phone number"
                  className="phone-input"
                    disabled={clientDetails.phone.replace(/\D/g, '').length >= 15}
                />
              </div>
                {/* Show warning if max length reached */}
                {(() => {
                  const digits = clientDetails.phone.replace(/\D/g, '');
                  return digits.length === 15 ? (
                    <p className="text-xs text-yellow-600 mt-1">Maximum phone number length reached (15 digits).</p>
                  ) : null;
                })()}
              {clientErrors.phone && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {clientErrors.phone}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="preferred_language">Preferred Language <span className="text-red-500">*</span></Label>
                <UISelect
                  value={clientDetails.preferred_language ? clientDetails.preferred_language.toString() : ''}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger id="preferred_language" className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {languageOptions.map((option) => (
                      <SelectItem key={option.id?.toString() ?? option.value} value={option.id?.toString() ?? option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </UISelect>
              {clientErrors.preferred_language && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {clientErrors.preferred_language}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="address">Address (Optional, but required for court filings or physical correspondence)</Label>
              <Textarea
                id="address"
                value={clientDetails.address}
                onChange={(e) => setClientDetails({ ...clientDetails, address: e.target.value })}
                placeholder="123 Main St, City, State, ZIP"
                className={clientErrors.address ? 'border-red-500' : ''}
              />
              {clientErrors.address && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {clientErrors.address}
                </p>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center space-x-3">
                <Switch
                  id="send_eform"
                  checked={sendEForm}
                  onCheckedChange={setSendEForm}
                />
                <Label htmlFor="send_eform" className="cursor-pointer text-sm">Send intake form to client's email</Label>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ minHeight: FORM_MIN_HEIGHT }} className="grid gap-6">
            <div className="px-8 py-10">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="title">Matter Title <span className="text-red-500">*</span></Label>
                    <Input
                      id="title"
                      value={matterDetails.title}
                      onChange={(e) => setMatterDetails(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                      className={matterErrors.title ? 'border-red-500' : ''}
                      placeholder="Enter matter title"
                      required
                    />
                    {matterErrors.title && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {matterErrors.title}
                      </p>
                    )}
                  </div>
            <div className="space-y-1">
              <Label htmlFor="matter_type">Matter Type <span className="text-red-500">*</span></Label>
                    <div id="matter_type_id-wrapper" className="relative">
              <Select
                        inputId="matter_type_id"
                        className={`react-select ${matterErrors.matter_type_id ? 'border-red-500' : ''}`}
                classNamePrefix="react-select"
                        options={matterTypeOptions}
                        value={matterTypeOptions.find(option => String(option.id) === String(matterDetails.matter_type_id))}
                onChange={(selectedOption) => {
                  setMatterDetails({
                    ...matterDetails,
                            matter_type_id: selectedOption ? selectedOption.id : null,
                            sub_type_id: null,
                  });
                }}
                placeholder="Select matter type"
                isClearable
                isSearchable
                        menuPlacement="auto"
                        styles={{
                          menuList: (base) => ({
                            ...base,
                            maxHeight: '350px',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            fontSize: '1rem',
                            paddingTop: 0,
                            paddingBottom: 0,
                          }),
                          menu: (base) => ({
                            ...base,
                            marginTop: 0,
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            width: '100%',
                          }),
                          control: (base) => ({
                            ...base,
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                            fontSize: '1rem',
                          })
                        }}
                      />
                    </div>
                    {matterErrors.matter_type_id && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                        {matterErrors.matter_type_id}
                </p>
              )}
            </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="sub_type">Sub-Type <span className="text-red-500">*</span></Label>
                    <div id="sub_type_id-wrapper" className="relative">
              <Select
                        inputId="sub_type_id"
                        className={`react-select ${matterErrors.sub_type_id ? 'border-red-500' : ''}`}
                classNamePrefix="react-select"
                        options={(() => {
                          const type = matterTypeOptions.find(type => String(type.id) === String(matterDetails.matter_type_id));
                          return type && Array.isArray(type.subTypes)
                            ? type.subTypes.map(subType => ({
                                id: subType.id,
                                value: subType.value,
                                label: subType.label
                              }))
                            : [];
                        })()}
                        value={(() => {
                          const type = matterTypeOptions.find(type => String(type.id) === String(matterDetails.matter_type_id));
                          if (type && Array.isArray(type.subTypes)) {
                            const sub = type.subTypes.find(subType => String(subType.id) === String(matterDetails.sub_type_id));
                            return sub ? { id: sub.id, value: sub.value, label: sub.label } : null;
                          }
                          return null;
                        })()}
                onChange={(selectedOption) => {
                  setMatterDetails({
                    ...matterDetails,
                            sub_type_id: selectedOption ? selectedOption.id : null,
                  });
                }}
                placeholder="Select sub-type"
                isClearable
                isSearchable
                        menuPlacement="auto"
                        styles={{
                          menuList: (base) => ({
                            ...base,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            overflowX: 'hidden'
                          })
                        }}
                      />
                    </div>
                    {matterErrors.sub_type_id && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                        {matterErrors.sub_type_id}
                      </p>
                    )}
                  </div>
                </div>
                {/* Move Country field to its own row below Sub-Type */}
                <div className="space-y-1 mt-2">
                  <Label htmlFor="jurisdiction_country">Country <span className="text-red-500">*</span></Label>
                  <div id="jurisdiction_country-wrapper" className="relative">
                    <Select
                      inputId="jurisdiction_country"
                      className={`react-select ${matterErrors.jurisdiction_country ? 'border-red-500' : ''}`}
                      classNamePrefix="react-select"
                      options={countries}
                      value={countries.find(option => option.value === matterDetails.jurisdiction_country)}
                      onChange={(selectedOption) => {
                        setMatterDetails({
                          ...matterDetails,
                          jurisdiction_country: selectedOption?.value || '',
                        });
                      }}
                      placeholder="Select country"
                      isClearable
                      isSearchable
                      menuPlacement="auto"
                      styles={{
                        menuList: (base) => ({
                          ...base,
                          maxHeight: '350px',
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          fontSize: '1rem',
                          paddingTop: 0,
                          paddingBottom: 0,
                        }),
                        menu: (base) => ({
                          ...base,
                          marginTop: 0,
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                          width: '100%',
                        }),
                        control: (base) => ({
                          ...base,
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                          fontSize: '1rem',
                        })
                      }}
                    />
                  </div>
                  {matterErrors.jurisdiction_country && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {matterErrors.jurisdiction_country}
                </p>
              )}
            </div>

                <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
                    <Label htmlFor="start_date">Start Date <span className="text-red-500">*</span></Label>
                    <div className="h-10">
              <DatePicker
                value={matterDetails.start_date}
                onChange={(date) => setMatterDetails({ ...matterDetails, start_date: date })}
                placeholder="Select start date"
                error={matterErrors.start_date}
                        required
                        minDate={new Date()}
              />            
            </div>
                  </div>
            <div className="space-y-1">
                    <Label htmlFor="estimated_value">Estimated Value (Optional)</Label>
                    <Input
                      id="estimated_value"
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={typeof matterDetails.estimated_value === 'number' ? matterDetails.estimated_value : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Only allow valid numbers or empty
                        if (/^\d*$/.test(val)) {
                          setMatterDetails({
                            ...matterDetails,
                            estimated_value: val ? Number(val) : undefined
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        // Allow navigation, backspace, delete, tab, etc.
                        if (["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete"].includes(e.key)) return;
                        // Block non-numeric keys
                        if (!/\d/.test(e.key)) e.preventDefault();
                      }}
                      onPaste={(e) => {
                        const paste = e.clipboardData.getData('text');
                        if (!/^\d+$/.test(paste)) e.preventDefault();
                      }}
                      placeholder="e.g., 100000"
                      className={matterErrors.estimated_value ? 'border-red-500 h-10' : 'h-10'}
                    />
                    {matterErrors.estimated_value && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                        {matterErrors.estimated_value}
                </p>
              )}
            </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                    <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
                    <div id="priority-wrapper" className="relative">
                  <Select
                        inputId="priority"
                        className="react-select"
                    classNamePrefix="react-select"
                        options={[
                          { value: 'High', label: 'High' },
                          { value: 'Medium', label: 'Medium' },
                          { value: 'Low', label: 'Low' },
                        ]}
                        value={{ value: matterDetails.priority, label: matterDetails.priority }}
                    onChange={(selectedOption) => {
                      setMatterDetails({
                        ...matterDetails,
                            priority: selectedOption?.value as 'High' | 'Medium' | 'Low',
                      });
                    }}
                        placeholder="Select priority"
                        menuPlacement="auto"
                        styles={{
                          menuList: (base) => ({
                            ...base,
                            maxHeight: '350px',
                            overflowY: 'auto'
                          })
                        }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                    <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                    <div id="status-wrapper" className="relative">
                  <Select
                        inputId="status"
                        className="react-select"
                    classNamePrefix="react-select"
                        options={[
                          { value: 'Active', label: 'Active' },
                          { value: 'Closed', label: 'Closed' },
                          { value: 'On Hold', label: 'On Hold' },
                          { value: 'Pending', label: 'Pending' },
                        ]}
                        value={{ value: matterDetails.status, label: matterDetails.status }}
                    onChange={(selectedOption) => {
                      setMatterDetails({
                        ...matterDetails,
                            status: selectedOption?.value as 'Active' | 'Closed' | 'On Hold' | 'Pending',
                      });
                    }}
                        placeholder="Select status"
                        menuPlacement="auto"
                        styles={{
                          menuList: (base) => ({
                            ...base,
                            maxHeight: '350px',
                            overflowY: 'auto'
                          })
                        }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={matterDetails.description}
                    onChange={(e) => setMatterDetails({ ...matterDetails, description: e.target.value })}
                    placeholder="Provide a brief description of the matter"
                    className={matterErrors.description ? 'border-red-500' : ''}
                  />
                  {matterErrors.description && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                      {matterErrors.description}
                </p>
              )}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="billing_method">Billing Method <span className="text-red-500">*</span></Label>
              <Select
                inputId="billing_method"
                className={`react-select ${billingErrors.billing_method ? 'border-red-500' : ''}`}
                classNamePrefix="react-select"
                  options={billingMethodOptions}
                  value={billingMethodOptions.find(option => String(option.id) === (billingDetails.billing_method_id ?? ''))}
                  onChange={selectedOption => setBillingDetails({
                    ...billingDetails,
                    billing_method_id: selectedOption ? String(selectedOption.id) : null
                  })}
                placeholder="Select billing method"
                  styles={{ control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.8rem' }) }}
              />
              {billingErrors.billing_method && (
                  <p className="text-xs text-red-500 mt-1">{billingErrors.billing_method}</p>
              )}
            </div>

              <div className="space-y-1">
                <Label htmlFor="payment_pattern">Payment Pattern <span className="text-red-500">*</span></Label>
                <Select
                  inputId="payment_pattern"
                  className={`react-select ${billingErrors.payment_pattern_id ? 'border-red-500' : ''}`}
                  classNamePrefix="react-select"
                  options={paymentPatternOptions}
                  value={paymentPatternOptions.find(option => option.value === billingDetails.payment_pattern_id)}
                  onChange={selectedOption => setBillingDetails({
                    ...billingDetails,
                    payment_pattern_id: selectedOption ? selectedOption.value : null
                  })}
                  placeholder="Select payment pattern"
                  styles={{ control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.8rem' }) }}
                />
                {billingErrors.payment_pattern_id && (
                  <p className="text-xs text-red-500 mt-1">{billingErrors.payment_pattern_id}</p>
                )}
              </div>
            </div>

            {selectedBillingMethodValue !== 'Pro Bono' && (
              <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                  <Label htmlFor="payment_medium">Payment Medium <span className="text-red-500">*</span></Label>
                  <Select
                    inputId="payment_medium"
                    className={`react-select ${billingErrors.payment_medium ? 'border-red-500' : ''}`}
                    classNamePrefix="react-select"
                    options={paymentMediumOptions}
                    value={paymentMediumOptions.find(option => String(option.id) === (billingDetails.payment_medium_id ?? ''))}
                    onChange={selectedOption => setBillingDetails({
                      ...billingDetails,
                      payment_medium_id: selectedOption ? String(selectedOption.id) : null
                    })}
                    placeholder="Select payment medium"
                    styles={{ control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.8rem' }) }}
                  />
                  {billingErrors.payment_medium && (
                    <p className="text-xs text-red-500 mt-1">{billingErrors.payment_medium}</p>
                )}
              </div>

                {billingMethodRequirements[selectedBillingMethodValue]?.requiresFrequency && (
              <div className="space-y-1">
                    <Label htmlFor="billing_frequency">Billing Frequency <span className="text-red-500">*</span></Label>
                    <Select
                      inputId="billing_frequency"
                      className={`react-select ${billingErrors.billing_frequency_id ? 'border-red-500' : ''}`}
                      classNamePrefix="react-select"
                      options={billingFrequencyOptions}
                      value={billingFrequencyOptions.find(option => option.value === billingDetails.billing_frequency_id)}
                      onChange={selectedOption => setBillingDetails({
                        ...billingDetails,
                        billing_frequency_id: selectedOption ? selectedOption.value : null
                      })}
                      placeholder="Select billing frequency"
                      styles={{ control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.8rem' }) }}
                    />
                    {billingErrors.billing_frequency_id && (
                      <p className="text-xs text-red-500 mt-1">{billingErrors.billing_frequency_id}</p>
                )}
              </div>
            )}
              </div>
            )}

            {selectedBillingMethodValue && (
              <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                  <Label htmlFor="rate">Rate <span className="text-red-500">*</span></Label>
                <Input
                    id="rate"
                  type="number"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                    value={billingDetails.rate_value}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Only allow valid decimal numbers or empty
                      if (/^\d*\.?\d*$/.test(val)) {
                        setBillingDetails({
                          ...billingDetails,
                          rate_value: val
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      // Allow navigation, backspace, delete, tab, period (for decimal)
                      if (["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", "."].includes(e.key)) return;
                      // Block non-numeric keys
                      if (!/\d/.test(e.key)) e.preventDefault();
                    }}
                    onPaste={(e) => {
                      const paste = e.clipboardData.getData('text');
                      if (!/^\d*\.?\d*$/.test(paste)) e.preventDefault();
                    }}
                    placeholder={`Enter ${selectedBillingMethodValue} rate`}
                    style={{ fontSize: '0.8rem', height: '32px' }}
                    className={billingErrors.rate ? 'border-red-500' : ''}
                  />
                  {billingErrors.rate && (
                    <p className="text-xs text-red-500 mt-1">{billingErrors.rate}</p>
                )}
              </div>
            <div className="space-y-1">
              <Label htmlFor="currency">Currency <span className="text-red-500">*</span></Label>
              <Select
                inputId="currency"
                className={`react-select ${billingErrors.currency ? 'border-red-500' : ''}`}
                classNamePrefix="react-select"
                options={currencyOptions}
                    value={currencyOptions.find(option => String(option.id) === (billingDetails.currency_id ?? ''))}
                    onChange={selectedOption => setBillingDetails({
                      ...billingDetails,
                      currency_id: selectedOption ? String(selectedOption.id) : null
                    })}
                    placeholder="Select currency"
                    styles={{ control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.8rem' }) }}
                  />
                  {billingErrors.currency && (
                    <p className="text-xs text-red-500 mt-1">{billingErrors.currency}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="terms">Payment Terms <span className="text-red-500">*</span> <span className="text-gray-500 text-xs">(e.g., when payment is due: Net 30, Due on receipt)</span></Label>
                <Select
                  inputId="terms"
                  classNamePrefix="react-select"
                  className={billingErrors.terms ? 'border-red-500' : ''}
                  options={paymentTermsOptions}
                  value={isCustomTermsActive ? null : (paymentTermsOptions.find(option => option.value === (billingDetails.terms_details.standard || '')) || paymentTermsOptions[0])}
                  onChange={selectedOption => {
                    if (selectedOption?.value === 'Other') {
                  setBillingDetails({
                    ...billingDetails,
                        terms_details: { ...billingDetails.terms_details, standard: '', custom: '' }
                      });
                    } else {
                      setBillingDetails({
                        ...billingDetails,
                        terms_details: { ...billingDetails.terms_details, standard: selectedOption?.value || '', custom: undefined }
                      });
                    }
                  }}
                  placeholder="Select payment terms"
                  styles={{ control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.8rem' }) }}
                  isDisabled={isCustomTermsActive}
                />
                {billingErrors.terms && (
                  <p className="text-xs text-red-500 mt-1">{billingErrors.terms}</p>
              )}
            </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="use_custom_terms"
                  checked={isCustomTermsActive}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setBillingDetails({
                        ...billingDetails,
                        terms_details: { ...billingDetails.terms_details, custom: '', standard: '' }
                      });
                    } else {
                      setBillingDetails({
                        ...billingDetails,
                        terms_details: { ...billingDetails.terms_details, custom: undefined, standard: '' }
                      });
                    }
                  }}
                />
                <Label htmlFor="use_custom_terms">Use Custom Terms</Label>
              </div>
              {isCustomTermsActive && (
                <div className="space-y-1">
                  <Label htmlFor="custom_terms">Custom Terms <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="custom_terms"
                    value={billingDetails.terms_details.custom || ''}
                    onChange={(e) => setBillingDetails({
                      ...billingDetails,
                      terms_details: { ...billingDetails.terms_details, custom: e.target.value, standard: '' }
                    })}
                    placeholder="Enter custom payment terms"
                    style={{ fontSize: '0.8rem', minHeight: '48px' }}
                    className={billingErrors.custom_terms ? 'border-red-500' : ''}
                  />
                  {billingErrors.custom_terms && (
                    <p className="text-xs text-red-500 mt-1">{billingErrors.custom_terms}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="automated_time_capture"
                  checked={billingDetails.features.automated_time_capture}
                  onCheckedChange={(checked) => setBillingDetails({
                    ...billingDetails,
                    features: { ...billingDetails.features, automated_time_capture: checked }
                  })}
                />
                <Label htmlFor="automated_time_capture" className="text-sm">Automated Time Capture</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="blockchain_invoicing"
                  checked={billingDetails.features.blockchain_invoicing}
                  onCheckedChange={(checked) => setBillingDetails({
                    ...billingDetails,
                    features: { ...billingDetails.features, blockchain_invoicing: checked }
                  })}
                />
                <Label htmlFor="blockchain_invoicing" className="text-sm">Blockchain Invoicing</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="send_invoice_on_approval"
                  checked={billingDetails.features.send_invoice_on_approval}
                  onCheckedChange={(checked) => setBillingDetails({
                    ...billingDetails,
                    features: { ...billingDetails.features, send_invoice_on_approval: checked }
                  })}
                />
                <Label htmlFor="send_invoice_on_approval" className="text-sm">Auto-Invoice</Label>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Billing Notes</Label>
              <Textarea
                id="notes"
                value={billingDetails.notes || ''}
                onChange={(e) => setBillingDetails({
                  ...billingDetails,
                  notes: e.target.value
                })}
                placeholder="Any additional notes about billing (optional)"
                style={{ fontSize: '0.8rem', minHeight: '48px' }}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ minHeight: FORM_MIN_HEIGHT }} className="space-y-4">
            <div className="border rounded-lg p-3 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Client Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium text-gray-600">Name:</div>
                <div className="text-gray-900">{(() => {
                  const titleLabel = titleOptions.find(option => String(option.id) === String(clientDetails.title))?.label;
                  return [titleLabel, clientDetails.first_name, clientDetails.last_name].filter(Boolean).join(' ');
                })()}</div>
                
                <div className="font-medium text-gray-600">Email:</div>
                <div className="text-gray-900">{clientDetails.email}</div>
                
                <div className="font-medium text-gray-600">Phone:</div>
                <div className="text-gray-900">{clientDetails.phone}</div>
                
                <div className="font-medium text-gray-600">Preferred Language:</div>
                <div className="text-gray-900">
                  {languageOptions.find(option => String(option.id) === String(clientDetails.preferred_language))?.label || clientDetails.preferred_language}
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-3 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Matter Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium text-gray-600">Title:</div>
                <div className="text-gray-900">{matterDetails.title}</div>
                
                <div className="font-medium text-gray-600">Type:</div>
                <div className="text-gray-900">
                  {Array.isArray(matterTypeOptions)
                    ? (() => {
                        const type = matterTypeOptions.find(type => String(type.id) === String(matterDetails.matter_type_id));
                        return type ? type.label : 'Not selected';
                      })()
                    : 'Not selected'}
                </div>
                
                <div className="font-medium text-gray-600">Sub-Type:</div>
                <div className="text-gray-900">
                  {Array.isArray(matterTypeOptions)
                    ? (() => {
                        const type = matterTypeOptions.find(type => String(type.id) === String(matterDetails.matter_type_id));
                        if (type && Array.isArray(type.subTypes)) {
                          const sub = type.subTypes.find(subType => String(subType.id) === String(matterDetails.sub_type_id));
                          return sub ? sub.label : 'Not selected';
                        }
                        return 'Not selected';
                      })()
                    : 'Not selected'}
                </div>
                
                <div className="font-medium text-gray-600">Country:</div>
                <div className="text-gray-900">
                  {countries.find(option => option.value === matterDetails.jurisdiction_country)?.label || matterDetails.jurisdiction_country}
                </div>
                
                <div className="font-medium text-gray-600">Start Date:</div>
                <div className="text-gray-900">
                  {matterDetails.start_date ? format(new Date(matterDetails.start_date), 'MMM d, yyyy') : 'Not specified'}
                </div>
                
                <div className="font-medium text-gray-600">Priority:</div>
                <div className="text-gray-900">{matterDetails.priority}</div>
                
                <div className="font-medium text-gray-600">Status:</div>
                <div className="text-gray-900">{matterDetails.status}</div>
                
                <div className="font-medium text-gray-600">Description:</div>
                <div className="text-gray-900">{matterDetails.description}</div>
              </div>
            </div>
            
            <div className="border rounded-lg p-3 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Billing Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium text-gray-600">Method:</div>
                <div className="text-gray-900">{selectedBillingMethodValue}</div>
                
                {selectedBillingMethodValue === 'Hourly' && billingDetails.rate_value && (
                  <>
                    <div className="font-medium text-gray-600">Rate:</div>
                    <div className="text-gray-900">{billingDetails.rate_value} {currencyOptions.find(option => option.id === billingDetails.currency_id)?.label || billingDetails.currency_id}</div>
                  </>
                )}
                
                <div className="font-medium text-gray-600">Features:</div>
                <div className="text-gray-900">
                  {[
                    billingDetails.features.automated_time_capture && 'Automated Time Capture',
                    billingDetails.features.blockchain_invoicing && 'Blockchain Invoicing',
                    billingDetails.features.send_invoice_on_approval && 'Auto-Invoice'
                  ].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
            
            {sendEForm && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 mt-2">
                <p className="text-sm text-blue-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Intake form will be sent to {clientDetails.email}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {submissionResult === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
            <CheckCircle className="w-20 h-20 text-green-500 animate-bounce" />
            <h2 className="text-3xl font-bold mt-4 mb-2 text-green-700 animate-fade-in">Success!</h2>
            <p className="text-gray-700 mb-4 animate-fade-in">Matter created successfully.</p>
            <Button onClick={() => { setSubmissionResult(null); if (typeof onComplete === 'function') onComplete(); }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md mt-2">
              Close
            </Button>
          </div>
        </div>
      )}
      {submissionResult === 'error' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
            <XCircle className="w-16 h-16 text-red-500 animate-bounce-in" />
            <h2 className="text-2xl font-bold mt-4 mb-2 text-red-700">Error</h2>
            <p className="text-gray-700 mb-4">Failed to create matter. Please try again.</p>
            <Button onClick={() => setSubmissionResult(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    <div className="grid grid-cols-[280px_1fr] overflow-hidden rounded-xl shadow-xl">
      {/* Left sidebar */}
      <div className="bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 text-white p-6 min-h-[500px] rounded-l-xl flex flex-col justify-between shadow-inner overflow-hidden relative before:absolute before:inset-0 before:bg-gradient-to-tr before:from-transparent before:via-blue-400/10 before:to-yellow-200/20">
        <div>
          <h2 className="text-2xl font-black mb-8 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">LawMate</h2>
          <h3 className="text-xl font-extrabold mb-2 text-white">New Matter Intake</h3>
          
          <div className="mb-8">
            <div className="uppercase text-xs mb-3 font-black tracking-wider text-white">PROGRESS</div>
            <div className="relative w-full bg-blue-800/70 h-4 rounded-full mb-2 shadow-inner">
              <div className="absolute left-0 top-0 h-4 bg-white rounded-full transition-all shadow-sm" style={{ width: `${25 * currentStep}%` }}></div>
            </div>
            <div className="text-sm font-extrabold mt-4 text-white">Step {currentStep} of 4</div>
          </div>
        </div>
        
        <div className="text-xs text-white mt-auto">
          © {new Date().getFullYear()} LawMate
        </div>
      </div>
      
      {/* Right content */}
      <div className="p-6 bg-white rounded-r-xl">
        <Card className="border-0 shadow-lg rounded-xl w-full">
            <CardContent className="px-8 py-10 min-h-[600px] flex flex-col">
            <div className="mb-5">
              <h2 className="text-xl font-bold mb-1">
                {currentStep === 1 && 'Client Information'}
                {currentStep === 2 && 'Matter Details'}
                {currentStep === 3 && 'Billing Setup'}
                {currentStep === 4 && 'Review & Submit'}
              </h2>
              <p className="text-gray-500 text-sm">
                {currentStep === 1 && 'Please fill out all required fields to create a new matter.'}
                {currentStep === 2 && 'Provide details about the legal matter.'}
                {currentStep === 3 && 'Set up billing preferences for this matter.'}
                {currentStep === 4 && 'Review all information before submitting.'}
              </p>
            </div>
            
            <div className="flex-grow overflow-y-auto">
              {renderStep()}
            </div>
            
            <div className="mt-6 flex justify-between">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Back
                </Button>
              ) : (
                <div></div> // Empty div for spacing
              )}
              
              {currentStep < 4 ? (
                <Button 
                  onClick={handleNext} 
                  className="bg-black hover:bg-gray-800 text-white rounded-md px-4 py-2"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="bg-black hover:bg-gray-800 text-white rounded-md px-4 py-2"
                >
                  {loading ? 'Creating...' : 'Submit'}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
} 