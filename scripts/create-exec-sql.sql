-- Create a function to execute SQL queries
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    EXECUTE query INTO result;
    RETURN result;
END;
$$; 