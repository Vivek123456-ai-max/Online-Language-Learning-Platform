-- ====================================================================
-- CodeVerse Database Migration 02: Row Level Security (RLS) & Policies
-- ====================================================================

-- 1. Helper Functions (SECURITY DEFINER to safely read roles without recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(check_user_id UUID, check_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id AND role = check_role
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'instructor') OR public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_course_owner(check_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.courses
        WHERE id = check_course_id AND instructor_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.course_instructors
        WHERE course_id = check_course_id AND instructor_id = auth.uid()
    ) OR public.is_admin();
$$;

-- 2. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Profiles Policies
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. User Roles Policies (CRITICAL: Only Admins can modify roles)
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" ON public.user_roles
    FOR ALL USING (public.is_admin());

-- 5. User Stats Policies
DROP POLICY IF EXISTS "Public can view user stats" ON public.user_stats;
CREATE POLICY "Public can view user stats" ON public.user_stats
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
CREATE POLICY "Users can update own stats" ON public.user_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Languages Policies
DROP POLICY IF EXISTS "Anyone can view active languages" ON public.languages;
CREATE POLICY "Anyone can view active languages" ON public.languages
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage languages" ON public.languages;
CREATE POLICY "Admins can manage languages" ON public.languages
    FOR ALL USING (public.is_admin());

-- 7. Courses Policies
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses" ON public.courses
    FOR SELECT USING (
        status = 'published' 
        OR auth.uid() = instructor_id 
        OR public.is_course_owner(id)
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Instructors can insert courses" ON public.courses;
CREATE POLICY "Instructors can insert courses" ON public.courses
    FOR INSERT WITH CHECK (
        (public.is_instructor() AND auth.uid() = instructor_id) OR public.is_admin()
    );

DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;
CREATE POLICY "Instructors can update own courses" ON public.courses
    FOR UPDATE USING (
        (public.is_instructor() AND auth.uid() = instructor_id) OR public.is_admin()
    );

DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;
CREATE POLICY "Admins can delete courses" ON public.courses
    FOR DELETE USING (public.is_admin());

-- 8. Course Instructors Policies
DROP POLICY IF EXISTS "View course instructors" ON public.course_instructors;
CREATE POLICY "View course instructors" ON public.course_instructors
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage course instructors" ON public.course_instructors;
CREATE POLICY "Manage course instructors" ON public.course_instructors
    FOR ALL USING (public.is_course_owner(course_id) OR public.is_admin());

-- 9. Modules Policies
DROP POLICY IF EXISTS "View modules" ON public.modules;
CREATE POLICY "View modules" ON public.modules
    FOR SELECT USING (
        status = 'published' OR public.is_course_owner(course_id) OR public.is_admin()
    );

DROP POLICY IF EXISTS "Manage modules" ON public.modules;
CREATE POLICY "Manage modules" ON public.modules
    FOR ALL USING (public.is_course_owner(course_id) OR public.is_admin());

-- 10. Lessons Policies
DROP POLICY IF EXISTS "View lessons" ON public.lessons;
CREATE POLICY "View lessons" ON public.lessons
    FOR SELECT USING (
        status = 'published' 
        OR EXISTS (
            SELECT 1 FROM public.modules m 
            WHERE m.id = lessons.module_id AND (public.is_course_owner(m.course_id) OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Manage lessons" ON public.lessons;
CREATE POLICY "Manage lessons" ON public.lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.modules m 
            WHERE m.id = lessons.module_id AND (public.is_course_owner(m.course_id) OR public.is_admin())
        )
    );

-- 11. Enrollments Policies
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
CREATE POLICY "Users can view own enrollments" ON public.enrollments
    FOR SELECT USING (
        auth.uid() = user_id 
        OR public.is_course_owner(course_id) 
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Users can enroll themselves" ON public.enrollments;
CREATE POLICY "Users can enroll themselves" ON public.enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enrollment" ON public.enrollments;
CREATE POLICY "Users can update own enrollment" ON public.enrollments
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- 12. Lesson Progress Policies
DROP POLICY IF EXISTS "Users can view own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can view own lesson progress" ON public.lesson_progress
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can record lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can record lesson progress" ON public.lesson_progress
    FOR ALL USING (auth.uid() = user_id);

-- 13. Quizzes & Quiz Questions Policies
DROP POLICY IF EXISTS "View quizzes" ON public.quizzes;
CREATE POLICY "View quizzes" ON public.quizzes
    FOR SELECT USING (status = 'published' OR public.is_instructor());

DROP POLICY IF EXISTS "Manage quizzes" ON public.quizzes;
CREATE POLICY "Manage quizzes" ON public.quizzes
    FOR ALL USING (public.is_instructor());

DROP POLICY IF EXISTS "View quiz questions" ON public.quiz_questions;
CREATE POLICY "View quiz questions" ON public.quiz_questions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Manage quiz questions" ON public.quiz_questions
    FOR ALL USING (public.is_instructor());

-- 14. Quiz Attempts & Responses Policies
DROP POLICY IF EXISTS "View own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "View own quiz attempts" ON public.quiz_attempts
    FOR SELECT USING (auth.uid() = user_id OR public.is_instructor());

DROP POLICY IF EXISTS "Create own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Create own quiz attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Update own quiz attempts" ON public.quiz_attempts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage quiz responses" ON public.quiz_responses;
CREATE POLICY "Manage quiz responses" ON public.quiz_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts qa 
            WHERE qa.id = quiz_responses.attempt_id AND qa.user_id = auth.uid()
        ) OR public.is_admin()
    );

-- 15. Coding Exercises Policies
DROP POLICY IF EXISTS "View coding exercises" ON public.coding_exercises;
CREATE POLICY "View coding exercises" ON public.coding_exercises
    FOR SELECT USING (status = 'published' OR public.is_instructor());

DROP POLICY IF EXISTS "Manage coding exercises" ON public.coding_exercises;
CREATE POLICY "Manage coding exercises" ON public.coding_exercises
    FOR ALL USING (public.is_instructor());

-- 16. Coding Test Cases Policies (NEVER expose private test cases to learners)
DROP POLICY IF EXISTS "View test cases" ON public.coding_test_cases;
CREATE POLICY "View test cases" ON public.coding_test_cases
    FOR SELECT USING (is_public = true OR public.is_instructor() OR public.is_admin());

DROP POLICY IF EXISTS "Manage test cases" ON public.coding_test_cases;
CREATE POLICY "Manage test cases" ON public.coding_test_cases
    FOR ALL USING (public.is_instructor() OR public.is_admin());

-- 17. Coding Submissions Policies
DROP POLICY IF EXISTS "View own coding submissions" ON public.coding_submissions;
CREATE POLICY "View own coding submissions" ON public.coding_submissions
    FOR SELECT USING (auth.uid() = user_id OR public.is_instructor() OR public.is_admin());

DROP POLICY IF EXISTS "Insert own coding submissions" ON public.coding_submissions;
CREATE POLICY "Insert own coding submissions" ON public.coding_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 18. Projects & Project Submissions Policies
DROP POLICY IF EXISTS "View projects" ON public.projects;
CREATE POLICY "View projects" ON public.projects
    FOR SELECT USING (status = 'published' OR public.is_instructor());

DROP POLICY IF EXISTS "Manage projects" ON public.projects;
CREATE POLICY "Manage projects" ON public.projects
    FOR ALL USING (public.is_instructor());

DROP POLICY IF EXISTS "View project submissions" ON public.project_submissions;
CREATE POLICY "View project submissions" ON public.project_submissions
    FOR SELECT USING (auth.uid() = user_id OR public.is_instructor() OR public.is_admin());

DROP POLICY IF EXISTS "Manage own project submissions" ON public.project_submissions;
CREATE POLICY "Manage own project submissions" ON public.project_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update project submissions" ON public.project_submissions;
CREATE POLICY "Update project submissions" ON public.project_submissions
    FOR UPDATE USING (auth.uid() = user_id OR public.is_instructor() OR public.is_admin());

-- 19. Achievements & User Achievements Policies
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
CREATE POLICY "Anyone can view achievements" ON public.achievements
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage achievements" ON public.achievements;
CREATE POLICY "Admins can manage achievements" ON public.achievements
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view user achievements" ON public.user_achievements;
CREATE POLICY "Anyone can view user achievements" ON public.user_achievements
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Record user achievements" ON public.user_achievements;
CREATE POLICY "Record user achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 20. Learning Activity Policies
DROP POLICY IF EXISTS "Users view own activity" ON public.learning_activity;
CREATE POLICY "Users view own activity" ON public.learning_activity
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users record activity" ON public.learning_activity;
CREATE POLICY "Users record activity" ON public.learning_activity
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 21. Content Reviews Policies
DROP POLICY IF EXISTS "Instructors view reviews on own courses" ON public.content_reviews;
CREATE POLICY "Instructors view reviews on own courses" ON public.content_reviews
    FOR SELECT USING (public.is_course_owner(course_id) OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage reviews" ON public.content_reviews;
CREATE POLICY "Admins manage reviews" ON public.content_reviews
    FOR ALL USING (public.is_admin());

-- 22. Notifications Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 23. Audit Logs Policies (Admins only)
DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;
CREATE POLICY "Admins view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin());
