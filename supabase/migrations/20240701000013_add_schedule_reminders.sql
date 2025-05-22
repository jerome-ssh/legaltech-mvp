-- Add reminder fields to schedules table
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS reminder_time interval,
ADD COLUMN IF NOT EXISTS reminder_type text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- Create index for reminder_time
CREATE INDEX IF NOT EXISTS idx_schedules_reminder_time ON schedules(reminder_time);

-- Create function to check for upcoming reminders
CREATE OR REPLACE FUNCTION check_schedule_reminders()
RETURNS TABLE (
    id uuid,
    title text,
    start_time timestamptz,
    profile_id uuid,
    reminder_time interval,
    reminder_type text[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.start_time,
        s.profile_id,
        s.reminder_time,
        s.reminder_type
    FROM schedules s
    WHERE 
        s.reminder_time IS NOT NULL
        AND s.reminder_sent = false
        AND s.start_time - s.reminder_time <= now()
        AND s.start_time > now();
END;
$$ LANGUAGE plpgsql; 