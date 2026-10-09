import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Course, Language } from '../types/database';
import { DifficultyBadge } from '../components/common/StatusBadge';
import { BookOpen, Clock, Award, ArrowRight, Search, Filter, Sparkles } from 'lucide-react';
import { formatDuration } from '../lib/utils';

import { cache } from '../lib/cache';

export const CoursesPage: React.FC = () => {
  const cachedCourses = cache.get<Course[]>('courses-catalog');
  const cachedLangs = cache.get<Language[]>('courses-languages');

  const [courses, setCourses] = useState<Course[]>(cachedCourses || []);
  const [languages, setLanguages] = useState<Language[]>(cachedLangs || []);
  const [isLoading, setIsLoading] = useState(!cachedCourses);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const langFilter = searchParams.get('lang') || 'all';

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*, language:languages(*)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setCourses(data as Course[]);
        cache.set('courses-catalog', data);
      }

      const { data: langs } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (langs) {
        setLanguages(langs as Language[]);
        cache.set('courses-languages', langs);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();

    // Realtime listener on courses table
    const channel = supabase
      .channel('realtime-courses-catalog')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => {
          fetchCourses();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'languages' },
        () => {
          fetchCourses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesLang = langFilter === 'all' || c.language?.slug === langFilter;
      const matchesSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.language?.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLang && matchesSearch;
    });
  }, [courses, langFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Realtime Synchronized Curriculum</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Course Catalog
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Browse structured courses with incremental lessons, interactive Monaco code challenges, and verified completion certificates.
        </p>
      </div>

      {/* Search and Filter Toolbar (Fully Responsive) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#101522] border border-slate-800 p-4 rounded-2xl">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Language Filter Pills (Scrollable horizontally on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setSearchParams({})}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              langFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Tracks
          </button>
          {languages.map((l) => (
            <button
              key={l.id}
              onClick={() => setSearchParams({ lang: l.slug })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                langFilter === l.slug
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#101522] border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#101522] border border-slate-800 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-white text-lg">No matching courses found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query or language filter to discover available courses.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchParams({});
            }}
            className="text-xs text-indigo-400 hover:underline font-semibold"
          >
            Clear Filters & View All Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="rounded-3xl bg-[#101522] border border-slate-800 hover:border-indigo-500/50 hover:bg-[#131929] transition-all p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-xl group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${course.language?.color || '#6366f1'}20`,
                      color: course.language?.color || '#818cf8',
                    }}
                  >
                    {course.language?.name || 'Programming'}
                  </span>
                  <DifficultyBadge difficulty={course.difficulty} />
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {course.short_description || course.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    {formatDuration(course.estimated_duration_hours)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Verified Certificate
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <Link
                  to={`/courses/${course.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-md shadow-indigo-600/20"
                >
                  <span>View Syllabus</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
