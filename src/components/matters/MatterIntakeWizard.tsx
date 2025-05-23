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
import { ArrowLeft, ArrowRight, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { validateEmail, validatePhone, validateRequired, validateDate } from '@/lib/form-validation';
import { titleOptions, clientTypeOptions, languageOptions, matterTypes, currencyOptions } from '@/data/dropdown-data';
import { countries } from '@/data/countries-list';
import { regions } from '@/data/regions-states';

interface MatterIntakeWizardProps {
  onComplete: () => void;
}

interface ClientDetails {
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  preferred_language: string;
  client_type: string;
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

interface MatterDetails {
  matter_type: string;
  sub_type: string;
  description: string;
  jurisdiction_country: string;
  jurisdiction_state?: string;
  estimated_value?: number;
  start_date: Date | null;
}

interface MatterErrors {
  matter_type?: string;
  sub_type?: string;
  description?: string;
  jurisdiction_country?: string;
  jurisdiction_state?: string;
  estimated_value?: string;
  start_date?: string;
  [key: string]: string | undefined;
}

interface BillingDetails {
  billing_method: 'Hourly' | 'Flat Fee' | 'Contingency' | 'Retainer';
  hourly_rate?: number;
  flat_fee_amount?: number;
  contingency_percentage?: number;
  retainer_amount?: number;
  currency: string;
  automated_time_capture: boolean;
  blockchain_invoicing: boolean;
  send_invoice_on_approval: boolean;
}

interface BillingErrors {
  billing_method?: string;
  hourly_rate?: string;
  flat_fee_amount?: string;
  contingency_percentage?: string;
  retainer_amount?: string;
  currency?: string;
  [key: string]: string | undefined;
}

export function MatterIntakeWizard({ onComplete }: MatterIntakeWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(25);
  const [loading, setLoading] = useState(false);
  const [sendEForm, setSendEForm] = useState(false);

  // Form state
  // Load saved client details from localStorage if available
  const [clientDetails, setClientDetails] = useState<ClientDetails>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('matter_intake_client_details');
      const parsedData = savedData ? JSON.parse(savedData) : null;
      // Handle migration from full_name to first_name and last_name
      if (parsedData && parsedData.full_name) {
        const nameParts = parsedData.full_name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        return {
          ...parsedData,
          first_name: firstName,
          last_name: lastName
        };
      }
      return parsedData || {
        title: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        preferred_language: 'en',
        client_type: 'Individual'
      };
    }
    return {
      full_name: '',
      email: '',
      phone: '',
      preferred_language: 'English',
      client_type: 'Individual'
    };
  });

  // Load saved matter details from localStorage if available
  const [matterDetails, setMatterDetails] = useState<MatterDetails>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('matter_intake_matter_details');
      const parsedData = savedData ? JSON.parse(savedData) : null;
      // Handle migration from jurisdiction to jurisdiction_country/state
      if (parsedData && parsedData.jurisdiction) {
        return {
          ...parsedData,
          jurisdiction_country: parsedData.jurisdiction,
          jurisdiction_state: ''
        };
      }
      return parsedData || {
        matter_type: '',
        sub_type: '',
        description: '',
        jurisdiction_country: '',
        jurisdiction_state: '',
        start_date: null
      };
    }
    return {
      matter_type: '',
      sub_type: '',
      description: '',
      jurisdiction_country: '',
      jurisdiction_state: '',
      start_date: null
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
        billing_method: 'Hourly',
        currency: 'USD',
        automated_time_capture: true,
        blockchain_invoicing: false,
        send_invoice_on_approval: false
      };
    }
    return {
      billing_method: 'Hourly',
      currency: 'USD',
      automated_time_capture: true,
      blockchain_invoicing: false,
      send_invoice_on_approval: false
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
    
    errors.matter_type = validateRequired(matterDetails.matter_type, 'Matter type');
    errors.sub_type = validateRequired(matterDetails.sub_type, 'Sub-type');
    errors.description = validateRequired(matterDetails.description, 'Description');
    errors.jurisdiction_country = validateRequired(matterDetails.jurisdiction_country, 'Country');
    // State/province is required only if a country is selected
    if (matterDetails.jurisdiction_country) {
      errors.jurisdiction_state = validateRequired(matterDetails.jurisdiction_state || '', 'State/Province');
    }
    errors.start_date = validateDate(matterDetails.start_date, 'Start date');
    
    // No validation for estimated value as it's optional
    
    setMatterErrors(errors);
    
    // Form is valid if there are no error messages
    return Object.values(errors).every(error => !error);
  };
  
  const validateBillingForm = (): boolean => {
    const errors: BillingErrors = {};
    
    errors.billing_method = validateRequired(billingDetails.billing_method, 'Billing method');
    errors.currency = validateRequired(billingDetails.currency, 'Currency');
    
    // Validate rate fields based on selected billing method
    if (billingDetails.billing_method === 'Hourly' && !billingDetails.hourly_rate) {
      errors.hourly_rate = 'Hourly rate is required';
    }
    
    if (billingDetails.billing_method === 'Flat Fee' && !billingDetails.flat_fee_amount) {
      errors.flat_fee_amount = 'Flat fee amount is required';
    }
    
    if (billingDetails.billing_method === 'Contingency' && !billingDetails.contingency_percentage) {
      errors.contingency_percentage = 'Contingency percentage is required';
    }
    
    if (billingDetails.billing_method === 'Retainer' && !billingDetails.retainer_amount) {
      errors.retainer_amount = 'Retainer amount is required';
    }
    
    setBillingErrors(errors);
    
    // Form is valid if there are no error messages
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

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Create client first
      const clientResponse = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientDetails)
      });

      if (!clientResponse.ok) throw new Error('Failed to create client');
      const { id: clientId } = await clientResponse.json();

      // Create matter with client ID
      const matterResponse = await fetch('/api/matters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...matterDetails,
          client_id: clientId
        })
      });

      if (!matterResponse.ok) throw new Error('Failed to create matter');
      const { id: matterId } = await matterResponse.json();

      // Set up billing
      const billingResponse = await fetch(`/api/matters/${matterId}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billingDetails)
      });

      if (!billingResponse.ok) throw new Error('Failed to set up billing');

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

        if (!intakeResponse.ok) throw new Error('Failed to create intake form');
      }

      // Clear stored form data from localStorage
      localStorage.removeItem('matter_intake_client_details');
      localStorage.removeItem('matter_intake_matter_details');
      localStorage.removeItem('matter_intake_billing_details');

      toast({
        title: 'Success',
        description: 'Matter created successfully',
      });

      onComplete();
      router.push('/matters');
    } catch (error) {
      console.error('Error creating matter:', error);
      toast({
        title: 'Error',
        description: 'Failed to create matter. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Select
                  inputId="title"
                  className={`react-select ${clientErrors.title ? 'border-red-500' : ''}`}
                  classNamePrefix="react-select"
                  options={titleOptions}
                  value={titleOptions.find(option => option.value === clientDetails.title)}
                  onChange={(selectedOption) => {
                    setClientDetails({
                      ...clientDetails,
                      title: selectedOption?.value || ''
                    });
                  }}
                  placeholder="Select title"
                  isClearable
                  isSearchable
                />
                {clientErrors.title && (
                  <div className="text-red-500 text-sm mt-1">{clientErrors.title}</div>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="client_type">Client Type <span className="text-red-500">*</span></Label>
                <Select
                  inputId="client_type"
                  className={`react-select ${clientErrors.client_type ? 'border-red-500' : ''}`}
                  classNamePrefix="react-select"
                  options={clientTypeOptions}
                  value={clientTypeOptions.find(option => option.value === clientDetails.client_type)}
                  onChange={(selectedOption) => {
                    setClientDetails({
                      ...clientDetails,
                      client_type: selectedOption?.value || ''
                    });
                  }}
                  placeholder="Select client type"
                  isClearable
                  isSearchable
                />
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
                  onChange={(e) => setClientDetails({ ...clientDetails, first_name: e.target.value })}
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
                  onChange={(e) => setClientDetails({ ...clientDetails, last_name: e.target.value })}
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
              <Select
                inputId="preferred_language"
                className={`react-select ${clientErrors.preferred_language ? 'border-red-500' : ''}`}
                classNamePrefix="react-select"
                options={languageOptions}
                value={languageOptions.find(option => option.value === clientDetails.preferred_language)}
                onChange={(selectedOption) => {
                  setClientDetails({
                    ...clientDetails,
                    preferred_language: selectedOption?.value || ''
                  });
                }}
                placeholder="Select language"
                isClearable
                isSearchable
              />
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
          <div className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="matter_type">Matter Type <span className="text-red-500">*</span></Label>
              <Select
                inputId="matter_type"
                className={`react-select ${matterErrors.matter_type ? 'border-red-500' : ''}`}
                classNamePrefix="react-select"
                options={matterTypes}
                value={matterTypes.find(option => option.value === matterDetails.matter_type)}
                onChange={(selectedOption) => {
                  setMatterDetails({
                    ...matterDetails,
                    matter_type: selectedOption?.value || '',
                    sub_type: '' // Reset sub-type when matter type changes
                  });
                }}
                placeholder="Select matter type"
                isClearable
                isSearchable
              />
              {matterErrors.matter_type && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {matterErrors.matter_type}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sub_type">Sub-Type <span className="text-red-500">*</span></Label>
              <Select
                inputId="sub_type"
                className={`react-select ${matterErrors.sub_type ? 'border-red-500' : ''}`}
                classNamePrefix="react-select"
                options={
                  matterDetails.matter_type 
                    ? matterTypes.find(m => m.value === matterDetails.matter_type)?.subTypes || []
                    : []
                }
                value={
                  matterDetails.matter_type && matterDetails.sub_type
                    ? matterTypes
                        .find(m => m.value === matterDetails.matter_type)?.subTypes
                        .find(option => option.value === matterDetails.sub_type)
                    : null
                }
                onChange={(selectedOption) => {
                  setMatterDetails({
                    ...matterDetails,
                    sub_type: selectedOption?.value || ''
                  });
                }}
                placeholder="Select sub-type"
                isClearable
                isSearchable
                isDisabled={!matterDetails.matter_type}
              />
              {matterErrors.sub_type && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {matterErrors.sub_type}
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
                <Label htmlFor="jurisdiction_state">State/Province <span className="text-red-500">*</span></Label>
                <div id="jurisdiction_state-wrapper">
                  <Select
                    inputId="jurisdiction_state"
                    className={`react-select ${matterErrors.jurisdiction_state ? 'border-red-500' : ''}`}
                    classNamePrefix="react-select"
                    options={matterDetails.jurisdiction_country && regions[matterDetails.jurisdiction_country as keyof typeof regions] ? 
                      regions[matterDetails.jurisdiction_country as keyof typeof regions] : []}
                    value={matterDetails.jurisdiction_country && matterDetails.jurisdiction_state ? 
                      (regions[matterDetails.jurisdiction_country as keyof typeof regions] || []).find((option) => 
                        option.value === matterDetails.jurisdiction_state) : null}
                    onChange={(selectedOption) => {
                      setMatterDetails({
                        ...matterDetails,
                        jurisdiction_state: selectedOption?.value || ''
                      });
                    }}
                    placeholder="Select state/province"
                    isClearable
                    isSearchable
                    isDisabled={!matterDetails.jurisdiction_country || 
                      !regions[matterDetails.jurisdiction_country as keyof typeof regions]}
                  />
                </div>
                {matterErrors.jurisdiction_state && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {matterErrors.jurisdiction_state}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="estimated_value">Estimated Value (Optional)</Label>
              <Input
                id="estimated_value"
                type="number"
                value={matterDetails.estimated_value}
                onChange={(e) => setMatterDetails({ ...matterDetails, estimated_value: e.target.value ? Number(e.target.value) : undefined })}
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
                options={[
                  { value: 'Hourly', label: 'Hourly' },
                  { value: 'Flat Fee', label: 'Flat Fee' },
                  { value: 'Contingency', label: 'Contingency' },
                  { value: 'Retainer', label: 'Retainer' }
                ]}
                value={{
                  value: billingDetails.billing_method,
                  label: billingDetails.billing_method
                }}
                onChange={(selectedOption) => {
                  setBillingDetails({
                    ...billingDetails,
                    billing_method: (selectedOption?.value as 'Hourly' | 'Flat Fee' | 'Contingency' | 'Retainer') || 'Hourly'
                  });
                }}
                placeholder="Select billing method"
                isClearable
                isSearchable
              />
              {billingErrors.billing_method && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {billingErrors.billing_method}
                </p>
              )}
            </div>
            {billingDetails.billing_method === 'Hourly' && (
              <div className="space-y-1">
                <Label htmlFor="hourly_rate">Hourly Rate</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  value={billingDetails.hourly_rate}
                  onChange={(e) => setBillingDetails({ ...billingDetails, hourly_rate: Number(e.target.value) })}
                  placeholder="e.g., 200"
                  className={billingErrors.hourly_rate ? 'border-red-500' : ''}
                />
                {billingErrors.hourly_rate && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {billingErrors.hourly_rate}
                  </p>
                )}
              </div>
            )}
            {billingDetails.billing_method === 'Flat Fee' && (
              <div className="space-y-1">
                <Label htmlFor="flat_fee_amount">Flat Fee Amount</Label>
                <Input
                  id="flat_fee_amount"
                  type="number"
                  value={billingDetails.flat_fee_amount}
                  onChange={(e) => setBillingDetails({ ...billingDetails, flat_fee_amount: Number(e.target.value) })}
                  placeholder="e.g., 5000"
                  className={billingErrors.flat_fee_amount ? 'border-red-500' : ''}
                />
                {billingErrors.flat_fee_amount && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {billingErrors.flat_fee_amount}
                  </p>
                )}
              </div>
            )}
            {billingDetails.billing_method === 'Contingency' && (
              <div className="space-y-1">
                <Label htmlFor="contingency_percentage">Contingency Percentage</Label>
                <Input
                  id="contingency_percentage"
                  type="number"
                  value={billingDetails.contingency_percentage}
                  onChange={(e) => setBillingDetails({ ...billingDetails, contingency_percentage: Number(e.target.value) })}
                  placeholder="e.g., 30"
                  className={billingErrors.contingency_percentage ? 'border-red-500' : ''}
                />
                {billingErrors.contingency_percentage && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {billingErrors.contingency_percentage}
                  </p>
                )}
              </div>
            )}
            {billingDetails.billing_method === 'Retainer' && (
              <div className="space-y-1">
                <Label htmlFor="retainer_amount">Retainer Amount</Label>
                <Input
                  id="retainer_amount"
                  type="number"
                  value={billingDetails.retainer_amount}
                  onChange={(e) => setBillingDetails({ ...billingDetails, retainer_amount: Number(e.target.value) })}
                  placeholder="e.g., 2000"
                  className={billingErrors.retainer_amount ? 'border-red-500' : ''}
                />
                {billingErrors.retainer_amount && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {billingErrors.retainer_amount}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="currency">Currency <span className="text-red-500">*</span></Label>
              <Select
                inputId="currency"
                className={`react-select ${billingErrors.currency ? 'border-red-500' : ''}`}
                classNamePrefix="react-select"
                options={currencyOptions}
                value={currencyOptions.find(option => option.value === billingDetails.currency)}
                onChange={(selectedOption) => {
                  setBillingDetails({
                    ...billingDetails,
                    currency: selectedOption?.value || 'USD'
                  });
                }}
                placeholder="Select currency"
                isClearable
                isSearchable
              />
              {billingErrors.currency && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {billingErrors.currency}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="automated_time_capture"
                  checked={billingDetails.automated_time_capture}
                  onCheckedChange={(checked) => setBillingDetails({ ...billingDetails, automated_time_capture: checked })}
                />
                <Label htmlFor="automated_time_capture">Enable Automated Time Capture</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="blockchain_invoicing"
                  checked={billingDetails.blockchain_invoicing}
                  onCheckedChange={(checked) => setBillingDetails({ ...billingDetails, blockchain_invoicing: checked })}
                />
                <Label htmlFor="blockchain_invoicing">Enable Blockchain-Secured Invoicing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="send_invoice_on_approval"
                  checked={billingDetails.send_invoice_on_approval}
                  onCheckedChange={(checked) => setBillingDetails({ ...billingDetails, send_invoice_on_approval: checked })}
                />
                <Label htmlFor="send_invoice_on_approval">Send Invoice on Client Approval</Label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
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
                <div className="text-gray-900">{clientDetails.preferred_language}</div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Matter Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="font-medium text-gray-600">Type:</div>
                <div className="text-gray-900">{matterDetails.matter_type}</div>
                
                <div className="font-medium text-gray-600">Sub-Type:</div>
                <div className="text-gray-900">{matterDetails.sub_type}</div>
                
                <div className="font-medium text-gray-600">Jurisdiction:</div>
                <div className="text-gray-900">
                  {matterDetails.jurisdiction_country}
                  {matterDetails.jurisdiction_state ? `, ${matterDetails.jurisdiction_state}` : ''}
                </div>
                
                <div className="font-medium text-gray-600">Start Date:</div>
                <div className="text-gray-900">{matterDetails.start_date ? format(new Date(matterDetails.start_date), 'MMM d, yyyy') : 'Not specified'}</div>
                
                <div className="font-medium text-gray-600 col-span-2">Description:</div>
                <div className="text-gray-900 col-span-2">{matterDetails.description}</div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Billing Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="font-medium text-gray-600">Method:</div>
                <div className="text-gray-900">{billingDetails.billing_method}</div>
                
                {billingDetails.billing_method === 'Hourly' && billingDetails.hourly_rate && (
                  <>
                    <div className="font-medium text-gray-600">Rate:</div>
                    <div className="text-gray-900">{billingDetails.hourly_rate} {billingDetails.currency}</div>
                  </>
                )}
                
                {billingDetails.billing_method === 'Flat Fee' && billingDetails.flat_fee_amount && (
                  <>
                    <div className="font-medium text-gray-600">Fee:</div>
                    <div className="text-gray-900">{billingDetails.flat_fee_amount} {billingDetails.currency}</div>
                  </>
                )}
                
                <div className="font-medium text-gray-600">Features:</div>
                <div className="text-gray-900">
                  {billingDetails.automated_time_capture && 'Automated Time Capture'}
                  {billingDetails.blockchain_invoicing && ', Blockchain Invoicing'}
                  {billingDetails.send_invoice_on_approval && ', Auto-Invoice'}
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
  );
} 