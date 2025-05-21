-- Migration: Supabase → Clerk user deletion sync
-- Creates a trigger to call the Edge Function when a user is deleted from auth.users

-- Function to call the Edge Function
create or replace function call_delete_clerk_user()
returns trigger as $$
declare
begin
  -- Call the Edge Function via HTTP POST
  perform net.http_post(
    'https://<your-project-ref>.functions.supabase.co/delete-clerk-user',
    json_build_object('user_id', OLD.id)::text,
    'application/json'
  );
  return OLD;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users table
drop trigger if exists after_user_delete on auth.users;
create trigger after_user_delete
after delete on auth.users
for each row
execute function call_delete_clerk_user(); 