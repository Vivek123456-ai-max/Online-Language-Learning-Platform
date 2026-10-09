import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Course, Enrollment, Profile } from '../types/database';
import { Button } from '../components/common/Button';
import { 
  Award, 
  Printer, 
  Share2, 
  Check, 
  ArrowLeft, 
  Code2, 
  ShieldCheck, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const CertificatePage: React.FC = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const { user } = useAuth();

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadCertificate() {
      if (!enrollmentId) return;
      setIsLoading(true);

      try {
        // Fetch enrollment
        const { data: enrData, error: enrErr } = await supabase
          .from('enrollments')
          .select('*, course:courses(*, language:languages(*)), user:profiles(*)')
          .eq('id', enrollmentId)
          .single();

        if (enrErr || !enrData) {
          setIsLoading(false);
          return;
        }

        setEnrollment(enrData as any);
        setCourse(enrData.course as any);
        setLearnerProfile(enrData.user as any);
      } catch (err) {
        console.error('Error loading certificate:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCertificate();
  }, [enrollmentId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-slate-400 gap-3">
        <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Verifying Certificate Credentials...</span>
      </div>
    );
  }

  if (!enrollment || !course || enrollment.progress_percent < 100) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-[#101522] border border-slate-800 text-center space-y-4">
        <Award className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Certificate Unavailable</h2>
        <p className="text-xs text-slate-400">
          This course certificate is only generated when 100% of all curriculum lessons and exercises are completed.
        </p>
        <Link to="/dashboard">
          <Button variant="primary" size="sm">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const certificateCode = `CV-${enrollment.id.substring(0, 8).toUpperCase()}-${course.slug.substring(0, 4).toUpperCase()}`;
  const completionDate = enrollment.completed_at
    ? new Date(enrollment.completed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top action bar (hidden during print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to={`/courses/${course.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          >
            {copied ? 'Link Copied' : 'Share Certificate'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Official Certificate Paper Frame */}
      <div className="relative bg-[#0d111b] border-8 border-[#1f293d] rounded-3xl p-8 sm:p-14 shadow-2xl text-center space-y-8 overflow-hidden print:border-4 print:p-8 print:m-0 print:shadow-none">
        {/* Subtle Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Code2 className="w-96 h-96 text-white" />
        </div>

        {/* Certificate Header */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">CODEVERSE</span>
          </div>

          <div className="pt-2">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-indigo-400 font-bold block">
              Official Certificate of Mastery
            </span>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto mt-2" />
          </div>
        </div>

        {/* Certificate Recipient */}
        <div className="space-y-2 relative z-10 py-4">
          <p className="text-sm uppercase tracking-wider text-slate-400 font-sans">
            This is proudly awarded to
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-serif italic py-2">
            {learnerProfile?.full_name || 'CodeVerse Scholar'}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            for successfully mastering all modules, programming challenges, and algorithmic exercises in
          </p>
        </div>

        {/* Course Title */}
        <div className="relative z-10 py-2">
          <div className="inline-block px-6 py-3 rounded-2xl bg-[#141b2d] border border-indigo-500/30 shadow-inner">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {course.title}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-indigo-300 font-mono">
              <span>Track: {course.language?.name}</span>
              <span>•</span>
              <span>Level: {course.difficulty.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Footer verification & seal */}
        <div className="pt-8 border-t border-slate-800/80 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="text-center sm:text-left space-y-1">
            <span className="font-mono text-[11px] text-slate-500 block uppercase">Verification Credential</span>
            <span className="font-mono text-xs font-bold text-slate-200">{certificateCode}</span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Cryptographically Verified Record
            </div>
          </div>

          {/* Golden Seal */}
          <div className="w-20 h-20 rounded-full border-4 border-amber-500/60 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-600/30 flex flex-col items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            <span className="text-[9px] font-mono font-bold uppercase text-amber-300 mt-0.5">Certified</span>
          </div>

          <div className="text-center sm:text-right space-y-1">
            <span className="font-mono text-[11px] text-slate-500 block uppercase">Issuance Date</span>
            <span className="text-xs font-semibold text-slate-200 flex items-center justify-center sm:justify-end gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {completionDate}
            </span>
            <span className="text-[11px] text-slate-500 block">CodeVerse Academic Council</span>
          </div>
        </div>
      </div>
    </div>
  );
};
