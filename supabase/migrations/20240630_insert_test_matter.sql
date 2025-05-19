-- Insert a test matter for the user
INSERT INTO public.cases (
  title,
  description,
  status,
  profile_id,
  created_at
) VALUES (
  'Test Matter',
  'This is a test matter to verify the matters page functionality.',
  'open',
  (SELECT id FROM public.profiles WHERE clerk_id = 'user_2xGvjtZP4yjZmbjBLFFN6r8U4TK'),
  NOW()
) ON CONFLICT DO NOTHING; 