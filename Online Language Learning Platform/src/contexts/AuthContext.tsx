import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContextType, AuthUser, SUPER_ADMIN_EMAIL } from '../types/auth';
import { Profile, AppRole, UserStats, UserRoleRecord } from '../types/database';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Check if current user has the super admin email
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const isSuperAdminEmail = authUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      } else if (!profileErr && authUser) {
        const newProfile = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
          username: authUser.user_metadata?.username || `user_${authUser.id.substring(0, 6)}`,
        };
        const { data: insertedProfile } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();
        if (insertedProfile) setProfile(insertedProfile as Profile);
      }

      // 2. Fetch User Roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const userRoleList: AppRole[] = rolesData && rolesData.length > 0 
        ? rolesData.map((r: { role: AppRole }) => r.role)
        : ['learner'];

      // If this is the designated super admin email, guarantee admin role
      if (isSuperAdminEmail) {
        if (!userRoleList.includes('admin')) {
          userRoleList.push('admin');
          try {
            const { error: upsertErr } = await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
            if (upsertErr) {
              console.warn('[Auth] Admin role upsert note:', upsertErr.message);
            }
          } catch (e) {
            console.warn('[Auth] Admin auto-provisioning handled:', e);
          }
        }
        if (!userRoleList.includes('instructor')) {
          userRoleList.push('instructor');
        }
      }

      setRoles(userRoleList);

      // 3. Fetch User Stats
      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (statsData) {
        setStats(statsData as UserStats);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user.id).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Listen for Auth State Changes
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        setSession(currentSession);
        if (currentSession?.user) {
          setUser(currentSession.user);
          await fetchUserData(currentSession.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setRoles([]);
          setStats(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authListener.unsubscribe();
    };
  }, [fetchUserData]);

  // Realtime subscription for Profile and Roles changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new as Profile);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles', filter: `user_id=eq.${user.id}` },
        () => {
          // Refetch roles on change
          fetchUserData(user.id);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_stats', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.new) {
            setStats(payload.new as UserStats);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUserData]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error as Error | null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    username?: string,
    requestedRole: 'learner' | 'instructor' = 'learner',
    expertise?: string,
    bio?: string
  ) => {
    try {
      const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
            username: username || email.split('@')[0],
            requested_role: isSuperAdmin ? 'admin' : requestedRole,
            instructor_status: isSuperAdmin ? 'approved' : requestedRole === 'instructor' ? 'pending' : 'approved',
            expertise: expertise || '',
            bio: bio || '',
          },
        },
      });

      if (error) return { error: error as Error };

      if (data.user) {
        // If instructor requested and not super admin, record application in learning_activity
        if (requestedRole === 'instructor' && !isSuperAdmin) {
          try {
            await supabase.from('learning_activity').insert({
              user_id: data.user.id,
              activity_type: 'instructor_application_pending',
              xp_earned: 0,
              metadata: {
                applicant_email: email,
                applicant_name: fullName || email.split('@')[0],
                expertise: expertise || 'General Programming',
                bio: bio || '',
                status: 'pending',
                applied_at: new Date().toISOString(),
              },
            });

            await supabase.from('notifications').insert({
              user_id: data.user.id,
              title: 'Instructor Application Received ⏳',
              message: 'Your request to become an instructor is pending review by our administrator. You have full learner access while review is underway.',
              type: 'info',
            });
          } catch (e) {
            console.error('Error logging instructor application:', e);
          }
        }

        await fetchUserData(data.user.id);
      }

      return { error: null, user: data.user };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRoles([]);
    setStats(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const isSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const isAdmin = isSuperAdmin || roles.includes('admin');
  const isInstructor = roles.includes('instructor') || isAdmin;
  const isAuthenticated = !!session && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        stats,
        isLoading,
        isAuthenticated,
        isAdmin,
        isInstructor,
        hasRole,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
