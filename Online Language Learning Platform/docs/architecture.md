# CodeVerse Architecture & System Design

## 1. High-Level Architecture Overview

CodeVerse is designed as a secure, full-stack, data-driven online programming learning platform built on modern cloud technologies.

```
+-------------------------------------------------------------------------+
|                              CLIENT LAYER                               |
|                  React 18 + TypeScript + Tailwind CSS                   |
|                                                                         |
|  +--------------------+  +--------------------+  +--------------------+ |
|  | Learner Dashboard  |  | Instructor Studio  |  |  Admin Backoffice  | |
|  +--------------------+  +--------------------+  +--------------------+ |
|  | Monaco Code Editor |  | Interactive Quiz   |  | Realtime Sync      | |
|  +--------------------+  +--------------------+  +--------------------+ |
+-------------------------------------------------------------------------+
                                    |
                                    | HTTPS / WebSockets (WSS)
                                    v
+-------------------------------------------------------------------------+
|                           SUPABASE PLATFORM                             |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Auth (GoTrue v2)                                                  |  |
|  | - JWT session tokens                                              |  |
|  | - Password hashing (bcrypt)                                       |  |
|  | - Automatic user profile creation via database triggers           |  |
|  +-------------------------------------------------------------------+  |
|  | PostgreSQL 15+ Core Relational Database                           |  |
|  | - 25 Relational Tables with Foreign Keys & Constraints             |  |
|  | - Row Level Security (RLS) on 100% of tables                      |  |
|  | - SECURITY DEFINER helper functions (has_role, is_admin, etc.)     |  |
|  | - Realtime Replication Publication (supabase_realtime)            |  |
|  +-------------------------------------------------------------------+  |
|  | Storage Buckets (Avatars, Lesson Media, Project Uploads)          |  |
|  +-------------------------------------------------------------------+  |
|  | Supabase Edge Functions (Deno Runtime)                            |  |
|  | - Privileged server-side execution runner proxy                   |  |
|  | - Private test-case verification                                  |  |
|  | - AI-assisted authoring proxy (keys kept strictly server-side)    |  |
+-------------------------------------------------------------------------+
                                    |
                                    | Privileged Server-to-Server API
                                    v
+-------------------------------------------------------------------------+
|                      ISOLATED CODE RUNNER (Judge0)                      |
|                                                                         |
|  - C++ (GCC 9.2+)                                                       |
|  - Python (3.8+)                                                        |
|  - Java (OpenJDK 13+)                                                   |
|  - Sandboxed execution, cgroups isolation, memory & CPU limits          |
+-------------------------------------------------------------------------+
```

## 2. Security Architecture & Threat Model

### Principle of Least Privilege
- **No Client Privilege Escalation**: Role assignment is managed exclusively through the `public.user_roles` table, which is guarded by strict Row Level Security policies. Normal users can only SELECT their own roles and cannot insert, update, or delete roles.
- **Role Verification**: Application authorization evaluates roles against the database record (`public.has_role(auth.uid(), 'admin')`), never trusting client-provided state or cookies.
- **Private Test Cases**: In `public.coding_test_cases`, entries marked with `is_public = false` are filtered out by RLS for learners. Solutions are evaluated server-side to prevent answer extraction.
- **Secret Keys Isolation**: The Supabase `service_role` key, Judge0 API keys, and AI provider keys are NEVER exposed to the frontend bundle. Only the public anon key (`sb_publishable_...`) is embedded.

## 3. Realtime Synchronization Architecture

CodeVerse leverages PostgreSQL logical decoding and Supabase Realtime WebSocket channels to provide instant updates:
- **Profile & XP Updates**: When a user completes a lesson or exercise, their XP points and streak counter update live in the navigation bar without a page reload.
- **Submission Status**: Code submissions transition from `queued` -> `running` -> `passed`/`failed` in real time.
- **Course & Content Reviews**: Instructors and admins receive instantaneous notifications on submission and review outcomes.

## 4. Hierarchy of Educational Content

```
Language (e.g. C++, Python, Java)
  └── Course (e.g. C++ Fundamentals: Zero to Hero)
        └── Module (e.g. Module 1: Getting Started)
              └── Lesson (e.g. 1.1 Hello World & Basic Structure)
                    ├── Code Examples & Expected Output
                    ├── Coding Exercises & Test Cases
                    └── Module/Lesson Quizzes
```
