-- ==================================================================================
-- CodeVerse — Complete All-in-One Database Setup Script
-- Project: Learning Platform (Supabase ID: bxzdpsmqunpetlvjuptw)
-- Instructions: Copy and paste this script directly into the Supabase Dashboard
--               SQL Editor (https://supabase.com/dashboard/project/bxzdpsmqunpetlvjuptw/sql)
--               and click "Run".
-- ==================================================================================

-- ----------------------------------------------------------------------------------
-- PART 1: CORE SCHEMA (25 Relational Tables & Indexes)
-- ----------------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    github_username TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- User Roles Table (Role-based access: learner, instructor, admin)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('learner', 'instructor', 'admin')),
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role)
);

-- User Stats Table (XP, streaks, analytics)
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    streak_count INTEGER NOT NULL DEFAULT 0 CHECK (streak_count >= 0),
    longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
    last_active_date DATE,
    courses_completed INTEGER NOT NULL DEFAULT 0 CHECK (courses_completed >= 0),
    lessons_completed INTEGER NOT NULL DEFAULT 0 CHECK (lessons_completed >= 0),
    quizzes_passed INTEGER NOT NULL DEFAULT 0 CHECK (quizzes_passed >= 0),
    exercises_solved INTEGER NOT NULL DEFAULT 0 CHECK (exercises_solved >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Languages Catalog (Initial 19 programming languages)
CREATE TABLE IF NOT EXISTS public.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'General',
    description TEXT,
    icon_url TEXT,
    color TEXT DEFAULT '#6366f1',
    is_executable BOOLEAN NOT NULL DEFAULT true,
    judge0_language_id INTEGER,
    version TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
    thumbnail_url TEXT,
    instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    learning_objectives TEXT[] DEFAULT '{}',
    prerequisites TEXT[] DEFAULT '{}',
    estimated_duration_hours NUMERIC(6, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Course Instructors
CREATE TABLE IF NOT EXISTS public.course_instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'primary' CHECK (role IN ('primary', 'co_instructor', 'ta')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT course_instructor_unique UNIQUE (course_id, instructor_id)
);

-- Modules
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT modules_course_slug_unique UNIQUE (course_id, slug)
);

-- Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL DEFAULT '',
    code_example TEXT,
    expected_output TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    estimated_minutes INTEGER NOT NULL DEFAULT 15,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT lessons_module_slug_unique UNIQUE (module_id, slug)
);

-- Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    current_lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    completed_at TIMESTAMPTZ,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT enrollments_user_course_unique UNIQUE (user_id, course_id)
);

-- Lesson Progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT lesson_progress_user_lesson_unique UNIQUE (user_id, lesson_id)
);

-- Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    passing_score_percent INTEGER NOT NULL DEFAULT 70 CHECK (passing_score_percent BETWEEN 1 AND 100),
    time_limit_minutes INTEGER,
    max_attempts INTEGER,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'single_choice' CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'code_prediction')),
    code_snippet TEXT,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanation TEXT,
    points INTEGER NOT NULL DEFAULT 10,
    order_index INTEGER NOT NULL DEFAULT 0
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
    is_passed BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- Quiz Responses
CREATE TABLE IF NOT EXISTS public.quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_answers JSONB DEFAULT '[]'::jsonb,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    points_awarded INTEGER NOT NULL DEFAULT 0
);

-- Coding Exercises
CREATE TABLE IF NOT EXISTS public.coding_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    starter_code TEXT NOT NULL DEFAULT '',
    solution_template TEXT,
    hints TEXT[] DEFAULT '{}',
    constraints TEXT[] DEFAULT '{}',
    xp_reward INTEGER NOT NULL DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Coding Test Cases
CREATE TABLE IF NOT EXISTS public.coding_test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES public.coding_exercises(id) ON DELETE CASCADE,
    input TEXT DEFAULT '',
    expected_output TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0
);

-- Coding Submissions
CREATE TABLE IF NOT EXISTS public.coding_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.coding_exercises(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'compilation_error', 'runtime_error', 'time_limit_exceeded', 'running', 'queued')),
    passed_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER,
    memory_kb INTEGER,
    output TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    deliverables TEXT[] DEFAULT '{}',
    starter_repo_url TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Project Submissions
CREATE TABLE IF NOT EXISTS public.project_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_url TEXT,
    notes TEXT,
    checklist_completed JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
    reviewer_feedback TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_at TIMESTAMPTZ
);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    badge_icon TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'learning' CHECK (category IN ('learning', 'streak', 'coding', 'quiz', 'course')),
    xp_reward INTEGER NOT NULL DEFAULT 50,
    requirement_criteria JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- User Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_achievements_unique UNIQUE (user_id, achievement_id)
);

-- Learning Activity
CREATE TABLE IF NOT EXISTS public.learning_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('lesson_completed', 'quiz_passed', 'code_solved', 'course_enrolled', 'course_completed')),
    xp_earned INTEGER NOT NULL DEFAULT 0,
    reference_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Content Reviews
CREATE TABLE IF NOT EXISTS public.content_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'achievement', 'review')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    link_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_courses_language_id ON public.courses(language_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_coding_exercises_language_id ON public.coding_exercises(language_id);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_user_id ON public.coding_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_exercise_id ON public.coding_submissions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_learning_activity_user_id ON public.learning_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- ----------------------------------------------------------------------------------
-- PART 2: HELPER FUNCTIONS & ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_role(check_user_id UUID, check_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func_has_role$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id AND role = check_role
    );
$func_has_role$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func_is_admin$
    SELECT public.has_role(auth.uid(), 'admin');
$func_is_admin$;

CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func_is_inst$
    SELECT public.has_role(auth.uid(), 'instructor') OR public.is_admin();
$func_is_inst$;

CREATE OR REPLACE FUNCTION public.is_course_owner(check_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func_is_owner$
    SELECT EXISTS (
        SELECT 1 FROM public.courses
        WHERE id = check_course_id AND instructor_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.course_instructors
        WHERE course_id = check_course_id AND instructor_id = auth.uid()
    ) OR public.is_admin();
$func_is_owner$;

-- Enable RLS across all tables
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

-- Profiles Policies
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Roles Policies (Strict: no user can promote themselves)
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- User Stats Policies
DROP POLICY IF EXISTS "Public can view user stats" ON public.user_stats;
CREATE POLICY "Public can view user stats" ON public.user_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
CREATE POLICY "Users can update own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

-- Languages Policies
DROP POLICY IF EXISTS "Anyone can view active languages" ON public.languages;
CREATE POLICY "Anyone can view active languages" ON public.languages FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage languages" ON public.languages;
CREATE POLICY "Admins can manage languages" ON public.languages FOR ALL USING (public.is_admin());

-- Courses Policies
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (
    status = 'published' OR auth.uid() = instructor_id OR public.is_course_owner(id) OR public.is_admin()
);

DROP POLICY IF EXISTS "Instructors can insert courses" ON public.courses;
CREATE POLICY "Instructors can insert courses" ON public.courses FOR INSERT WITH CHECK (
    (public.is_instructor() AND auth.uid() = instructor_id) OR public.is_admin()
);

DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;
CREATE POLICY "Instructors can update own courses" ON public.courses FOR UPDATE USING (
    (public.is_instructor() AND auth.uid() = instructor_id) OR public.is_admin()
);

DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;
CREATE POLICY "Admins can delete courses" ON public.courses FOR DELETE USING (public.is_admin());

-- Course Instructors Policies
DROP POLICY IF EXISTS "View course instructors" ON public.course_instructors;
CREATE POLICY "View course instructors" ON public.course_instructors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage course instructors" ON public.course_instructors;
CREATE POLICY "Manage course instructors" ON public.course_instructors FOR ALL USING (public.is_course_owner(course_id) OR public.is_admin());

-- Modules Policies
DROP POLICY IF EXISTS "View modules" ON public.modules;
CREATE POLICY "View modules" ON public.modules FOR SELECT USING (status = 'published' OR public.is_course_owner(course_id) OR public.is_admin());

DROP POLICY IF EXISTS "Manage modules" ON public.modules;
CREATE POLICY "Manage modules" ON public.modules FOR ALL USING (public.is_course_owner(course_id) OR public.is_admin());

-- Lessons Policies
DROP POLICY IF EXISTS "View lessons" ON public.lessons;
CREATE POLICY "View lessons" ON public.lessons FOR SELECT USING (
    status = 'published' OR EXISTS (SELECT 1 FROM public.modules m WHERE m.id = lessons.module_id AND (public.is_course_owner(m.course_id) OR public.is_admin()))
);

DROP POLICY IF EXISTS "Manage lessons" ON public.lessons;
CREATE POLICY "Manage lessons" ON public.lessons FOR ALL USING (
    EXISTS (SELECT 1 FROM public.modules m WHERE m.id = lessons.module_id AND (public.is_course_owner(m.course_id) OR public.is_admin()))
);

-- Enrollments Policies
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
CREATE POLICY "Users can view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id OR public.is_course_owner(course_id) OR public.is_admin());

DROP POLICY IF EXISTS "Users can enroll themselves" ON public.enrollments;
CREATE POLICY "Users can enroll themselves" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enrollment" ON public.enrollments;
CREATE POLICY "Users can update own enrollment" ON public.enrollments FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Lesson Progress Policies
DROP POLICY IF EXISTS "Users can view own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can view own lesson progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can record lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can record lesson progress" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id);

-- Quizzes Policies
DROP POLICY IF EXISTS "View quizzes" ON public.quizzes;
CREATE POLICY "View quizzes" ON public.quizzes FOR SELECT USING (status = 'published' OR public.is_instructor());

DROP POLICY IF EXISTS "Manage quizzes" ON public.quizzes;
CREATE POLICY "Manage quizzes" ON public.quizzes FOR ALL USING (public.is_instructor());

-- Quiz Questions Policies
DROP POLICY IF EXISTS "View quiz questions" ON public.quiz_questions;
CREATE POLICY "View quiz questions" ON public.quiz_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Manage quiz questions" ON public.quiz_questions FOR ALL USING (public.is_instructor());

-- Quiz Attempts & Responses
DROP POLICY IF EXISTS "View own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "View own quiz attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id OR public.is_instructor());

DROP POLICY IF EXISTS "Create own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Create own quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Update own quiz attempts" ON public.quiz_attempts FOR UPDATE USING (auth.uid() = user_id);

-- Coding Exercises Policies
DROP POLICY IF EXISTS "View coding exercises" ON public.coding_exercises;
CREATE POLICY "View coding exercises" ON public.coding_exercises FOR SELECT USING (status = 'published' OR public.is_instructor());

DROP POLICY IF EXISTS "Manage coding exercises" ON public.coding_exercises;
CREATE POLICY "Manage coding exercises" ON public.coding_exercises FOR ALL USING (public.is_instructor());

-- Coding Test Cases (Private test cases protected from learner access)
DROP POLICY IF EXISTS "View test cases" ON public.coding_test_cases;
CREATE POLICY "View test cases" ON public.coding_test_cases FOR SELECT USING (is_public = true OR public.is_instructor() OR public.is_admin());

DROP POLICY IF EXISTS "Manage test cases" ON public.coding_test_cases;
CREATE POLICY "Manage test cases" ON public.coding_test_cases FOR ALL USING (public.is_instructor() OR public.is_admin());

-- Coding Submissions Policies
DROP POLICY IF EXISTS "View own coding submissions" ON public.coding_submissions;
CREATE POLICY "View own coding submissions" ON public.coding_submissions FOR SELECT USING (auth.uid() = user_id OR public.is_instructor() OR public.is_admin());

DROP POLICY IF EXISTS "Insert own coding submissions" ON public.coding_submissions;
CREATE POLICY "Insert own coding submissions" ON public.coding_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Projects Policies
DROP POLICY IF EXISTS "View projects" ON public.projects;
CREATE POLICY "View projects" ON public.projects FOR SELECT USING (status = 'published' OR public.is_instructor());

DROP POLICY IF EXISTS "Manage projects" ON public.projects;
CREATE POLICY "Manage projects" ON public.projects FOR ALL USING (public.is_instructor());

-- Project Submissions Policies
DROP POLICY IF EXISTS "View project submissions" ON public.project_submissions;
CREATE POLICY "View project submissions" ON public.project_submissions FOR SELECT USING (auth.uid() = user_id OR public.is_instructor() OR public.is_admin());

-- Achievements Policies
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage achievements" ON public.achievements;
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view user achievements" ON public.user_achievements;
CREATE POLICY "Anyone can view user achievements" ON public.user_achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Record user achievements" ON public.user_achievements;
CREATE POLICY "Record user achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Learning Activity Policies
DROP POLICY IF EXISTS "Users view own activity" ON public.learning_activity;
CREATE POLICY "Users view own activity" ON public.learning_activity FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users record activity" ON public.learning_activity;
CREATE POLICY "Users record activity" ON public.learning_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Content Reviews Policies
DROP POLICY IF EXISTS "Instructors view reviews on own courses" ON public.content_reviews;
CREATE POLICY "Instructors view reviews on own courses" ON public.content_reviews FOR SELECT USING (public.is_course_owner(course_id) OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage reviews" ON public.content_reviews;
CREATE POLICY "Admins manage reviews" ON public.content_reviews FOR ALL USING (public.is_admin());

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Audit Logs Policies
DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());

-- ----------------------------------------------------------------------------------
-- PART 3: TRIGGERS, AUTO PROFILE CREATION & REALTIME REPLICATION
-- ----------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $func_updated_at$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$func_updated_at$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_courses_updated_at ON public.courses;
CREATE TRIGGER set_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_modules_updated_at ON public.modules;
CREATE TRIGGER set_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_lessons_updated_at ON public.lessons;
CREATE TRIGGER set_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_user_stats_updated_at ON public.user_stats;
CREATE TRIGGER set_user_stats_updated_at BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto Profile & Learner Role creation trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func_new_user$
DECLARE
    derived_username TEXT;
    derived_name TEXT;
    avatar TEXT;
BEGIN
    derived_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 5)
    );

    derived_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        'https://api.dicebear.com/7.x/bottts/svg?seed=' || NEW.id::text
    );

    INSERT INTO public.profiles (id, email, username, full_name, avatar_url)
    VALUES (NEW.id, NEW.email, derived_username, derived_name, avatar)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'learner')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.user_stats (user_id, xp, streak_count, longest_streak, courses_completed, lessons_completed)
    VALUES (NEW.id, 0, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
        NEW.id,
        'Welcome to CodeVerse! 🚀',
        'Your coding journey begins now. Explore programming languages, enroll in courses, and start learning!',
        'success'
    );

    RETURN NEW;
END;
$func_new_user$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Realtime
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.user_stats REPLICA IDENTITY FULL;
ALTER TABLE public.enrollments REPLICA IDENTITY FULL;
ALTER TABLE public.lesson_progress REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.coding_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.courses REPLICA IDENTITY FULL;
ALTER TABLE public.modules REPLICA IDENTITY FULL;
ALTER TABLE public.lessons REPLICA IDENTITY FULL;
ALTER TABLE public.languages REPLICA IDENTITY FULL;
ALTER TABLE public.learning_activity REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

DO $pub$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
        public.profiles, 
        public.user_roles, 
        public.user_stats, 
        public.enrollments, 
        public.lesson_progress, 
        public.notifications, 
        public.coding_submissions,
        public.courses,
        public.modules,
        public.lessons,
        public.languages,
        public.learning_activity,
        public.audit_logs;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
$pub$;

-- ----------------------------------------------------------------------------------
-- PART 4: INITIAL SEED DATA (19 Languages, Starter Courses, Modules, Lessons)
-- ----------------------------------------------------------------------------------

-- 1. Insert Initial 19 Languages
INSERT INTO public.languages (name, slug, category, description, icon_url, color, is_executable, judge0_language_id, version, display_order)
VALUES
    ('C', 'c', 'Systems', 'Foundational procedural systems programming language.', 'c', '#00599C', true, 50, 'GCC 9.2.0', 1),
    ('C++', 'cpp', 'Systems', 'High-performance object-oriented and systems programming.', 'cpp', '#00599C', true, 54, 'GCC 9.2.0', 2),
    ('Java', 'java', 'Object-Oriented', 'Robust, cross-platform enterprise programming language.', 'java', '#ED8B00', true, 62, 'OpenJDK 13', 3),
    ('Python', 'python', 'General Purpose', 'Clean, high-level language popular in data science, web, and automation.', 'python', '#3776AB', true, 71, '3.8.1', 4),
    ('JavaScript', 'javascript', 'Web', 'The ubiquitous language of the web for client and server.', 'javascript', '#F7DF1E', true, 63, 'Node.js 18', 5),
    ('TypeScript', 'typescript', 'Web', 'JavaScript with strongly typed static syntax.', 'typescript', '#3178C6', true, 74, '4.9.4', 6),
    ('HTML', 'html', 'Web Markup', 'Standard markup language for documents designed to be displayed in a web browser.', 'html', '#E34F26', false, NULL, 'HTML5', 7),
    ('CSS', 'css', 'Web Styling', 'Style sheet language used for describing presentation of a document.', 'css', '#1572B6', false, NULL, 'CSS3', 8),
    ('SQL', 'sql', 'Database', 'Standard language for storing, manipulating and retrieving data in relational databases.', 'sql', '#336791', true, NULL, 'PostgreSQL 15', 9),
    ('C#', 'csharp', 'Enterprise', 'Modern, type-safe programming language for .NET ecosystem.', 'csharp', '#239120', true, 51, 'Mono 6.6.0', 10),
    ('PHP', 'php', 'Web Backend', 'Popular general-purpose scripting language suited for web development.', 'php', '#777BB4', true, 68, '7.4.1', 11),
    ('Go', 'go', 'Cloud & Systems', 'Concurrent, garbage-collected language designed by Google.', 'go', '#00ADD8', true, 60, '1.13.5', 12),
    ('Rust', 'rust', 'Systems', 'Blazingly fast and memory-efficient with guaranteed memory safety.', 'rust', '#DEA584', true, 73, '1.40.0', 13),
    ('Kotlin', 'kotlin', 'Mobile & JVM', 'Modern concise language for Android and multiplatform development.', 'kotlin', '#7F52FF', true, 78, '1.3.70', 14),
    ('Swift', 'swift', 'Apple Ecosystem', 'Fast, safe, and expressive language for iOS and macOS apps.', 'swift', '#FA7343', true, 83, '5.2.3', 15),
    ('Ruby', 'ruby', 'Web & Scripting', 'Dynamic, open source language with a focus on simplicity and productivity.', 'ruby', '#CC342D', true, 72, '2.7.0', 16),
    ('Dart', 'dart', 'Mobile & UI', 'Client-optimized language for fast apps on any platform (Flutter).', 'dart', '#0175C2', true, 90, '2.19.2', 17),
    ('Bash', 'bash', 'Scripting', 'Unix shell and command language for automation and system administration.', 'bash', '#4EAA25', true, 46, '5.0.0', 18),
    ('R', 'r', 'Data Science', 'Language and environment for statistical computing and graphics.', 'r', '#276DC3', true, 80, '4.0.0', 19)
ON CONFLICT (slug) DO UPDATE
SET is_executable = EXCLUDED.is_executable,
    judge0_language_id = EXCLUDED.judge0_language_id;

-- 2. Insert Starter Published Courses
INSERT INTO public.courses (language_id, title, slug, short_description, description, difficulty, estimated_duration_hours, status, published_at, learning_objectives, prerequisites)
SELECT 
    id,
    'C++ Fundamentals: Zero to Hero',
    'cpp-fundamentals',
    'Master core C++ syntax, pointers, memory management, and OOP fundamentals.',
    'A comprehensive introductory track to modern C++ programming. Learn variables, functions, pointers, references, standard template library (STL), and modern object-oriented paradigms.',
    'beginner',
    18.5,
    'published',
    now(),
    ARRAY['Understand basic syntax and compilation', 'Master pointers and references', 'Write Object-Oriented code in C++'],
    ARRAY['Basic computer literacy', 'No prior coding experience required']
FROM public.languages WHERE slug = 'cpp'
ON CONFLICT (slug) DO UPDATE SET status = 'published';

INSERT INTO public.courses (language_id, title, slug, short_description, description, difficulty, estimated_duration_hours, status, published_at, learning_objectives, prerequisites)
SELECT 
    id,
    'Python 3: From Scratch to Fluency',
    'python-from-scratch',
    'Learn clean Pythonic code, data structures, functions, and modern scripting.',
    'The complete foundational course for Python developers. Covers core language primitives, data structures, object-oriented concepts, and standard library tools.',
    'beginner',
    14.0,
    'published',
    now(),
    ARRAY['Master Python syntax and logic flows', 'Leverage lists, dictionaries and sets', 'Build modular functions'],
    ARRAY['No prior programming background required']
FROM public.languages WHERE slug = 'python'
ON CONFLICT (slug) DO UPDATE SET status = 'published';

INSERT INTO public.courses (language_id, title, slug, short_description, description, difficulty, estimated_duration_hours, status, published_at, learning_objectives, prerequisites)
SELECT 
    id,
    'Java Programming: Core & Object Orientation',
    'java-core-essentials',
    'Build enterprise-ready Java applications with strong OOP foundations.',
    'A structured journey through the Java language, standard libraries, classes, inheritance, and clean code practices.',
    'beginner',
    20.0,
    'published',
    now(),
    ARRAY['Understand JVM architecture', 'Design clean classes and interfaces', 'Apply Java collections'],
    ARRAY['None']
FROM public.languages WHERE slug = 'java'
ON CONFLICT (slug) DO UPDATE SET status = 'published';

-- 3. Insert Starter Modules
INSERT INTO public.modules (course_id, title, slug, description, order_index, status)
SELECT 
    id,
    'Module 1: Getting Started with C++',
    'module-1-getting-started',
    'Your first steps in modern C++ compilation and syntax.',
    1,
    'published'
FROM public.courses WHERE slug = 'cpp-fundamentals'
ON CONFLICT (course_id, slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.modules (course_id, title, slug, description, order_index, status)
SELECT 
    id,
    'Module 1: Introduction to Python',
    'py-mod-1-intro',
    'Syntax, printing, variables, and numbers.',
    1,
    'published'
FROM public.courses WHERE slug = 'python-from-scratch'
ON CONFLICT (course_id, slug) DO UPDATE SET title = EXCLUDED.title;

-- 4. Insert Starter Lessons
INSERT INTO public.lessons (module_id, title, slug, summary, content, code_example, expected_output, order_index, estimated_minutes, status)
SELECT 
    id,
    '1.1 Hello World & Basic Structure',
    'cpp-hello-world',
    'Write and compile your very first C++ program using std::cout.',
    'Welcome to C++! C++ is a high-performance compiled language created by Bjarne Stroustrup. Every C++ program begins execution at the main() function. Use std::cout to print text to the standard output.',
    '#include <iostream>

int main() {
    std::cout << "Hello, CodeVerse!" << std::endl;
    return 0;
}',
    'Hello, CodeVerse!',
    1,
    10,
    'published'
FROM public.modules WHERE slug = 'module-1-getting-started'
ON CONFLICT (module_id, slug) DO NOTHING;

INSERT INTO public.lessons (module_id, title, slug, summary, content, code_example, expected_output, order_index, estimated_minutes, status)
SELECT 
    id,
    '1.1 Hello Python & Interactive Scripting',
    'py-hello-world',
    'Understand Python syntax elegance and write your first script.',
    'Welcome to Python! Python is known for its readable, human-friendly syntax. Unlike C++ or Java, Python does not require boilerplate classes or semicolons.',
    'print("Hello, CodeVerse!")',
    'Hello, CodeVerse!',
    1,
    10,
    'published'
FROM public.modules WHERE slug = 'py-mod-1-intro'
ON CONFLICT (module_id, slug) DO NOTHING;

-- 5. Insert Initial Achievements Catalog
INSERT INTO public.achievements (title, slug, description, badge_icon, category, xp_reward, requirement_criteria)
VALUES
    ('First Steps', 'first-steps', 'Complete your very first lesson on CodeVerse.', 'footprints', 'learning', 50, '{"lessons_completed": 1}'),
    ('Streak Starter', 'streak-starter', 'Maintain a 3-day consecutive learning streak.', 'flame', 'streak', 100, '{"streak_count": 3}'),
    ('Streak Master', 'streak-master', 'Maintain a 7-day consecutive learning streak.', 'zap', 'streak', 250, '{"streak_count": 7}'),
    ('Code Explorer', 'code-explorer', 'Enroll in at least 3 distinct programming language courses.', 'compass', 'course', 150, '{"courses_enrolled": 3}'),
    ('Bug Buster', 'bug-buster', 'Pass your first automated coding exercise.', 'check-circle', 'coding', 75, '{"exercises_solved": 1}'),
    ('Quiz Ace', 'quiz-ace', 'Pass a course quiz with a 100% score.', 'award', 'quiz', 120, '{"perfect_quiz_count": 1}'),
    ('Course Graduate', 'course-graduate', 'Complete all lessons and exercises in a full course.', 'graduation-cap', 'course', 500, '{"courses_completed": 1}')
ON CONFLICT (slug) DO NOTHING;
