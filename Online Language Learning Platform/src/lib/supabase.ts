import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bxzdpsmqunpetlvjuptw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6C73H9jH8tFDjjUrz3pIsA_nuLLyGc1';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('CodeVerse: Missing Supabase environment variables! Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});

export interface ConnectionStatus {
  isConnected: boolean;
  authHealthy: boolean;
  tablesStatus: {
    profiles: boolean;
    user_roles: boolean;
    user_stats: boolean;
    languages: boolean;
    courses: boolean;
    enrollments: boolean;
  };
  errorMessage?: string;
}

export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  const result: ConnectionStatus = {
    isConnected: false,
    authHealthy: false,
    tablesStatus: {
      profiles: false,
      user_roles: false,
      user_stats: false,
      languages: false,
      courses: false,
      enrollments: false,
    },
  };

  try {
    // 1. Check Auth service connectivity
    const { data: authData } = await supabase.auth.getSession();
    result.authHealthy = true;
    result.isConnected = true;

    // 2. Test querying tables
    const checkTable = async (tableName: string) => {
      try {
        const { error } = await supabase.from(tableName).select('id', { count: 'exact', head: true });
        return !error;
      } catch {
        return false;
      }
    };

    result.tablesStatus.profiles = await checkTable('profiles');
    result.tablesStatus.user_roles = await checkTable('user_roles');
    result.tablesStatus.user_stats = await checkTable('user_stats');
    result.tablesStatus.languages = await checkTable('languages');
    result.tablesStatus.courses = await checkTable('courses');
    result.tablesStatus.enrollments = await checkTable('enrollments');

  } catch (err: any) {
    result.errorMessage = err.message || 'Unknown network error';
  }

  return result;
}
