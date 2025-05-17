-- Enable RLS
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own metrics"
ON user_metrics FOR SELECT
USING (profile_id IN (
  SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
));

CREATE POLICY "Users can insert their own metrics"
ON user_metrics FOR INSERT
WITH CHECK (profile_id IN (
  SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
));

CREATE POLICY "Users can update their own metrics"
ON user_metrics FOR UPDATE
USING (profile_id IN (
  SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
));

CREATE POLICY "Users can delete their own metrics"
ON user_metrics FOR DELETE
USING (profile_id IN (
  SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
)); 