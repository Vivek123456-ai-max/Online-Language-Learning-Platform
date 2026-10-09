import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/common/Button';
import { Clock, ShieldAlert, ArrowRight, BookOpen, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';

export const InstructorPendingPage: React.FC = () => {
  const { user, profile, isInstructor, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checkedMessage, setCheckedMessage] = useState<string | null>(null);
  const [isApprovedLive, setIsApprovedLive] = useState(false);

  // If already instructor, redirect immediately
  useEffect(() => {
    if (isInstructor) {
      navigate('/instructor', { replace: true });
    }
  }, [isInstructor, navigate]);

  // Real-time listener for instant approval across all devices without refresh
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`instructor-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('[Realtime] User roles updated live:', payload);
          await refreshProfile();
          setIsApprovedLive(true);
          setTimeout(() => {
            navigate('/instructor', { replace: true });
          }, 1500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, refreshProfile]);

  const handleCheckStatus = async () => {
    setIsRefreshing(true);
    setCheckedMessage(null);
    await refreshProfile();
    setTimeout(() => {
      setIsRefreshing(false);
      setCheckedMessage('Status checked: Your application is still currently under review by the administrator.');
    }, 600);
  };

  if (isApprovedLive) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full bg-[#101522] border border-emerald-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Access Granted Live!
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-1">
              Application Approved 🎉
            </h1>
            <p className="text-sm text-slate-300">
              The administrator has authorized your Instructor account. Launching your Course Studio now...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-[#101522] border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Application Under Review
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-1">
            Instructor Access Pending
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Hello <strong className="text-white">{profile?.full_name || user?.email}</strong>, your application to become an authorized CodeVerse Instructor has been submitted.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0d14] border border-slate-800 text-left text-xs space-y-2 text-slate-400">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Administrator Review Policy</span>
          </div>
          <p>
            To guarantee curriculum quality, all instructor accounts must be manually reviewed and approved by CodeVerse platform administration before access to the Course Studio is granted.
          </p>
        </div>

        {checkedMessage && (
          <div className="p-3 bg-slate-900 border border-slate-800 text-xs text-amber-300 rounded-xl">
            {checkedMessage}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleCheckStatus}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="w-full sm:w-auto flex-1 text-xs"
          >
            Check Status
          </Button>

          <Link to="/dashboard" className="w-full sm:w-auto flex-1">
            <Button
              variant="primary"
              size="md"
              leftIcon={<BookOpen className="w-4 h-4" />}
              className="w-full text-xs"
            >
              Learner Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
