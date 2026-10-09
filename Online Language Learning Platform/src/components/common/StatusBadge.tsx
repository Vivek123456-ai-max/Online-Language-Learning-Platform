import React from 'react';
import { cn } from '../../lib/utils';
import { AppRole, CourseDifficulty, CourseStatus } from '../../types/database';

export const RoleBadge: React.FC<{ role: AppRole; className?: string }> = ({ role, className }) => {
  const styles: Record<AppRole, string> = {
    admin: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    instructor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    learner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  const labels: Record<AppRole, string> = {
    admin: 'Admin',
    instructor: 'Instructor',
    learner: 'Learner',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider', styles[role], className)}>
      {labels[role]}
    </span>
  );
};

export const DifficultyBadge: React.FC<{ difficulty: CourseDifficulty; className?: string }> = ({ difficulty, className }) => {
  const styles: Record<CourseDifficulty, string> = {
    beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    advanced: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    all_levels: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize', styles[difficulty], className)}>
      {difficulty.replace('_', ' ')}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: CourseStatus; className?: string }> = ({ status, className }) => {
  const styles: Record<CourseStatus, string> = {
    draft: 'bg-slate-700/20 text-slate-400 border-slate-700/50',
    pending_review: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    archived: 'bg-slate-800/40 text-slate-500 border-slate-700/30',
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize', styles[status], className)}>
      {status.replace('_', ' ')}
    </span>
  );
};
