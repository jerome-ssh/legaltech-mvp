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

-- Example RLS policy: allow users to select their own tasks (customize as needed)
-- Replace 'assigned_to' with your actual user reference if needed
create policy if not exists "Users can view their own tasks" on public.tasks
  for select using (true); 