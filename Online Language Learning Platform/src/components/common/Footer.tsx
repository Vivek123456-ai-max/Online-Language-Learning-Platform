import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Github, Terminal, Shield, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#07090e]/80 backdrop-blur-md text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Code2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">CodeVerse</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modern full-stack programming platform for learning 19+ programming languages with browser execution, interactive quizzes, and persistent progress.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-indigo-400" /> Monaco Editor</span>
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Supabase RLS</span>
            </div>
          </div>

          {/* Languages */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">Top Languages</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/courses?lang=cpp" className="hover:text-indigo-400 transition-colors">C++ Masterclass</Link></li>
              <li><Link to="/courses?lang=python" className="hover:text-indigo-400 transition-colors">Python for Developers</Link></li>
              <li><Link to="/courses?lang=java" className="hover:text-indigo-400 transition-colors">Java Enterprise</Link></li>
              <li><Link to="/courses?lang=rust" className="hover:text-indigo-400 transition-colors">Rust Systems Programming</Link></li>
              <li><Link to="/courses?lang=typescript" className="hover:text-indigo-400 transition-colors">TypeScript & Web</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/languages" className="hover:text-indigo-400 transition-colors">Explore All 19 Languages</Link></li>
              <li><Link to="/courses" className="hover:text-indigo-400 transition-colors">Course Catalog</Link></li>
              <li><Link to="/paths" className="hover:text-indigo-400 transition-colors">Career Learning Paths</Link></li>
              <li><Link to="/about" className="hover:text-indigo-400 transition-colors">About CodeVerse</Link></li>
            </ul>
          </div>

          {/* Roles & Legal */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">Governance</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/terms" className="hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/contact" className="hover:text-indigo-400 transition-colors">Contact & Feedback</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CodeVerse. Built on Supabase & React. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Powered by Supabase PostgreSQL</span>
            <span>Realtime Enabled</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
