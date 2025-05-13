-- Create periodic_sync_settings table
CREATE TABLE IF NOT EXISTS periodic_sync_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('cases', 'documents', 'messages')),
  interval_minutes INTEGER NOT NULL DEFAULT 60,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(profile_id, sync_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS periodic_sync_settings_profile_id_idx ON periodic_sync_settings(profile_id);
CREATE INDEX IF NOT EXISTS periodic_sync_settings_last_sync_at_idx ON periodic_sync_settings(last_sync_at);

-- Add RLS policies
ALTER TABLE periodic_sync_settings ENABLE ROW LEVEL SECURITY;

-- Periodic sync settings policies
CREATE POLICY "Users can view their own sync settings"
  ON periodic_sync_settings FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
    )
  );

CREATE POLICY "Users can manage their own sync settings"
  ON periodic_sync_settings FOR ALL
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_periodic_sync_settings_updated_at
  BEFORE UPDATE ON periodic_sync_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create offline_queue table for background sync
CREATE TABLE IF NOT EXISTS offline_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('case', 'document', 'message')),
  resource_id UUID,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS offline_queue_profile_id_idx ON offline_queue(profile_id);
CREATE INDEX IF NOT EXISTS offline_queue_status_idx ON offline_queue(status);
CREATE INDEX IF NOT EXISTS offline_queue_created_at_idx ON offline_queue(created_at);

-- Add RLS policies
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;

-- Offline queue policies
CREATE POLICY "Users can view their own queue items"
  ON offline_queue FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
    )
  );

CREATE POLICY "Users can manage their own queue items"
  ON offline_queue FOR ALL
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_offline_queue_updated_at
  BEFORE UPDATE ON offline_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old queue items
CREATE OR REPLACE FUNCTION cleanup_old_queue_items()
RETURNS void AS $$
BEGIN
  DELETE FROM offline_queue
  WHERE status = 'completed'
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if your database supports it)
-- Note: This is PostgreSQL-specific and might need to be adjusted based on your database
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc
    WHERE proname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule('0 0 * * *', 'SELECT cleanup_old_queue_items()');
  END IF;
END $$; 