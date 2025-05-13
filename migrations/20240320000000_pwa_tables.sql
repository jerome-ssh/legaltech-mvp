-- Add notification preferences to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "case_updates": true,
  "client_messages": true,
  "document_updates": true,
  "calendar_events": true
}'::jsonb;

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notification_preferences table
create table if not exists notification_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  preferences jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
CREATE INDEX IF NOT EXISTS push_subscriptions_profile_id_idx ON push_subscriptions(profile_id);
create index if not exists notification_preferences_user_id_idx on notification_preferences(user_id);

-- Add RLS policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
alter table notification_preferences enable row level security;

-- Push subscriptions policies
CREATE POLICY "Users can view their own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
    )
  );

CREATE POLICY "Users can insert their own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
    )
  );

CREATE POLICY "Users can update their own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
    )
  );

CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
    )
  );

-- Notification preferences policies
create policy "Users can view their own notification preferences"
  on notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notification preferences"
  on notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notification preferences"
  on notification_preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notification preferences"
  on notification_preferences for delete
  using (auth.uid() = user_id);

-- Add updated_at trigger to push_subscriptions
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 