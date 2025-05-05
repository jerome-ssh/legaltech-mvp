-- Create admin profile in public.profiles
INSERT INTO public.profiles (
  id,
  full_name,
  email,
  role,
  specialization,
  firm_name,
  phone_number,
  address,
  bar_number,
  years_of_practice,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@legaltech.com'),
  'System Administrator',
  'admin@legaltech.com',
  'admin',
  'Administrative Law',
  'LegalTech Platform',
  '+1234567890',
  '123 Admin Street, Suite 100',
  'ADMIN-001',
  10,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING; 