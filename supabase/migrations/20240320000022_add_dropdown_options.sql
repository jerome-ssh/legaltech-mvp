-- Create enum types for dropdowns
CREATE TYPE public.title_type AS ENUM ('Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Other');
CREATE TYPE public.client_type AS ENUM ('Individual', 'Business', 'Government', 'Nonprofit', 'Trust', 'Partnership', 'Estate', 'Other');
CREATE TYPE public.language_type AS ENUM ('English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Other');

-- Create tables for dropdown options
CREATE TABLE public.titles (
    id SERIAL PRIMARY KEY,
    value title_type NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.client_types (
    id SERIAL PRIMARY KEY,
    value client_type NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.languages (
    id SERIAL PRIMARY KEY,
    value language_type NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default values
INSERT INTO public.titles (value, label) VALUES
    ('Mr', 'Mr.'),
    ('Mrs', 'Mrs.'),
    ('Ms', 'Ms.'),
    ('Dr', 'Dr.'),
    ('Prof', 'Prof.'),
    ('Other', 'Other');

INSERT INTO public.client_types (value, label) VALUES
    ('Individual', 'Individual'),
    ('Business', 'Business'),
    ('Government', 'Government'),
    ('Nonprofit', 'Nonprofit'),
    ('Trust', 'Trust'),
    ('Partnership', 'Partnership'),
    ('Estate', 'Estate'),
    ('Other', 'Other');

INSERT INTO public.languages (value, label) VALUES
    ('English', 'English'),
    ('Spanish', 'Spanish'),
    ('French', 'French'),
    ('German', 'German'),
    ('Chinese', 'Chinese'),
    ('Japanese', 'Japanese'),
    ('Korean', 'Korean'),
    ('Other', 'Other');

-- Add RLS policies
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to titles" ON public.titles
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to client_types" ON public.client_types
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to languages" ON public.languages
    FOR SELECT USING (true); 