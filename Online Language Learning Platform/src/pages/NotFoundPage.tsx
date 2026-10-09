import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Home, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-[#101522] border border-slate-800 shadow-2xl">
        <span className="font-mono text-6xl font-extrabold text-indigo-500 block">404</span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
          <p className="text-sm text-slate-400">
            The curriculum or resource you are looking for does not exist or has been relocated.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="primary" size="sm" leftIcon={<Home className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
          <Link to="/courses">
            <Button variant="outline" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
              Browse Courses
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
