export type AppRole = 'learner' | 'instructor' | 'admin';

export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
export type CourseStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'code_prediction';
export type ExerciseDifficulty = 'easy' | 'medium' | 'hard';
export type SubmissionStatus = 'passed' | 'failed' | 'compilation_error' | 'runtime_error' | 'time_limit_exceeded' | 'running' | 'queued';
export type AchievementCategory = 'learning' | 'streak' | 'coding' | 'quiz' | 'course';
export type NotificationType = 'info' | 'success' | 'warning' | 'achievement' | 'review';

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  github_username: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_by: string | null;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  xp: number;
  streak_count: number;
  longest_streak: number;
  last_active_date: string | null;
  courses_completed: number;
  lessons_completed: number;
  quizzes_passed: number;
  exercises_solved: number;
  updated_at: string;
}

export interface Language {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  icon_url: string | null;
  color: string;
  is_executable: boolean;
  judge0_language_id: number | null;
  version: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  language_id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  difficulty: CourseDifficulty;
  thumbnail_url: string | null;
  instructor_id: string | null;
  learning_objectives: string[];
  prerequisites: string[];
  estimated_duration_hours: number;
  status: CourseStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  language?: Language;
  instructor?: Profile;
  modules?: Module[];
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  description: string | null;
  order_index: number;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  code_example: string | null;
  expected_output: string | null;
  order_index: number;
  estimated_minutes: number;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  current_lesson_id: string | null;
  status: EnrollmentStatus;
  progress_percent: number;
  completed_at: string | null;
  enrolled_at: string;
  course?: Course;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
  last_accessed_at: string;
}

export interface Quiz {
  id: string;
  lesson_id: string | null;
  course_id: string | null;
  title: string;
  description: string | null;
  passing_score_percent: number;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  status: 'draft' | 'published';
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  code_snippet: string | null;
  options: Array<{ id: string; text: string }>;
  correct_answers?: string[];
  explanation: string | null;
  points: number;
  order_index: number;
}

export interface CodingExercise {
  id: string;
  lesson_id: string | null;
  language_id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ExerciseDifficulty;
  starter_code: string;
  solution_template: string | null;
  hints: string[];
  constraints: string[];
  xp_reward: number;
  status: 'draft' | 'published';
  created_at: string;
  language?: Language;
}

export interface CodingTestCase {
  id: string;
  exercise_id: string;
  input: string;
  expected_output: string;
  is_public: boolean;
  order_index: number;
}

export interface CodingSubmission {
  id: string;
  user_id: string;
  exercise_id: string;
  code: string;
  language_id: string;
  status: SubmissionStatus;
  passed_count: number;
  total_count: number;
  execution_time_ms: number | null;
  memory_kb: number | null;
  output: string | null;
  error_message: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  slug: string;
  description: string;
  badge_icon: string;
  category: AchievementCategory;
  xp_reward: number;
  requirement_criteria: Record<string, unknown>;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link_url: string | null;
  created_at: string;
}
