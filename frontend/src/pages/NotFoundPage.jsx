import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Home, Compass } from 'lucide-react';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-5">
      <div className="p-4 rounded-3xl bg-brand-50 text-brand-600 border border-brand-200">
        <BookOpen className="w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h1 className="text-5xl font-black text-navy-900">404</h1>
        <h2 className="text-xl font-bold text-navy-800">Page Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The academic resource or page you are looking for does not exist or may have been relocated.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="primary" size="sm">
            <Home className="w-4 h-4 mr-1.5" /> Return Home
          </Button>
        </Link>
        <Link to="/explore">
          <Button variant="secondary" size="sm">
            <Compass className="w-4 h-4 mr-1.5" /> Browse Library
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
