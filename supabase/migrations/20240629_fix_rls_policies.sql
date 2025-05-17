-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own metrics" ON public.user_metrics;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON public.user_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON public.user_metrics;
DROP POLICY IF EXISTS "Users can delete their own metrics" ON public.user_metrics;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can do all profile actions" ON profiles;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Service role can do all document actions" ON documents;
DROP POLICY IF EXISTS "Users can view their own connections" ON connections;
DROP POLICY IF EXISTS "Users can insert their own connections" ON connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON connections;
DROP POLICY IF EXISTS "Service role can do all connection actions" ON connections;
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;
DROP POLICY IF EXISTS "Service role can do all invoice actions" ON invoices;

-- Enable RLS
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create new policies for user_metrics
CREATE POLICY "Users can view their own metrics"
    ON public.user_metrics
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.clerk_id = auth.jwt()->>'sub'
            AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can insert their own metrics"
    ON public.user_metrics
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can update their own metrics"
    ON public.user_metrics
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can delete their own metrics"
    ON public.user_metrics
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    USING (
        clerk_id = auth.jwt()->>'sub'
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    USING (
        clerk_id = auth.jwt()->>'sub'
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
    )
    WITH CHECK (
        clerk_id = auth.jwt()->>'sub'
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
    );

CREATE POLICY "Users can insert their own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (
        clerk_id = auth.jwt()->>'sub'
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own profile"
    ON profiles
    FOR DELETE
    USING (
        clerk_id = auth.jwt()->>'sub'
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
    );

-- Create policies for documents
CREATE POLICY "Users can view their own documents"
    ON documents
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can insert their own documents"
    ON documents
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can update their own documents"
    ON documents
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can delete their own documents"
    ON documents
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

-- Create policies for connections
CREATE POLICY "Users can view their own connections"
    ON connections
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can insert their own connections"
    ON connections
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can update their own connections"
    ON connections
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can delete their own connections"
    ON connections
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

-- Create policies for invoices
CREATE POLICY "Users can view their own invoices"
    ON invoices
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can insert their own invoices"
    ON invoices
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can update their own invoices"
    ON invoices
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can delete their own invoices"
    ON invoices
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
        OR auth.role() = 'service_role'
    );

-- Grant permissions
GRANT ALL ON public.user_metrics TO authenticated;
GRANT ALL ON public.user_metrics TO service_role;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON documents TO service_role;
GRANT ALL ON connections TO authenticated;
GRANT ALL ON connections TO service_role;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON invoices TO service_role;

-- Ensure only one metrics row per profile
ALTER TABLE public.user_metrics
ADD CONSTRAINT unique_profile_id UNIQUE (profile_id); 