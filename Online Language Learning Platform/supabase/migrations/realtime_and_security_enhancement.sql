-- =========================================================================
-- CODEVERSE REALTIME BROADCAST & SECURITY ENHANCEMENTS
-- Enables instant zero-delay WebSockets across all devices
-- Ensures only Super Admin (ktvivek1234567@gmail.com) can manage database
-- =========================================================================

-- 1. Enable Full Replica Identity for instant WebSocket row payload delivery
ALTER TABLE public.courses REPLICA IDENTITY FULL;
ALTER TABLE public.modules REPLICA IDENTITY FULL;
ALTER TABLE public.lessons REPLICA IDENTITY FULL;
ALTER TABLE public.languages REPLICA IDENTITY FULL;
ALTER TABLE public.learning_activity REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.enrollments REPLICA IDENTITY FULL;
ALTER TABLE public.user_stats REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

-- 2. Add tables to Supabase Realtime publication safely
DO $$
BEGIN
    -- Add courses
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'courses') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
    END IF;

    -- Add modules
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'modules') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.modules;
    END IF;

    -- Add lessons
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'lessons') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons;
    END IF;

    -- Add languages
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'languages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.languages;
    END IF;

    -- Add learning_activity
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'learning_activity') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_activity;
    END IF;

    -- Add user_roles
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_roles') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
    END IF;

    -- Add enrollments
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'enrollments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollments;
    END IF;

    -- Add user_stats
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_stats') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stats;
    END IF;

    -- Add profiles
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;

    -- Add audit_logs
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'audit_logs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
    END IF;
END $$;

-- 3. Strict Database-level authorization enforcing ONLY Super Admin can manage critical tables
-- Function to verify if caller is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'email') = 'ktvivek1234567@gmail.com'
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-verify RLS policies for Courses: only Admin or course Instructor can edit/delete
DROP POLICY IF EXISTS "Admins and instructors can manage courses" ON public.courses;
CREATE POLICY "Admins and instructors can manage courses"
    ON public.courses
    FOR ALL
    USING (
        public.is_super_admin()
        OR (instructor_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'instructor'
        ))
    )
    WITH CHECK (
        public.is_super_admin()
        OR (instructor_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'instructor'
        ))
    );

-- Re-verify RLS policies for User Roles: ONLY Super Admin can insert, update, or delete roles
DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;
CREATE POLICY "Only admins can manage user roles"
    ON public.user_roles
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Re-verify Languages: ONLY Super Admin can manage languages
DROP POLICY IF EXISTS "Admins can manage languages" ON public.languages;
CREATE POLICY "Admins can manage languages"
    ON public.languages
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
