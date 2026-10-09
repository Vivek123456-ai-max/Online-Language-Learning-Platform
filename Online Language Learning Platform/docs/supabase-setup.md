# Supabase Setup Guide for CodeVerse

## Project Credentials
- **Project Name**: Learning Platform
- **Project ID**: `bxzdpsmqunpetlvjuptw`
- **Dashboard URL**: [https://supabase.com/dashboard/project/bxzdpsmqunpetlvjuptw](https://supabase.com/dashboard/project/bxzdpsmqunpetlvjuptw)
- **API URL**: `https://bxzdpsmqunpetlvjuptw.supabase.co`

## Step-by-Step Initialization

### Step 1: Open the Supabase SQL Editor
1. Log into your Supabase Dashboard.
2. Navigate to your project `Learning Platform` (`bxzdpsmqunpetlvjuptw`).
3. Click on the **SQL Editor** icon in the left navigation sidebar:
   `https://supabase.com/dashboard/project/bxzdpsmqunpetlvjuptw/sql`

### Step 2: Run the All-in-One Migration
1. Open the file `supabase/migrations/full_setup.sql` in this project.
2. Copy the entire file content.
3. Paste it into a new query tab in the Supabase SQL Editor.
4. Click **Run** (or press `Cmd + Enter` / `Ctrl + Enter`).

### Step 3: Verify Schema Creation
1. Go to the **Table Editor** in the Supabase Dashboard:
   `https://supabase.com/dashboard/project/bxzdpsmqunpetlvjuptw/editor`
2. You will see all 25 tables populated:
   - `profiles`, `user_roles`, `user_stats`, `languages`, `courses`, `modules`, `lessons`, etc.
   - The initial 19 programming languages catalog and starter C++, Python, and Java courses will be seeded automatically.

### Step 4: Verify in the Web App
1. Open the web application at `http://localhost:5173/diagnostics`.
2. Click **Re-check Health**.
3. All 25 table indicators will turn green with exact row counts.

### Step 5: Assigning Administrator or Instructor Roles
By default, all new registered users are given the `learner` role. To promote a user to `admin` or `instructor`, run this SQL query in the Supabase SQL Editor:

```sql
-- Promote a user to Admin:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM public.profiles WHERE email = 'your-admin-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Promote a user to Instructor:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'instructor' FROM public.profiles WHERE email = 'your-instructor-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```
