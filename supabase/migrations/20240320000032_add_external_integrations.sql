-- Create external integrations table
CREATE TABLE external_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'error')),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create payment processors table
CREATE TABLE payment_processors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    processor_type VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create calendar sync settings table
CREATE TABLE calendar_sync_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL,
    sync_frequency VARCHAR(20) DEFAULT 'hourly' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create email integrations table
CREATE TABLE email_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_external_integrations_firm_id ON external_integrations(firm_id);
CREATE INDEX IF NOT EXISTS idx_external_integrations_type ON external_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_payment_processors_firm_id ON payment_processors(firm_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_settings_firm_id ON calendar_sync_settings(firm_id);
CREATE INDEX IF NOT EXISTS idx_email_integrations_firm_id ON email_integrations(firm_id);

-- Enable RLS
ALTER TABLE external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Firm members can view their firm's integrations"
    ON external_integrations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM law_firm_associations
            WHERE law_firm_id = external_integrations.firm_id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

CREATE POLICY "Firm members can view their firm's payment processors"
    ON payment_processors FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM law_firm_associations
            WHERE law_firm_id = payment_processors.firm_id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

CREATE POLICY "Firm members can view their firm's calendar sync settings"
    ON calendar_sync_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM law_firm_associations
            WHERE law_firm_id = calendar_sync_settings.firm_id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

CREATE POLICY "Firm members can view their firm's email integrations"
    ON email_integrations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM law_firm_associations
            WHERE law_firm_id = email_integrations.firm_id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

-- Add updated_at triggers
CREATE TRIGGER update_external_integrations_updated_at
    BEFORE UPDATE ON external_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_processors_updated_at
    BEFORE UPDATE ON payment_processors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_sync_settings_updated_at
    BEFORE UPDATE ON calendar_sync_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_integrations_updated_at
    BEFORE UPDATE ON email_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 