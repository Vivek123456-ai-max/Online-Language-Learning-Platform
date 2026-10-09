-- ==================================================================================
-- CodeVerse — Part 2: Seed Data (19 Languages, Starter Courses, Badges)
-- Run this AFTER Part 1 in Supabase SQL Editor
-- ==================================================================================

-- 1. Insert Initial 19 Languages
INSERT INTO public.languages (name, slug, category, description, icon_url, color, is_executable, judge0_language_id, version, display_order)
VALUES
    ('C', 'c', 'Systems', 'Foundational procedural systems programming language.', 'c', '#00599C', true, 50, 'GCC 9.2.0', 1),
    ('C++', 'cpp', 'Systems', 'High-performance object-oriented and systems programming.', 'cpp', '#00599C', true, 54, 'GCC 9.2.0', 2),
    ('Java', 'java', 'Object-Oriented', 'Robust, cross-platform enterprise programming language.', 'java', '#ED8B00', true, 62, 'OpenJDK 13', 3),
    ('Python', 'python', 'General Purpose', 'Clean, high-level language popular in data science, web, and automation.', 'python', '#3776AB', true, 71, '3.8.1', 4),
    ('JavaScript', 'javascript', 'Web', 'The ubiquitous language of the web for client and server.', 'javascript', '#F7DF1E', true, 63, 'Node.js 18', 5),
    ('TypeScript', 'typescript', 'Web', 'JavaScript with strongly typed static syntax.', 'typescript', '#3178C6', true, 74, '4.9.4', 6),
    ('HTML', 'html', 'Web Markup', 'Standard markup language for documents designed to be displayed in a web browser.', 'html', '#E34F26', false, NULL, 'HTML5', 7),
    ('CSS', 'css', 'Web Styling', 'Style sheet language used for describing presentation of a document.', 'css', '#1572B6', false, NULL, 'CSS3', 8),
    ('SQL', 'sql', 'Database', 'Standard language for storing, manipulating and retrieving data in relational databases.', 'sql', '#336791', true, NULL, 'PostgreSQL 15', 9),
    ('C#', 'csharp', 'Enterprise', 'Modern, type-safe programming language for .NET ecosystem.', 'csharp', '#239120', true, 51, 'Mono 6.6.0', 10),
    ('PHP', 'php', 'Web Backend', 'Popular general-purpose scripting language suited for web development.', 'php', '#777BB4', true, 68, '7.4.1', 11),
    ('Go', 'go', 'Cloud & Systems', 'Concurrent, garbage-collected language designed by Google.', 'go', '#00ADD8', true, 60, '1.13.5', 12),
    ('Rust', 'rust', 'Systems', 'Blazingly fast and memory-efficient with guaranteed memory safety.', 'rust', '#DEA584', true, 73, '1.40.0', 13),
    ('Kotlin', 'kotlin', 'Mobile & JVM', 'Modern concise language for Android and multiplatform development.', 'kotlin', '#7F52FF', true, 78, '1.3.70', 14),
    ('Swift', 'swift', 'Apple Ecosystem', 'Fast, safe, and expressive language for iOS and macOS apps.', 'swift', '#FA7343', true, 83, '5.2.3', 15),
    ('Ruby', 'ruby', 'Web & Scripting', 'Dynamic, open source language with a focus on simplicity and productivity.', 'ruby', '#CC342D', true, 72, '2.7.0', 16),
    ('Dart', 'dart', 'Mobile & UI', 'Client-optimized language for fast apps on any platform (Flutter).', 'dart', '#0175C2', true, 90, '2.19.2', 17),
    ('Bash', 'bash', 'Scripting', 'Unix shell and command language for automation and system administration.', 'bash', '#4EAA25', true, 46, '5.0.0', 18),
    ('R', 'r', 'Data Science', 'Language and environment for statistical computing and graphics.', 'r', '#276DC3', true, 80, '4.0.0', 19)
ON CONFLICT (slug) DO UPDATE
SET is_executable = EXCLUDED.is_executable,
    judge0_language_id = EXCLUDED.judge0_language_id;

-- 2. Insert Starter Published Courses
INSERT INTO public.courses (language_id, title, slug, short_description, description, difficulty, estimated_duration_hours, status, published_at, learning_objectives, prerequisites)
SELECT 
    id,
    'C++ Fundamentals: Zero to Hero',
    'cpp-fundamentals',
    'Master core C++ syntax, pointers, memory management, and OOP fundamentals.',
    'A comprehensive introductory track to modern C++ programming. Learn variables, functions, pointers, references, standard template library (STL), and modern object-oriented paradigms.',
    'beginner',
    18.5,
    'published',
    now(),
    ARRAY['Understand basic syntax and compilation', 'Master pointers and references', 'Write Object-Oriented code in C++'],
    ARRAY['Basic computer literacy', 'No prior coding experience required']
FROM public.languages WHERE slug = 'cpp'
ON CONFLICT (slug) DO UPDATE SET status = 'published';

INSERT INTO public.courses (language_id, title, slug, short_description, description, difficulty, estimated_duration_hours, status, published_at, learning_objectives, prerequisites)
SELECT 
    id,
    'Python 3: From Scratch to Fluency',
    'python-from-scratch',
    'Learn clean Pythonic code, data structures, functions, and modern scripting.',
    'The complete foundational course for Python developers. Covers core language primitives, data structures, object-oriented concepts, and standard library tools.',
    'beginner',
    14.0,
    'published',
    now(),
    ARRAY['Master Python syntax and logic flows', 'Leverage lists, dictionaries and sets', 'Build modular functions'],
    ARRAY['No prior programming background required']
FROM public.languages WHERE slug = 'python'
ON CONFLICT (slug) DO UPDATE SET status = 'published';

INSERT INTO public.courses (language_id, title, slug, short_description, description, difficulty, estimated_duration_hours, status, published_at, learning_objectives, prerequisites)
SELECT 
    id,
    'Java Programming: Core & Object Orientation',
    'java-core-essentials',
    'Build enterprise-ready Java applications with strong OOP foundations.',
    'A structured journey through the Java language, standard libraries, classes, inheritance, and clean code practices.',
    'beginner',
    20.0,
    'published',
    now(),
    ARRAY['Understand JVM architecture', 'Design clean classes and interfaces', 'Apply Java collections'],
    ARRAY['None']
FROM public.languages WHERE slug = 'java'
ON CONFLICT (slug) DO UPDATE SET status = 'published';

-- 3. Insert Starter Modules
INSERT INTO public.modules (course_id, title, slug, description, order_index, status)
SELECT 
    id,
    'Module 1: Getting Started with C++',
    'module-1-getting-started',
    'Your first steps in modern C++ compilation and syntax.',
    1,
    'published'
FROM public.courses WHERE slug = 'cpp-fundamentals'
ON CONFLICT (course_id, slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.modules (course_id, title, slug, description, order_index, status)
SELECT 
    id,
    'Module 1: Introduction to Python',
    'py-mod-1-intro',
    'Syntax, printing, variables, and numbers.',
    1,
    'published'
FROM public.courses WHERE slug = 'python-from-scratch'
ON CONFLICT (course_id, slug) DO UPDATE SET title = EXCLUDED.title;

-- 4. Insert Starter Lessons
INSERT INTO public.lessons (module_id, title, slug, summary, content, code_example, expected_output, order_index, estimated_minutes, status)
SELECT 
    id,
    '1.1 Hello World & Basic Structure',
    'cpp-hello-world',
    'Write and compile your very first C++ program using std::cout.',
    'Welcome to C++! C++ is a high-performance compiled language created by Bjarne Stroustrup. Every C++ program begins execution at the main() function. Use std::cout to print text to the standard output.',
    '#include <iostream>

int main() {
    std::cout << "Hello, CodeVerse!" << std::endl;
    return 0;
}',
    'Hello, CodeVerse!',
    1,
    10,
    'published'
FROM public.modules WHERE slug = 'module-1-getting-started'
ON CONFLICT (module_id, slug) DO NOTHING;

INSERT INTO public.lessons (module_id, title, slug, summary, content, code_example, expected_output, order_index, estimated_minutes, status)
SELECT 
    id,
    '1.1 Hello Python & Interactive Scripting',
    'py-hello-world',
    'Understand Python syntax elegance and write your first script.',
    'Welcome to Python! Python is known for its readable, human-friendly syntax. Unlike C++ or Java, Python does not require boilerplate classes or semicolons.',
    'print("Hello, CodeVerse!")',
    'Hello, CodeVerse!',
    1,
    10,
    'published'
FROM public.modules WHERE slug = 'py-mod-1-intro'
ON CONFLICT (module_id, slug) DO NOTHING;

-- 5. Insert Initial Achievements Catalog
INSERT INTO public.achievements (title, slug, description, badge_icon, category, xp_reward, requirement_criteria)
VALUES
    ('First Steps', 'first-steps', 'Complete your very first lesson on CodeVerse.', 'footprints', 'learning', 50, '{"lessons_completed": 1}'),
    ('Streak Starter', 'streak-starter', 'Maintain a 3-day consecutive learning streak.', 'flame', 'streak', 100, '{"streak_count": 3}'),
    ('Streak Master', 'streak-master', 'Maintain a 7-day consecutive learning streak.', 'zap', 'streak', 250, '{"streak_count": 7}'),
    ('Code Explorer', 'code-explorer', 'Enroll in at least 3 distinct programming language courses.', 'compass', 'course', 150, '{"courses_enrolled": 3}'),
    ('Bug Buster', 'bug-buster', 'Pass your first automated coding exercise.', 'check-circle', 'coding', 75, '{"exercises_solved": 1}'),
    ('Quiz Ace', 'quiz-ace', 'Pass a course quiz with a 100% score.', 'award', 'quiz', 120, '{"perfect_quiz_count": 1}'),
    ('Course Graduate', 'course-graduate', 'Complete all lessons and exercises in a full course.', 'graduation-cap', 'course', 500, '{"courses_completed": 1}')
ON CONFLICT (slug) DO NOTHING;
