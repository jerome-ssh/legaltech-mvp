-- Insert a test matter for development and debugging
INSERT INTO cases (
  id,
  title,
  description,
  status,
  created_at
) VALUES (
  gen_random_uuid(),
  'Test Matter',
  'This is a test matter for development and debugging.',
  'active',
  NOW()
); 