'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChevronRight } from 'lucide-react';

interface ModernMatterIntakeWizardProps {
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

interface MatterDetails {
  matter_type: string;
  sub_type: string;
  description: string;
  jurisdiction: string;
  estimated_value?: number;
}

interface BillingDetails {
  billing_method_id: string;
  payment_pattern_id: string;
  currency_id: string;
  payment_medium_id?: string;
  rate_value: number;
  terms_details: {
    standard: string;
    custom?: string;
  };
  billing_frequency_id?: string;
  features: {
    automated_time_capture: boolean;
    blockchain_invoicing: boolean;
    send_invoice_on_approval: boolean;
  };
  retainer_amount: number | null;
  retainer_balance: number | null;
  notes: string | null;
}

// Types for dropdown options
interface Option { id: string; value: string; label: string; }
interface SubTypeOption extends Option { matter_type_id: string; }

export function ModernMatterIntakeWizard({ onComplete }: ModernMatterIntakeWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sendEForm, setSendEForm] = useState(false);

  // Form state with proper default values from dropdown data
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    title: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    preferred_language: '',
    client_type: ''
  });

  const [matterDetails, setMatterDetails] = useState<MatterDetails>({
    matter_type: '',
    sub_type: '',
    description: '',
    jurisdiction: ''
  });

  const [billingDetails, setBillingDetails] = useState<BillingDetails>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('matter_intake_billing_details');
      return savedData ? JSON.parse(savedData) : {
        billing_method_id: '',
        payment_pattern_id: '',
        currency_id: '',
        payment_medium_id: '',
        rate_value: 0,
        terms_details: {
          standard: '',
          custom: ''
        },
        billing_frequency_id: '',
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
      billing_method_id: '',
      payment_pattern_id: '',
      currency_id: '',
      payment_medium_id: '',
      rate_value: 0,
      terms_details: {
        standard: '',
        custom: ''
      },
      billing_frequency_id: '',
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

  const [titleOptions, setTitleOptions] = useState<Option[]>([]);
  const [clientTypeOptions, setClientTypeOptions] = useState<Option[]>([]);
  const [languageOptions, setLanguageOptions] = useState<Option[]>([]);
  const [matterTypeOptions, setMatterTypeOptions] = useState<Option[]>([]);
  const [matterSubTypeOptions, setMatterSubTypeOptions] = useState<SubTypeOption[]>([]);
  const [billingMethodOptions, setBillingMethodOptions] = useState<Option[]>([]);
  const [paymentPatternOptions, setPaymentPatternOptions] = useState<Option[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<Option[]>([]);
  const [billingFrequencyOptions, setBillingFrequencyOptions] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const fetchOrCache = async (key: string, url: string) => {
      const cached = sessionStorage.getItem(key);
      if (cached) return JSON.parse(cached);
      const res = await fetch(url);
      const data = await res.json();
      sessionStorage.setItem(key, JSON.stringify(data.options));
      return data.options;
    };
    Promise.all([
      fetchOrCache('dropdown_titles', '/api/dropdowns/titles'),
      fetchOrCache('dropdown_client_types', '/api/dropdowns/client-types'),
      fetchOrCache('dropdown_languages', '/api/dropdowns/languages'),
      fetchOrCache('dropdown_matter_types', '/api/dropdowns/matter-types'),
      fetchOrCache('dropdown_matter_sub_types', '/api/dropdowns/matter-sub-types'),
      fetchOrCache('dropdown_billing_methods', '/api/dropdowns/billing-methods'),
      fetchOrCache('dropdown_payment_patterns', '/api/dropdowns/payment-patterns'),
      fetchOrCache('dropdown_currencies', '/api/dropdowns/currencies'),
      fetchOrCache('dropdown_billing_frequencies', '/api/dropdowns/billing-frequencies'),
    ]).then(([titles, clientTypes, languages, matterTypes, subTypes, billingMethods, paymentPatterns, currencies, billingFrequencies]) => {
      setTitleOptions(titles);
      setClientTypeOptions(clientTypes);
      setLanguageOptions(languages);
      setMatterTypeOptions(matterTypes);
      setMatterSubTypeOptions(subTypes);
      setBillingMethodOptions(billingMethods);
      setPaymentPatternOptions(paymentPatterns);
      setCurrencyOptions(currencies);
      setBillingFrequencyOptions(billingFrequencies);
    }).finally(() => setLoadingOptions(false));
  }, []);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Create client first
      const clientResponse = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: `${clientDetails.first_name} ${clientDetails.last_name}`,
          email: clientDetails.email,
          phone: clientDetails.phone,
          address: clientDetails.address,
          preferred_language: clientDetails.preferred_language,
          client_type: clientDetails.client_type
        })
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

  const renderClientInformation = () => (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Select
            value={clientDetails.title}
            onValueChange={(value) => setClientDetails({ ...clientDetails, title: value })}
          >
            <SelectTrigger id="title" className="w-full">
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              {titleOptions.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="client_type">Client Type</Label>
          <Select
            value={clientDetails.client_type}
            onValueChange={(value) => setClientDetails({ ...clientDetails, client_type: value })}
          >
            <SelectTrigger id="client_type" className="w-full">
              <SelectValue placeholder="Select client type" />
            </SelectTrigger>
            <SelectContent>
              {clientTypeOptions.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            value={clientDetails.first_name}
            onChange={(e) => setClientDetails({ ...clientDetails, first_name: e.target.value })}
            placeholder="John"
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            value={clientDetails.last_name}
            onChange={(e) => setClientDetails({ ...clientDetails, last_name: e.target.value })}
            placeholder="Smith"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={clientDetails.email}
          onChange={(e) => setClientDetails({ ...clientDetails, email: e.target.value })}
          placeholder="john.smith@email.com"
        />
      </div>

      <div>
        <Label htmlFor="phone">Client Phone Number</Label>
        <Input
          id="phone"
          value={clientDetails.phone}
          onChange={(e) => setClientDetails({ ...clientDetails, phone: e.target.value })}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <Label htmlFor="preferred_language">Preferred Language</Label>
        <Select
          value={clientDetails.preferred_language}
          onValueChange={(value) => setClientDetails({ ...clientDetails, preferred_language: value })}
        >
          <SelectTrigger id="preferred_language" className="w-full">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="address">Address (Optional, but required for court filings or physical correspondence)</Label>
        <Textarea
          id="address"
          value={clientDetails.address}
          onChange={(e) => setClientDetails({ ...clientDetails, address: e.target.value })}
          placeholder="123 Main St, City, State, ZIP"
        />
      </div>

      <div className="items-center">
        <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
          <Switch
            id="send_eform"
            checked={sendEForm}
            onCheckedChange={setSendEForm}
          />
          <Label htmlFor="send_eform" className="cursor-pointer">Send intake form to client's email</Label>
        </div>
      </div>
    </div>
  );

  const renderMatterDetails = () => (
    <div className="grid gap-6">
      <div>
        <Label htmlFor="matter_type">Matter Type</Label>
        <Select
          value={matterDetails.matter_type}
          onValueChange={(value) => setMatterDetails({ ...matterDetails, matter_type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select matter type" />
          </SelectTrigger>
          <SelectContent>
            {matterTypeOptions.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="sub_type">Sub-Type</Label>
        <Select
          value={matterDetails.sub_type}
          onValueChange={(value) => setMatterDetails({ ...matterDetails, sub_type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sub-type" />
          </SelectTrigger>
          <SelectContent>
            {matterSubTypeOptions.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={matterDetails.description}
          onChange={(e) => setMatterDetails({ ...matterDetails, description: e.target.value })}
          placeholder="Describe the matter in detail..."
          className="h-32"
        />
      </div>
      <div>
        <Label htmlFor="jurisdiction">Jurisdiction</Label>
        <Input
          id="jurisdiction"
          value={matterDetails.jurisdiction}
          onChange={(e) => setMatterDetails({ ...matterDetails, jurisdiction: e.target.value })}
          placeholder="e.g., California, UK, India"
        />
      </div>
      <div>
        <Label htmlFor="estimated_value">Estimated Value (Optional)</Label>
        <Input
          id="estimated_value"
          type="number"
          value={matterDetails.estimated_value}
          onChange={(e) => setMatterDetails({ ...matterDetails, estimated_value: Number(e.target.value) })}
          placeholder="e.g., 10000"
        />
      </div>
    </div>
  );

  const renderBillingInformation = () => (
    <div className="grid gap-6">
      <div>
        <Label htmlFor="billing_method">Billing Method</Label>
        <Select
          value={billingDetails.billing_method_id}
          onValueChange={(value) => setBillingDetails({ 
            ...billingDetails, 
            billing_method_id: value,
            rate_value: 0
          })}
        >
          <SelectTrigger id="billing_method" className="w-full">
            <SelectValue placeholder="Select billing method" />
          </SelectTrigger>
          <SelectContent>
            {billingMethodOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="payment_pattern">Payment Pattern</Label>
        <Select
          value={billingDetails.payment_pattern_id}
          onValueChange={(value) => setBillingDetails({ 
            ...billingDetails, 
            payment_pattern_id: value
          })}
        >
          <SelectTrigger id="payment_pattern" className="w-full">
            <SelectValue placeholder="Select payment pattern" />
          </SelectTrigger>
          <SelectContent>
            {paymentPatternOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={billingDetails.currency_id}
          onValueChange={(value) => setBillingDetails({ 
            ...billingDetails, 
            currency_id: value
          })}
        >
          <SelectTrigger id="currency" className="w-full">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencyOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="billing_frequency">Billing Frequency</Label>
        <Select
          value={billingDetails.billing_frequency_id || ''}
          onValueChange={(value) => setBillingDetails({ 
            ...billingDetails, 
            billing_frequency_id: value || undefined
          })}
        >
          <SelectTrigger id="billing_frequency" className="w-full">
            <SelectValue placeholder="Select billing frequency" />
          </SelectTrigger>
          <SelectContent>
            {billingFrequencyOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {billingDetails.billing_method_id && (
        <div>
          <Label htmlFor="rate">Rate</Label>
          <Input
            id="rate"
            type="number"
            value={billingDetails.rate_value}
            onChange={(e) => setBillingDetails({
              ...billingDetails,
              rate_value: Number(e.target.value)
            })}
            placeholder="Enter rate value"
          />
        </div>
      )}

      <div>
        <Label htmlFor="terms">Payment Terms</Label>
        <Input
          id="terms"
          value={billingDetails.terms_details.standard}
          onChange={(e) => setBillingDetails({
            ...billingDetails,
            terms_details: { ...billingDetails.terms_details, standard: e.target.value }
          })}
          placeholder="e.g., Net 30"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="use_custom_terms"
          checked={!!billingDetails.terms_details.custom}
          onCheckedChange={(checked) => setBillingDetails({
            ...billingDetails,
            terms_details: { 
              ...billingDetails.terms_details, 
              custom: checked ? '' : undefined 
            }
          })}
        />
        <Label htmlFor="use_custom_terms">Use Custom Terms</Label>
      </div>

      {billingDetails.terms_details.custom !== undefined && (
        <div>
          <Label htmlFor="custom_terms">Custom Terms</Label>
          <Textarea
            id="custom_terms"
            value={billingDetails.terms_details.custom || ''}
            onChange={(e) => setBillingDetails({
              ...billingDetails,
              terms_details: { ...billingDetails.terms_details, custom: e.target.value }
            })}
            placeholder="Enter custom payment terms"
          />
        </div>
      )}

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

      <div>
        <Label htmlFor="notes">Billing Notes</Label>
        <Textarea
          id="notes"
          value={billingDetails.notes || ''}
          onChange={(e) => setBillingDetails({
            ...billingDetails,
            notes: e.target.value
          })}
          placeholder="Any additional notes about billing (optional)"
        />
      </div>
    </div>
  );

  const renderReviewSubmit = () => (
    <div className="grid gap-6">
      <div className="border rounded-md p-4">
        <h3 className="text-lg font-medium mb-2">Client Information</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Name:</div>
          <div>{clientDetails.title} {clientDetails.first_name} {clientDetails.last_name}</div>
          
          <div className="font-medium">Email:</div>
          <div>{clientDetails.email}</div>
          
          <div className="font-medium">Phone:</div>
          <div>{clientDetails.phone}</div>
          
          <div className="font-medium">Client Type:</div>
          <div>{clientDetails.client_type}</div>
          
          <div className="font-medium">Preferred Language:</div>
          <div>{clientDetails.preferred_language}</div>
          
          {clientDetails.address && (
            <>
              <div className="font-medium">Address:</div>
              <div>{clientDetails.address}</div>
            </>
          )}
        </div>
      </div>
      
      <div className="border rounded-md p-4">
        <h3 className="text-lg font-medium mb-2">Matter Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Type:</div>
          <div>{matterDetails.matter_type}</div>
          
          <div className="font-medium">Sub-Type:</div>
          <div>{matterDetails.sub_type}</div>
          
          <div className="font-medium">Jurisdiction:</div>
          <div>{matterDetails.jurisdiction}</div>
          
          {matterDetails.estimated_value && (
            <>
              <div className="font-medium">Estimated Value:</div>
              <div>{matterDetails.estimated_value}</div>
            </>
          )}
          
          <div className="font-medium col-span-2">Description:</div>
          <div className="col-span-2 whitespace-pre-wrap">{matterDetails.description}</div>
        </div>
      </div>
      
      <div className="border rounded-md p-4">
        <h3 className="text-lg font-medium mb-2">Billing Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Billing Method:</div>
          <div>{billingMethodOptions.find(opt => opt.id === billingDetails.billing_method_id)?.label}</div>
          
          <div className="font-medium">Payment Pattern:</div>
          <div>{paymentPatternOptions.find(opt => opt.id === billingDetails.payment_pattern_id)?.label}</div>
          
          <div className="font-medium">Currency:</div>
          <div>{currencyOptions.find(opt => opt.id === billingDetails.currency_id)?.label}</div>
          
          {billingDetails.billing_frequency_id && (
            <>
              <div className="font-medium">Billing Frequency:</div>
              <div>{billingFrequencyOptions.find(opt => opt.id === billingDetails.billing_frequency_id)?.label}</div>
            </>
          )}
          
          {billingDetails.rate_value > 0 && (
            <>
              <div className="font-medium">Rate Value:</div>
              <div>{billingDetails.rate_value}</div>
            </>
          )}
          
          <div className="font-medium col-span-2">Features:</div>
          <div className="col-span-2">
            <ul className="list-disc list-inside">
              {billingDetails.features.automated_time_capture && <li>Automated Time Capture</li>}
              {billingDetails.features.blockchain_invoicing && <li>Blockchain-Secured Invoicing</li>}
              {billingDetails.features.send_invoice_on_approval && <li>Send Invoice on Approval</li>}
            </ul>
          </div>
        </div>
      </div>
      
      {sendEForm && (
        <div className="border rounded-md p-4 bg-blue-50">
          <p className="text-sm">
            <strong>Note:</strong> An intake form will be sent to the client's email ({clientDetails.email}) for them to review and approve.
          </p>
        </div>
      )}
    </div>
  );
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderClientInformation();
      case 2: return renderMatterDetails();
      case 3: return renderBillingInformation();
      case 4: return renderReviewSubmit();
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-[250px_1fr]">
      {/* Left sidebar */}
      <div className="bg-blue-600 text-white p-6 min-h-[500px]">
        <h2 className="text-2xl font-bold mb-4">LawMate</h2>
        <h3 className="text-xl mb-8">New Matter Intake</h3>
        
        <div className="mb-8">
          <div className="uppercase text-xs mb-2 font-medium tracking-wider text-blue-200">PROGRESS</div>
          <div className="w-full bg-blue-700 h-2 rounded-full mb-2">
            <div 
              className="bg-white h-2 rounded-full transition-all" 
              style={{ width: `${currentStep * 25}%` }}
            ></div>
          </div>
          <div className="text-sm font-medium">Step {currentStep} of 4</div>
        </div>
      </div>
      
      {/* Right content */}
      <div className="p-6">
        <Card className="border-0 shadow-none">
          <CardContent className="p-6">
            <div className="mb-6">
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
            
            {renderStepContent()}
            
            <div className="mt-8 flex justify-between">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                >
                  Back
                </Button>
              ) : (
                <div></div> // Empty div for spacing
              )}
              
              {currentStep < 4 ? (
                <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? 'Creating...' : 'Submit'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
