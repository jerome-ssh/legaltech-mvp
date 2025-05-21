-- Add connection_name column to connections table
ALTER TABLE public.connections
ADD COLUMN IF NOT EXISTS connection_name TEXT;

-- Add status column to connections table
ALTER TABLE public.connections
ADD COLUMN IF NOT EXISTS status TEXT;

-- Insert test user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::UUID, 'test@example.com', crypt('password', gen_salt('bf')), NOW(), NOW(), NOW());

-- Insert test profile
INSERT INTO public.profiles (id, user_id, full_name, email)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'Test User', 'test@example.com');

-- Insert test connections
INSERT INTO public.connections (profile_id, connection_name, connection_type, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::UUID, 'John Smith', 'client', 'active'),
    ('00000000-0000-0000-0000-000000000001'::UUID, 'Sarah Johnson', 'colleague', 'active'),
    ('00000000-0000-0000-0000-000000000001'::UUID, 'Michael Brown', 'mentor', 'active');

-- Add document_type column to documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS document_type TEXT;

-- Add file_url column to documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Insert test documents
INSERT INTO public.documents (profile_id, title, document_type, compliance_status, file_url, file_path, file_type, file_size, uploaded_by)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::UUID, 'Contract A', 'contract', 'active', 'https://example.com/contract-a.pdf', '/path/to/contract-a.pdf', 'pdf', 1024, '00000000-0000-0000-0000-000000000001'::UUID),
    ('00000000-0000-0000-0000-000000000001'::UUID, 'Contract B', 'contract', 'active', 'https://example.com/contract-b.pdf', '/path/to/contract-b.pdf', 'pdf', 2048, '00000000-0000-0000-0000-000000000001'::UUID),
    ('00000000-0000-0000-0000-000000000001'::UUID, 'Contract C', 'contract', 'archived', 'https://example.com/contract-c.pdf', '/path/to/contract-c.pdf', 'pdf', 3072, '00000000-0000-0000-0000-000000000001'::UUID);

-- Insert test invoices
INSERT INTO public.invoices (profile_id, invoice_number, amount, status, due_date)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::UUID, 'INV-001', 1500.00, 'paid', NOW() + INTERVAL '30 days'),
    ('00000000-0000-0000-0000-000000000001'::UUID, 'INV-002', 2500.00, 'paid', NOW() + INTERVAL '30 days'),
    ('00000000-0000-0000-0000-000000000001'::UUID, 'INV-003', 1000.00, 'pending', NOW() + INTERVAL '30 days');

-- Insert test AI interactions
INSERT INTO public.ai_interactions (profile_id, interaction_type, input_text, output_text, tokens_used)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::UUID, 'document_review', 'Review this contract', 'Contract reviewed successfully', 150),
    ('00000000-0000-0000-0000-000000000001'::UUID, 'legal_research', 'Research case law', 'Research completed', 200),
    ('00000000-0000-0000-0000-000000000001'::UUID, 'document_generation', 'Generate NDA', 'NDA generated', 100); 