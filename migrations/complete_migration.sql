-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Documents table (moved up since other tables depend on it)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    case_id UUID,
    file_url TEXT,
    status TEXT DEFAULT 'draft',
    uploaded_by UUID REFERENCES users(id),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view documents they have access to"
    ON documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_id = documents.id
            AND user_id = auth.uid()
        )
    );

-- Add updated_at trigger to documents
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Document Permissions
CREATE TABLE IF NOT EXISTS document_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_level TEXT CHECK (permission_level IN ('read', 'write', 'admin')),
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, user_id)
);

-- Enable RLS
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_permissions
CREATE POLICY "Users can view their own permissions"
    ON document_permissions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage permissions"
    ON document_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_id = document_permissions.document_id
            AND user_id = auth.uid()
            AND permission_level = 'admin'
        )
    );

-- Add updated_at trigger to document_permissions
CREATE TRIGGER update_document_permissions_updated_at
    BEFORE UPDATE ON document_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    company TEXT,
    job_title TEXT,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Add updated_at trigger to profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Document Versions
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    changes_description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

-- Enable RLS
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_versions
CREATE POLICY "Users can view document versions they have access to"
    ON document_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_id = document_versions.document_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create versions for documents they can write to"
    ON document_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_id = document_versions.document_id
            AND user_id = auth.uid()
            AND permission_level IN ('write', 'admin')
        )
    );

-- Add updated_at trigger to document_versions
CREATE TRIGGER update_document_versions_updated_at
    BEFORE UPDATE ON document_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Document Comments
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    page_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_comments
CREATE POLICY "Users can view comments on documents they have access to"
    ON document_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_id = document_comments.document_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create comments on documents they have access to"
    ON document_comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_id = document_comments.document_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own comments"
    ON document_comments FOR UPDATE
    USING (user_id = auth.uid());

-- Add updated_at trigger to document_comments
CREATE TRIGGER update_document_comments_updated_at
    BEFORE UPDATE ON document_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Document Tags
CREATE TABLE IF NOT EXISTS document_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    color TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_tag_relationships (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES document_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (document_id, tag_id)
);

-- Enable RLS
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tag_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_tags
CREATE POLICY "Users can view all tags"
    ON document_tags FOR SELECT
    USING (true);

CREATE POLICY "Users can create tags"
    ON document_tags FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for document_tag_relationships
CREATE POLICY "Users can view tag relationships for documents they have access to"
    ON document_tag_relationships FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_id = document_tag_relationships.document_id
            AND user_id = auth.uid()
        )
    );

-- Add updated_at trigger to document_tags
CREATE TRIGGER update_document_tags_updated_at
    BEFORE UPDATE ON document_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Document Categories
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES document_categories(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, parent_id)
);

-- Enable RLS
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_categories
CREATE POLICY "Users can view all categories"
    ON document_categories FOR SELECT
    USING (true);

CREATE POLICY "Users can create categories"
    ON document_categories FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Add updated_at trigger to document_categories
CREATE TRIGGER update_document_categories_updated_at
    BEFORE UPDATE ON document_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Document Workflows
CREATE TABLE IF NOT EXISTS document_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    current_step INTEGER NOT NULL DEFAULT 1,
    assigned_to UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE document_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_workflows
CREATE POLICY "Users can view workflows for documents they have access to"
    ON document_workflows FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_id = document_workflows.document_id
            AND user_id = auth.uid()
        )
    );

-- Add updated_at trigger to document_workflows
CREATE TRIGGER update_document_workflows_updated_at
    BEFORE UPDATE ON document_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Document Audit Logs
CREATE TABLE IF NOT EXISTS document_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE document_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_audit_logs
CREATE POLICY "Users can view audit logs for documents they have access to"
    ON document_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_id = document_audit_logs.document_id
            AND user_id = auth.uid()
        )
    );

-- Create audit log trigger function
CREATE OR REPLACE FUNCTION log_document_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO document_audit_logs (document_id, user_id, action, details)
    VALUES (
        NEW.id,
        auth.uid(),
        TG_OP,
        jsonb_build_object(
            'old', row_to_json(OLD),
            'new', row_to_json(NEW)
        )
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add audit log trigger to documents
CREATE TRIGGER log_document_changes
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION log_document_changes();

-- Analytics Tables
CREATE TABLE IF NOT EXISTS case_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    case_type_id UUID REFERENCES case_types(id),
    status TEXT NOT NULL DEFAULT 'active',
    client_id UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    revenue DECIMAL(10,2) DEFAULT 0,
    expenses DECIMAL(10,2) DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    paid_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to UUID REFERENCES users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for analytics tables
ALTER TABLE case_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for case_types
CREATE POLICY "Anyone can view case types"
    ON case_types FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify case types"
    ON case_types FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- RLS Policies for cases
CREATE POLICY "Users can view their assigned cases"
    ON cases FOR SELECT
    USING (
        assigned_to = auth.uid()
        OR client_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- RLS Policies for billing
CREATE POLICY "Users can view billing for their cases"
    ON billing FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = billing.case_id
            AND (cases.assigned_to = auth.uid()
                OR cases.client_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM users
                    WHERE id = auth.uid()
                    AND role = 'admin'
                ))
        )
    );

-- RLS Policies for tasks
CREATE POLICY "Users can view their assigned tasks"
    ON tasks FOR SELECT
    USING (
        assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = tasks.case_id
            AND (cases.assigned_to = auth.uid()
                OR cases.client_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM users
                    WHERE id = auth.uid()
                    AND role = 'admin'
                ))
        )
    );

-- RLS Policies for client_feedback
CREATE POLICY "Users can view feedback for their cases"
    ON client_feedback FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = client_feedback.case_id
            AND (cases.assigned_to = auth.uid()
                OR cases.client_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM users
                    WHERE id = auth.uid()
                    AND role = 'admin'
                ))
        )
    );

-- Add updated_at triggers for analytics tables
CREATE TRIGGER update_case_types_updated_at
    BEFORE UPDATE ON case_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_updated_at
    BEFORE UPDATE ON billing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_feedback_updated_at
    BEFORE UPDATE ON client_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON document_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at);

CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user_id ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_granted_at ON document_permissions(granted_at);

CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_user_id ON document_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_created_at ON document_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_document_workflows_document_id ON document_workflows(document_id);
CREATE INDEX IF NOT EXISTS idx_document_workflows_assigned_to ON document_workflows(assigned_to);
CREATE INDEX IF NOT EXISTS idx_document_workflows_status ON document_workflows(status);

CREATE INDEX IF NOT EXISTS idx_document_audit_logs_document_id ON document_audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_user_id ON document_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_created_at ON document_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_action ON document_audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_cases_case_type_id ON cases(case_type_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);

CREATE INDEX IF NOT EXISTS idx_billing_case_id ON billing(case_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing(status);
CREATE INDEX IF NOT EXISTS idx_billing_due_date ON billing(due_date);

CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_client_feedback_case_id ON client_feedback(case_id);
CREATE INDEX IF NOT EXISTS idx_client_feedback_client_id ON client_feedback(client_id);
CREATE INDEX IF NOT EXISTS idx_client_feedback_rating ON client_feedback(rating);

-- Create helper functions
CREATE OR REPLACE FUNCTION get_document_history(p_document_id UUID)
RETURNS TABLE (
    action TEXT,
    user_id UUID,
    action_timestamp TIMESTAMP WITH TIME ZONE,
    details JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.action,
        al.user_id,
        al.created_at as action_timestamp,
        al.details
    FROM document_audit_logs al
    WHERE al.document_id = p_document_id
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_document_permissions(p_document_id UUID)
RETURNS TABLE (
    user_id UUID,
    permission_level TEXT,
    granted_by UUID,
    granted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dp.user_id,
        dp.permission_level,
        dp.granted_by,
        dp.granted_at
    FROM document_permissions dp
    WHERE dp.document_id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default case types
INSERT INTO case_types (name, description)
VALUES 
    ('Criminal', 'Criminal law cases'),
    ('Civil', 'Civil law cases'),
    ('Family', 'Family law cases'),
    ('Corporate', 'Corporate law cases'),
    ('Real Estate', 'Real estate law cases'),
    ('Intellectual Property', 'IP law cases')
ON CONFLICT (name) DO NOTHING; 