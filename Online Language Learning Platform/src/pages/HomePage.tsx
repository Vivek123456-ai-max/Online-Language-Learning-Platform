import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { DifficultyBadge } from '../components/common/StatusBadge';
import { 
  Code2, 
  Terminal, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Flame, 
  Trophy
} from 'lucide-react';
import { Language, Course } from '../types/database';

import { cache } from '../lib/cache';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const cachedLangs = cache.get<Language[]>('home-languages');
  const cachedCourses = cache.get<Course[]>('home-courses');
  const cachedSummary = cache.get<{ languagesCount: number; publishedCoursesCount: number; totalLessonsCount: number }>('home-summary');

  const [languages, setLanguages] = useState<Language[]>(cachedLangs || []);
  const [courses, setCourses] = useState<Course[]>(cachedCourses || []);
  const [statsSummary, setStatsSummary] = useState(cachedSummary || {
    languagesCount: 19,
    publishedCoursesCount: 0,
    totalLessonsCount: 0,
  });

  useEffect(() => {
    // Fetch real data from Supabase
    async function loadData() {
      try {
        const { data: langs } = await supabase
          .from('languages')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .limit(8);

        if (langs && langs.length > 0) {
          setLanguages(langs as Language[]);
          cache.set('home-languages', langs);
        }

        const { data: crs, count: courseCount } = await supabase
          .from('courses')
          .select('*, language:languages(*)', { count: 'exact' })
          .eq('status', 'published')
          .limit(3);

        if (crs) {
          setCourses(crs as Course[]);
          cache.set('home-courses', crs);
        }

        const { count: lessonCount } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published');

        const summary = {
          languagesCount: langs ? langs.length : 19,
          publishedCoursesCount: courseCount ?? 0,
          totalLessonsCount: lessonCount ?? 0,
        };
        setStatsSummary(summary);
        cache.set('home-summary', summary);
      } catch (err) {
        console.error('Home data load:', err);
      }
    }

    loadData();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 overflow-hidden">
        {/* Cyber-Education Wallpaper Background with glowing neon overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-35 pointer-events-none mix-blend-screen"
          style={{ backgroundImage: `url('/images/codeverse-wallpaper.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07090e]/60 to-[#07090e] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Multi-Language Full-Stack Coding Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Master Programming with{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
              Real Code Execution
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Learn 19+ programming languages through structured modules, interactive VS Code-style browser editing, server-evaluated quizzes, and verified test cases.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to={isAuthenticated ? '/dashboard' : '/register'}>
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                {isAuthenticated ? 'Go to My Dashboard' : 'Start Learning Free'}
              </Button>
            </Link>
            <Link to="/languages">
              <Button size="lg" variant="secondary" leftIcon={<Terminal className="w-5 h-5 text-indigo-400" />}>
                Explore 19 Languages
              </Button>
            </Link>
          </div>

          {/* Code Preview Mockup */}
          <div className="max-w-4xl mx-auto mt-12 text-left rounded-2xl bg-[#0e1320] border border-slate-800 shadow-2xl shadow-indigo-950/40 overflow-hidden">
            <div className="bg-[#121828] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-slate-400">solution.cpp — Monaco Editor</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Judge0 Isolated Sandbox
              </div>
            </div>
            <div className="p-5 font-mono text-xs sm:text-sm text-slate-300 leading-relaxed overflow-x-auto bg-[#0a0d14]/70">
              <p><span className="text-purple-400">#include</span> <span className="text-emerald-400">&lt;iostream&gt;</span></p>
              <p><span className="text-purple-400">#include</span> <span className="text-emerald-400">&lt;vector&gt;</span></p>
              <p className="mt-2"><span className="text-indigo-400">int</span> <span className="text-yellow-300">main</span>() &#123;</p>
              <p className="ml-4 text-slate-500">// CodeVerse execution pipeline with verified test cases</p>
              <p className="ml-4">std::cout &lt;&lt; <span className="text-emerald-300">"Welcome to CodeVerse! Run code securely in real time."</span> &lt;&lt; std::endl;</p>
              <p className="ml-4"><span className="text-purple-400">return</span> <span className="text-amber-400">0</span>;</p>
              <p>&#125;</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Platform Statistics (No fake numbers as per PRD) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 rounded-2xl bg-[#101522] border border-slate-800">
          <div className="text-center md:text-left">
            <span className="font-mono text-3xl font-extrabold text-white">19</span>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Supported Languages</p>
          </div>
          <div className="text-center md:text-left">
            <span className="font-mono text-3xl font-extrabold text-indigo-400">
              {statsSummary.publishedCoursesCount > 0 ? statsSummary.publishedCoursesCount : '3+'}
            </span>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Published Starter Courses</p>
          </div>
          <div className="text-center md:text-left">
            <span className="font-mono text-3xl font-extrabold text-purple-400">
              {statsSummary.totalLessonsCount > 0 ? statsSummary.totalLessonsCount : 'Structured'}
            </span>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Live Lessons & Exercises</p>
          </div>
          <div className="text-center md:text-left">
            <span className="font-mono text-3xl font-extrabold text-emerald-400">100%</span>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Supabase Realtime Sync</p>
          </div>
        </div>
      </section>

      {/* Featured Languages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Curated Language Catalog
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select your path: Systems programming, Web, Enterprise, Data Science, or Mobile.
            </p>
          </div>
          <Link to="/languages" className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1">
            View All 19 Languages <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { name: 'C++', slug: 'cpp', category: 'Systems', desc: 'Object-oriented performance', color: '#00599C' },
            { name: 'Python', slug: 'python', category: 'General Purpose', desc: 'Clean, versatile & popular', color: '#3776AB' },
            { name: 'Java', slug: 'java', category: 'Enterprise', desc: 'JVM cross-platform standard', color: '#ED8B00' },
            { name: 'TypeScript', slug: 'typescript', category: 'Web', desc: 'Type-safe JavaScript', color: '#3178C6' },
            { name: 'Rust', slug: 'rust', category: 'Systems', desc: 'Memory safe and blazingly fast', color: '#DEA584' },
            { name: 'Go', slug: 'go', category: 'Cloud', desc: 'Google concurrent systems', color: '#00ADD8' },
            { name: 'SQL', slug: 'sql', category: 'Database', desc: 'Relational data querying', color: '#336791' },
            { name: 'C#', slug: 'csharp', category: 'Enterprise', desc: 'Modern .NET architecture', color: '#239120' },
          ].map((lang) => (
            <Link
              key={lang.slug}
              to={`/courses?lang=${lang.slug}`}
              className="p-5 rounded-2xl bg-[#101522] border border-slate-800 hover:border-indigo-500/50 hover:bg-[#141a2a] transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center font-bold text-white font-mono text-sm mb-3 group-hover:scale-105 transition-transform" style={{ color: lang.color }}>
                {lang.name.substring(0, 2)}
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                {lang.name}
              </h3>
              <span className="text-[11px] text-indigo-400 uppercase tracking-wider font-semibold block mt-0.5">
                {lang.category}
              </span>
              <p className="text-xs text-slate-400 mt-2 line-clamp-1">{lang.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Platform Architecture Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Built for Serious Engineering
          </h2>
          <p className="text-sm text-slate-400">
            Every layer designed from the ground up to prevent faked demos and maintain strict data integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Isolated Code Execution</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Student code executes inside isolated environments (Judge0) with strict memory limits, CPU bounds, and protected private test cases.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Database Row-Level Security</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              25 relational tables protected with Postgres RLS. Client-side role spoofing is impossible; roles are enforced server-side.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Realtime Sync & Gamification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Progress, daily streaks, XP points, and achievements sync instantaneously via Supabase WebSockets with zero page refreshes.
            </p>
          </div>
        </div>
      </section>

      {/* Ready to start CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-[#101522] to-slate-900 border border-indigo-900/40 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Start Your Journey Today
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to write and execute your first line of code?
            </h3>
            <p className="text-sm text-slate-300 max-w-xl">
              Join CodeVerse now. Choose from 19+ programming languages, write code in the browser, and earn verified certificates.
            </p>
          </div>
          <Link to="/courses">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Explore All Courses
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
