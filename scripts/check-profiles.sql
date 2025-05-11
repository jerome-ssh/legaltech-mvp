-- Check the most recent users in auth.users
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check if these users have corresponding profiles
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.phone_number,
    p.onboarding_completed,
    p.created_at,
    CASE 
        WHEN u.id IS NOT NULL THEN '✅'
        ELSE '❌'
    END as has_auth_user
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 5;

-- Check for any users without profiles
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 5; 