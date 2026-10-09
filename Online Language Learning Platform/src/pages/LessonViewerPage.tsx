import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Course, Module, Lesson, Quiz, QuizQuestion } from '../types/database';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { CodeWorkspace } from '../components/learn/CodeWorkspace';
import { QuizPanel } from '../components/learn/QuizPanel';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  Play, 
  BookOpen, 
  Code2, 
  HelpCircle, 
  Menu, 
  X, 
  Trophy, 
  Sparkles, 
  Columns, 
  Maximize2,
  Clock,
  ExternalLink
} from 'lucide-react';

export const LessonViewerPage: React.FC = () => {
  const { courseSlug, lessonSlug } = useParams<{ courseSlug: string; lessonSlug: string }>();
  const { user, isAuthenticated, isInstructor, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // State
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<(Module & { lessons: Lesson[] })[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'workspace' | 'quiz'>('workspace');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'tabs'>('split');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch Course, Modules, and Lessons
  useEffect(() => {
    async function loadCurriculum() {
      if (!courseSlug) return;
      setIsLoading(true);

      try {
        const { data: courseData, error: courseErr } = await supabase
          .from('courses')
          .select('*, language:languages(*)')
          .eq('slug', courseSlug)
          .single();

        if (courseErr || !courseData) {
          setIsLoading(false);
          return;
        }

        setCourse(courseData as Course);

        const { data: modulesData } = await supabase
          .from('modules')
          .select('*, lessons(*)')
          .eq('course_id', courseData.id)
          .order('order_index', { ascending: true });

        if (modulesData) {
          const formatted = modulesData.map((m: any) => ({
            ...m,
            lessons: (m.lessons || []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index),
          }));
          setModules(formatted);
        }

        // Check enrollment
        if (user) {
          const { data: enrData } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseData.id)
            .maybeSingle();

          if (enrData) {
            setEnrollmentId(enrData.id);
          }
        }
      } catch (err) {
        console.error('Failed to load curriculum:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCurriculum();
  }, [courseSlug, user]);

  // 2. Determine Current Lesson and fetch Quiz/Progress
  useEffect(() => {
    if (!modules.length) return;

    // Flatten all lessons
    const allLessons = modules.flatMap((m) => m.lessons || []);
    let target = allLessons.find((l) => l.slug === lessonSlug);

    // Default to first lesson if slug is not matched
    if (!target && allLessons.length > 0) {
      target = allLessons[0];
    }

    if (target) {
      setCurrentLesson(target);
      loadLessonMeta(target.id);

      if (courseSlug && (!lessonSlug || lessonSlug !== target.slug)) {
        navigate(`/learn/${courseSlug}/${target.slug}`, { replace: true });
      }

      if (user) {
        const progChannel = supabase
          .channel(`realtime-progress-${user.id}-${target.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'lesson_progress', filter: `user_id=eq.${user.id}` },
            () => {
              loadLessonMeta(target.id);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(progChannel);
        };
      }
    }
  }, [modules, lessonSlug, user]);

  const loadLessonMeta = async (lessonId: string) => {
    try {
      // 1. Fetch completed progress for the user
      if (user) {
        const { data: progData } = await supabase
          .from('lesson_progress')
          .select('lesson_id, is_completed')
          .eq('user_id', user.id)
          .eq('is_completed', true);

        if (progData) {
          setCompletedLessonIds(new Set(progData.map((p) => p.lesson_id)));
        }

        // Record last_accessed_at
        await supabase
          .from('lesson_progress')
          .upsert(
            {
              user_id: user.id,
              lesson_id: lessonId,
              last_accessed_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,lesson_id' }
          );
      }

      // 2. Fetch Quiz if any
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('status', 'published')
        .maybeSingle();

      if (quizData) {
        setQuiz(quizData as Quiz);
        const { data: qData } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizData.id)
          .order('order_index', { ascending: true });

        if (qData) {
          setQuizQuestions(qData as QuizQuestion[]);
        }
      } else {
        setQuiz(null);
        setQuizQuestions([]);
      }
    } catch (err) {
      console.error('Error fetching lesson meta:', err);
    }
  };

  // Flattened lessons list for sequential navigation
  const flatLessons = useMemo(() => {
    return modules.flatMap((m) => m.lessons || []);
  }, [modules]);

  const currentIndex = useMemo(() => {
    if (!currentLesson) return -1;
    return flatLessons.findIndex((l) => l.id === currentLesson.id);
  }, [flatLessons, currentLesson]);

  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  const isCurrentCompleted = currentLesson ? completedLessonIds.has(currentLesson.id) : false;

  // Progress Calculation
  const progressPercent = useMemo(() => {
    if (flatLessons.length === 0) return 0;
    return Math.round((completedLessonIds.size / flatLessons.length) * 100);
  }, [completedLessonIds, flatLessons]);

  // Mark Completed Handler
  const handleCompleteAndNext = async () => {
    if (!currentLesson) return;

    if (!user) {
      // Non-authenticated user
      if (nextLesson) {
        navigate(`/learn/${courseSlug}/${nextLesson.slug}`);
      }
      return;
    }

    setIsSavingProgress(true);
    setStatusMessage(null);

    try {
      // 1. Upsert lesson progress
      const { error: progErr } = await supabase.from('lesson_progress').upsert(
        {
          user_id: user.id,
          lesson_id: currentLesson.id,
          is_completed: true,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      );

      if (progErr) throw progErr;

      const updatedCompleted = new Set(completedLessonIds).add(currentLesson.id);
      setCompletedLessonIds(updatedCompleted);

      // 2. Award 15 XP
      const xpReward = 15;
      await supabase.from('learning_activity').insert({
        user_id: user.id,
        activity_type: 'lesson_completed',
        xp_earned: xpReward,
        reference_id: currentLesson.id,
        metadata: {
          lesson_title: currentLesson.title,
          course_title: course?.title,
        },
      });

      // 3. Update user_stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('xp, lessons_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (stats) {
        await supabase
          .from('user_stats')
          .update({
            xp: (stats.xp || 0) + xpReward,
            lessons_completed: (stats.lessons_completed || 0) + 1,
          })
          .eq('user_id', user.id);
      }

      // 4. Update enrollment progress
      if (course) {
        const newProgress = Math.round((updatedCompleted.size / Math.max(1, flatLessons.length)) * 100);
        const isFinished = newProgress === 100;

        await supabase
          .from('enrollments')
          .update({
            progress_percent: newProgress,
            current_lesson_id: nextLesson ? nextLesson.id : currentLesson.id,
            status: isFinished ? 'completed' : 'active',
            completed_at: isFinished ? new Date().toISOString() : null,
          })
          .eq('user_id', user.id)
          .eq('course_id', course.id);

        if (isFinished) {
          // Course completed badge & activity
          await supabase.from('learning_activity').insert({
            user_id: user.id,
            activity_type: 'course_completed',
            xp_earned: 100,
            reference_id: course.id,
            metadata: { course_title: course.title },
          });

          await supabase.from('notifications').insert({
            user_id: user.id,
            title: `Course Completed: ${course.title} 🏆`,
            message: `Congratulations! You completed all lessons in ${course.title} and earned 100 bonus XP.`,
            type: 'success',
          });
        }
      }

      await refreshProfile();

      setStatusMessage({
        type: 'success',
        text: `Lesson completed! +${xpReward} XP awarded.`,
      });

      // Auto advance to next lesson after short notification
      if (nextLesson) {
        setTimeout(() => {
          navigate(`/learn/${courseSlug}/${nextLesson.slug}`);
        }, 600);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to update progress.',
      });
    } finally {
      setIsSavingProgress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0d14] text-slate-400 gap-3">
        <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Launching CodeVerse Learning Environment...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-[#101522] border border-slate-800 text-center space-y-4">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Course Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested course could not be located in the catalog.
        </p>
        <Link to="/courses">
          <Button variant="primary" size="sm">
            Return to Courses
          </Button>
        </Link>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="max-w-lg mx-auto my-20 p-8 rounded-3xl bg-[#101522] border border-slate-800 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
          <BookOpen className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Curriculum in Preparation</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            {isInstructor || isAdmin
              ? 'This course currently has no lessons. As an instructor or admin, you can open the Course Studio and publish modules and interactive code lessons.'
              : 'Lessons for this course are currently being authored and verified by instructors. Check back shortly to start learning!'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isInstructor || isAdmin ? (
            <Link to={`/instructor/courses/${course.id}`}>
              <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                Open Course Studio
              </Button>
            </Link>
          ) : null}
          <Link to={`/courses/${course.slug}`}>
            <Button variant="outline" size="sm">
              Course Overview
            </Button>
          </Link>
          <Link to="/courses">
            <Button variant="ghost" size="sm">
              Browse All Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0a0d14] overflow-hidden">
      {/* Top Learning Navigation Bar */}
      <header className="h-14 bg-[#101522] border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            title="Toggle Curriculum Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link
            to={`/courses/${course.slug}`}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </Link>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2 overflow-hidden">
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded uppercase"
              style={{
                backgroundColor: `${course.language?.color || '#6366f1'}20`,
                color: course.language?.color || '#818cf8',
              }}
            >
              {course.language?.name}
            </span>
            <span className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-xs md:max-w-md">
              {currentLesson.title}
            </span>
          </div>
        </div>

        {/* Center / Right controls: Progress & Mode Switcher */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Progress bar */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">{progressPercent}% done</span>
            <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* View Mode Toggle (Desktop only) */}
          <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded text-xs transition-colors flex items-center gap-1 ${
                viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Side-by-side split view"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="text-[11px]">Split</span>
            </button>
            <button
              onClick={() => setViewMode('tabs')}
              className={`p-1.5 rounded text-xs transition-colors flex items-center gap-1 ${
                viewMode === 'tabs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Full workspace tab view"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Tabs</span>
            </button>
          </div>

          {/* Complete & Next Action Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleCompleteAndNext}
            isLoading={isSavingProgress}
            leftIcon={isCurrentCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : undefined}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="text-xs shadow-md shadow-indigo-600/20"
          >
            {isCurrentCompleted ? 'Next Lesson' : 'Complete & Next'}
          </Button>
        </div>
      </header>

      {/* Status banner */}
      {statusMessage && (
        <div className="px-4 py-2 bg-indigo-950/80 border-b border-indigo-800 text-xs text-indigo-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)}>
            <X className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Curriculum Tree */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-72 sm:w-80 bg-[#0d111b] border-r border-slate-800 flex flex-col transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                Curriculum
              </span>
              <h3 className="font-bold text-white text-sm truncate">{course.title}</h3>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {modules.map((mod, modIdx) => (
              <div key={mod.id} className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 px-2 font-bold tracking-wider">
                  Module {modIdx + 1}: {mod.title}
                </span>

                <div className="space-y-1">
                  {mod.lessons.map((lesson) => {
                    const isActive = lesson.id === currentLesson.id;
                    const isCompleted = completedLessonIds.has(lesson.id);

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          navigate(`/learn/${course.slug}/${lesson.slug}`);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          isActive
                            ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isActive ? (
                            <Play className="w-3.5 h-3.5 text-indigo-400 fill-current shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0 pl-1">
                          {lesson.estimated_minutes}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-800 bg-[#0a0d14] text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>{completedLessonIds.size} / {flatLessons.length} Done</span>
            </span>
            <span className="font-mono text-indigo-400">+{completedLessonIds.size * 15} XP</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0a0d14]">
          {/* Tab Selector when in tabs mode or mobile */}
          <div className={`px-4 py-2 bg-[#0c0f18] border-b border-slate-800 flex items-center gap-2 ${
            viewMode === 'split' ? 'lg:hidden' : ''
          }`}>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'content'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lesson Theory</span>
            </button>

            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'workspace'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Monaco Editor</span>
            </button>

            {quiz && (
              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'quiz'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Knowledge Quiz</span>
              </button>
            )}
          </div>

          {/* Layout Renderer: Split vs Tabs */}
          <div className="flex-1 flex overflow-hidden p-3 sm:p-4 gap-4">
            {/* Split View (Desktop) */}
            {viewMode === 'split' ? (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-hidden">
                {/* Left Pane: Theory & Lesson Notes */}
                <div className="h-full overflow-y-auto pr-1 space-y-6 bg-[#101522] border border-slate-800 rounded-2xl p-6 sm:p-8">
                  <div className="space-y-2 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono">
                      <span>Lesson {currentIndex + 1} of {flatLessons.length}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {currentLesson.estimated_minutes} min read
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {currentLesson.title}
                    </h1>
                    {currentLesson.summary && (
                      <p className="text-sm text-slate-300 leading-relaxed pt-1">
                        {currentLesson.summary}
                      </p>
                    )}
                  </div>

                  {/* Rendered Lesson Content */}
                  <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
                    {currentLesson.content.split('\n\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h3 key={idx} className="text-lg font-bold text-white pt-2 border-b border-slate-800/60 pb-1">
                            {paragraph.replace('### ', '')}
                          </h3>
                        );
                      }
                      if (paragraph.startsWith('# ')) {
                        return (
                          <h2 key={idx} className="text-xl font-bold text-white pt-2">
                            {paragraph.replace('# ', '')}
                          </h2>
                        );
                      }
                      if (paragraph.startsWith('```')) {
                        const cleanCode = paragraph.replace(/```[a-z]*\n?/g, '');
                        return (
                          <pre key={idx} className="p-4 bg-[#0d111b] rounded-xl text-xs font-mono text-indigo-300 border border-slate-800 overflow-x-auto">
                            {cleanCode}
                          </pre>
                        );
                      }
                      return <p key={idx}>{paragraph}</p>;
                    })}
                  </div>

                  {/* Expected output callout */}
                  {currentLesson.expected_output && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                      <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                        Expected Program Output:
                      </span>
                      <pre className="font-mono text-xs text-white pt-1">
                        {currentLesson.expected_output}
                      </pre>
                    </div>
                  )}

                  {/* Quiz Section inside split view if available */}
                  {quiz && quizQuestions.length > 0 && (
                    <div className="pt-6 border-t border-slate-800">
                      <QuizPanel
                        quiz={quiz}
                        questions={quizQuestions}
                        onQuizCompleted={(_score, _passed) => {
                          refreshProfile();
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Right Pane: Monaco Code Workspace */}
                <div className="h-full flex flex-col overflow-hidden">
                  <CodeWorkspace
                    initialCode={currentLesson.code_example || '// Write your code here'}
                    languageSlug={course.language?.slug || 'cpp'}
                    expectedOutput={currentLesson.expected_output}
                  />
                </div>
              </div>
            ) : (
              /* Tabbed View */
              <div className="flex-1 h-full overflow-hidden">
                {activeTab === 'content' && (
                  <div className="h-full overflow-y-auto bg-[#101522] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
                    <div className="space-y-2 border-b border-slate-800/80 pb-4">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {currentLesson.title}
                      </h1>
                      {currentLesson.summary && (
                        <p className="text-sm text-slate-300 leading-relaxed pt-1">
                          {currentLesson.summary}
                        </p>
                      )}
                    </div>

                    <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
                      {currentLesson.content.split('\n\n').map((paragraph, idx) => {
                        if (paragraph.startsWith('### ')) {
                          return (
                            <h3 key={idx} className="text-lg font-bold text-white pt-2 border-b border-slate-800/60 pb-1">
                              {paragraph.replace('### ', '')}
                            </h3>
                          );
                        }
                        if (paragraph.startsWith('```')) {
                          const cleanCode = paragraph.replace(/```[a-z]*\n?/g, '');
                          return (
                            <pre key={idx} className="p-4 bg-[#0d111b] rounded-xl text-xs font-mono text-indigo-300 border border-slate-800 overflow-x-auto">
                              {cleanCode}
                            </pre>
                          );
                        }
                        return <p key={idx}>{paragraph}</p>;
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'workspace' && (
                  <div className="h-full flex flex-col overflow-hidden">
                    <CodeWorkspace
                      initialCode={currentLesson.code_example || '// Write your code here'}
                      languageSlug={course.language?.slug || 'cpp'}
                      expectedOutput={currentLesson.expected_output}
                    />
                  </div>
                )}

                {activeTab === 'quiz' && quiz && (
                  <div className="h-full overflow-y-auto max-w-3xl mx-auto">
                    <QuizPanel
                      quiz={quiz}
                      questions={quizQuestions}
                      onQuizCompleted={(_score, _passed) => {
                        refreshProfile();
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Lesson Navigation Bar */}
          <footer className="h-14 bg-[#101522] border-t border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
            <div>
              {prevLesson ? (
                <button
                  onClick={() => navigate(`/learn/${courseSlug}/${prevLesson.slug}`)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous:</span>
                  <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{prevLesson.title}</span>
                </button>
              ) : (
                <span className="text-xs text-slate-600">First lesson</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {nextLesson && (
                <button
                  onClick={() => navigate(`/learn/${courseSlug}/${nextLesson.slug}`)}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
                >
                  <span className="hidden sm:inline">Next:</span>
                  <span className="truncate max-w-[120px] sm:max-w-none">{nextLesson.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
