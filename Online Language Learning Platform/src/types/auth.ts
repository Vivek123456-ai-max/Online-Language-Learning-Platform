import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { Profile, AppRole, UserStats } from './database';

export interface AuthUser extends SupabaseUser {
  profile?: Profile | null;
  roles?: AppRole[];
  stats?: UserStats | null;
}

export const SUPER_ADMIN_EMAIL = 'ktvivek1234567@gmail.com';

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  stats: UserStats | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    username?: string,
    requestedRole?: 'learner' | 'instructor',
    expertise?: string,
    bio?: string
  ) => Promise<{ error: Error | null; user?: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
