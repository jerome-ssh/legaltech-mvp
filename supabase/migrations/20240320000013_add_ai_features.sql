-- Ensure required extensions and functions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the log_audit_changes function if it doesn't exist
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, changed_by, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'insert', NEW.created_by, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'update', NEW.updated_by, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'delete', OLD.updated_by, row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    insight_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create workflow optimizations table
CREATE TABLE IF NOT EXISTS workflow_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    optimization_type VARCHAR(50) NOT NULL,
    current_workflow JSONB NOT NULL,
    suggested_workflow JSONB NOT NULL,
    potential_savings DECIMAL(10,2),
    implementation_complexity VARCHAR(20) CHECK (implementation_complexity IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'implemented', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create predictive analytics table
CREATE TABLE IF NOT EXISTS predictive_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    current_value DECIMAL(10,2),
    predicted_value DECIMAL(10,2),
    confidence_interval JSONB,
    factors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create billing insights table
CREATE TABLE IF NOT EXISTS billing_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    current_metrics JSONB NOT NULL,
    recommendations JSONB NOT NULL,
    potential_impact DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_law_firm_id ON ai_insights(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_insight_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_workflow_optimizations_law_firm_id ON workflow_optimizations(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_workflow_optimizations_status ON workflow_optimizations(status);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_law_firm_id ON predictive_analytics(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_metric_type ON predictive_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_billing_insights_law_firm_id ON billing_insights(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_billing_insights_insight_type ON billing_insights(insight_type);

-- Enable RLS
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Firm members can view their firm's AI insights" ON ai_insights;
DROP POLICY IF EXISTS "Firm members can view their firm's workflow optimizations" ON workflow_optimizations;
DROP POLICY IF EXISTS "Firm members can view their firm's predictive analytics" ON predictive_analytics;
DROP POLICY IF EXISTS "Firm members can view their firm's billing insights" ON billing_insights;

-- Create RLS policies
CREATE POLICY "Firm members can view their firm's AI insights"
    ON ai_insights FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM law_firm_associations
            WHERE law_firm_id = ai_insights.law_firm_id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

CREATE POLICY "Firm members can view their firm's workflow optimizations"
    ON workflow_optimizations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM law_firm_associations
            WHERE law_firm_id = workflow_optimizations.law_firm_id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

CREATE POLICY "Firm members can view their firm's predictive analytics"
    ON predictive_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM law_firm_associations
            WHERE law_firm_id = predictive_analytics.law_firm_id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

CREATE POLICY "Firm members can view their firm's billing insights"
    ON billing_insights FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM law_firm_associations
            WHERE law_firm_id = billing_insights.law_firm_id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_ai_insights_updated_at ON ai_insights;
DROP TRIGGER IF EXISTS update_workflow_optimizations_updated_at ON workflow_optimizations;
DROP TRIGGER IF EXISTS update_predictive_analytics_updated_at ON predictive_analytics;
DROP TRIGGER IF EXISTS update_billing_insights_updated_at ON billing_insights;
DROP TRIGGER IF EXISTS audit_ai_insights ON ai_insights;
DROP TRIGGER IF EXISTS audit_workflow_optimizations ON workflow_optimizations;
DROP TRIGGER IF EXISTS audit_predictive_analytics ON predictive_analytics;
DROP TRIGGER IF EXISTS audit_billing_insights ON billing_insights;

-- Create updated_at triggers
CREATE TRIGGER update_ai_insights_updated_at
    BEFORE UPDATE ON ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_optimizations_updated_at
    BEFORE UPDATE ON workflow_optimizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictive_analytics_updated_at
    BEFORE UPDATE ON predictive_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_insights_updated_at
    BEFORE UPDATE ON billing_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_ai_insights
    AFTER INSERT OR UPDATE OR DELETE ON ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_workflow_optimizations
    AFTER INSERT OR UPDATE OR DELETE ON workflow_optimizations
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_predictive_analytics
    AFTER INSERT OR UPDATE OR DELETE ON predictive_analytics
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_billing_insights
    AFTER INSERT OR UPDATE OR DELETE ON billing_insights
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes(); 