-- Insert test connections
INSERT INTO public.connections (profile_id, connection_name, connection_type, status)
VALUES 
    ('user_2x7fM0uWoqY2MKFQqPEeiQdl0ly', 'John Smith', 'client', 'active'),
    ('user_2x7fM0uWoqY2MKFQqPEeiQdl0ly', 'Sarah Johnson', 'colleague', 'active'),
    ('user_2x7fM0uWoqY2MKFQqPEeiQdl0ly', 'Michael Brown', 'mentor', 'active');

-- Insert test documents
INSERT INTO public.documents (profile_id, title, document_type, compliance_status, file_url)
VALUES 
    ('user_2x7fM0uWoqY2MKFQqPEeiQdl0ly', 'Contract A', 'contract', 'compliant', 'https://example.com/contract-a.pdf'),
    ('user_2x7fM0uWoqY2MKFQqPEeiQdl0ly', 'Contract B', 'contract', 'compliant', 'https://example.com/contract-b.pdf'),
    ('user_2x7fM0uWoqY2MKFQqPEeiQdl0ly', 'Contract C', 'contract', 'pending', 'https://example.com/contract-c.pdf');

-- Insert test invoices
INSERT INTO public.invoices (profile_id, invoice_number, amount, status, due_date)
VALUES 
    ('user_2x7fM0uWoqY2MKFQqPEeiQdl0ly', 'INV-001', 1500.00, 'paid', NOW() + INTERVAL '30 days'),
    ('user_2x7fM0uWoqY2MKFQqPEeiQdl0ly', 'INV-002', 2500.00, 'paid', NOW() + INTERVAL '30 days'),
    ('user_2x7fM0uWoqY2MKFQqPEeiQdl0ly', 'INV-003', 1000.00, 'pending', NOW() + INTERVAL '30 days');

-- Insert test AI interactions
INSERT INTO public.ai_interactions (profile_id, interaction_type, input_text, output_text, tokens_used)
VALUES 
    ('user_2x7fM0uWoqY2MKFQqPEeiQdl0ly', 'document_review', 'Review this contract', 'Contract reviewed successfully', 150),
    ('user_2x7fM0uWoqY2MKFQqPEeiQdl0ly', 'legal_research', 'Research case law', 'Research completed', 200),
    ('user_2x7fM0uWoqY2MKFQqPEeiQdl0ly', 'document_generation', 'Generate NDA', 'NDA generated', 100); 