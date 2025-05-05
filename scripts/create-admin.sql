-- First, check and create necessary constraints
DO $$ 
BEGIN
    -- Check if auth.users table exists and has email constraint
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_constraint 
            WHERE conname = 'users_email_key'
        ) THEN
            ALTER TABLE auth.users ADD CONSTRAINT users_email_key UNIQUE (email);
        END IF;
    END IF;

    -- Check if public.profiles table exists and has primary key
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_constraint 
            WHERE conname = 'profiles_pkey'
        ) THEN
            ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
        END IF;
    END IF;
END $$;

-- Create admin user in auth.users
INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    role,
    raw_user_meta_data
) VALUES (
    'admin@legaltech.com',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    'authenticated',
    '{"role": "admin"}'::jsonb
);

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
    years_of_practice
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
    10
); 