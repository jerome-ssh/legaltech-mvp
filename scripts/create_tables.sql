-- Create exec_sql function
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
    EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create law_firms table
CREATE TABLE IF NOT EXISTS law_firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create practice_areas table
CREATE TABLE IF NOT EXISTS practice_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    practice_area TEXT NOT NULL,
    law_firm_id UUID REFERENCES law_firms(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create case_participants table
CREATE TABLE IF NOT EXISTS case_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(case_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    is_all_day BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_law_firms_updated_at
    BEFORE UPDATE ON law_firms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_areas_updated_at
    BEFORE UPDATE ON practice_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_participants_updated_at
    BEFORE UPDATE ON case_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Law firms are viewable by all authenticated users" ON law_firms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage law firms" ON law_firms
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Practice areas are viewable by all authenticated users" ON practice_areas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage practice areas" ON practice_areas
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Cases are viewable by participants" ON cases
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM case_participants WHERE case_id = id
        )
    );

CREATE POLICY "Case participants can manage their cases" ON cases
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM case_participants WHERE case_id = id
        )
    );

CREATE POLICY "Case participants are viewable by participants" ON case_participants
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM case_participants WHERE case_id = case_id
        )
    );

CREATE POLICY "Case participants can manage their participation" ON case_participants
    FOR ALL USING (
        auth.uid() = user_id
    );

CREATE POLICY "Messages are viewable by participants" ON messages
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM case_participants WHERE case_id = case_id
        )
    );

CREATE POLICY "Participants can manage their messages" ON messages
    FOR ALL USING (
        auth.uid() = sender_id
    );

CREATE POLICY "Calendar events are viewable by participants" ON calendar_events
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM case_participants WHERE case_id = case_id
        )
    );

CREATE POLICY "Participants can manage their calendar events" ON calendar_events
    FOR ALL USING (
        auth.uid() = user_id
    );

-- Removed duplicate foreign key constraint for matter_notes
-- ALTER TABLE matter_notes
-- ADD CONSTRAINT matter_notes_matter_id_fkey FOREIGN KEY (matter_id) REFERENCES matters(id); 