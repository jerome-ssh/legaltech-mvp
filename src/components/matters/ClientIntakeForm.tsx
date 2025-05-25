'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface ClientIntakeFormProps {
  token: string;
}

interface Option {
  id: number;
  value: string;
  label: string;
}

// Form validation schema with proper types
const formSchema = z.object({
  title_id: z.string().min(1, 'Title is required').transform(val => parseInt(val, 10)),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Please enter a valid international phone number'),
  address: z.string().min(1, 'Address is required'),
  preferred_language_id: z.string().min(1, 'Preferred language is required').transform(val => parseInt(val, 10)),
  client_type_id: z.string().min(1, 'Client type is required').transform(val => parseInt(val, 10)),
  additional_notes: z.string().optional()
});

type FormData = {
  title_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  preferred_language_id: string;
  client_type_id: string;
  additional_notes?: string;
};

export function ClientIntakeForm({ token }: ClientIntakeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [titleOptions, setTitleOptions] = useState<Option[]>([]);
  const [clientTypeOptions, setClientTypeOptions] = useState<Option[]>([]);
  const [languageOptions, setLanguageOptions] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    title_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    preferred_language_id: '',
    client_type_id: '',
    additional_notes: ''
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [titlesRes, clientTypesRes, languagesRes] = await Promise.all([
          fetch('/api/dropdowns/titles'),
          fetch('/api/dropdowns/client-types'),
          fetch('/api/dropdowns/languages')
        ]);

        if (!titlesRes.ok || !clientTypesRes.ok || !languagesRes.ok) {
          throw new Error('Failed to fetch options');
        }

        const [titlesData, clientTypesData, languagesData] = await Promise.all([
          titlesRes.json(),
          clientTypesRes.json(),
          languagesRes.json()
        ]);

        setTitleOptions(titlesData.options);
        setClientTypeOptions(clientTypesData.options);
        setLanguageOptions(languagesData.options);
      } catch (error) {
        console.error('Error fetching options:', error);
        setErrors(prev => ({ ...prev, form: 'Failed to load form options. Please refresh the page.' }));
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const validateField = (field: keyof FormData, value: any) => {
    try {
      formSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate form data
      const validationResult = formSchema.safeParse(formData);
      if (!validationResult.success) {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        validationResult.error.errors.forEach(error => {
          const field = error.path[0] as keyof FormData;
          newErrors[field] = error.message;
        });
        setErrors(newErrors);
        toast({
          title: 'Validation Error',
          description: 'Please check the form for errors',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`/api/intake/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationResult.data),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      toast({
        title: 'Success',
        description: data.message || 'Form submitted successfully',
      });

      // Redirect to thank you page
      router.push(`/thank-you?token=${token}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit form',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading Form...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Intake Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Select
                  value={formData.title_id}
                  onValueChange={(value) => handleChange('title_id', value)}
                >
                  <SelectTrigger id="title" className={errors.title_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    {titleOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.title_id && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.title_id}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="John"
                    className={errors.first_name ? 'border-red-500' : ''}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.first_name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder="Smith"
                    className={errors.last_name ? 'border-red-500' : ''}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.last_name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john.smith@email.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone_number">Phone</Label>
                <PhoneInput
                  country={'us'}
                  value={formData.phone_number}
                  onChange={(phone) => handleChange('phone_number', `+${phone}`)}
                  inputClass={errors.phone_number ? 'border-red-500' : ''}
                  containerClass="w-full"
                  inputStyle={{ width: '100%' }}
                  specialLabel=""
                  inputProps={{
                    required: true,
                    name: 'phone_number',
                    id: 'phone_number'
                  }}
                />
                {errors.phone_number && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.phone_number}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="client_type">Client Type</Label>
                <Select
                  value={formData.client_type_id}
                  onValueChange={(value) => handleChange('client_type_id', value)}
                >
                  <SelectTrigger id="client_type" className={errors.client_type_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientTypeOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.client_type_id && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.client_type_id}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="preferred_language">Preferred Language</Label>
                <Select
                  value={formData.preferred_language_id}
                  onValueChange={(value) => handleChange('preferred_language_id', value)}
                >
                  <SelectTrigger id="preferred_language" className={errors.preferred_language_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.preferred_language_id && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.preferred_language_id}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="123 Main St, City, State, ZIP"
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  value={formData.additional_notes}
                  onChange={(e) => handleChange('additional_notes', e.target.value)}
                  placeholder="Please provide any additional notes..."
                  className={errors.additional_notes ? 'border-red-500' : ''}
                />
                {errors.additional_notes && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.additional_notes}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 