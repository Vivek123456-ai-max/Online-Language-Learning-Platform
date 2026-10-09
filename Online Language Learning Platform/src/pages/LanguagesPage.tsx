import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Language } from '../types/database';
import { Terminal, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../components/common/Input';

import { cache } from '../lib/cache';

export const LanguagesPage: React.FC = () => {
  const cachedLangs = cache.get<Language[]>('languages-catalog');
  const [languages, setLanguages] = useState<Language[]>(cachedLangs || []);
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(!cachedLangs);

  useEffect(() => {
    async function fetchLanguages() {
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('*')
          .order('display_order', { ascending: true });

        if (data && !error) {
          setLanguages(data as Language[]);
          cache.set('languages-catalog', data);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchLanguages();

    const channel = supabase
      .channel('languages-realtime-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'languages' },
        () => {
          fetchLanguages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = ['All', 'Systems', 'Web', 'General Purpose', 'Enterprise', 'Cloud & Systems', 'Mobile & UI', 'Database'];

  const filtered = languages.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(filter.toLowerCase()) || l.slug.includes(filter.toLowerCase());
    const matchCategory = selectedCategory === 'All' || l.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchSearch && matchCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Explore Programming Languages</h1>
        <p className="text-sm text-slate-400 mt-1">
          Browse our structured 19 language tracks with browser execution environments and test-driven challenges.
        </p>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search language..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategory === c
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-[#101522] border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#101522] border border-slate-800 text-center space-y-3">
          <Terminal className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="font-semibold text-white">No languages found</h3>
          <p className="text-xs text-slate-400">
            {languages.length === 0
              ? 'Database tables pending initialization. Run migrations in Supabase SQL editor to load languages.'
              : 'Try adjusting your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((lang) => (
            <Link
              key={lang.id}
              to={`/courses?lang=${lang.slug}`}
              className="p-5 rounded-2xl bg-[#101522] border border-slate-800 hover:border-indigo-500/50 hover:bg-[#131929] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-base font-mono"
                    style={{ color: lang.color || '#6366f1' }}
                  >
                    {lang.name.substring(0, 2)}
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {lang.version || 'Latest'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {lang.name}
                </h3>
                <span className="text-xs text-indigo-400 font-semibold block mb-2">{lang.category}</span>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{lang.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  {lang.is_executable ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Runner Active
                    </>
                  ) : (
                    <span className="text-slate-500">Preview Mode</span>
                  )}
                </span>
                <span className="text-indigo-400 group-hover:underline">View courses →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
