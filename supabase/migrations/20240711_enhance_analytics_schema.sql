-- Migration: Enhance analytics schema
-- Description: This migration adds tables and columns for comprehensive legal analytics

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create courts table
CREATE TABLE IF NOT EXISTS public.courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    jurisdiction TEXT NOT NULL,
    court_type TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create judges table
CREATE TABLE IF NOT EXISTS public.judges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    court_id UUID REFERENCES public.courts(id),
    specialization TEXT,
    years_of_experience INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matter_outcomes table
CREATE TABLE IF NOT EXISTS public.matter_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES public.matters(id) ON DELETE CASCADE,
    outcome TEXT NOT NULL CHECK (outcome IN ('Won', 'Lost', 'Settled', 'Dismissed', 'Pending')),
    result TEXT,
    judge_id UUID REFERENCES public.judges(id),
    court_id UUID REFERENCES public.courts(id),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matter_risk_assessment table
CREATE TABLE IF NOT EXISTS public.matter_risk_assessment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES public.matters(id) ON DELETE CASCADE,
    risk_score NUMERIC CHECK (risk_score >= 0 AND risk_score <= 100),
    compliance_status TEXT CHECK (compliance_status IN ('Compliant', 'At Risk', 'Violation')),
    last_audit_at TIMESTAMP WITH TIME ZONE,
    audit_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matter_efficiency_metrics table
CREATE TABLE IF NOT EXISTS public.matter_efficiency_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES public.matters(id) ON DELETE CASCADE,
    task_completion_rate NUMERIC CHECK (task_completion_rate >= 0 AND task_completion_rate <= 100),
    average_task_duration NUMERIC,
    efficiency_score NUMERIC CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matter_notifications table
CREATE TABLE IF NOT EXISTS public.matter_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES public.matters(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('Deadline', 'Billing', 'Compliance', 'Task', 'Document')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matter_ai_insights table
CREATE TABLE IF NOT EXISTS public.matter_ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES public.matters(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('Precedent', 'Outcome Prediction', 'Research', 'Strategy')),
    content TEXT NOT NULL,
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matter_outcomes_matter_id ON public.matter_outcomes(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_outcomes_judge_id ON public.matter_outcomes(judge_id);
CREATE INDEX IF NOT EXISTS idx_matter_outcomes_court_id ON public.matter_outcomes(court_id);
CREATE INDEX IF NOT EXISTS idx_matter_outcomes_outcome ON public.matter_outcomes(outcome);

CREATE INDEX IF NOT EXISTS idx_matter_risk_assessment_matter_id ON public.matter_risk_assessment(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_risk_assessment_compliance_status ON public.matter_risk_assessment(compliance_status);

CREATE INDEX IF NOT EXISTS idx_matter_efficiency_metrics_matter_id ON public.matter_efficiency_metrics(matter_id);

CREATE INDEX IF NOT EXISTS idx_matter_notifications_matter_id ON public.matter_notifications(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_notifications_type ON public.matter_notifications(type);
CREATE INDEX IF NOT EXISTS idx_matter_notifications_is_read ON public.matter_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_matter_notifications_due_date ON public.matter_notifications(due_date);

CREATE INDEX IF NOT EXISTS idx_matter_ai_insights_matter_id ON public.matter_ai_insights(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_ai_insights_insight_type ON public.matter_ai_insights(insight_type);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all new tables
CREATE TRIGGER update_courts_updated_at
    BEFORE UPDATE ON public.courts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_judges_updated_at
    BEFORE UPDATE ON public.judges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matter_outcomes_updated_at
    BEFORE UPDATE ON public.matter_outcomes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matter_risk_assessment_updated_at
    BEFORE UPDATE ON public.matter_risk_assessment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matter_efficiency_metrics_updated_at
    BEFORE UPDATE ON public.matter_efficiency_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matter_notifications_updated_at
    BEFORE UPDATE ON public.matter_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matter_ai_insights_updated_at
    BEFORE UPDATE ON public.matter_ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 