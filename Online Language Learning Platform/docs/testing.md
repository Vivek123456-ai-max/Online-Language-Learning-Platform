# Testing & Quality Assurance Guide

## Verification Matrix for Phase 1

### 1. Supabase Project Connectivity
- **Endpoint**: `https://bxzdpsmqunpetlvjuptw.supabase.co/auth/v1/health`
- **Verification**: PostgREST responds HTTP 200 with GoTrue v2.197.0.
- **Client Key**: `sb_publishable_6C73H9jH8tFDjjUrz3pIsA_nuLLyGc1` authenticated and active.

### 2. Authentication Testing
- **Sign Up**: Registers user via `supabase.auth.signUp()`.
- **Database Trigger**: `on_auth_user_created` trigger fires on `auth.users` insert:
  1. Populates `public.profiles` with `username`, `email`, and avatar.
  2. Inserts `public.user_roles` with `role = 'learner'`.
  3. Inserts `public.user_stats` with `xp = 0`, `streak_count = 0`.
  4. Generates a welcome notification in `public.notifications`.
- **Sign In**: Authenticates session and restores JWT.
- **Sign Out**: Clears session tokens and resets UI state.
- **Password Reset**: Generates reset email link.

### 3. Authorization & Row Level Security (RLS)
- **Learners**:
  - Can view published courses and active languages.
  - Can read and update only their own profile.
  - CANNOT self-promote to `instructor` or `admin` (guarded by RLS policy on `public.user_roles`).
- **Private Test Cases**:
  - `coding_test_cases` where `is_public = false` are filtered out from client SELECT queries.

### 4. Realtime Synchronization
- Subscriptions on `profiles`, `user_roles`, and `user_stats` are active.
- Live notifications push directly over WebSockets without polling.
