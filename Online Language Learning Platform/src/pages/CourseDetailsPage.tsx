import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Course, Module, Lesson, Enrollment } from '../types/database';
import { Button } from '../components/common/Button';
import { DifficultyBadge } from '../components/common/StatusBadge';
import { Alert } from '../components/common/Alert';
import { 
  BookOpen, 
  Clock, 
  Award, 
  CheckCircle2, 
  Play, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Share2, 
  Check, 
  Layers,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { formatDuration } from '../lib/utils';

export const CourseDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated, isInstructor, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<(Module & { lessons: Lesson[] })[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourseDetails() {
      if (!slug) return;
      setIsLoading(true);
      try {
        // 1. Fetch Course with Language
        const { data: courseData, error: courseErr } = await supabase
          .from('courses')
          .select('*, language:languages(*)')
          .eq('slug', slug)
          .single();

        if (courseErr || !courseData) {
          setIsLoading(false);
          return;
        }

        setCourse(courseData as Course);

        // 2. Fetch Modules and their Lessons
        const { data: modulesData } = await supabase
          .from('modules')
          .select('*, lessons(*)')
          .eq('course_id', courseData.id)
          .order('order_index', { ascending: true });

        if (modulesData) {
          const formattedModules = modulesData.map((m: any) => ({
            ...m,
            lessons: (m.lessons || []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index),
          }));
          setModules(formattedModules);

          // By default open the first module
          if (formattedModules.length > 0) {
            setOpenModules({ [formattedModules[0].id]: true });
          }
        }

        // 3. Check Enrollment if user is authenticated
        if (user) {
          const { data: enrData } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', courseData.id)
            .maybeSingle();

          if (enrData) {
            setEnrollment(enrData as Enrollment);
          }
        }
      } catch (err) {
        console.error('Course details error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCourseDetails();

    const channel = supabase
      .channel(`course-details-${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
        loadCourseDetails();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
        loadCourseDetails();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses', filter: `slug=eq.${slug}` }, () => {
        loadCourseDetails();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug, user]);

  const toggleModule = (modId: string) => {
    setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirectTo=${encodeURIComponent(location.pathname)}`);
      return;
    }

    if (!course || !user) return;

    setIsEnrolling(true);
    setEnrollError(null);

    try {
      // Find the first lesson to start with
      const firstLesson = modules[0]?.lessons[0];

      // 1. Insert into enrollments
      const { data: newEnr, error: enrErr } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: course.id,
          current_lesson_id: firstLesson ? firstLesson.id : null,
          status: 'active',
          progress_percent: 0,
        })
        .select()
        .single();

      if (enrErr) {
        throw enrErr;
      }

      setEnrollment(newEnr as Enrollment);

      // 2. Record learning activity
      await supabase.from('learning_activity').insert({
        user_id: user.id,
        activity_type: 'course_enrolled',
        xp_earned: 25,
        reference_id: course.id,
        metadata: { course_title: course.title },
      });

      // 3. Award 25 welcome XP to user_stats
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('xp')
        .eq('user_id', user.id)
        .maybeSingle();

      if (currentStats) {
        await supabase
          .from('user_stats')
          .update({ xp: (currentStats.xp || 0) + 25 })
          .eq('user_id', user.id);
      }

      // 4. Send notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: `Enrolled in ${course.title} 🎉`,
        message: 'You have enrolled in the course and earned 25 starter XP points. Start your first lesson now!',
        type: 'success',
      });

      await refreshProfile();
    } catch (err: any) {
      setEnrollError(err.message || 'Failed to enroll in course.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 animate-pulse">
        <div className="h-8 w-40 bg-slate-800 rounded-lg" />
        <div className="h-48 bg-[#101522] border border-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-[#101522] border border-slate-800 rounded-2xl" />
          <div className="h-96 bg-[#101522] border border-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-[#101522] border border-slate-800 text-center space-y-4">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Course Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested course could not be located in the published directory.
        </p>
        <Link to="/courses">
          <Button variant="primary" size="sm">
            Browse All Courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top bar navigation */}
      <div className="flex items-center justify-between">
        <Link to="/courses" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>
        {(isInstructor || isAdmin) && (
          <Link to={`/instructor/courses/${course.id}`}>
            <Button variant="outline" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}>
              Edit in Course Studio
            </Button>
          </Link>
        )}
      </div>

      {/* Hero Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-[#101522] to-slate-900 border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="font-mono text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-700"
              style={{ color: course.language?.color || '#6366f1' }}
            >
              {course.language?.name}
            </span>
            <DifficultyBadge difficulty={course.difficulty} />
            {enrollment && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {course.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            {course.description || course.short_description}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 pt-2">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              {formatDuration(course.estimated_duration_hours)}
            </span>
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              {modules.length} Modules • {totalLessons} Lessons
            </span>
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Certificate of Completion
            </span>
          </div>
        </div>
      </div>

      {enrollError && (
        <Alert type="error" onClose={() => setEnrollError(null)}>
          {enrollError}
        </Alert>
      )}

      {/* Main Grid: Syllabus & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Modules & Lessons Syllabus */}
        <div className="lg:col-span-2 space-y-8">
          {/* Learning Objectives */}
          {course.learning_objectives && course.learning_objectives.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                What You'll Learn
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.learning_objectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum Accordion */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Course Curriculum</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {modules.length} modules • {totalLessons} lessons • browser execution
                </p>
              </div>
              <button
                onClick={() => {
                  const allOpen = Object.keys(openModules).length === modules.length;
                  if (allOpen) {
                    setOpenModules({});
                  } else {
                    const all: Record<string, boolean> = {};
                    modules.forEach((m) => (all[m.id] = true));
                    setOpenModules(all);
                  }
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {Object.keys(openModules).length === modules.length ? 'Collapse All' : 'Expand All'}
              </button>
            </div>

            <div className="space-y-3">
              {modules.map((mod, index) => {
                const isOpen = !!openModules[mod.id];
                return (
                  <div
                    key={mod.id}
                    className="rounded-xl bg-[#101522] border border-slate-800 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="text-[11px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                          Module {index + 1}
                        </span>
                        <h3 className="font-bold text-white text-base">{mod.title}</h3>
                        {mod.description && (
                          <p className="text-xs text-slate-400 line-clamp-1">{mod.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-mono">
                          {mod.lessons.length} lessons
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-850 bg-[#0d111b] divide-y divide-slate-850">
                        {mod.lessons.map((lesson) => (
                          <Link
                            key={lesson.id}
                            to={`/learn/${course.slug}/${lesson.slug}`}
                            className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-xs group"
                          >
                            <div className="flex items-center gap-3">
                              <Play className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                              <div>
                                <span className="font-semibold text-slate-200 block group-hover:text-indigo-300 transition-colors">
                                  {lesson.title}
                                </span>
                                {lesson.summary && (
                                  <span className="text-[11px] text-slate-400 line-clamp-1">{lesson.summary}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-slate-500 font-mono shrink-0 pl-2">
                              {lesson.estimated_minutes} min
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prerequisites */}
          {course.prerequisites && course.prerequisites.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-3">
              <h2 className="text-base font-bold text-white">Prerequisites</h2>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {course.prerequisites.map((p, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Enrollment Card */}
        <div className="space-y-6">
          <div className="sticky top-24 p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-6 shadow-2xl">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Track Access</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">Free</span>
                <span className="text-xs text-emerald-400 font-medium">Included with CodeVerse Account</span>
              </div>
            </div>

            {/* Action Button */}
            {enrollment ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-emerald-400 font-semibold">Your Progress</span>
                    <span className="text-white font-mono">{enrollment.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${enrollment.progress_percent}%` }}
                    />
                  </div>
                </div>

                <Link to={`/learn/${course.slug}/${modules[0]?.lessons[0]?.slug || ''}`}>
                  <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Continue Learning
                  </Button>
                </Link>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full py-3"
                onClick={handleEnroll}
                isLoading={isEnrolling}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {isAuthenticated ? 'Enroll Now (Free)' : 'Sign In to Enroll'}
              </Button>
            )}

            <div className="space-y-3 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
              <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">This course includes:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{formatDuration(course.estimated_duration_hours)} structured training</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{totalLessons} interactive lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Monaco Editor sandbox execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Verified completion certificate</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between">
              <button
                onClick={handleCopyLink}
                className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Share Course'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
