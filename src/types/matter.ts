export interface MatterBilling {
  id: string;
  matter_id: string;
  billing_method: string;
  payment_pattern?: {
    id: string;
    value: string;
    label: string;
  } | null;
  currency?: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  } | null;
  currency_id?: string | null;
  payment_medium: string;
  rate_value: number;
  terms_details: {
    standard: string;
    custom?: string;
  };
  billing_frequency: string | null;
  features: {
    automated_time_capture: boolean;
    blockchain_invoicing: boolean;
    send_invoice_on_approval: boolean;
  };
  retainer_amount: number | null;
  retainer_balance: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
} 