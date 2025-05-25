'use client';

import { useState, useEffect } from 'react';
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

interface MatterIntakeWizardProps {
  onComplete: (matter: any) => void;
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
  matter_type_id: number | null;
  sub_type_id: number | null;
  description: string;
  jurisdiction_country: string;
  jurisdiction_state?: string;
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
  jurisdiction_state?: string;
  estimated_value?: string;
  start_date?: string;
  [key: string]: string | undefined;
}

interface BillingDetails {
  billing_method_id: string | null;
  payment_pattern_id: string | null;
  currency_id: string | null;
  payment_medium: string;
  rate_value: number;
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
  retainer_amount: number | null;
  retainer_balance: number | null;
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
  retainer_amount?: string;
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
  payment_medium_id: number | null;
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
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [titleOptions, setTitleOptions] = useState<Option[]>([]);
  const [clientTypeOptions, setClientTypeOptions] = useState<Option[]>([]);
  const [languageOptions, setLanguageOptions] = useState<Option[]>([]);
  const [matterTypeOptions, setMatterTypeOptions] = useState<Option[]>([]);
  const [matterSubTypeOptions, setMatterSubTypeOptions] = useState<SubTypeOption[]>([]);
  const [billingMethodOptions, setBillingMethodOptions] = useState<Option[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<Option[]>([]);
  const [matterTypes, setMatterTypes] = useState<MatterType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submissionResult, setSubmissionResult] = useState<null | 'success' | 'error'>(null);
  const [paymentMediumOptions, setPaymentMediumOptions] = useState<Option[]>([]);
  const [paymentPatternOptions, setPaymentPatternOptions] = useState<Option[]>([]);
  const [billingFrequencyOptions, setBillingFrequencyOptions] = useState<Option[]>([]);

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
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    first_name: '',
    last_name: '',
    title: '',
    preferred_language: '',
    client_type: '',
    email: '',
    phone: '',
    address: ''
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
          jurisdiction_state: '',
          priority: parsedData.priority || 'Medium',
          status: parsedData.status || 'Active',
          title: parsedData.title || '',
          start_date: parsedData.start_date ? new Date(parsedData.start_date) : null,
          estimated_value: sanitizeEstimatedValue(parsedData.estimated_value),
        };
      }
      return parsedData ? {
        ...parsedData,
        start_date: parsedData.start_date ? new Date(parsedData.start_date) : null,
        estimated_value: sanitizeEstimatedValue(parsedData.estimated_value),
      } : {
        title: '',
        matter_type_id: null,
        sub_type_id: null,
        description: '',
        jurisdiction_country: '',
        jurisdiction_state: '',
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
      jurisdiction_state: '',
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
        payment_medium: '',
        rate_value: 0,
        terms_details: {
          standard: '',
          custom: ''
        },
        billing_frequency_id: null,
        features: {
          automated_time_capture: true,
          blockchain_invoicing: false,
          send_invoice_on_approval: false
        },
        retainer_amount: null,
        retainer_balance: null,
        notes: null
      };
    }
    return {
      billing_method_id: null,
      payment_pattern_id: null,
      currency_id: null,
      payment_medium: '',
      rate_value: 0,
      terms_details: {
        standard: '',
        custom: ''
      },
      billing_frequency_id: null,
      features: {
        automated_time_capture: true,
        blockchain_invoicing: false,
        send_invoice_on_approval: false
      },
      retainer_amount: null,
      retainer_balance: null,
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

  // Load options from API
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [
          titles,
          clientTypes,
          languages,
          matterTypes,
          subTypes,
          billingMethods,
          currencies
        ] = await Promise.all([
          fetch('/api/dropdowns/titles').then(res => res.json()),
          fetch('/api/dropdowns/client-types').then(res => res.json()),
          fetch('/api/dropdowns/languages').then(res => res.json()),
          fetch('/api/dropdowns/matter-types').then(res => res.json()),
          fetch('/api/dropdowns/matter-sub-types').then(res => res.json()),
          fetch('/api/dropdowns/billing-methods').then(res => res.json()),
          fetch('/api/dropdowns/currencies').then(res => res.json()),
        ]);

        if (titles?.options) setTitleOptions(titles.options);
        if (clientTypes?.options) setClientTypeOptions(clientTypes.options);
        if (languages?.options) setLanguageOptions(languages.options);
        if (matterTypes?.options) setMatterTypeOptions(matterTypes.options);
        if (subTypes?.options) setMatterSubTypeOptions(subTypes.options);
        if (billingMethods?.options) setBillingMethodOptions(billingMethods.options);
        if (currencies?.options) setCurrencyOptions(currencies.options);
      } catch (error) {
        console.error('Error loading dropdown options:', error);
        toast({
          title: 'Error',
          description: 'Failed to load form options. Please refresh the page.',
          variant: 'destructive'
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  // Update form state when options are loaded
  useEffect(() => {
    if (titleOptions?.length > 0 && languageOptions?.length > 0 && clientTypeOptions?.length > 0) {
      setClientDetails(prev => ({
        ...prev,
        title: prev.title || titleOptions[0]?.value || '',
        preferred_language: prev.preferred_language || languageOptions[0]?.value || '',
        client_type: prev.client_type || clientTypeOptions[0]?.value || ''
      }));
    }
  }, [titleOptions, languageOptions, clientTypeOptions]);

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

  // Add this useEffect to fetch matter types
  useEffect(() => {
    const fetchMatterTypes = async () => {
      try {
        const response = await fetch('/api/matter-types');
        if (!response.ok) {
          throw new Error('Failed to fetch matter types');
        }
        const data = await response.json();
        setMatterTypes(data.matterTypes);
      } catch (error) {
        console.error('Error fetching matter types:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatterTypes();
  }, []);

  // Fetch payment medium options
  useEffect(() => {
    fetch('/api/dropdowns/payment-mediums').then(res => res.json()).then(data => {
      if (data?.options) setPaymentMediumOptions(data.options);
    });
  }, []);

  // Fetch payment pattern options from the backend
  useEffect(() => {
    fetch('/api/dropdowns/payment-patterns')
      .then(res => res.json())
      .then(data => {
        if (data?.options) setPaymentPatternOptions(data.options);
      });
  }, []);

  // Add useEffect for loading billing frequency options
  useEffect(() => {
    fetch('/api/dropdowns/billing-frequencies')
      .then(res => res.json())
      .then(data => {
        if (data?.options) {
          setBillingFrequencyOptions(data.options);
        }
      })
      .catch(error => {
        console.error('Error loading billing frequency options:', error);
        toast({
          title: 'Error',
          description: 'Failed to load billing frequency options',
          variant: 'destructive'
        });
      });
  }, []);

  // Set default for billingDetails.terms_details.standard to 'Net 30' if not set
  useEffect(() => {
    if (!billingDetails.terms_details.standard && !billingDetails.terms_details.custom) {
      setBillingDetails(prev => ({
        ...prev,
        terms_details: { ...prev.terms_details, standard: 'Net 30' }
      }));
    }
    // eslint-disable-next-line
  }, []);

  // Set default for billingDetails.payment_pattern_id to 'Standard' and currency_id to 'USD' if not set
  useEffect(() => {
    // Set default payment pattern
    if (!billingDetails.payment_pattern_id && paymentPatternOptions.length > 0) {
      const standardOption = paymentPatternOptions.find(option => option.label.toLowerCase().includes('standard'));
      if (standardOption) {
        setBillingDetails(prev => ({
          ...prev,
          payment_pattern_id: standardOption.value
        }));
      }
    }
    // Set default currency
    if (!billingDetails.currency_id && currencyOptions.length > 0) {
      const usdOption = currencyOptions.find(option => option.label.toLowerCase().includes('usd') || option.value.toLowerCase() === 'usd');
      if (usdOption) {
        setBillingDetails(prev => ({
          ...prev,
          currency_id: String(usdOption.id)
        }));
      }
    }
    // eslint-disable-next-line
  }, [paymentPatternOptions, currencyOptions]);

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
    
    errors.matter_type_id = validateRequired(matterDetails.matter_type_id, 'Matter type');
    errors.sub_type_id = validateRequired(matterDetails.sub_type_id, 'Sub-type');
    errors.description = validateRequired(matterDetails.description, 'Description');
    errors.jurisdiction_country = validateRequired(matterDetails.jurisdiction_country, 'Country');
    errors.start_date = validateDate(matterDetails.start_date, 'Start date');
    
    // No validation for state/province as it's optional
    // No validation for estimated value as it's optional
    
    setMatterErrors(errors);
    
    // Form is valid if there are no error messages
    return Object.values(errors).every(error => !error);
  };
  
  const validateBillingForm = (): boolean => {
    const errors: BillingErrors = {};
    const method = billingDetails.billing_method_id ?? '';

    // Always required
    errors.billing_method = validateRequired(method, 'Billing method');
    errors.payment_pattern_id = validateRequired(billingDetails.payment_pattern_id, 'Payment pattern');
    errors.terms = validateRequired(billingDetails.terms_details.standard, 'Payment terms');

    // Rate required for all except Pro Bono/Other
    if (!['Pro Bono', 'Other'].includes(method)) {
      if (!billingDetails.rate_value || billingDetails.rate_value <= 0) {
        errors.rate = 'Rate is required';
      }
    }

    // Payment Medium required for all except Contingency, Pro Bono, Other
    if (!['Contingency', 'Pro Bono', 'Other'].includes(method)) {
      errors.payment_medium = validateRequired(billingDetails.payment_medium, 'Payment medium');
    }

    // Frequency required for recurring methods
    if (["Hourly", "Retainer", "Subscription", "Hybrid"].includes(method)) {
      errors.billing_frequency_id = validateRequired(billingDetails.billing_frequency_id, 'Billing frequency');
    }

    // Retainer amount required for Retainer
    if (method === 'Retainer') {
      errors.retainer_amount = validateRequired(billingDetails.retainer_amount, 'Retainer amount');
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

  // Helper to build prefixed title
  function getPrefixedTitle(client: ClientDetails, title: string | undefined) {
    const prefix = `${client.first_name} ${client.last_name}`.trim();
    if (!prefix) return title || '';
    // Remove ALL occurrences of the prefix at the start
    const regex = new RegExp(`^(${prefix}\\s*-\\s*)+`, 'i');
    const titleWithoutPrefix = (title || '').replace(regex, '');
    return `${prefix} - ${titleWithoutPrefix}`.trim();
  }

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
      const validMatterType = matterTypes.find(type => type.id === matterDetails.matter_type_id);
      if (!validMatterType) {
        toast({ title: 'Error', description: 'Invalid matter type selected.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const validSubType = validMatterType.subTypes.find(sub => sub.id === matterDetails.sub_type_id);
      if (!validSubType) {
        toast({ title: 'Error', description: 'Invalid sub-type selected.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Build the matter payload to match the DB schema
      const jurisdiction = matterDetails.jurisdiction_country + (matterDetails.jurisdiction_state ? `, ${matterDetails.jurisdiction_state}` : '');
      const matterPayload: any = {
        client_id: clientId,
        title: getPrefixedTitle(clientDetails, matterDetails.title),
        description: matterDetails.description,
        jurisdiction,
        estimated_value: matterDetails.estimated_value,
        matter_date: matterDetails.start_date ? matterDetails.start_date.toISOString().split('T')[0] : undefined,
        type_id: Number(matterDetails.matter_type_id),
        sub_type_id: Number(matterDetails.sub_type_id),
        priority: matterDetails.priority,
        intake_data: { send_eform: sendEForm },
        payment_pattern_id: billingDetails.payment_pattern_id,
        rate: typeof billingDetails.rate_value === 'number' ? billingDetails.rate_value : (billingDetails.rate_value ?? 0),
        currency: typeof billingDetails.currency_id === 'string' ? billingDetails.currency_id : null,
        payment_terms: billingDetails.terms_details.standard || '',
        retainer_amount: typeof billingDetails.retainer_amount === 'number' ? billingDetails.retainer_amount : (billingDetails.retainer_amount ?? 0),
        retainer_balance: typeof billingDetails.retainer_balance === 'number' ? billingDetails.retainer_balance : (billingDetails.retainer_balance ?? 0),
        billing_frequency_id: billingDetails.billing_frequency_id,
        notes: billingDetails.notes || '',
        features: billingDetails.features,
        billing_method_id: billingDetails.billing_method_id
      };

      // Remove null/undefined fields in a type-safe way
      const cleanedMatterPayload = Object.fromEntries(
        Object.entries(matterPayload).filter(([_, value]) => value !== undefined && value !== null)
      );

      const matterResponse = await fetch('/api/matters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedMatterPayload)
      });

      const matterData = await matterResponse.json();
      if (!matterResponse.ok || !matterData?.success || !matterData?.id) {
        let errorMsg = 'Failed to create matter';
        if (matterData && matterData.error) errorMsg = matterData.error;
        throw new Error(errorMsg);
      }

      const matterId = matterData.id;
      if (!matterId) {
        throw new Error('Matter ID missing from response');
      }

      // Get UUIDs for dropdowns
      const currency_id = billingDetails.currency_id ?? '';
      const payment_medium_id = paymentMediumOptions.find(option => option.value === billingDetails.payment_medium)?.id || null;
      const payment_pattern_id = billingDetails.payment_pattern_id ?? '';
      const billing_method_id = billingDetails.billing_method_id ?? '';
      const billing_frequency_id = billingDetails.billing_frequency_id ?? '';

      // Build the matter_billing payload with all required fields
      const billingPayload = {
        matter_id: matterId,
        billing_method_id: billing_method_id,
        payment_pattern_id: payment_pattern_id,
        currency_id: currency_id,
        payment_medium_id: payment_medium_id,
        terms_details: billingDetails.terms_details,
        billing_frequency_id: billing_frequency_id,
        features: billingDetails.features,
        retainer_amount: billingDetails.retainer_amount,
        retainer_balance: billingDetails.retainer_balance,
        notes: billingDetails.notes
      };

      // Remove null/undefined fields in a type-safe way
      const cleanedBillingPayload = Object.fromEntries(
        Object.entries(billingPayload).filter(([_, value]) => value !== undefined && value !== null)
      );

      const billingResponse = await fetch(`/api/matters/${matterId}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedBillingPayload)
      });

      if (!billingResponse.ok) {
        const errorData = await billingResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to set up billing');
      }

      // If e-form is enabled, create and send intake form
      if (sendEForm) {
        const intakeResponse = await fetch(`/api/matters/${matterId}/intake`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            expiration_days: 7
          })
        });

        if (!intakeResponse.ok) {
          throw new Error('Failed to create intake form');
        }
      }

      // Clear stored form data
      localStorage.removeItem('matter_intake_client_details');
      localStorage.removeItem('matter_intake_matter_details');
      localStorage.removeItem('matter_intake_billing_details');

      setSubmissionResult('success');
      toast({ title: 'Success', description: 'Matter created successfully' });
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
    const newFirstName = e.target.value;
    setClientDetails(prev => ({ ...prev, first_name: newFirstName }));
    setMatterDetails(prev => ({
      ...prev,
      title: getPrefixedTitle({ ...clientDetails, first_name: newFirstName }, prev.title)
    }));
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLastName = e.target.value;
    setClientDetails(prev => ({ ...prev, last_name: newLastName }));
    setMatterDetails(prev => ({
      ...prev,
      title: getPrefixedTitle({ ...clientDetails, last_name: newLastName }, prev.title)
    }));
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
                  value={clientDetails.first_name}
                  onChange={handleFirstNameChange}
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
                  value={clientDetails.last_name}
                  onChange={handleLastNameChange}
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
                  onChange={(value: string | undefined) => setClientDetails({ ...clientDetails, phone: value || '' })}
                  placeholder="Enter phone number"
                  className="phone-input"
                />
              </div>
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
                <SelectContent>
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
        );

      case 2:
        return (
          <div style={{ minHeight: FORM_MIN_HEIGHT }} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="title">Matter Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={matterDetails.title}
                onChange={(e) => setMatterDetails(prev => ({
                  ...prev,
                  title: getPrefixedTitle(clientDetails, e.target.value)
                }))}
                className={matterErrors.title ? 'border-red-500' : ''}
                placeholder="Enter matter title"
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
              <Select
                inputId="matter_type"
                className={`react-select ${matterErrors.matter_type_id ? 'border-red-500' : ''}`}
                classNamePrefix="react-select"
                options={matterTypes.map(type => ({
                  value: type.id.toString(),
                  label: type.label
                }))}
                value={matterTypes.find(type => type.id === matterDetails.matter_type_id) ? {
                  value: matterDetails.matter_type_id?.toString() || '',
                  label: matterTypes.find(type => type.id === matterDetails.matter_type_id)?.label || ''
                } : null}
                onChange={(selectedOption) => {
                  setMatterDetails({
                    ...matterDetails,
                    matter_type_id: selectedOption ? parseInt(selectedOption.value) : null,
                    sub_type_id: null // Reset sub-type when matter type changes
                  });
                }}
                placeholder="Select matter type"
                isClearable
                isSearchable
                isLoading={isLoading}
              />
              {matterErrors.matter_type_id && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {matterErrors.matter_type_id}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sub_type">Sub-Type <span className="text-red-500">*</span></Label>
              <Select
                inputId="sub_type"
                className={`react-select ${matterErrors.sub_type_id ? 'border-red-500' : ''}`}
                classNamePrefix="react-select"
                options={matterDetails.matter_type_id ? 
                  matterTypes
                    .find(type => type.id === matterDetails.matter_type_id)
                    ?.subTypes.map(subType => ({
                      value: subType.id.toString(),
                      label: subType.label
                    })) || [] : []
                }
                value={matterDetails.sub_type_id ? {
                  value: matterDetails.sub_type_id.toString(),
                  label: matterTypes
                    .find(type => type.id === matterDetails.matter_type_id)
                    ?.subTypes.find(subType => subType.id === matterDetails.sub_type_id)
                    ?.label || ''
                } : null}
                onChange={(selectedOption) => {
                  setMatterDetails({
                    ...matterDetails,
                    sub_type_id: selectedOption ? parseInt(selectedOption.value) : null
                  });
                }}
                placeholder="Select sub-type"
                isClearable
                isSearchable
                isDisabled={!matterDetails.matter_type_id}
              />
              {matterErrors.sub_type_id && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {matterErrors.sub_type_id}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <DatePicker
                label="Matter Start Date"
                value={matterDetails.start_date}
                onChange={(date) => setMatterDetails({ ...matterDetails, start_date: date })}
                placeholder="Select start date"
                error={matterErrors.start_date}
                required
                minDate={new Date()}
              />            
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="jurisdiction_country">Country <span className="text-red-500">*</span></Label>
                <div id="jurisdiction_country-wrapper">
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
                        jurisdiction_state: '' // Reset state when country changes
                      });
                    }}
                    placeholder="Select country"
                    isClearable
                    isSearchable
                  />
                </div>
                {matterErrors.jurisdiction_country && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {matterErrors.jurisdiction_country}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="jurisdiction_state">State/Province</Label>
                <Input
                  id="jurisdiction_state"
                  value={matterDetails.jurisdiction_state}
                  onChange={(e) => setMatterDetails({ ...matterDetails, jurisdiction_state: e.target.value })}
                  placeholder="Enter state/province"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="estimated_value">Estimated Value (Optional)</Label>
              <Input
                id="estimated_value"
                type="number"
                value={typeof matterDetails.estimated_value === 'number' ? matterDetails.estimated_value : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setMatterDetails({
                    ...matterDetails,
                    estimated_value: val ? Number(val) : undefined
                  });
                }}
                placeholder="e.g., 100000"
                className={matterErrors.estimated_value ? 'border-red-500' : ''}
              />
              {matterErrors.estimated_value && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {matterErrors.estimated_value}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
              <Select
                inputId="priority"
                classNamePrefix="react-select"
                options={[
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' }
                ]}
                value={{ value: matterDetails.priority, label: matterDetails.priority }}
                onChange={selectedOption => setMatterDetails({ ...matterDetails, priority: selectedOption?.value || 'Medium' })}
                placeholder="Select priority"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
              <Select
                inputId="status"
                classNamePrefix="react-select"
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Closed', label: 'Closed' },
                  { value: 'On Hold', label: 'On Hold' },
                  { value: 'Pending', label: 'Pending' }
                ]}
                value={{ value: matterDetails.status, label: matterDetails.status }}
                onChange={selectedOption => setMatterDetails({ ...matterDetails, status: selectedOption?.value || 'Active' })}
                placeholder="Select status"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
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
            </div>

            {/* Payment Pattern Field */}
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
            </div>

            {/* Conditionally render Payment Medium */}
            {selectedBillingMethodValue !== 'Pro Bono' && (
              <div className="space-y-1">
                <Label htmlFor="payment_medium">Payment Medium <span className="text-red-500">*</span></Label>
                <Select
                  inputId="payment_medium"
                  className={`react-select ${billingErrors.payment_medium ? 'border-red-500' : ''}`}
                  classNamePrefix="react-select"
                  options={paymentMediumOptions}
                  value={paymentMediumOptions.find(option => option.value === billingDetails.payment_medium)}
                  onChange={selectedOption => setBillingDetails({
                    ...billingDetails,
                    payment_medium: selectedOption?.value || ''
                  })}
                  placeholder="Select payment medium"
                  styles={{ control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.8rem' }) }}
                />
              </div>
            )}

            {/* Conditionally render Billing Frequency */}
            {billingMethodRequirements[selectedBillingMethodValue]?.requiresFrequency && (
              <div className="space-y-1">
                <Label htmlFor="billing_frequency">Billing Frequency <span className="text-red-500">*</span></Label>
                <Select
                  inputId="billing_frequency"
                  className={`react-select ${billingErrors.billing_frequency ? 'border-red-500' : ''}`}
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
              </div>
            )}

            {/* Rate and Currency Section */}
            {selectedBillingMethodValue && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="rate">Rate <span className="text-red-500">*</span></Label>
                  <Input
                    id="rate"
                    type="number"
                    value={billingDetails.rate_value}
                    onChange={(e) => setBillingDetails({
                      ...billingDetails,
                      rate_value: Number(e.target.value)
                    })}
                    placeholder={`Enter ${selectedBillingMethodValue} rate`}
                    style={{ fontSize: '0.8rem', height: '32px' }}
                  />
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
                </div>
              </div>
            )}

            {/* Terms Section */}
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="terms">Payment Terms <span className="text-red-500">*</span> <span className="text-gray-500 text-xs">(e.g., when payment is due: Net 30, Due on receipt)</span></Label>
                <Select
                  inputId="terms"
                  classNamePrefix="react-select"
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
              </div>
              <div className="flex items-center space-x-2 mt-2">
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
                  />
                </div>
              )}
            </div>

            {/* Features Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="automated_time_capture"
                  checked={billingDetails.features.automated_time_capture}
                  onCheckedChange={(checked) => setBillingDetails({
                    ...billingDetails,
                    features: { ...billingDetails.features, automated_time_capture: checked }
                  })}
                />
                <Label htmlFor="automated_time_capture">Enable Automated Time Capture</Label>
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
                <Label htmlFor="blockchain_invoicing">Enable Blockchain-Secured Invoicing</Label>
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
                <Label htmlFor="send_invoice_on_approval">Send Invoice on Client Approval</Label>
              </div>
            </div>

            {/* Notes Section */}
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
          <div style={{ minHeight: FORM_MIN_HEIGHT }} className="space-y-6">
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Client Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="font-medium text-gray-600">Name:</div>
                <div className="text-gray-900">{clientDetails.first_name} {clientDetails.last_name}</div>
                
                <div className="font-medium text-gray-600">Email:</div>
                <div className="text-gray-900">{clientDetails.email}</div>
                
                <div className="font-medium text-gray-600">Phone:</div>
                <div className="text-gray-900">{clientDetails.phone}</div>
                
                <div className="font-medium text-gray-600">Preferred Language:</div>
                <div className="text-gray-900">{languageOptions.find(option => option.id === clientDetails.preferred_language)?.label || clientDetails.preferred_language}</div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Matter Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="font-medium text-gray-600">Title:</div>
                <div className="text-gray-900">{matterDetails.title}</div>
                
                <div className="font-medium text-gray-600">Type:</div>
                <div className="text-gray-900">
                  {matterTypes.find(type => type.id === matterDetails.matter_type_id)?.label || 'Not selected'}
                </div>
                
                <div className="font-medium text-gray-600">Sub-Type:</div>
                <div className="text-gray-900">
                  {matterTypes
                    .find(type => type.id === matterDetails.matter_type_id)
                    ?.subTypes.find(subType => subType.id === matterDetails.sub_type_id)?.label || 'Not selected'}
                </div>
                
                <div className="font-medium text-gray-600">Jurisdiction:</div>
                <div className="text-gray-900">
                  {matterDetails.jurisdiction_country}
                  {matterDetails.jurisdiction_state ? `, ${matterDetails.jurisdiction_state}` : ''}
                </div>
                
                <div className="font-medium text-gray-600">Start Date:</div>
                <div className="text-gray-900">
                  {matterDetails.start_date ? format(new Date(matterDetails.start_date), 'MMM d, yyyy') : 'Not specified'}
                </div>
                
                <div className="font-medium text-gray-600">Priority:</div>
                <div className="text-gray-900">{matterDetails.priority}</div>
                
                <div className="font-medium text-gray-600">Status:</div>
                <div className="text-gray-900">{matterDetails.status}</div>
                
                <div className="font-medium text-gray-600 col-span-2">Description:</div>
                <div className="text-gray-900 col-span-2">{matterDetails.description}</div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Billing Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
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
                  {billingDetails.features.automated_time_capture && 'Automated Time Capture'}
                  {billingDetails.features.blockchain_invoicing && ', Blockchain Invoicing'}
                  {billingDetails.features.send_invoice_on_approval && ', Auto-Invoice'}
                </div>
              </div>
            </div>
            
            {sendEForm && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-2">
                <p className="text-sm text-blue-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
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
            <CheckCircle className="w-16 h-16 text-green-500 animate-bounce-in" />
            <h2 className="text-2xl font-bold mt-4 mb-2 text-green-700">Success!</h2>
            <p className="text-gray-700 mb-4">Matter created successfully.</p>
            <Button onClick={() => { setSubmissionResult(null); router.push('/matters'); }}>
              Go to Matters
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
            <CardContent className="p-8 min-h-[600px] flex flex-col">
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