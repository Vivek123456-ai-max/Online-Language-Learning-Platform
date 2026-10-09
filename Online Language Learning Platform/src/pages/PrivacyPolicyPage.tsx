import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Database, Server, ArrowLeft } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-indigo-400">
          <Shield className="w-6 h-6" />
          <span className="text-xs uppercase tracking-wider font-mono font-semibold">Legal & Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-slate-400">
          Last revised: October 2026 • Effective for all CodeVerse users worldwide
        </p>
      </div>

      <div className="space-y-8 text-sm text-slate-300 leading-relaxed bg-[#101522] border border-slate-800 p-8 sm:p-10 rounded-3xl">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            1. Information We Collect
          </h2>
          <p>
            CodeVerse collects minimal information necessary to deliver educational programming workflows, track lesson completion, manage streaks, and grant certifications:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400 pl-2">
            <li><strong className="text-slate-200">Account Credentials:</strong> Email address and authentication tokens via Supabase Auth (passwords are securely hashed with bcrypt and never visible to our staff).</li>
            <li><strong className="text-slate-200">Profile Details:</strong> Display name, optional username, avatar preference, and biographical summary.</li>
            <li><strong className="text-slate-200">Learning Records:</strong> Course enrollments, lesson progress, quiz attempts, XP earned, streak logs, and completed project certificates.</li>
            <li><strong className="text-slate-200">Code Submissions:</strong> Code snippets you compile or submit for grading against automated test suites.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-400" />
            2. Code Execution & Sandboxing
          </h2>
          <p>
            When you execute code in Monaco Editor, your code is sent securely to an isolated execution sandbox runner (e.g., Judge0 container). Code is evaluated in an ephemeral, memory-limited sandbox with no access to sensitive platform databases or user tokens. Submissions are retained only to support your personal revision history and automated grading telemetry.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            3. Row Level Security & Data Access
          </h2>
          <p>
            All persistent storage is guarded by PostgreSQL Row Level Security (RLS) policies within Supabase. Your private submissions and progress are accessible strictly to your verified session or authorized instructors reviewing specific assignments.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400" />
            4. Third-Party Disclosures
          </h2>
          <p>
            We do not sell, rent, or monetize your personal information or submitted code. We do not use user learning code to train public foundation models without explicit consent.
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-800 pt-6">
          <h2 className="text-lg font-bold text-white">5. Contact Regarding Privacy</h2>
          <p className="text-xs text-slate-400">
            For privacy inquiries, GDPR data deletion requests, or data export requests, reach out via our{' '}
            <Link to="/contact" className="text-indigo-400 hover:underline">
              Contact & Feedback page
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
};
