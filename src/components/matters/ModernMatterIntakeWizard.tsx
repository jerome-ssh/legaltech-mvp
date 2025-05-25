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
  billing_method: string;
  hourly_rate?: number;
  flat_fee_amount?: number;
  contingency_percentage?: number;
  retainer_amount?: number;
  currency: string;
  automated_time_capture: boolean;
  blockchain_invoicing: boolean;
  send_invoice_on_approval: boolean;
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
        billing_method: '',
        currency: '',
        automated_time_capture: true,
        blockchain_invoicing: false,
        send_invoice_on_approval: false
      };
    }
    return {
      billing_method: '',
      currency: '',
    automated_time_capture: true,
    blockchain_invoicing: false,
    send_invoice_on_approval: false
    };
  });

  const [titleOptions, setTitleOptions] = useState<Option[]>([]);
  const [clientTypeOptions, setClientTypeOptions] = useState<Option[]>([]);
  const [languageOptions, setLanguageOptions] = useState<Option[]>([]);
  const [matterTypeOptions, setMatterTypeOptions] = useState<Option[]>([]);
  const [matterSubTypeOptions, setMatterSubTypeOptions] = useState<SubTypeOption[]>([]);
  const [billingMethodOptions, setBillingMethodOptions] = useState<Option[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<Option[]>([]);
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
      fetchOrCache('dropdown_currencies', '/api/dropdowns/currencies'),
    ]).then(([titles, clientTypes, languages, matterTypes, subTypes, billingMethods, currencies]) => {
      setTitleOptions(titles);
      setClientTypeOptions(clientTypes);
      setLanguageOptions(languages);
      setMatterTypeOptions(matterTypes);
      setMatterSubTypeOptions(subTypes);
      setBillingMethodOptions(billingMethods);
      setCurrencyOptions(currencies);
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
          value={billingDetails.billing_method}
          onValueChange={(value: string) => setBillingDetails({ ...billingDetails, billing_method: value })}
        >
          <SelectTrigger id="billing_method" className="w-full">
            <SelectValue placeholder="Select billing method" />
          </SelectTrigger>
          <SelectContent>
            {billingMethodOptions.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {billingDetails.billing_method === 'Hourly' && (
        <div>
          <Label htmlFor="hourly_rate">Hourly Rate</Label>
          <Input
            id="hourly_rate"
            type="number"
            value={billingDetails.hourly_rate}
            onChange={(e) => setBillingDetails({ ...billingDetails, hourly_rate: Number(e.target.value) })}
            placeholder="e.g., 200"
          />
        </div>
      )}
      {billingDetails.billing_method === 'Flat Fee' && (
        <div>
          <Label htmlFor="flat_fee_amount">Flat Fee Amount</Label>
          <Input
            id="flat_fee_amount"
            type="number"
            value={billingDetails.flat_fee_amount}
            onChange={(e) => setBillingDetails({ ...billingDetails, flat_fee_amount: Number(e.target.value) })}
            placeholder="e.g., 5000"
          />
        </div>
      )}
      {billingDetails.billing_method === 'Contingency' && (
        <div>
          <Label htmlFor="contingency_percentage">Contingency Percentage</Label>
          <Input
            id="contingency_percentage"
            type="number"
            value={billingDetails.contingency_percentage}
            onChange={(e) => setBillingDetails({ ...billingDetails, contingency_percentage: Number(e.target.value) })}
            placeholder="e.g., 30"
          />
        </div>
      )}
      {billingDetails.billing_method === 'Retainer' && (
        <div>
          <Label htmlFor="retainer_amount">Retainer Amount</Label>
          <Input
            id="retainer_amount"
            type="number"
            value={billingDetails.retainer_amount}
            onChange={(e) => setBillingDetails({ ...billingDetails, retainer_amount: Number(e.target.value) })}
            placeholder="e.g., 2000"
          />
        </div>
      )}
      <div>
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={billingDetails.currency}
          onValueChange={(value) => setBillingDetails({ ...billingDetails, currency: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencyOptions.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4">
        <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
          <Switch
            id="automated_time_capture"
            checked={billingDetails.automated_time_capture}
            onCheckedChange={(checked) => setBillingDetails({ ...billingDetails, automated_time_capture: checked })}
          />
          <Label htmlFor="automated_time_capture" className="cursor-pointer">Enable Automated Time Capture</Label>
        </div>
        <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
          <Switch
            id="blockchain_invoicing"
            checked={billingDetails.blockchain_invoicing}
            onCheckedChange={(checked) => setBillingDetails({ ...billingDetails, blockchain_invoicing: checked })}
          />
          <Label htmlFor="blockchain_invoicing" className="cursor-pointer">Enable Blockchain-Secured Invoicing</Label>
        </div>
        <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
          <Switch
            id="send_invoice_on_approval"
            checked={billingDetails.send_invoice_on_approval}
            onCheckedChange={(checked) => setBillingDetails({ ...billingDetails, send_invoice_on_approval: checked })}
          />
          <Label htmlFor="send_invoice_on_approval" className="cursor-pointer">Send Invoice on Client Approval</Label>
        </div>
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
          <div className="font-medium">Method:</div>
          <div>{billingDetails.billing_method}</div>
          
          {billingDetails.billing_method === 'Hourly' && billingDetails.hourly_rate && (
            <>
              <div className="font-medium">Hourly Rate:</div>
              <div>{billingDetails.hourly_rate} {billingDetails.currency}</div>
            </>
          )}
          
          {billingDetails.billing_method === 'Flat Fee' && billingDetails.flat_fee_amount && (
            <>
              <div className="font-medium">Flat Fee Amount:</div>
              <div>{billingDetails.flat_fee_amount} {billingDetails.currency}</div>
            </>
          )}
          
          {billingDetails.billing_method === 'Contingency' && billingDetails.contingency_percentage && (
            <>
              <div className="font-medium">Contingency Percentage:</div>
              <div>{billingDetails.contingency_percentage}%</div>
            </>
          )}
          
          {billingDetails.billing_method === 'Retainer' && billingDetails.retainer_amount && (
            <>
              <div className="font-medium">Retainer Amount:</div>
              <div>{billingDetails.retainer_amount} {billingDetails.currency}</div>
            </>
          )}
          
          <div className="font-medium">Currency:</div>
          <div>{billingDetails.currency}</div>
          
          <div className="font-medium col-span-2">Features:</div>
          <div className="col-span-2">
            <ul className="list-disc list-inside">
              {billingDetails.automated_time_capture && <li>Automated Time Capture</li>}
              {billingDetails.blockchain_invoicing && <li>Blockchain-Secured Invoicing</li>}
              {billingDetails.send_invoice_on_approval && <li>Send Invoice on Approval</li>}
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
