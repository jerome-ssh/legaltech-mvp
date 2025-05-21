-- Add sub_type column to cases table
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS sub_type TEXT NOT NULL;

-- Add comment to explain the sub_type values
COMMENT ON COLUMN cases.sub_type IS 'Sub-type of the case, dependent on the matter_type. For Litigation: Civil, Criminal, Family, Personal Injury, Employment. For Transactional: Corporate, Real Estate, Estate Planning, Intellectual Property, Contract Drafting. For Advisory: Tax, Regulatory, Financial.';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_cases_sub_type ON cases(sub_type); 