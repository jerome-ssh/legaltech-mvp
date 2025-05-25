-- Create payment_mediums table
CREATE TABLE public.payment_mediums (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    value text NOT NULL UNIQUE,
    label text NOT NULL,
    icon text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Seed payment mediums
INSERT INTO public.payment_mediums (value, label, icon) VALUES
  ('credit_card', 'Credit/Debit Card', 'credit-card'),
  ('bank_transfer', 'Bank Transfer/Wire Transfer', 'bank'),
  ('ach', 'ACH (Automated Clearing House)', 'banknote'),
  ('digital_wallet', 'Digital Wallet (e.g., PayPal, Apple Pay, Google Pay)', 'wallet'),
  ('mobile_money', 'Mobile Money (e.g., M-Pesa, Airtel Money)', 'smartphone'),
  ('crypto', 'Cryptocurrency (e.g., Bitcoin, Ethereum)', 'bitcoin'); 