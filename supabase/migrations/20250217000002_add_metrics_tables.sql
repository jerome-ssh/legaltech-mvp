-- Create connections table
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    connection_name TEXT NOT NULL,
    connection_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    compliance_status TEXT DEFAULT 'pending',
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for connections
CREATE POLICY "Users can view their own connections"
    ON public.connections FOR SELECT
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.jwt()->>'sub'
    ));

CREATE POLICY "Users can insert their own connections"
    ON public.connections FOR INSERT
    WITH CHECK (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.jwt()->>'sub'
    ));

CREATE POLICY "Users can update their own connections"
    ON public.connections FOR UPDATE
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.jwt()->>'sub'
    ));

CREATE POLICY "Users can delete their own connections"
    ON public.connections FOR DELETE
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.jwt()->>'sub'
    ));

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents"
    ON public.documents FOR SELECT
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.jwt()->>'sub'
    ));

CREATE POLICY "Users can insert their own documents"
    ON public.documents FOR INSERT
    WITH CHECK (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.jwt()->>'sub'
    ));

CREATE POLICY "Users can update their own documents"
    ON public.documents FOR UPDATE
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.jwt()->>'sub'
    ));

CREATE POLICY "Users can delete their own documents"
    ON public.documents FOR DELETE
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.jwt()->>'sub'
    ));

-- Create RLS policies for invoices
CREATE POLICY "Users can view their own invoices"
    ON public.invoices FOR SELECT
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.jwt()->>'sub'
    ));

CREATE POLICY "Users can insert their own invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.jwt()->>'sub'
    ));

CREATE POLICY "Users can update their own invoices"
    ON public.invoices FOR UPDATE
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.jwt()->>'sub'
    ));

CREATE POLICY "Users can delete their own invoices"
    ON public.invoices FOR DELETE
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.jwt()->>'sub'
    ));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_connections_profile_id ON public.connections(profile_id);
CREATE INDEX IF NOT EXISTS idx_documents_profile_id ON public.documents(profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_profile_id ON public.invoices(profile_id); 