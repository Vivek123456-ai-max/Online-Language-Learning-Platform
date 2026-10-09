-- ====================================================================
-- CodeVerse Database Migration 03: Triggers, Automatic Profiles & Realtime
-- ====================================================================

-- 1. Automatic Timestamp Update Trigger
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

-- 2. New User Registration Trigger:
-- Automatically creates Profile, Learner Role, and User Stats when a user signs up via Supabase Auth
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

-- 3. Configure Supabase Realtime Replication
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.user_stats REPLICA IDENTITY FULL;
ALTER TABLE public.enrollments REPLICA IDENTITY FULL;
ALTER TABLE public.lesson_progress REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.coding_submissions REPLICA IDENTITY FULL;

DO $pub$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles, public.user_roles, public.user_stats, public.enrollments, public.lesson_progress, public.notifications, public.coding_submissions;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
$pub$;
