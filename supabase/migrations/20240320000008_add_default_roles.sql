-- Insert default roles if they don't exist
INSERT INTO roles (name, description) VALUES
    ('attorney', 'Licensed attorney with full access to legal services'),
    ('paralegal', 'Legal professional supporting attorneys'),
    ('client', 'Client with access to their own cases and documents'),
    ('admin', 'System administrator with full access')
ON CONFLICT (name) DO NOTHING; 