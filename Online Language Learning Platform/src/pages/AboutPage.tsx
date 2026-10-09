import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { 
  Code2, 
  Terminal, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Database,
  Award
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 mx-auto">
          <Code2 className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          About CodeVerse
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          CodeVerse was built on a simple conviction: programming cannot be mastered by watching passive videos alone. True mastery requires writing real code, executing it in authentic runtimes, and solving test cases.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-lg">Execution First</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every concept is paired with an interactive Monaco editor session backed by isolated sandbox compilers.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-lg">19+ Languages</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            From foundational systems languages (C, C++, Rust) to modern enterprise stacks (Java, Python, TypeScript, Go).
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-lg">Real Data Integrity</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Zero fake reviews or fabricated learner numbers. All metrics, streaks, and progress reflect verified database state.
          </p>
        </div>
      </div>

      {/* Architecture & Engineering Standards */}
      <div className="p-8 rounded-3xl bg-[#101522] border border-slate-800 space-y-6">
        <h2 className="text-2xl font-bold text-white">Engineering Architecture</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>PostgreSQL relational architecture with 25 tables and foreign keys.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>Row-Level Security (RLS) actively guarding every table.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>Supabase Realtime WebSockets for zero-refresh XP and streak synchronization.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>Isolated runner limits on CPU, memory, and wall-time execution.</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4 pt-4">
        <h3 className="text-xl font-bold text-white">Ready to elevate your engineering skills?</h3>
        <Link to="/courses">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
            Explore Course Catalog
          </Button>
        </Link>
      </div>
    </div>
  );
};
