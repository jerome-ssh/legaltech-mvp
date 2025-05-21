-- Drop existing test data
DELETE FROM public.case_documents WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
DELETE FROM public.cases WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
DELETE FROM public.documents WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
DELETE FROM public.professional_ids WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
DELETE FROM public.profiles WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
DELETE FROM auth.users WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Create test users in auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'test.lawyer@example.com', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Test Lawyer"}', false, '', '', '', ''),
    ('00000000-0000-0000-0000-000000000002', 'test.client@example.com', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Test Client"}', false, '', '', '', '');

-- Create test profiles
INSERT INTO public.profiles (id, user_id, clerk_id, full_name, email, role, status, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Test Lawyer', 'test.lawyer@example.com', 'lawyer', 'active', now(), now()),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Test Client', 'test.client@example.com', 'client', 'active', now(), now());

-- Create test professional IDs
INSERT INTO public.professional_ids (id, profile_id, country, state, professional_id, year_issued, status, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'US', 'CA', 'BAR123456', 2020, 'active', now(), now()),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'US', 'NY', 'BAR789012', 2021, 'active', now(), now());

-- Create test documents
INSERT INTO public.documents (id, profile_id, title, document_type, compliance_status, file_url, file_path, file_type, file_size, uploaded_by, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Bar Certificate CA', 'certification', 'active', 'https://example.com/cert-ca.pdf', '/path/to/cert-ca.pdf', 'pdf', 1024, '00000000-0000-0000-0000-000000000001', now(), now()),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Bar Certificate NY', 'certification', 'active', 'https://example.com/cert-ny.pdf', '/path/to/cert-ny.pdf', 'pdf', 1024, '00000000-0000-0000-0000-000000000001', now(), now());

-- Create test cases
INSERT INTO public.cases (id, profile_id, title, case_type, status, priority, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Test Case 1', 'litigation', 'active', 'high', now(), now()),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Test Case 2', 'contract', 'active', 'medium', now(), now());

-- Create test case documents
INSERT INTO public.case_documents (id, case_id, document_id, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', now(), now()),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', now(), now()); 