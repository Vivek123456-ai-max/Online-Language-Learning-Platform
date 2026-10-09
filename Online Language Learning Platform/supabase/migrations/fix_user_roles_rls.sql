-- =========================================================================
-- FIX: Row Level Security for user_roles and handle_new_user trigger
-- Fixes: "new row violates row-level security policy for table 'user_roles'"
-- =========================================================================

-- 1. Helper Function: Is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN lower(COALESCE(auth.jwt() ->> 'email', '')) = 'ktvivek1234567@gmail.com'
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop all conflicting old policies on user_roles
DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow learner role creation" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert for registration and admins" ON public.user_roles;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.user_roles;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.user_roles;
DROP POLICY IF EXISTS "Allow role insertion" ON public.user_roles;
DROP POLICY IF EXISTS "Only super admin can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only super admin can delete roles" ON public.user_roles;

-- 3. SELECT Policy:
-- Users can view their own roles, Super Admin can view all roles
CREATE POLICY "Users can view own roles"
    ON public.user_roles
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR public.is_super_admin()
    );

-- 4. INSERT Policy:
-- Allow 'learner' role creation for any authenticated or new user
-- Allow Super Admin or service role to insert ANY role ('learner', 'instructor', 'admin')
CREATE POLICY "Allow role insertion"
    ON public.user_roles
    FOR INSERT
    WITH CHECK (
        -- Learner role can be assigned to oneself upon registration
        (auth.uid() = user_id AND role = 'learner')
        -- OR caller is Super Admin (can assign any role: admin, instructor, learner)
        OR public.is_super_admin()
        -- OR system trigger / unauthenticated signup execution
        OR (auth.uid() IS NULL)
    );

-- 5. UPDATE Policy:
-- ONLY Super Admin can update roles
CREATE POLICY "Only super admin can update roles"
    ON public.user_roles
    FOR UPDATE
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 6. DELETE Policy:
-- ONLY Super Admin can delete roles
CREATE POLICY "Only super admin can delete roles"
    ON public.user_roles
    FOR DELETE
    USING (public.is_super_admin());

-- 7. Update handle_new_user() trigger to guarantee security and auto-provision admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $func_new_user$
DECLARE
    derived_username TEXT;
    derived_name TEXT;
    avatar TEXT;
BEGIN
    derived_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 5));
    derived_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || NEW.id::text);

    -- 1. Insert Profile
    INSERT INTO public.profiles (id, email, username, full_name, avatar_url)
    VALUES (NEW.id, NEW.email, derived_username, derived_name, avatar)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email, full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

    -- 2. Insert Default Role: learner
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'learner')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. If Super Admin email registers, automatically grant admin and instructor roles immediately!
    IF lower(NEW.email) = 'ktvivek1234567@gmail.com' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;

        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'instructor')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    -- 4. User Stats
    INSERT INTO public.user_stats (user_id, xp, streak_count, longest_streak, courses_completed, lessons_completed)
    VALUES (NEW.id, 0, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- 5. Welcome Notification
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.id, 'Welcome to CodeVerse! 🚀', 'Your coding journey begins now. Explore programming languages, enroll in courses, and start learning!', 'success');

    RETURN NEW;
END;
$func_new_user$;

-- Re-attach trigger cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure admin role exists for ktvivek1234567@gmail.com if account already exists
DO $$
DECLARE
    admin_uid UUID;
BEGIN
    SELECT id INTO admin_uid FROM auth.users WHERE lower(email) = 'ktvivek1234567@gmail.com';
    IF admin_uid IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (admin_uid, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
        INSERT INTO public.user_roles (user_id, role) VALUES (admin_uid, 'instructor') ON CONFLICT (user_id, role) DO NOTHING;
        INSERT INTO public.user_roles (user_id, role) VALUES (admin_uid, 'learner') ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
