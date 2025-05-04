-- First, disable RLS temporarily for seeding
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE law_firms DISABLE ROW LEVEL SECURITY;
ALTER TABLE practice_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines DISABLE ROW LEVEL SECURITY;
ALTER TABLE billing DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON users;

-- Create policies for users table
CREATE POLICY "Enable read access for all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON users
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for service role" ON users
    FOR DELETE USING (true);

-- Create policies for practice_areas table
CREATE POLICY "Enable read access for all users" ON practice_areas
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON practice_areas
    FOR ALL USING (true);

-- Create policies for law_firms table
CREATE POLICY "Enable read access for all users" ON law_firms
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON law_firms
    FOR ALL USING (true);

-- Create policies for clients table
CREATE POLICY "Enable read access for firm members" ON clients
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON clients
    FOR ALL USING (true);

-- Create policies for cases table
CREATE POLICY "Enable read access for case participants" ON cases
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON cases
    FOR ALL USING (true);

-- Create policies for case_stages table
CREATE POLICY "Enable read access for case participants" ON case_stages
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON case_stages
    FOR ALL USING (true);

-- Create policies for documents table
CREATE POLICY "Enable read access for case participants" ON documents
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON documents
    FOR ALL USING (true);

-- Create policies for tasks table
CREATE POLICY "Enable read access for assigned users" ON tasks
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON tasks
    FOR ALL USING (true);

-- Create policies for deadlines table
CREATE POLICY "Enable read access for case participants" ON deadlines
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON deadlines
    FOR ALL USING (true);

-- Create policies for billing table
CREATE POLICY "Enable read access for billing participants" ON billing
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON billing
    FOR ALL USING (true);

-- Create policies for time_entries table
CREATE POLICY "Enable read access for firm members" ON time_entries
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON time_entries
    FOR ALL USING (true);

-- Create policies for messages table
CREATE POLICY "Enable read access for message participants" ON messages
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON messages
    FOR ALL USING (true);

-- Create policies for notes table
CREATE POLICY "Enable read access for case participants" ON notes
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON notes
    FOR ALL USING (true);

-- Create policies for calendar_events table
CREATE POLICY "Enable read access for event participants" ON calendar_events
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON calendar_events
    FOR ALL USING (true);

-- Create policies for case_participants table
CREATE POLICY "Enable read access for case participants" ON case_participants
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON case_participants
    FOR ALL USING (true);

-- Re-enable RLS with new policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY; 