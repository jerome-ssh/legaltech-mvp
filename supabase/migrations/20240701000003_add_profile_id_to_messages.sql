-- Add profile_id column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Create index for profile_id
CREATE INDEX IF NOT EXISTS idx_messages_profile_id ON messages(profile_id);

-- Update RLS policies to include profile_id
CREATE POLICY "Users can view messages related to their profile"
    ON public.messages
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can insert messages with their profile"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can update their own messages"
    ON public.messages
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can delete their own messages"
    ON public.messages
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    ); 