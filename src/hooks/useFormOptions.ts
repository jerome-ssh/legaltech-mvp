import { useState, useEffect } from 'react';

interface Option {
  id: string;
  value: string;
  label: string;
  icon?: string;
  subTypes?: SubTypeOption[];
}

interface SubTypeOption extends Option {
  parent_id: string;
}

interface FormOptions {
  titleOptions: Option[];
  clientTypeOptions: Option[];
  languageOptions: Option[];
  matterTypeOptions: Option[];
  matterSubTypeOptions: SubTypeOption[];
  billingMethodOptions: Option[];
  paymentPatternOptions: Option[];
  currencyOptions: Option[];
  billingFrequencyOptions: Option[];
  paymentMediumOptions: Option[];
  isLoading: boolean;
  error: Error | null;
}

interface UseFormOptionsProps {
  shouldFetch?: boolean;
}

export function useFormOptions({ shouldFetch = true }: UseFormOptionsProps = {}): FormOptions {
  const [options, setOptions] = useState<FormOptions>({
    titleOptions: [],
    clientTypeOptions: [],
    languageOptions: [],
    matterTypeOptions: [],
    matterSubTypeOptions: [],
    billingMethodOptions: [],
    paymentPatternOptions: [],
    currencyOptions: [],
    billingFrequencyOptions: [],
    paymentMediumOptions: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!shouldFetch) return;

    const fetchOrCache = async (key: string, url: string) => {
      try {
        const cached = sessionStorage.getItem(key);
        if (cached) return JSON.parse(cached);
        
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${key}`);
        
        const data = await res.json();
        sessionStorage.setItem(key, JSON.stringify(data.options));
        return data.options;
      } catch (error) {
        console.error(`Error fetching ${key}:`, error);
        throw error;
      }
    };

    const fetchAllOptions = async () => {
      try {
        const [
          titles,
          clientTypes,
          languages,
          matterTypes,
          subTypes,
          billingMethods,
          paymentPatterns,
          currencies,
          billingFrequencies,
          paymentMediums
        ] = await Promise.all([
          fetchOrCache('dropdown_titles', '/api/dropdowns/titles'),
          fetchOrCache('dropdown_client_types', '/api/dropdowns/client-types'),
          fetchOrCache('dropdown_languages', '/api/dropdowns/languages'),
          fetchOrCache('dropdown_matter_types', '/api/dropdowns/matter-types'),
          fetchOrCache('dropdown_matter_sub_types', '/api/dropdowns/matter-sub-types'),
          fetchOrCache('dropdown_billing_methods', '/api/dropdowns/billing-methods'),
          fetchOrCache('dropdown_payment_patterns', '/api/dropdowns/payment-patterns'),
          fetchOrCache('dropdown_currencies', '/api/dropdowns/currencies'),
          fetchOrCache('dropdown_billing_frequencies', '/api/dropdowns/billing-frequencies'),
          fetchOrCache('dropdown_payment_mediums', '/api/dropdowns/payment-mediums'),
        ]);

        setOptions({
          titleOptions: titles,
          clientTypeOptions: clientTypes,
          languageOptions: languages,
          matterTypeOptions: matterTypes,
          matterSubTypeOptions: subTypes,
          billingMethodOptions: billingMethods,
          paymentPatternOptions: paymentPatterns,
          currencyOptions: currencies,
          billingFrequencyOptions: billingFrequencies,
          paymentMediumOptions: paymentMediums,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setOptions(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    };

    fetchAllOptions();
  }, [shouldFetch]);

  return options;
} 