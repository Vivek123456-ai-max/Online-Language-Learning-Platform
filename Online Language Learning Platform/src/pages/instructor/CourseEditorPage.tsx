import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Course, Module, Lesson } from '../../types/database';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Alert } from '../../components/common/Alert';
import Editor from '@monaco-editor/react';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Play, 
  Clock, 
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { MONACO_LANGUAGE_MAP, executeCode, ExecutionResult } from '../../lib/codeExecution';

export const CourseEditorPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<(Module & { lessons: Lesson[] })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active Lesson Editor Drawer/Modal
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);
  const [isTestingCode, setIsTestingCode] = useState(false);
  const [testResult, setTestResult] = useState<ExecutionResult | null>(null);

  // Add Module Modal
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleSlug, setNewModuleSlug] = useState('');

  useEffect(() => {
    loadCourseDetails();

    if (!courseId) return;

    const channel = supabase
      .channel(`course-editor-${courseId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'modules', filter: `course_id=eq.${courseId}` },
        () => {
          console.log('[Realtime] Modules changed in course editor');
          loadCourseDetails();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses', filter: `id=eq.${courseId}` },
        () => {
          console.log('[Realtime] Course metadata changed in editor');
          loadCourseDetails();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lessons' },
        () => {
          console.log('[Realtime] Lessons changed in course editor');
          loadCourseDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId]);

  const loadCourseDetails = async () => {
    if (!courseId) return;
    setIsLoading(true);

    try {
      const { data: cData } = await supabase
        .from('courses')
        .select('*, language:languages(*)')
        .eq('id', courseId)
        .single();

      if (cData) {
        setCourse(cData as Course);
      }

      const { data: mData } = await supabase
        .from('modules')
        .select('*, lessons(*)')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (mData) {
        setModules(
          mData.map((m: any) => ({
            ...m,
            lessons: (m.lessons || []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index),
          }))
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCourseMeta = async () => {
    if (!course) return;
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: course.title,
          short_description: course.short_description,
          description: course.description,
          difficulty: course.difficulty,
          status: course.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', course.id);

      if (error) throw error;
      setStatusMessage({ type: 'success', text: 'Course metadata updated successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save course changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle || !newModuleSlug || !course) return;

    try {
      const nextIndex = modules.length + 1;
      const { data, error } = await supabase
        .from('modules')
        .insert({
          course_id: course.id,
          title: newModuleTitle,
          slug: newModuleSlug,
          order_index: nextIndex,
          status: 'published',
        })
        .select('*, lessons(*)')
        .single();

      if (error) throw error;

      setModules([...modules, { ...data, lessons: [] }]);
      setShowAddModule(false);
      setNewModuleTitle('');
      setNewModuleSlug('');
      setStatusMessage({ type: 'success', text: 'Module added!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !targetModuleId) return;

    setIsSaving(true);
    try {
      if (editingLesson.id) {
        // Update existing lesson
        const { error } = await supabase
          .from('lessons')
          .update({
            title: editingLesson.title,
            slug: editingLesson.slug,
            summary: editingLesson.summary,
            content: editingLesson.content,
            code_example: editingLesson.code_example,
            expected_output: editingLesson.expected_output,
            estimated_minutes: editingLesson.estimated_minutes || 10,
            status: editingLesson.status || 'published',
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingLesson.id);

        if (error) throw error;
      } else {
        // Insert new lesson
        const targetMod = modules.find((m) => m.id === targetModuleId);
        const nextOrder = (targetMod?.lessons.length || 0) + 1;

        const { error } = await supabase.from('lessons').insert({
          module_id: targetModuleId,
          title: editingLesson.title,
          slug: editingLesson.slug,
          summary: editingLesson.summary,
          content: editingLesson.content || '# Lesson Overview',
          code_example: editingLesson.code_example || '',
          expected_output: editingLesson.expected_output || '',
          estimated_minutes: editingLesson.estimated_minutes || 10,
          order_index: nextOrder,
          status: editingLesson.status || 'published',
        });

        if (error) throw error;
      }

      setEditingLesson(null);
      setTargetModuleId(null);
      setTestResult(null);
      await loadCourseDetails();
      setStatusMessage({ type: 'success', text: 'Lesson saved successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestRunCode = async () => {
    if (!editingLesson?.code_example || !editingLesson.code_example.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter starter code in the editor first.' });
      return;
    }

    setIsTestingCode(true);
    setTestResult(null);

    try {
      const currentLangSlug = course?.language?.slug || 'cpp';
      const result = await executeCode(currentLangSlug, editingLesson.code_example, '');
      setTestResult(result);

      if (result.stdout && result.stdout.trim()) {
        const cleanStdout = result.stdout.trim();
        setEditingLesson((prev) => (prev ? { ...prev, expected_output: cleanStdout } : null));
        setStatusMessage({
          type: 'success',
          text: `Executed successfully! Expected output automatically populated.`,
        });
      } else if (result.stderr || result.compile_output) {
        setStatusMessage({
          type: 'error',
          text: 'Compiler returned errors. Review the output block below before saving.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Compiler execution failed.' });
    } finally {
      setIsTestingCode(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400 gap-3">
        <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Course Studio...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-[#101522] border border-slate-800 text-center space-y-4">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Course Not Found</h2>
        <Link to="/instructor">
          <Button variant="primary" size="sm">
            Back to Instructor Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const langSlug = course.language?.slug || 'cpp';
  const monacoLang = MONACO_LANGUAGE_MAP[langSlug] || 'plaintext';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/instructor"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                {course.language?.name}
              </span>
              <span className="text-xs font-mono uppercase text-slate-400">Status: {course.status}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">{course.title}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {course.status === 'published' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const nextStatus = 'draft';
                setCourse({ ...course, status: nextStatus });
                await supabase.from('courses').update({ status: nextStatus }).eq('id', course.id);
                setStatusMessage({ type: 'success', text: 'Course switched to draft (private).' });
              }}
              leftIcon={<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              Published (Click to Unpublish)
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                const nextStatus = 'published';
                setCourse({ ...course, status: nextStatus });
                await supabase.from('courses').update({ status: nextStatus }).eq('id', course.id);
                setStatusMessage({ type: 'success', text: 'Course published live for all learners!' });
              }}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Publish Live
            </Button>
          )}

          <Link to={`/learn/${course.slug}`}>
            <Button variant="outline" size="sm" leftIcon={<Play className="w-3.5 h-3.5 text-indigo-400" />} className="text-xs">
              Open Workspace
            </Button>
          </Link>

          <Link to={`/courses/${course.slug}`}>
            <Button variant="outline" size="sm" className="text-xs">
              Overview
            </Button>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={handleUpdateCourseMeta}
            isLoading={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Save Settings
          </Button>
        </div>
      </div>

      {statusMessage && (
        <Alert type={statusMessage.type} onClose={() => setStatusMessage(null)}>
          {statusMessage.text}
        </Alert>
      )}

      {/* Grid: Course Meta on Left, Curriculum on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Metadata form */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#101522] border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white">Course Configuration</h2>

            <div className="space-y-3 text-xs">
              <Input
                label="Course Title"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
              />

              <div className="space-y-1">
                <label className="font-medium text-slate-300 block">Status</label>
                <select
                  value={course.status}
                  onChange={(e) => setCourse({ ...course, status: e.target.value as any })}
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published (Live for Learners)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300 block">Difficulty</label>
                <select
                  value={course.difficulty}
                  onChange={(e) => setCourse({ ...course, difficulty: e.target.value as any })}
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
                  value={course.short_description || ''}
                  onChange={(e) => setCourse({ ...course, short_description: e.target.value })}
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300 block">Full Description</label>
                <textarea
                  rows={4}
                  value={course.description || ''}
                  onChange={(e) => setCourse({ ...course, description: e.target.value })}
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Modules & Lessons tree */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Curriculum Structure ({modules.length} Modules)
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModule(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Module
            </Button>
          </div>

          <div className="space-y-4">
            {modules.map((mod, modIdx) => (
              <div
                key={mod.id}
                className="bg-[#101522] border border-slate-800 rounded-2xl overflow-hidden space-y-2 p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">
                      Module {modIdx + 1}
                    </span>
                    <h3 className="font-bold text-white text-base">{mod.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTargetModuleId(mod.id);
                      setEditingLesson({
                        title: '',
                        slug: '',
                        summary: '',
                        content: '# Lesson Title\n\nExplain the concept here.',
                        code_example: '',
                        expected_output: '',
                        estimated_minutes: 10,
                        status: 'published',
                      });
                    }}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Add Lesson
                  </Button>
                </div>

                {/* Lessons in module */}
                <div className="space-y-2 pt-2">
                  {mod.lessons.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No lessons in this module yet.</p>
                  ) : (
                    mod.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-3 bg-[#0d111b] border border-slate-800/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Play className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-white block">{lesson.title}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              slug: {lesson.slug} • {lesson.estimated_minutes} min
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/learn/${course.slug}/${lesson.slug}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                            title="Preview in Monaco workspace"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setTargetModuleId(mod.id);
                              setEditingLesson(lesson);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400"
                            title="Edit Lesson"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Module Modal */}
      {showAddModule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101522] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add Curriculum Module</h3>
            <form onSubmit={handleAddModule} className="space-y-4 text-xs">
              <Input
                label="Module Title"
                required
                placeholder="e.g. Module 2: Pointers & References"
                value={newModuleTitle}
                onChange={(e) => {
                  setNewModuleTitle(e.target.value);
                  setNewModuleSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)+/g, '')
                  );
                }}
              />
              <Input
                label="Module Slug"
                required
                value={newModuleSlug}
                onChange={(e) => setNewModuleSlug(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddModule(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Module
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Editor Modal / Drawer */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#101522] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingLesson.id ? 'Edit Lesson' : 'Add New Lesson'}
              </h3>
              <button
                onClick={() => setEditingLesson(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Lesson Title"
                  required
                  placeholder="e.g. 1.2 Variables and Memory"
                  value={editingLesson.title || ''}
                  onChange={(e) => {
                    const t = e.target.value;
                    setEditingLesson({
                      ...editingLesson,
                      title: t,
                      slug:
                        editingLesson.slug ||
                        t
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)+/g, ''),
                    });
                  }}
                />

                <Input
                  label="Lesson Slug"
                  required
                  placeholder="e.g. variables-and-memory"
                  value={editingLesson.slug || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, slug: e.target.value })}
                />
              </div>

              <Input
                label="Summary (short 1-line overview)"
                placeholder="Learn how integers and floating points are declared in memory."
                value={editingLesson.summary || ''}
                onChange={(e) => setEditingLesson({ ...editingLesson, summary: e.target.value })}
              />

              <div className="space-y-1">
                <label className="font-medium text-slate-300 block">Lesson Content (Markdown)</label>
                <textarea
                  rows={6}
                  value={editingLesson.content || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Starter Code Monaco Block & Instant Compiler Runner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-300 block">
                    Starter Code Example ({course.language?.name})
                  </label>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleTestRunCode}
                    isLoading={isTestingCode}
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 py-1 px-3"
                  >
                    ⚡ Run & Auto-Fill Output
                  </Button>
                </div>

                <div className="h-48 border border-slate-800 rounded-xl overflow-hidden bg-[#0d111b]">
                  <Editor
                    height="100%"
                    language={monacoLang}
                    value={editingLesson.code_example || ''}
                    onChange={(val) => setEditingLesson({ ...editingLesson, code_example: val || '' })}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      tabSize: 4,
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>

                {/* Instant Compiler Output Feedback */}
                {testResult && (
                  <div className="space-y-2 pt-1">
                    {testResult.compile_output && (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs font-mono">
                        <div className="font-bold flex items-center gap-1.5 text-rose-400 mb-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Compilation Error
                        </div>
                        <pre className="whitespace-pre-wrap">{testResult.compile_output}</pre>
                      </div>
                    )}

                    {testResult.stderr && (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs font-mono">
                        <div className="font-bold flex items-center gap-1.5 text-rose-400 mb-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Runtime Error
                        </div>
                        <pre className="whitespace-pre-wrap">{testResult.stderr}</pre>
                      </div>
                    )}

                    {testResult.stdout && (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-mono">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-400 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Online Compiler Output (Auto-filled below) • {testResult.time ? `${(parseFloat(testResult.time) * 1000).toFixed(0)}ms` : 'instant'}
                        </div>
                        <pre className="whitespace-pre-wrap text-white">{testResult.stdout}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  label="Expected Output (for automated verification)"
                  placeholder="Hello, CodeVerse!"
                  value={editingLesson.expected_output || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, expected_output: e.target.value })}
                />
                <p className="text-[11px] text-slate-500">
                  Tip: Click <strong>⚡ Run & Auto-Fill Output</strong> above to automatically run your code in the online compiler and fill this field.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <Button variant="ghost" size="sm" type="button" onClick={() => setEditingLesson(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
                  Save Lesson
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
