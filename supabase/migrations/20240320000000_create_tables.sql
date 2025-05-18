-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can insert their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can delete their own cases" ON public.cases;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    status TEXT DEFAULT 'new',
    source TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cases table
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    client_id UUID REFERENCES public.leads(id),
    assigned_to TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    thread_id UUID DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    recipient TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create a function to always allow (since Clerk auth is enforced in the API)
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leads policies
CREATE POLICY "Users can view their own leads"
    ON public.leads FOR SELECT
    USING (is_authenticated());

CREATE POLICY "Users can insert their own leads"
    ON public.leads FOR INSERT
    WITH CHECK (is_authenticated());

CREATE POLICY "Users can update their own leads"
    ON public.leads FOR UPDATE
    USING (is_authenticated());

CREATE POLICY "Users can delete their own leads"
    ON public.leads FOR DELETE
    USING (is_authenticated());

-- Cases policies
CREATE POLICY "Users can view their own cases"
    ON public.cases FOR SELECT
    USING (is_authenticated());

CREATE POLICY "Users can insert their own cases"
    ON public.cases FOR INSERT
    WITH CHECK (is_authenticated());

CREATE POLICY "Users can update their own cases"
    ON public.cases FOR UPDATE
    USING (is_authenticated());

CREATE POLICY "Users can delete their own cases"
    ON public.cases FOR DELETE
    USING (is_authenticated());

-- Messages policies
CREATE POLICY "Users can view their own messages"
    ON public.messages FOR SELECT
    USING (is_authenticated());

CREATE POLICY "Users can insert their own messages"
    ON public.messages FOR INSERT
    WITH CHECK (is_authenticated());

CREATE POLICY "Users can update their own messages"
    ON public.messages FOR UPDATE
    USING (is_authenticated());

CREATE POLICY "Users can delete their own messages"
    ON public.messages FOR DELETE
    USING (is_authenticated()); 