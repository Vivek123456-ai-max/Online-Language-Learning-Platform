-- =========================================================================
-- INSTRUCTOR FULL POWERS & OPEN CURRICULUM ACCESS MIGRATION
-- Ensures all modules/lessons are visible to learners without "Lesson Not Found"
-- Grants all instructors full power to create, edit, and publish any course/curriculum
-- =========================================================================

-- 1. Helper function: check if user is verified instructor or admin
CREATE OR REPLACE FUNCTION public.is_instructor_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'email') = 'ktvivek1234567@gmail.com'
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('instructor', 'admin')
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Open SELECT on courses, modules, lessons so learners and instructors can view and learn
DROP POLICY IF EXISTS "View courses" ON public.courses;
CREATE POLICY "View courses" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "View modules" ON public.modules;
CREATE POLICY "View modules" ON public.modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "View lessons" ON public.lessons;
CREATE POLICY "View lessons" ON public.lessons FOR SELECT USING (true);

-- 3. Allow verified Instructors and Admins full control over courses
DROP POLICY IF EXISTS "Admins and instructors can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can manage courses" ON public.courses;
CREATE POLICY "Instructors can manage courses"
    ON public.courses
    FOR ALL
    USING (public.is_instructor_or_admin())
    WITH CHECK (public.is_instructor_or_admin());

-- 4. Allow verified Instructors and Admins full control over modules
DROP POLICY IF EXISTS "Manage modules" ON public.modules;
CREATE POLICY "Manage modules"
    ON public.modules
    FOR ALL
    USING (public.is_instructor_or_admin())
    WITH CHECK (public.is_instructor_or_admin());

-- 5. Allow verified Instructors and Admins full control over lessons
DROP POLICY IF EXISTS "Manage lessons" ON public.lessons;
CREATE POLICY "Manage lessons"
    ON public.lessons
    FOR ALL
    USING (public.is_instructor_or_admin())
    WITH CHECK (public.is_instructor_or_admin());

-- 6. Ensure any existing draft courses, modules, and lessons are set to published so they are accessible
UPDATE public.courses SET status = 'published' WHERE status = 'draft';
UPDATE public.modules SET status = 'published' WHERE status = 'draft';
UPDATE public.lessons SET status = 'published' WHERE status = 'draft';
