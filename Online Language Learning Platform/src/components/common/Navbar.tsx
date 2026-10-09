import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from './Button';
import { RoleBadge } from './StatusBadge';
import { 
  Code2, 
  Flame, 
  Sparkles, 
  User, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard,
  Compass,
  BookOpen,
  Route,
  Shield,
  Edit3,
  Server
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, roles, stats, isAuthenticated, signOut, isLoading, isAdmin, isInstructor } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Explore Languages', href: '/languages', icon: Compass },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Learning Paths', href: '/paths', icon: Route },
    { name: 'Live Database Studio', href: '/backend', icon: Server, isLive: true },
  ];

  const primaryRole = roles[0] || 'learner';

  const getDashboardLink = () => {
    if (isAdmin) return '/admin';
    if (isInstructor) return '/instructor';
    return '/dashboard';
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0d14]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                CodeVerse
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800/80 text-indigo-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-4 h-4 opacity-70" />
                    <span>{link.name}</span>
                    {link.isLive && (
                      <span className="flex h-2 w-2 relative ml-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section: Auth State / Stats / User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="w-28 h-9 bg-slate-800/50 rounded-lg animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Realtime Streak Counter */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs font-semibold" title="Current Daily Streak">
                  <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{stats?.streak_count || 0}d</span>
                </div>

                {/* Realtime XP Counter */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 text-xs font-semibold" title="Total Experience Points">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>{stats?.xp || 0} XP</span>
                </div>

                {/* Role Badge */}
                <RoleBadge role={primaryRole} />

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors focus:outline-none"
                  >
                    <img
                      src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id}`}
                      alt="Avatar"
                      className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 object-cover"
                    />
                    <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">
                      {profile?.full_name || profile?.username || user?.email?.split('@')[0]}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#121724] border border-slate-800 shadow-2xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-800/80">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-100 truncate">{user?.email}</p>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-rose-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-rose-400" />
                          <span>Admin Control Center</span>
                        </Link>
                      )}

                      {(isInstructor || isAdmin) && (
                        <Link
                          to="/instructor"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-indigo-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                        >
                          <Edit3 className="w-4 h-4 text-indigo-400" />
                          <span>Instructor Studio</span>
                        </Link>
                      )}

                      <Link
                        to="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                        <span>Learner Dashboard</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                      >
                        <User className="w-4 h-4 text-indigo-400" />
                        <span>My Profile</span>
                      </Link>

                      <div className="border-t border-slate-800/80 my-1" />

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0c101a] px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800/60"
                >
                  <Icon className="w-5 h-5 text-indigo-400" />
                  <span>{link.name}</span>
                  {link.isLive && (
                    <span className="flex h-2 w-2 relative ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3">
                  <img
                    src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id}`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-lg bg-slate-800"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{profile?.full_name || profile?.username}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 px-3">
                  <RoleBadge role={primaryRole} />
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {stats?.xp || 0} XP
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-slate-800/60 rounded-lg"
                    >
                      <Shield className="w-4 h-4 text-rose-400" />
                      <span>Admin Control Center</span>
                    </Link>
                  )}

                  {(isInstructor || isAdmin) && (
                    <Link
                      to="/instructor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-purple-300 hover:bg-slate-800/60 rounded-lg"
                    >
                      <Edit3 className="w-4 h-4 text-purple-400" />
                      <span>Instructor Studio</span>
                    </Link>
                  )}

                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-indigo-300 hover:bg-slate-800/60 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                    <span>Learner Dashboard</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/60 rounded-lg"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
