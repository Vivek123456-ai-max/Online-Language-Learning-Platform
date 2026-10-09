# CodeVerse PostgreSQL Database Schema Reference

The platform features 25 interconnected tables engineered with strict foreign keys, indexes, and Row-Level Security (RLS).

## Table Inventory

| # | Table Name | Description | Key Relationships |
|---|------------|-------------|-------------------|
| 1 | `profiles` | User profiles extending `auth.users` | `id -> auth.users.id` |
| 2 | `user_roles` | Role permissions (`learner`, `instructor`, `admin`) | `user_id -> profiles.id` |
| 3 | `user_stats` | Gamification metrics (XP, streaks, completions) | `user_id -> profiles.id` |
| 4 | `languages` | Data-driven catalog of 19 languages | Standalone catalog |
| 5 | `courses` | Course definitions with difficulty & duration | `language_id -> languages.id`, `instructor_id -> profiles.id` |
| 6 | `course_instructors` | Multi-instructor mapping | `course_id -> courses.id`, `instructor_id -> profiles.id` |
| 7 | `modules` | Ordered chapters/modules within a course | `course_id -> courses.id` |
| 8 | `lessons` | Interactive lessons with code snippets | `module_id -> modules.id` |
| 9 | `enrollments` | Student course enrollments & progress | `user_id -> profiles.id`, `course_id -> courses.id` |
| 10 | `lesson_progress` | Per-lesson completion status | `user_id -> profiles.id`, `lesson_id -> lessons.id` |
| 11 | `quizzes` | Assessments attached to lessons or courses | `lesson_id -> lessons.id`, `course_id -> courses.id` |
| 12 | `quiz_questions` | Question bank with options and explanations | `quiz_id -> quizzes.id` |
| 13 | `quiz_attempts` | Learner quiz attempts and scores | `quiz_id -> quizzes.id`, `user_id -> profiles.id` |
| 14 | `quiz_responses` | Per-question choices and awarded points | `attempt_id -> quiz_attempts.id`, `question_id -> quiz_questions.id` |
| 15 | `coding_exercises` | Hands-on code problems and constraints | `language_id -> languages.id`, `lesson_id -> lessons.id` |
| 16 | `coding_test_cases` | Public (sample) and private (grading) cases | `exercise_id -> coding_exercises.id` |
| 17 | `coding_submissions` | Evaluated submissions with runtime/memory | `user_id -> profiles.id`, `exercise_id -> coding_exercises.id` |
| 18 | `projects` | Capstone portfolio projects | `course_id -> courses.id`, `language_id -> languages.id` |
| 19 | `project_submissions` | Project deliverables and review feedback | `project_id -> projects.id`, `user_id -> profiles.id` |
| 20 | `achievements` | Gamification badge criteria & XP rewards | Standalone catalog |
| 21 | `user_achievements` | Unlocked user badges | `user_id -> profiles.id`, `achievement_id -> achievements.id` |
| 22 | `learning_activity` | Event audit log for XP rewards & history | `user_id -> profiles.id` |
| 23 | `content_reviews` | Quality reviews for instructor drafts | `course_id -> courses.id`, `reviewer_id -> profiles.id` |
| 24 | `notifications` | User alerts and achievement notifications | `user_id -> profiles.id` |
| 25 | `audit_logs` | Admin action and access audit logs | `user_id -> profiles.id` |

## Triggers & Automation

### 1. New User Creation Trigger
```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
Automatically seeds `profiles`, assigns `'learner'` role in `user_roles`, initializes `user_stats`, and generates a welcome notification.

### 2. Auto Timestamp Update
Maintains `updated_at` timestamps across `profiles`, `courses`, `modules`, `lessons`, and `user_stats`.
