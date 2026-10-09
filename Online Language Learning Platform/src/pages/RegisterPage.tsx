import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SUPER_ADMIN_EMAIL } from '../types/auth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Alert } from '../components/common/Alert';
import { 
  Code2, 
  Mail, 
  Lock, 
  User, 
  AtSign, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  GraduationCap, 
  Presentation, 
  Clock, 
  ShieldAlert, 
  Sparkles,
  Layers
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Role Selection State
  const [selectedRole, setSelectedRole] = useState<'learner' | 'instructor'>('learner');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Instructor specific fields
  const [expertise, setExpertise] = useState('');
  const [bio, setBio] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      if (selectedRole === 'learner') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/instructor', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: signUpError } = await signUp(
        email,
        password,
        fullName,
        username,
        selectedRole,
        expertise,
        bio
      );

      if (signUpError) {
        setError(signUpError.message || 'Registration failed. Please try again.');
      } else {
        setRegisteredSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      {/* Decorative wallpaper glow on register page */}
      <div 
        className="absolute inset-0 max-w-5xl mx-auto my-auto h-[700px] bg-cover bg-center opacity-30 pointer-events-none mix-blend-screen rounded-3xl blur-[1px]"
        style={{ backgroundImage: `url('/images/codeverse-wallpaper.jpg')` }}
      />
      <div className="absolute inset-0 bg-radial from-transparent via-[#07090e]/80 to-[#07090e] pointer-events-none" />

      <div className="w-full max-w-xl space-y-6 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Code2 className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Join CodeVerse Platform
          </h1>
          <p className="text-sm text-slate-400">
            Choose how you want to participate in our computer science ecosystem
          </p>
        </div>

        {/* Role Selector Cards */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedRole('learner')}
            className={`p-5 rounded-2xl border text-left transition-all relative ${
              selectedRole === 'learner'
                ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-600/10'
                : 'bg-[#101522] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedRole === 'learner' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Instant
              </span>
            </div>
            <h3 className="font-bold text-white text-base">Learner</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Read lessons, run code in Monaco, solve test cases & earn certificates.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('instructor')}
            className={`p-5 rounded-2xl border text-left transition-all relative ${
              selectedRole === 'instructor'
                ? 'bg-purple-600/15 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-600/10'
                : 'bg-[#101522] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedRole === 'instructor' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                <Presentation className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                Admin Review
              </span>
            </div>
            <h3 className="font-bold text-white text-base">Instructor</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Author curricula, create coding challenges & publish interactive courses.
            </p>
          </button>
        </div>

        {/* Administrator Quick Notice */}
        <div className="p-3 bg-[#0a0d14] border border-slate-800/80 rounded-xl text-center text-xs text-slate-400">
          <span>Are you the Platform Administrator? </span>
          <Link to="/login" className="text-indigo-400 hover:underline font-semibold">
            Sign In with Administrator Credentials →
          </Link>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-3xl bg-[#101522] border border-slate-800 shadow-2xl space-y-5">
          {registeredSuccess ? (
            <div className="text-center py-6 space-y-4">
              {selectedRole === 'learner' ? (
                <>
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Learner Account Ready! 🎉</h3>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                    Your profile and learner permissions are active. Sign in to enter your Learner Dashboard directly and start coding.
                  </p>
                  <div className="pt-2">
                    <Link to="/login">
                      <Button variant="primary" className="w-full">
                        Sign In to Learner Dashboard
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-3xl flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Application Submitted! ⏳</h3>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                    Your account has been registered and your instructor application is now pending review by CodeVerse administration.
                  </p>
                  <div className="p-4 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-slate-400 text-left space-y-1">
                    <p className="font-semibold text-slate-200">What happens next?</p>
                    <p>
                      1. The Administrator will review your expertise in the Admin Control Panel.
                    </p>
                    <p>
                      2. Once approved, the Instructor Studio will unlock course creation.
                    </p>
                    <p>
                      3. In the meantime, you have immediate full access to learn and solve courses!
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link to="/login">
                      <Button variant="primary" className="w-full">
                        Sign In (Learner Access Enabled)
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {error && (
                <Alert type="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {selectedRole === 'instructor' && (
                <div className="p-4 bg-purple-950/20 border border-purple-800/40 rounded-2xl flex items-start gap-3 text-xs text-purple-200">
                  <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Approval Policy:</strong> Instructor accounts require manual approval by the platform administration to maintain course quality.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    type="text"
                    required
                    placeholder="Ada Lovelace"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    leftIcon={<User className="w-4 h-4" />}
                  />

                  <Input
                    label="Username"
                    type="text"
                    required
                    placeholder="adalovelace"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    leftIcon={<AtSign className="w-4 h-4" />}
                  />
                </div>

                <Input
                  label="Email address"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                />

                {/* Additional fields for instructor */}
                {selectedRole === 'instructor' && (
                  <>
                    <Input
                      label="Primary Languages / Topics You Teach"
                      type="text"
                      required
                      placeholder="e.g. C++, Python, Data Structures, Web Development"
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      leftIcon={<Layers className="w-4 h-4" />}
                      helperText="Specify the languages or frameworks you plan to teach"
                    />

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300 block">
                        Brief Bio & Teaching Experience
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Brief summary of your programming background or teaching credentials..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                  />

                  <Input
                    label="Confirm Password"
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 mt-2 shadow-lg shadow-indigo-600/20 text-sm font-semibold"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {selectedRole === 'learner'
                    ? 'Create Learner Account (Direct Access)'
                    : 'Submit Instructor Application (Pending Approval)'}
                </Button>
              </form>

              <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
