import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Course, Language } from '../../types/database';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { DifficultyBadge } from '../../components/common/StatusBadge';
import { Alert } from '../../components/common/Alert';
import { 
  BookOpen, 
  Plus, 
  Users, 
  Layers, 
  Edit3, 
  Eye, 
  Clock, 
  Sparkles, 
  CheckCircle,
  FileText,
  Play
} from 'lucide-react';
import { formatDuration } from '../../lib/utils';
import { getLanguageStarterTemplate } from '../../lib/codeExecution';

export const InstructorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Course Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [languageId, setLanguageId] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [shortDescription, setShortDescription] = useState('');

  useEffect(() => {
    fetchInstructorData();

    // Instant Realtime sync across all devices
    const channel = supabase
      .channel('instructor-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => {
          console.log('[Realtime] Courses changed - refreshing instructor studio');
          fetchInstructorData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'languages' },
        () => {
          fetchInstructorData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchInstructorData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch languages
      const { data: langs } = await supabase.from('languages').select('*').order('name');
      if (langs) {
        setLanguages(langs as Language[]);
        if (langs.length > 0 && !languageId) {
          setLanguageId(langs[0].id);
        }
      }

      // 2. Fetch instructor courses
      // If user is instructor, fetch all courses or courses authored by user
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*, language:languages(*)')
        .order('created_at', { ascending: false });

      if (coursesData) {
        setCourses(coursesData as Course[]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(autoSlug);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !languageId) return;

    setIsCreating(true);
    setStatusMessage(null);

    try {
      const selectedLang = languages.find((l) => l.id === languageId);
      const langSlug = selectedLang?.slug || 'javascript';
      const template = getLanguageStarterTemplate(langSlug);

      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert({
          title,
          slug,
          language_id: languageId,
          difficulty,
          short_description: shortDescription,
          instructor_id: user?.id,
          status: 'published', // Always published immediately
          estimated_duration_hours: 10,
          learning_objectives: ['Master key concepts', 'Write runnable code'],
          prerequisites: ['Basic programming logic'],
        })
        .select('*, language:languages(*)')
        .single();

      if (error) throw error;

      // Add a starter module and lesson automatically so course is never empty
      if (newCourse) {
        const { data: newModule } = await supabase
          .from('modules')
          .insert({
            course_id: newCourse.id,
            title: 'Module 1: Introduction & Environment',
            slug: 'module-1-introduction',
            description: 'Initial fundamentals and overview',
            order_index: 1,
            status: 'published',
          })
          .select()
          .single();

        if (newModule) {
          await supabase.from('lessons').insert({
            module_id: newModule.id,
            title: '1.1 Getting Started',
            slug: '1-1-getting-started',
            summary: `Welcome to ${title}! Run your first program in the browser.`,
            content: `# Getting Started with ${title}\n\nWelcome to **${title}**! In this lesson, we test our execution runtime and output our first program.\n\n### Your Goal:\nRun the starter code below to ensure the compiler environment is operational.`,
            code_example: template.code,
            expected_output: template.expectedOutput,
            order_index: 1,
            estimated_minutes: 5,
            status: 'published',
          });
        }
      }

      setStatusMessage({ type: 'success', text: `Course "${title}" created and published with starter lesson!` });
      setShowCreateModal(false);
      setTitle('');
      setSlug('');
      setShortDescription('');
      fetchInstructorData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create course.' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Instructor Studio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Course Management & Authoring
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Design curricula, publish lessons, and write interactive coding exercises with Monaco Editor.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-lg shadow-indigo-600/20"
        >
          Create New Course
        </Button>
      </div>

      {statusMessage && (
        <Alert type={statusMessage.type} onClose={() => setStatusMessage(null)}>
          {statusMessage.text}
        </Alert>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Courses</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{courses.length}</p>
          <span className="text-[11px] text-slate-500">Live in curriculum directory</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Active Languages</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{languages.length}</p>
          <span className="text-[11px] text-slate-500">Execution runners available</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Authoring Engine</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">Judge0 Live</p>
          <span className="text-[11px] text-slate-500">Isolated compile and test runner</span>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          Authored Courses ({courses.length})
        </h2>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading course catalog...</div>
        ) : courses.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#101522] border border-slate-800 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-white font-semibold">No courses created yet</h3>
            <p className="text-xs text-slate-400">Click Create New Course to start your first curriculum.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-6 rounded-2xl bg-[#101522] border border-slate-800 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${course.language?.color || '#6366f1'}20`,
                        color: course.language?.color || '#818cf8',
                      }}
                    >
                      {course.language?.name}
                    </span>
                    <DifficultyBadge difficulty={course.difficulty} />
                  </div>

                  <h3 className="font-bold text-white text-base leading-snug">{course.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {course.short_description || course.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Link to={`/courses/${course.slug}`}>
                      <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />} className="text-xs px-2.5">
                        Overview
                      </Button>
                    </Link>

                    <Link to={`/learn/${course.slug}`}>
                      <Button variant="ghost" size="sm" leftIcon={<Play className="w-3.5 h-3.5 text-indigo-400" />} className="text-xs px-2.5">
                        Learn
                      </Button>
                    </Link>
                  </div>

                  <Link to={`/instructor/courses/${course.id}`}>
                    <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />} className="text-xs">
                      Curriculum Studio
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101522] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Course</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <Input
                label="Course Title"
                required
                placeholder="e.g. Modern Rust Fundamentals"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />

              <Input
                label="URL Slug"
                required
                placeholder="e.g. rust-fundamentals"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />

              <div className="space-y-1">
                <label className="font-medium text-slate-300 block">Programming Language</label>
                <select
                  value={languageId}
                  onChange={(e) => setLanguageId(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {languages.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300 block">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300 block">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="One or two sentences summarizing the course..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={isCreating}>
                  Create Course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
