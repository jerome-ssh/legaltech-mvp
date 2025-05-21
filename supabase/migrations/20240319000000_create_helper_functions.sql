-- Create function to handle UUID comparison
CREATE OR REPLACE FUNCTION public.match_user_id(user_id uuid, auth_uid text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT user_id::text = auth_uid;
$$; 

-- Create set_updated_at() function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 