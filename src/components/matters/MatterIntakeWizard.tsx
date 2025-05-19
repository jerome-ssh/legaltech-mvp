'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface MatterIntakeWizardProps {
  onComplete: () => void;
}

interface ClientDetails {
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  preferred_language: string;
  client_type: 'Individual' | 'Business' | 'Government';
}

interface MatterDetails {
  matter_type: string;
  sub_type: string;
  description: string;
  jurisdiction: string;
  estimated_value?: number;
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

export function MatterIntakeWizard({ onComplete }: MatterIntakeWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(25);
  const [loading, setLoading] = useState(false);
  const [sendEForm, setSendEForm] = useState(false);

  // Form state
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    full_name: '',
    email: '',
    phone: '',
    preferred_language: 'English',
    client_type: 'Individual'
  });

  const [matterDetails, setMatterDetails] = useState<MatterDetails>({
    matter_type: '',
    sub_type: '',
    description: '',
    jurisdiction: ''
  });

  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    billing_method: 'Hourly',
    currency: 'USD',
    automated_time_capture: true,
    blockchain_invoicing: false,
    send_invoice_on_approval: false
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setProgress(progress + 25);
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
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={clientDetails.full_name}
                  onChange={(e) => setClientDetails({ ...clientDetails, full_name: e.target.value })}
                  placeholder="John A. Smith"
                />
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={clientDetails.phone}
                  onChange={(e) => setClientDetails({ ...clientDetails, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="address">Address (Optional)</Label>
                <Textarea
                  id="address"
                  value={clientDetails.address}
                  onChange={(e) => setClientDetails({ ...clientDetails, address: e.target.value })}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>
              <div>
                <Label htmlFor="preferred_language">Preferred Language</Label>
                <Select
                  value={clientDetails.preferred_language}
                  onValueChange={(value) => setClientDetails({ ...clientDetails, preferred_language: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                    <SelectItem value="Korean">Korean</SelectItem>
                    <SelectItem value="Russian">Russian</SelectItem>
                    <SelectItem value="Arabic">Arabic</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="client_type">Client Type</Label>
                <Select
                  value={clientDetails.client_type}
                  onValueChange={(value: 'Individual' | 'Business' | 'Government') => 
                    setClientDetails({ ...clientDetails, client_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="send_eform"
                checked={sendEForm}
                onCheckedChange={setSendEForm}
              />
              <Label htmlFor="send_eform">Send intake form to client's email</Label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
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
                  <SelectItem value="Litigation">Litigation</SelectItem>
                  <SelectItem value="Transactional">Transactional</SelectItem>
                  <SelectItem value="Advisory">Advisory</SelectItem>
                  <SelectItem value="ADR">ADR</SelectItem>
                  <SelectItem value="Pro Bono">Pro Bono</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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
                  {matterDetails.matter_type === 'Litigation' && (
                    <>
                      <SelectItem value="Civil">Civil</SelectItem>
                      <SelectItem value="Criminal">Criminal</SelectItem>
                      <SelectItem value="Family">Family</SelectItem>
                      <SelectItem value="Personal Injury">Personal Injury</SelectItem>
                      <SelectItem value="Employment">Employment</SelectItem>
                    </>
                  )}
                  {matterDetails.matter_type === 'Transactional' && (
                    <>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Estate Planning">Estate Planning</SelectItem>
                      <SelectItem value="Intellectual Property">Intellectual Property</SelectItem>
                      <SelectItem value="Contract Drafting">Contract Drafting</SelectItem>
                    </>
                  )}
                  {matterDetails.matter_type === 'Advisory' && (
                    <>
                      <SelectItem value="Tax">Tax</SelectItem>
                      <SelectItem value="Regulatory">Regulatory</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                    </>
                  )}
                  {matterDetails.matter_type === 'ADR' && (
                    <>
                      <SelectItem value="Mediation">Mediation</SelectItem>
                      <SelectItem value="Arbitration">Arbitration</SelectItem>
                    </>
                  )}
                  {matterDetails.matter_type === 'Pro Bono' && (
                    <>
                      <SelectItem value="Immigration">Immigration</SelectItem>
                      <SelectItem value="Civil Rights">Civil Rights</SelectItem>
                      <SelectItem value="Environmental">Environmental</SelectItem>
                    </>
                  )}
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

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="billing_method">Billing Method</Label>
              <Select
                value={billingDetails.billing_method}
                onValueChange={(value: 'Hourly' | 'Flat Fee' | 'Contingency' | 'Retainer') => 
                  setBillingDetails({ ...billingDetails, billing_method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select billing method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hourly">Hourly</SelectItem>
                  <SelectItem value="Flat Fee">Flat Fee</SelectItem>
                  <SelectItem value="Contingency">Contingency</SelectItem>
                  <SelectItem value="Retainer">Retainer</SelectItem>
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
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="CNY">CNY (¥)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                  <SelectItem value="CHF">CHF (Fr)</SelectItem>
                  <SelectItem value="SGD">SGD ($)</SelectItem>
                </SelectContent>
              </Select>
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
            <Card>
              <CardHeader>
                <CardTitle>Client Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{clientDetails.full_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{clientDetails.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900">{clientDetails.phone}</dd>
                  </div>
                  {clientDetails.address && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="text-sm text-gray-900">{clientDetails.address}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Preferred Language</dt>
                    <dd className="text-sm text-gray-900">{clientDetails.preferred_language}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Client Type</dt>
                    <dd className="text-sm text-gray-900">{clientDetails.client_type}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Matter Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="text-sm text-gray-900">{matterDetails.matter_type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Sub-Type</dt>
                    <dd className="text-sm text-gray-900">{matterDetails.sub_type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap">{matterDetails.description}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Jurisdiction</dt>
                    <dd className="text-sm text-gray-900">{matterDetails.jurisdiction}</dd>
                  </div>
                  {matterDetails.estimated_value && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Estimated Value</dt>
                      <dd className="text-sm text-gray-900">{matterDetails.estimated_value}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Method</dt>
                    <dd className="text-sm text-gray-900">{billingDetails.billing_method}</dd>
                  </div>
                  {billingDetails.billing_method === 'Hourly' && billingDetails.hourly_rate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
                      <dd className="text-sm text-gray-900">
                        {billingDetails.hourly_rate} {billingDetails.currency}
                      </dd>
                    </div>
                  )}
                  {billingDetails.billing_method === 'Flat Fee' && billingDetails.flat_fee_amount && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Flat Fee Amount</dt>
                      <dd className="text-sm text-gray-900">
                        {billingDetails.flat_fee_amount} {billingDetails.currency}
                      </dd>
                    </div>
                  )}
                  {billingDetails.billing_method === 'Contingency' && billingDetails.contingency_percentage && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Contingency Percentage</dt>
                      <dd className="text-sm text-gray-900">{billingDetails.contingency_percentage}%</dd>
                    </div>
                  )}
                  {billingDetails.billing_method === 'Retainer' && billingDetails.retainer_amount && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Retainer Amount</dt>
                      <dd className="text-sm text-gray-900">
                        {billingDetails.retainer_amount} {billingDetails.currency}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Features</dt>
                    <dd className="text-sm text-gray-900">
                      <ul className="list-disc list-inside">
                        {billingDetails.automated_time_capture && <li>Automated Time Capture</li>}
                        {billingDetails.blockchain_invoicing && <li>Blockchain-Secured Invoicing</li>}
                        {billingDetails.send_invoice_on_approval && <li>Send Invoice on Approval</li>}
                      </ul>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="mt-2 text-sm text-gray-500">
          Step {currentStep} of 4
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && 'Client Information'}
            {currentStep === 2 && 'Matter Details'}
            {currentStep === 3 && 'Billing Setup'}
            {currentStep === 4 && 'Review & Submit'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {currentStep < 4 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create Matter'}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 