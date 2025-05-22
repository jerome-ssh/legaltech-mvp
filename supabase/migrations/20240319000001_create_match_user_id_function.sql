-- Create match_user_id function
CREATE OR REPLACE FUNCTION match_user_id(user_id uuid, auth_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN user_id = auth_id;
END;
$$ LANGUAGE plpgsql; 