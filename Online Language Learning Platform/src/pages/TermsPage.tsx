import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, AlertTriangle, Scale, ArrowLeft } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-indigo-400">
          <FileText className="w-6 h-6" />
          <span className="text-xs uppercase tracking-wider font-mono font-semibold">User Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Terms of Service</h1>
        <p className="text-sm text-slate-400">
          Last revised: October 2026 • Governs usage of CodeVerse platform and remote execution sandboxes
        </p>
      </div>

      <div className="space-y-8 text-sm text-slate-300 leading-relaxed bg-[#101522] border border-slate-800 p-8 sm:p-10 rounded-3xl">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-400" />
            1. Platform Acceptable Use
          </h2>
          <p>
            CodeVerse is an interactive computer science education platform designed for learning, testing, and mastering software development. By accessing CodeVerse, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400 pl-2">
            <li>Use the remote code execution compilers solely for solving exercises, verifying algorithms, and coursework exploration.</li>
            <li>Maintain accurate profile records and respect intellectual property rights in community forums and projects.</li>
            <li>Not attempt unauthorized access to other user accounts, instructor workspaces, or administrative endpoints.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            2. Prohibited Sandbox Activities
          </h2>
          <p>
            The interactive code execution runners (C++, Python, Java, Rust, etc.) are shared computing environments. The following actions will result in immediate suspension:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400 pl-2">
            <li>Attempting container breakouts, denial-of-service loops (fork bombs, memory exhaustion beyond limits), or network penetration.</li>
            <li>Cryptocurrency mining, botnet activity, or scraping external systems through runner network egress.</li>
            <li>Submitting malicious software, worms, or payload generators.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-400" />
            3. Certification & Course Completion
          </h2>
          <p>
            Certificates issued upon completing all lessons and passing required automated test cases reflect genuine course accomplishment. Altering client-side telemetry or forging completion records will invalidate certificates and result in account termination.
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-800 pt-6">
          <h2 className="text-lg font-bold text-white">4. Modifications to Terms</h2>
          <p className="text-xs text-slate-400">
            We reserve the right to revise these Terms to reflect technical updates, security guidelines, or new programming language runners. Continued use constitutes acceptance of updated policies.
          </p>
        </section>
      </div>
    </div>
  );
};
