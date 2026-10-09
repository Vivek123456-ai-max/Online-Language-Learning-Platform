import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Course, Language, Profile, AppRole } from '../../types/database';
import { Button } from '../../components/common/Button';
import { RoleBadge } from '../../components/common/StatusBadge';
import { Alert } from '../../components/common/Alert';
import { 
  Shield, 
  Users, 
  BookOpen, 
  Layers, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileText,
  Search,
  RefreshCw,
  Terminal,
  Clock,
  Presentation,
  Check,
  UserCheck
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  action: string;
  target_table: string;
  record_id: string;
  actor_id: string | null;
  created_at: string;
  details: Record<string, any>;
}

interface InstructorApplication {
  id: string;
  user_id: string;
  applicant_name: string;
  applicant_email: string;
  expertise: string;
  bio: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
}

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'metrics' | 'approvals' | 'users' | 'courses' | 'languages' | 'audit'>('approvals');

  // Data states
  const [profiles, setProfiles] = useState<(Profile & { roles?: AppRole[] })[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [stats, setStats] = useState({
    usersCount: 0,
    coursesCount: 0,
    enrollmentsCount: 0,
    lessonsCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>(null);

  useEffect(() => {
    fetchAdminData();

    // Instant Realtime sync across all devices for Super Admin
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'learning_activity' },
        (payload) => {
          console.log('[Realtime] New activity/application in admin:', payload);
          fetchAdminData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => {
          console.log('[Realtime] User roles updated');
          fetchAdminData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => {
          console.log('[Realtime] Courses updated');
          fetchAdminData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchAdminData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enrollments' },
        () => {
          fetchAdminData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        () => {
          fetchAdminData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch counts
      const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: cCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
      const { count: eCount } = await supabase.from('enrollments').select('*', { count: 'exact', head: true });
      const { count: lCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true });

      setStats({
        usersCount: uCount || 0,
        coursesCount: cCount || 0,
        enrollmentsCount: eCount || 0,
        lessonsCount: lCount || 0,
      });

      // 2. Fetch Profiles with roles
      const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
      const { data: uRoles } = await supabase.from('user_roles').select('*');

      if (profs) {
        const enriched = profs.map((p) => {
          const userRoleList = (uRoles || []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole);
          return {
            ...p,
            roles: userRoleList.length > 0 ? userRoleList : (['learner'] as AppRole[]),
          };
        });
        setProfiles(enriched);
      }

      // 3. Fetch all courses
      const { data: crs } = await supabase.from('courses').select('*, language:languages(*)').order('created_at', { ascending: false });
      if (crs) setCourses(crs as Course[]);

      // 4. Fetch languages
      const { data: lngs } = await supabase.from('languages').select('*').order('name');
      if (lngs) setLanguages(lngs as Language[]);

      // 5. Fetch audit logs
      const { data: aLogs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(30);
      if (aLogs) setAuditLogs(aLogs as any);

      // 6. Fetch instructor applications from learning_activity
      const { data: appData } = await supabase
        .from('learning_activity')
        .select('*')
        .eq('activity_type', 'instructor_application_pending')
        .order('created_at', { ascending: false });

      if (appData) {
        const appList: InstructorApplication[] = appData.map((a: any) => ({
          id: a.id,
          user_id: a.user_id,
          applicant_name: a.metadata?.applicant_name || 'Instructor Candidate',
          applicant_email: a.metadata?.applicant_email || '',
          expertise: a.metadata?.expertise || 'Computer Science',
          bio: a.metadata?.bio || 'Teaching credentials submitted',
          status: a.metadata?.status || 'pending',
          applied_at: a.created_at,
        }));
        setApplications(appList);
      }
    } catch (err: any) {
      console.error('Admin fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveInstructor = async (applicantUserId: string, applicantName: string, applicationId?: string) => {
    try {
      // 1. Assign instructor role in user_roles
      const { error: roleErr } = await supabase
        .from('user_roles')
        .upsert({ user_id: applicantUserId, role: 'instructor' }, { onConflict: 'user_id,role' });

      if (roleErr) throw roleErr;

      // 2. Send notification to user
      await supabase.from('notifications').insert({
        user_id: applicantUserId,
        title: 'Instructor Application Approved! 🎉',
        message: 'Congratulations! The Administrator has approved your application. You now have access to the Instructor Studio to author and publish courses.',
        type: 'success',
      });

      // 3. Update application status if record exists
      if (applicationId) {
        await supabase
          .from('learning_activity')
          .update({
            metadata: {
              status: 'approved',
              approved_at: new Date().toISOString(),
              approved_by: user?.email,
            },
          })
          .eq('id', applicationId);
      }

      // 4. Log audit record
      if (user) {
        await supabase.from('audit_logs').insert({
          action: 'instructor_application_approved',
          target_table: 'user_roles',
          record_id: applicantUserId,
          actor_id: user.id,
          details: { approved_user: applicantUserId, applicant_name: applicantName },
        });
      }

      setStatusMessage({ type: 'success', text: `Successfully approved ${applicantName} as an authorized Instructor!` });
      await fetchAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to approve instructor.' });
    }
  };

  const handleRejectInstructor = async (applicantUserId: string, applicantName: string, applicationId?: string) => {
    try {
      if (applicationId) {
        await supabase
          .from('learning_activity')
          .update({
            metadata: {
              status: 'rejected',
              rejected_at: new Date().toISOString(),
              rejected_by: user?.email,
            },
          })
          .eq('id', applicationId);
      }

      await supabase.from('notifications').insert({
        user_id: applicantUserId,
        title: 'Instructor Application Update',
        message: 'Thank you for your interest. Your instructor application was not approved at this time. You can continue to take courses as a learner.',
        type: 'info',
      });

      setStatusMessage({ type: 'info', text: `Application for ${applicantName} has been declined.` });
      await fetchAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleCourseStatus = async (courseId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', courseId);

      if (error) throw error;

      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: nextStatus as any } : c))
      );

      // Log in audit_logs
      if (user) {
        await supabase.from('audit_logs').insert({
          action: `course_status_changed_to_${nextStatus}`,
          target_table: 'courses',
          record_id: courseId,
          actor_id: user.id,
          details: { previous: currentStatus, next: nextStatus },
        });
      }

      setStatusMessage({ type: 'success', text: `Course status changed to ${nextStatus}.` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleLanguageActive = async (langId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('languages')
        .update({ is_active: !currentActive })
        .eq('id', langId);

      if (error) throw error;

      setLanguages((prev) =>
        prev.map((l) => (l.id === langId ? { ...l, is_active: !currentActive } : l))
      );
      setStatusMessage({ type: 'success', text: 'Language status updated.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleAssignRole = async (targetUserId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase.from('user_roles').upsert(
        { user_id: targetUserId, role: newRole },
        { onConflict: 'user_id,role' }
      );

      if (error) throw error;

      if (user) {
        await supabase.from('audit_logs').insert({
          action: 'user_role_assigned',
          target_table: 'user_roles',
          record_id: targetUserId,
          actor_id: user.id,
          details: { assigned_role: newRole },
        });
      }

      setStatusMessage({ type: 'success', text: `Assigned role ${newRole} to user!` });
      fetchAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 font-mono">
              <Shield className="w-3.5 h-3.5" /> Super Administrator Panel
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Zero-Delay Sync
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            System Control & Approval Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Strict administrator authorization active. Review instructor submissions, oversee users, and manage course catalog in real-time.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAdminData}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Data
        </Button>
      </div>

      {statusMessage && (
        <Alert type={statusMessage.type} onClose={() => setStatusMessage(null)}>
          {statusMessage.text}
        </Alert>
      )}

      {/* Tabs Bar */}
      <div className="border-b border-slate-800 flex items-center gap-4 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors relative ${
            activeTab === 'approvals' ? 'border-indigo-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Presentation className="w-4 h-4 text-purple-400" />
          <span>Instructor Approvals</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'metrics' ? 'border-indigo-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" /> Platform Metrics
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'users' ? 'border-indigo-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> User Accounts ({profiles.length})
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'courses' ? 'border-indigo-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Courses & Moderation ({courses.length})
        </button>

        <button
          onClick={() => setActiveTab('languages')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'languages' ? 'border-indigo-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> Languages ({languages.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'audit' ? 'border-indigo-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" /> Audit Logs
        </button>
      </div>

      {/* Tab: Instructor Approvals (Primary User Requirement) */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#101522] to-slate-900 border border-purple-900/40 space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Presentation className="w-5 h-5 text-purple-400" />
              Pending Instructor Applications
            </h2>
            <p className="text-xs text-slate-300">
              Users who register as instructors remain pending until you explicitly grant them authoring access. Approving grants the <code className="text-purple-300 font-mono">instructor</code> role and unlocks the course builder.
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#101522] border border-slate-800 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-white font-semibold">No Pending Instructor Applications</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All instructor submissions have been processed or users have registered as standard learners.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-6 rounded-2xl bg-[#101522] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-base">{app.applicant_name}</h3>
                      <span className="text-xs font-mono text-slate-400">({app.applicant_email})</span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                          app.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : app.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <p>
                        <strong className="text-slate-400 font-mono">Expertise:</strong> {app.expertise}
                      </p>
                      {app.bio && (
                        <p className="text-slate-400 italic bg-[#0a0d14] p-2.5 rounded-lg border border-slate-800/80">
                          "{app.bio}"
                        </p>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 block">
                      Applied on: {new Date(app.applied_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {app.status === 'pending' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRejectInstructor(app.user_id, app.applicant_name, app.id)}
                          className="text-rose-400 hover:text-rose-300 text-xs"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveInstructor(app.user_id, app.applicant_name, app.id)}
                          leftIcon={<Check className="w-4 h-4" />}
                          className="text-xs shadow-md shadow-indigo-600/20"
                        >
                          Approve as Instructor
                        </Button>
                      </>
                    ) : app.status === 'approved' ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Instructor Role Active
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Application Declined</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Platform Metrics */}
      {activeTab === 'metrics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">Registered Users</span>
              <p className="text-3xl font-black text-white">{stats.usersCount}</p>
              <span className="text-[11px] text-emerald-400">Synced with GoTrue</span>
            </div>

            <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Courses</span>
              <p className="text-3xl font-black text-white">{stats.coursesCount}</p>
              <span className="text-[11px] text-indigo-400">Across C++, Python, Java & more</span>
            </div>

            <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">Curriculum Lessons</span>
              <p className="text-3xl font-black text-white">{stats.lessonsCount}</p>
              <span className="text-[11px] text-purple-400">With runnable examples</span>
            </div>

            <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">Active Enrollments</span>
              <p className="text-3xl font-black text-white">{stats.enrollmentsCount}</p>
              <span className="text-[11px] text-amber-400">Real database records</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base">Backend & Security Topology</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="p-4 bg-[#0a0d14] rounded-xl border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-semibold block">PostgreSQL RLS Active</span>
                <p className="text-slate-400 text-[11px]">25 tables protected with caller session isolation.</p>
              </div>
              <div className="p-4 bg-[#0a0d14] rounded-xl border border-slate-800 space-y-1">
                <span className="text-indigo-400 font-semibold block">Judge0 Sandbox Runner</span>
                <p className="text-slate-400 text-[11px]">Compiler memory and time limits enforced for 19+ languages.</p>
              </div>
              <div className="p-4 bg-[#0a0d14] rounded-xl border border-slate-800 space-y-1">
                <span className="text-purple-400 font-semibold block">Admin Access Restricted</span>
                <p className="text-slate-400 text-[11px]">Strictly verified against authorized administrator identity.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#101522] border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">{profiles.length} profiles loaded</span>
          </div>

          <div className="bg-[#101522] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead className="bg-[#0c0f18] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Learner Profile</th>
                    <th className="px-6 py-3">Roles</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Joined Date</th>
                    <th className="px-6 py-3 text-right">Admin Role Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {profiles
                    .filter((p) =>
                      searchQuery
                        ? p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.username?.toLowerCase().includes(searchQuery.toLowerCase())
                        : true
                    )
                    .map((prof) => (
                      <tr key={prof.id} className="hover:bg-slate-800/20">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs uppercase">
                              {prof.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <span className="font-semibold text-white block">{prof.full_name || 'Anonymous'}</span>
                              <span className="text-[11px] text-slate-500 font-mono">@{prof.username || prof.id.substring(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {prof.roles?.map((r) => (
                              <RoleBadge key={r} role={r} />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                          {new Date(prof.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!prof.roles?.includes('instructor') && (
                              <button
                                onClick={() => handleApproveInstructor(prof.id, prof.full_name || 'Learner')}
                                className="px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 text-[11px] font-semibold flex items-center gap-1"
                              >
                                <UserCheck className="w-3 h-3" /> Approve as Instructor
                              </button>
                            )}
                            {prof.roles?.includes('instructor') && (
                              <span className="text-[11px] text-purple-400 font-mono">Instructor ✓</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Courses Moderation */}
      {activeTab === 'courses' && (
        <div className="bg-[#101522] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[680px]">
              <thead className="bg-[#0c0f18] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Course Title</th>
                  <th className="px-6 py-3">Language</th>
                  <th className="px-6 py-3">Difficulty</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-800/20">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-white block">{course.title}</span>
                        <span className="text-[11px] text-slate-500 font-mono">slug: {course.slug}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-indigo-400">
                      {course.language?.name}
                    </td>
                    <td className="px-6 py-4 uppercase font-mono text-[11px]">
                      {course.difficulty}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          course.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant={course.status === 'published' ? 'ghost' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleCourseStatus(course.id, course.status)}
                        className="text-xs"
                      >
                        {course.status === 'published' ? 'Unpublish (Draft)' : 'Approve & Publish'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Language Catalog */}
      {activeTab === 'languages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {languages.map((lang) => (
            <div
              key={lang.id}
              className="p-5 rounded-2xl bg-[#101522] border border-slate-800 flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: lang.color || '#6366f1' }}
                  />
                  <h3 className="font-bold text-white text-base">{lang.name}</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500 block">
                  slug: {lang.slug} • version: {lang.version || 'current'}
                </span>
              </div>

              <button
                onClick={() => handleToggleLanguageActive(lang.id, lang.is_active)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-colors ${
                  lang.is_active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {lang.is_active ? 'Active' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-[#101522] border border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">System Security & Audit Trail</h3>
            <span className="text-xs font-mono text-slate-500">{auditLogs.length} events logged</span>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No audit log records recorded yet.</p>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-[#0a0d14] border border-slate-800 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-400 font-semibold">{log.action}</span>
                    <span className="text-slate-500">[{log.target_table}]</span>
                    {log.details && (
                      <span className="text-slate-400 text-[11px] truncate max-w-xs">
                        {JSON.stringify(log.details)}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-600 text-[11px] shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
