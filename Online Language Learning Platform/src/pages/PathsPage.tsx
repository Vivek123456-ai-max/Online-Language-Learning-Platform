import React from 'react';
import { Link } from 'react-router-dom';
import { Route, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../components/common/Button';

export const PathsPage: React.FC = () => {
  const paths = [
    {
      title: 'C++ Systems Engineering Path',
      language: 'C++',
      levels: ['Beginner', 'Intermediate', 'Advanced'],
      steps: [
        '1. Introduction & Compilation Model',
        '2. Variables, Memory & Data Types',
        '3. Control Flow & Loops',
        '4. Functions & Modular Architecture',
        '5. Pointers, References & Dynamic Memory',
        '6. Object-Oriented Programming (OOP)',
        '7. STL (Standard Template Library)',
        '8. Data Structures & Algorithms',
        '9. Systems Projects & Capstones',
      ],
      slug: 'cpp',
    },
    {
      title: 'Python Software Development Path',
      language: 'Python',
      levels: ['Beginner', 'Intermediate'],
      steps: [
        '1. Syntax, REPL & Scripting',
        '2. Data Structures: Lists, Dicts, Tuples',
        '3. Functional Programming & Lambdas',
        '4. OOP & Class Decorators',
        '5. File I/O & Error Handling',
        '6. Virtual Environments & Pip',
        '7. Backend APIs & Automation Capstone',
      ],
      slug: 'python',
    },
    {
      title: 'Java Enterprise Architecture Path',
      language: 'Java',
      levels: ['Beginner', 'Intermediate', 'Advanced'],
      steps: [
        '1. JVM, JRE, and Bytecode Anatomy',
        '2. Java Syntax & Data Types',
        '3. Classes, Objects & Packages',
        '4. Inheritance, Polymorphism & Interfaces',
        '5. Java Collections Framework',
        '6. Generics, Streams & Lambdas',
        '7. Enterprise Design Patterns',
      ],
      slug: 'java',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Structured Learning Paths</h1>
        <p className="text-sm text-slate-400 mt-1">
          Follow ordered, step-by-step roadmaps from zero to advanced professional fluency.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {paths.map((p) => (
          <div
            key={p.slug}
            className="rounded-2xl bg-[#101522] border border-slate-800 p-6 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {p.language} Roadmap
                </span>
                <span className="text-xs text-slate-400">{p.steps.length} Milestones</span>
              </div>
              <h3 className="text-xl font-bold text-white">{p.title}</h3>

              <div className="space-y-2 pt-2">
                {p.steps.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <Link to={`/courses?lang=${p.slug}`}>
                <Button variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore Roadmap
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
