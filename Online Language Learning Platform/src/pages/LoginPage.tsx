import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { SUPER_ADMIN_EMAIL } from '../types/auth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Alert } from '../components/common/Alert';
import { Code2, Mail, Lock, ArrowRight, GraduationCap, Presentation, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, signOut, isAuthenticated, user, isAdmin, isInstructor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState<'learner' | 'instructor' | 'admin'>('learner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const redirectTo = queryParams.get('redirectTo');
  const isSubmittingRef = useRef(false);

  React.useEffect(() => {
    // Only auto-redirect if not in the middle of active submit role verification
    if (isAuthenticated && !isSubmittingRef.current) {
      if (redirectTo && redirectTo !== '/') {
        navigate(redirectTo, { replace: true });
      } else if (user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || isAdmin) {
        navigate('/admin', { replace: true });
      } else if (isInstructor) {
        navigate('/instructor', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, redirectTo, user, isAdmin, isInstructor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    isSubmittingRef.current = true;

    try {
      const cleanEmail = email.trim();
      const isSuperAdminEmail = cleanEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

      // 1. Sign in with Supabase GoTrue Auth
      const { error: signInError } = await signIn(cleanEmail, password);
      if (signInError) {
        isSubmittingRef.current = false;
        setError(signInError.message || 'Invalid email or password. Please verify your credentials.');
        return;
      }

      // 2. Fetch authenticated user roles
      const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
      const currentUserId = currentAuthUser?.id;

      let userRoles: string[] = [];
      if (currentUserId) {
        const { data: roleRecords } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUserId);
        if (roleRecords) {
          userRoles = roleRecords.map((r: any) => r.role);
        }
      }

      // 3. Validate based on selected role

      // --- ADMIN PORTAL ---
      if (selectedRole === 'admin') {
        if (!isSuperAdminEmail && !userRoles.includes('admin')) {
          await signOut();
          isSubmittingRef.current = false;
          setError(`Access Denied: Only authorized Super Administrators (${SUPER_ADMIN_EMAIL}) can sign in through the Admin portal.`);
          return;
        }
        navigate('/admin', { replace: true });
        return;
      }

      // --- INSTRUCTOR PORTAL ---
      if (selectedRole === 'instructor') {
        if (isSuperAdminEmail || userRoles.includes('instructor') || userRoles.includes('admin')) {
          navigate('/instructor', { replace: true });
          return;
        }

        // Check if instructor application is pending admin review
        if (currentUserId) {
          const { data: pendingApp } = await supabase
            .from('learning_activity')
            .select('metadata')
            .eq('user_id', currentUserId)
            .eq('activity_type', 'instructor_application_pending')
            .maybeSingle();

          if (pendingApp && pendingApp.metadata?.status !== 'approved') {
            navigate('/instructor/pending', { replace: true });
            return;
          }
        }

        // Not an authorized instructor
        await signOut();
        isSubmittingRef.current = false;
        setError('This account does not have Instructor permissions yet. If you are a learner, please select "Learner", or apply for instructor review upon registration.');
        return;
      }

      // --- LEARNER PORTAL ---
      if (selectedRole === 'learner') {
        if (redirectTo && redirectTo !== '/') {
          navigate(redirectTo, { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
        return;
      }
    } catch (err: any) {
      isSubmittingRef.current = false;
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative">
      {/* Decorative wallpaper glow on auth page */}
      <div 
        className="absolute inset-0 max-w-4xl mx-auto my-auto h-[600px] bg-cover bg-center opacity-30 pointer-events-none mix-blend-screen rounded-3xl blur-[1px]"
        style={{ backgroundImage: `url('/images/codeverse-wallpaper.jpg')` }}
      />
      <div className="absolute inset-0 bg-radial from-transparent via-[#07090e]/80 to-[#07090e] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Code2 className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign In to CodeVerse
          </h1>
          <p className="text-sm text-slate-400">
            Enter your credentials to access your account securely
          </p>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-3xl bg-[#0e121d]/90 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-indigo-950/40 space-y-5">
          {error && (
            <Alert type="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 3-Role Selection Tabs (User requested: Learner, Instructor, Admin) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-slate-300">
                  Select Who is Logging In:
                </span>
                <span className="text-[11px] font-mono text-indigo-400 capitalize">
                  {selectedRole} Portal Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {/* 1. Learner Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('learner');
                    setError(null);
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    selectedRole === 'learner'
                      ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-500/40'
                      : 'bg-[#0a0d14]/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    selectedRole === 'learner' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs">Learner</span>
                  <span className="text-[10px] text-slate-400 font-mono">Student</span>
                </button>

                {/* 2. Instructor Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('instructor');
                    setError(null);
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    selectedRole === 'instructor'
                      ? 'bg-purple-600/25 border-purple-500 text-white shadow-lg shadow-purple-600/25 ring-2 ring-purple-500/40'
                      : 'bg-[#0a0d14]/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    selectedRole === 'instructor' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Presentation className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs">Instructor</span>
                  <span className="text-[10px] text-slate-400 font-mono">Studio</span>
                </button>

                {/* 3. Admin Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('admin');
                    setError(null);
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'bg-rose-600/25 border-rose-500 text-white shadow-lg shadow-rose-600/25 ring-2 ring-rose-500/40'
                      : 'bg-[#0a0d14]/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    selectedRole === 'admin' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs">Admin</span>
                  <span className="text-[10px] text-slate-400 font-mono">Control</span>
                </button>
              </div>

              {/* Informative micro-badge */}
              <p className="text-[11px] text-slate-400 text-center pt-1">
                {selectedRole === 'learner' && 'Logging in to track courses, code exercises, and earned XP.'}
                {selectedRole === 'instructor' && 'Logging in to create curricula, author lessons, and manage courses.'}
                {selectedRole === 'admin' && 'Restricted to platform Super Administrator for system control.'}
              </p>
            </div>

            <div className="pt-2 space-y-4">
              <Input
                label="Email address"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold uppercase tracking-wider text-slate-300">Password</label>
                  <Link to="/forgot-password" className="text-indigo-400 hover:text-indigo-300 text-xs">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                />
              </div>

              <Button
                type="submit"
                variant={selectedRole === 'admin' ? 'secondary' : 'primary'}
                className={`w-full py-2.5 mt-2 shadow-lg ${
                  selectedRole === 'admin'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25 border-none'
                    : selectedRole === 'instructor'
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/25 border-none'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 border-none'
                }`}
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {selectedRole === 'admin'
                  ? 'Sign In as Super Admin'
                  : selectedRole === 'instructor'
                  ? 'Sign In as Instructor'
                  : 'Sign In as Learner'}
              </Button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
