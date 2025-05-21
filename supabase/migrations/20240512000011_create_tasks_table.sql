-- Create the tasks table in the public schema
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text,
  description text,
  frequency integer,
  is_recurring boolean,
  case_id uuid references cases(id)
);

-- Optionally, add indexes for performance
create index if not exists idx_tasks_case_id on public.tasks(case_id);

-- Optionally, enable Row Level Security (RLS)
alter table public.tasks enable row level security;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;

-- Create the policy
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (true); 