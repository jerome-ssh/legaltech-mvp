ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for messages
-- CREATE POLICY "Users can view their own messages"
--     ON public.messages
--     FOR SELECT
--     USING (user_id = auth.uid());

-- CREATE POLICY "Users can insert their own messages"
--     ON public.messages FOR INSERT
--     WITH CHECK (user_id = auth.uid());

-- CREATE POLICY "Users can update their own messages"
--     ON public.messages FOR UPDATE
--     USING (user_id = auth.uid());

-- CREATE POLICY "Users can delete their own messages"
--     ON public.messages FOR DELETE
--     USING (user_id = auth.uid()); 