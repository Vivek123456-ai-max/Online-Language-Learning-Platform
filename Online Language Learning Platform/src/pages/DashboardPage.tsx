import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Enrollment, Course } from '../types/database';
import { Button } from '../components/common/Button';
import { 
  Sparkles, 
  Flame, 
  BookOpen, 
  Trophy, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Clock, 
  Compass, 
  ExternalLink,
  Award 
} from 'lucide-react';
import { formatDuration } from '../lib/utils';
import { cache } from '../lib/cache';

export const DashboardPage: React.FC = () => {
  const { user, profile, stats, roles } = useAuth();
  const cachedEnrollments = user ? cache.get<Enrollment[]>(`user-enrollments-${user.id}`) : null;
  const cachedRecommended = cache.get<Course[]>('dashboard-recommended');

  const [enrollments, setEnrollments] = useState<Enrollment[]>(cachedEnrollments || []);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>(cachedRecommended || []);
  const [isLoading, setIsLoading] = useState(!cachedEnrollments);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      try {
        // 1. Fetch user enrollments
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('*, course:courses(*, language:languages(*))')
          .eq('user_id', user.id);

        if (enrollData) {
          setEnrollments(enrollData as Enrollment[]);
          cache.set(`user-enrollments-${user.id}`, enrollData);
        }

        // 2. Fetch courses for recommendation
        const { data: courseData } = await supabase
          .from('courses')
          .select('*, language:languages(*)')
          .eq('status', 'published')
          .limit(3);

        if (courseData) {
          setRecommendedCourses(courseData as Course[]);
          cache.set('dashboard-recommended', courseData);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();

    if (!user) return;

    // Realtime synchronization across devices
    const channel = supabase
      .channel(`learner-dashboard-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enrollments', filter: `user_id=eq.${user.id}` },
        () => {
          console.log('[Realtime] Enrollments updated in learner dashboard');
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => {
          console.log('[Realtime] Published courses updated in learner dashboard');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Hero */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-[#101522] to-slate-900 border border-indigo-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Learner Dashboard
            </span>
            <span className="text-xs text-slate-400">Synced with Supabase Realtime</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {profile?.full_name || user?.email?.split('@')[0]} 👋
          </h1>
          <p className="text-sm text-slate-300">
            Pick up where you left off or dive into a new language track.
          </p>
        </div>

        {/* Realtime Stats Bar */}
        <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="px-3 text-center">
            <div className="flex items-center justify-center gap-1 text-indigo-400 font-bold text-lg">
              <Sparkles className="w-4 h-4" />
              <span>{stats?.xp ?? 0}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400">XP Points</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="px-3 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-lg">
              <Flame className="w-4 h-4" />
              <span>{stats?.streak_count ?? 0}d</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Streak</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="px-3 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400 font-bold text-lg">
              <BookOpen className="w-4 h-4" />
              <span>{stats?.courses_completed ?? 0}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Completed</span>
          </div>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            My Active Courses ({enrollments.length})
          </h2>
          <Link to="/courses" className="text-xs text-indigo-400 hover:underline font-semibold">
            Browse All Courses →
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#101522] border border-slate-800 text-center space-y-4">
            <Compass className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-semibold text-white">No active enrollments yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Explore the course catalog and enroll in C++, Python, or Java to start tracking your lesson progress.
              </p>
            </div>
            <Link to="/courses">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore Course Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enr) => (
              <div
                key={enr.id}
                className="p-6 rounded-2xl bg-[#101522] border border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                      {enr.course?.language?.name}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {enr.progress_percent}% completed
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg">{enr.course?.title}</h3>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${enr.progress_percent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  {enr.progress_percent === 100 ? (
                    <Link to={`/certificates/${enr.id}`}>
                      <Button variant="outline" size="sm" className="w-full text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" leftIcon={<Award className="w-4 h-4 text-emerald-400" />}>
                        View Certificate
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`/courses/${enr.course?.slug}`}>
                      <Button variant="primary" size="sm" className="w-full" leftIcon={<Play className="w-4 h-4" />}>
                        Resume Lesson
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Courses */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Recommended Next Steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedCourses.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl bg-[#101522] border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-indigo-400 block mb-1">{c.language?.name}</span>
                <h3 className="font-bold text-white text-base">{c.title}</h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{c.short_description}</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {formatDuration(c.estimated_duration_hours)}
                </span>
                <Link to={`/courses/${c.slug}`} className="text-xs font-semibold text-indigo-400 hover:underline">
                  View Track →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
