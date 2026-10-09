import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AppRole } from '../../types/database';
import { SUPER_ADMIN_EMAIL } from '../../types/auth';
import { Loader2 } from 'lucide-react';
import { InstructorPendingPage } from '../../pages/instructor/InstructorPendingPage';

interface RoleGuardProps {
  requiredRole: AppRole;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ requiredRole, children }) => {
  const { user, roles, isLoading, isAdmin, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400">Verifying security authorizations...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 1. Special Admin Guard: Only ktvivek1234567@gmail.com can access the admin control panel
  if (requiredRole === 'admin') {
    const isSuperAdminEmail = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    if (!isSuperAdminEmail) {
      return <Navigate to="/unauthorized" replace />;
    }
    return <>{children}</>;
  }

  // Super admin has access to all roles
  if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || isAdmin) {
    return <>{children}</>;
  }

  // 2. Instructor Guard: If not an approved instructor, display pending review screen
  if (requiredRole === 'instructor') {
    const isApprovedInstructor = roles.includes('instructor');
    if (!isApprovedInstructor) {
      return <InstructorPendingPage />;
    }
    return <>{children}</>;
  }

  // 3. General role check
  const hasPermission = roles.includes(requiredRole);
  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
