-- Create a test user
INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'test_' || extract(epoch from now())::text || '@example.com',
    '{"full_name": "Test User"}'::jsonb,
    now(),
    now()
) RETURNING id, email, raw_user_meta_data->>'full_name' as full_name;

-- Wait a moment for the trigger to execute
SELECT pg_sleep(1);

-- Check if the profile was created
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.onboarding_completed,
    p.created_at
FROM public.profiles p
WHERE p.email LIKE 'test_%'
ORDER BY p.created_at DESC
LIMIT 1; 