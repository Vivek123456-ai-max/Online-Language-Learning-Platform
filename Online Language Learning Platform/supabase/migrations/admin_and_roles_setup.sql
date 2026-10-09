-- CodeVerse Super Administrator & Role Setup
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Confirm email for admin user ktvivek1234567@gmail.com (bypasses manual email confirmation)
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'ktvivek1234567@gmail.com';

-- 2. Assign 'admin' role to ktvivek1234567@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM public.profiles
WHERE email = 'ktvivek1234567@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Assign 'instructor' role to ktvivek1234567@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'instructor'
FROM public.profiles
WHERE email = 'ktvivek1234567@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
