-- Insert test roles
INSERT INTO roles (id, name, role_level, description)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Partner', 'management', 'Senior partner role'),
    ('22222222-2222-2222-2222-222222222222', 'Associate', 'professional', 'Associate attorney role'),
    ('33333333-3333-3333-3333-333333333333', 'Paralegal', 'support', 'Paralegal role'),
    ('44444444-4444-4444-4444-444444444444', 'Legal Assistant', 'support', 'Legal assistant role')
ON CONFLICT (name) DO UPDATE SET
    role_level = EXCLUDED.role_level,
    description = EXCLUDED.description;

-- First, get the role IDs
DO $$
DECLARE
    partner_id UUID;
    associate_id UUID;
    paralegal_id UUID;
    legal_assistant_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO partner_id FROM roles WHERE name = 'Partner';
    SELECT id INTO associate_id FROM roles WHERE name = 'Associate';
    SELECT id INTO paralegal_id FROM roles WHERE name = 'Paralegal';
    SELECT id INTO legal_assistant_id FROM roles WHERE name = 'Legal Assistant';

    -- Create users first
    INSERT INTO users (
        id,
        email,
        first_name,
        last_name,
        role,
        phone_number,
        password_hash,
        created_at,
        updated_at
    ) VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'john.smith@example.com', 'John', 'Smith', 'admin', '+1234567890', crypt('password123', gen_salt('bf')), NOW(), NOW()),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'sarah.johnson@example.com', 'Sarah', 'Johnson', 'admin', '+1234567891', crypt('password123', gen_salt('bf')), NOW(), NOW()),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'michael.brown@example.com', 'Michael', 'Brown', 'client', '+1234567892', crypt('password123', gen_salt('bf')), NOW(), NOW()),
        ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'emily.davis@example.com', 'Emily', 'Davis', 'client', '+1234567893', crypt('password123', gen_salt('bf')), NOW(), NOW()),
        ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'david.wilson@example.com', 'David', 'Wilson', 'paralegal', '+1234567894', crypt('password123', gen_salt('bf')), NOW(), NOW()),
        ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'lisa.anderson@example.com', 'Lisa', 'Anderson', 'paralegal', '+1234567895', crypt('password123', gen_salt('bf')), NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Insert test profiles
    INSERT INTO profiles (id, user_id, first_name, last_name, email, role_id)
    VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'John', 'Smith', 'john.smith@example.com', partner_id),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sarah', 'Johnson', 'sarah.johnson@example.com', partner_id),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Michael', 'Brown', 'michael.brown@example.com', associate_id),
        ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Emily', 'Davis', 'emily.davis@example.com', associate_id),
        ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'David', 'Wilson', 'david.wilson@example.com', paralegal_id),
        ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Lisa', 'Anderson', 'lisa.anderson@example.com', legal_assistant_id)
    ON CONFLICT (id) DO NOTHING;

    -- Insert test clients
    INSERT INTO clients (
        id,
        name,
        email,
        phone,
        address,
        notes,
        created_at,
        updated_at
    ) VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tech Corp', 'contact@techcorp.com', '+1234567890', '123 Tech Street, New York, NY', 'Technology company specializing in software development', NOW(), NOW()),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Innovate Inc', 'info@innovateinc.com', '+1234567891', '456 Innovation Ave, San Francisco, CA', 'Innovation and research company', NOW(), NOW()),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Legal Solutions LLC', 'contact@legalsolutions.com', '+1234567892', '789 Legal Blvd, Austin, TX', 'Legal services provider', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Insert test cases
    INSERT INTO cases (
        id,
        title,
        description,
        status,
        client_id,
        profile_id,
        matter_type,
        sub_type,
        jurisdiction,
        created_at,
        updated_at
    ) VALUES 
        ('11111111-1111-1111-1111-111111111111', 'Corporate Merger Case', 'Merger between Tech Corp and Innovate Inc', 'open', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Transactional', 'Corporate', 'New York', NOW(), NOW()),
        ('22222222-2222-2222-2222-222222222222', 'Intellectual Property Dispute', 'Patent infringement case', 'open', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Transactional', 'Intellectual Property', 'California', NOW(), NOW()),
        ('33333333-3333-3333-3333-333333333333', 'Employment Law Case', 'Wrongful termination lawsuit', 'open', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Litigation', 'Employment', 'Texas', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Insert test matter team members
    INSERT INTO matter_team (
        matter_id,
        profile_id,
        role_id,
        is_lead,
        is_billing_attorney,
        is_responsible_attorney,
        start_date,
        end_date,
        status,
        notes
    )
    VALUES 
        -- Case 1: Corporate Merger
        ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', partner_id, true, true, true, '2024-01-01', NULL, 'active', 'Lead attorney'),
        ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', associate_id, false, false, true, '2024-01-01', NULL, 'active', 'Associate attorney'),
        ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', paralegal_id, false, false, false, '2024-01-01', NULL, 'active', 'Paralegal'),
        ('11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', legal_assistant_id, false, false, false, '2024-01-01', NULL, 'active', 'Legal assistant'),
        
        -- Case 2: IP Dispute
        ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', partner_id, true, true, true, '2024-02-01', NULL, 'active', 'Lead attorney'),
        ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', associate_id, false, true, false, '2024-02-01', NULL, 'active', 'Billing attorney'),
        ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', paralegal_id, false, false, false, '2024-02-01', NULL, 'active', 'Paralegal'),
        
        -- Case 3: Employment Law
        ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', associate_id, true, true, true, '2024-03-01', NULL, 'active', 'Lead associate'),
        ('33333333-3333-3333-3333-333333333333', 'ffffffff-ffff-ffff-ffff-ffffffffffff', legal_assistant_id, false, false, false, '2024-03-01', NULL, 'active', 'Legal assistant'),
        
        -- Historical records
        ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', partner_id, false, false, false, '2023-12-01', '2023-12-31', 'inactive', 'Previous team member'),
        ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', partner_id, true, true, true, '2023-12-01', '2024-01-31', 'inactive', 'Previous lead attorney'),
        ('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', associate_id, false, true, false, '2024-02-01', '2024-02-28', 'inactive', 'Previous billing attorney');

    -- Verify the test data
    DECLARE
        active_count INTEGER;
        leads_count INTEGER;
        billing_count INTEGER;
        responsible_count INTEGER;
        history_count INTEGER;
    BEGIN
        -- Count records in each view
        SELECT COUNT(*) INTO active_count FROM active_matter_team;
        SELECT COUNT(*) INTO leads_count FROM matter_team_leads;
        SELECT COUNT(*) INTO billing_count FROM matter_billing_attorneys;
        SELECT COUNT(*) INTO responsible_count FROM matter_responsible_attorneys;
        SELECT COUNT(*) INTO history_count FROM matter_team_history;
        
        -- Display counts
        RAISE NOTICE 'Test data verification:';
        RAISE NOTICE 'active_matter_team: % records', active_count;
        RAISE NOTICE 'matter_team_leads: % records', leads_count;
        RAISE NOTICE 'matter_billing_attorneys: % records', billing_count;
        RAISE NOTICE 'matter_responsible_attorneys: % records', responsible_count;
        RAISE NOTICE 'matter_team_history: % records', history_count;
        
        -- Verify expected counts
        IF active_count != 9 THEN
            RAISE EXCEPTION 'Expected 9 active team members, found %', active_count;
        END IF;
        
        IF leads_count != 3 THEN
            RAISE EXCEPTION 'Expected 3 team leads, found %', leads_count;
        END IF;
        
        IF billing_count != 3 THEN
            RAISE EXCEPTION 'Expected 3 billing attorneys, found %', billing_count;
        END IF;
        
        IF responsible_count != 3 THEN
            RAISE EXCEPTION 'Expected 3 responsible attorneys, found %', responsible_count;
        END IF;
        
        IF history_count != 12 THEN
            RAISE EXCEPTION 'Expected 12 total team members (including history), found %', history_count;
        END IF;
        
        RAISE NOTICE 'All test data verifications passed successfully!';
    END;
END $$; 