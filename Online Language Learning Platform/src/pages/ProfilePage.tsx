import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Alert } from '../components/common/Alert';
import { RoleBadge } from '../components/common/StatusBadge';
import { 
  User, 
  Mail, 
  AtSign, 
  Globe, 
  Github, 
  Sparkles, 
  Flame, 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck, 
  Save 
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, profile, roles, stats, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [githubUsername, setGithubUsername] = useState(profile?.github_username || '');

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setWebsite(profile.website || '');
      setGithubUsername(profile.github_username || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          bio: bio,
          website: website,
          github_username: githubUsername,
        })
        .eq('id', user.id);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        await refreshProfile();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-[#121724] to-[#101522] border border-indigo-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id}`}
            alt="Avatar"
            className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-indigo-500/40 p-1 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">
                {profile?.full_name || 'CodeVerse Learner'}
              </h1>
              {roles.map((r) => (
                <RoleBadge key={r} role={r} />
              ))}
            </div>
            <p className="text-sm text-slate-400">@{profile?.username || 'user'}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="flex items-center gap-4 bg-slate-900/70 border border-slate-800/80 px-4 py-2.5 rounded-xl">
          <div className="text-center">
            <div className="flex items-center gap-1 text-indigo-400 font-bold text-base">
              <Sparkles className="w-4 h-4" />
              <span>{stats?.xp ?? 0}</span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">XP Points</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center">
            <div className="flex items-center gap-1 text-amber-400 font-bold text-base">
              <Flame className="w-4 h-4" />
              <span>{stats?.streak_count ?? 0}d</span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Streak</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center">
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-base">
              <BookOpen className="w-4 h-4" />
              <span>{stats?.courses_completed ?? 0}</span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Completed</span>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Personal Information
            </h2>

            {message && (
              <Alert type={message.type} onClose={() => setMessage(null)}>
                {message.text}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ada Lovelace"
                  leftIcon={<User className="w-4 h-4" />}
                />
                <Input
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="adalovelace"
                  leftIcon={<AtSign className="w-4 h-4" />}
                />
              </div>

              <Input
                label="Email address"
                value={user?.email || ''}
                disabled
                helperText="Email cannot be changed directly"
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Biography
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community about your coding interests and background..."
                  className="w-full bg-[#121724] border border-slate-800 text-slate-100 text-sm rounded-lg p-3 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GitHub Username"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="username"
                  leftIcon={<Github className="w-4 h-4" />}
                />
                <Input
                  label="Personal Website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourportfolio.dev"
                  leftIcon={<Globe className="w-4 h-4" />}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar: Role & Security Info */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-4 text-sm">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Role & Permissions
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your platform access is governed by Supabase Row-Level Security policies.
            </p>

            <div className="space-y-2 pt-1">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 font-medium">Assigned Roles:</span>
                  <div className="flex gap-1">
                    {roles.map((r) => (
                      <RoleBadge key={r} role={r} />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Role promotion to Instructor or Admin is strictly controlled by administrative server-side operations.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-3 text-xs text-slate-400">
            <h3 className="font-bold text-white text-sm">Realtime Sync Active</h3>
            <p>
              Changes to your profile, enrolled courses, and earned XP are broadcasted live via Supabase Realtime replication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
