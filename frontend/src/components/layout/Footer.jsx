import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Shield, Heart, GraduationCap, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-600 text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Note<span className="text-brand-400">Sphere</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart academic resource sharing platform connecting university students and educators worldwide to share lecture notes, exam papers, and syllabus guides.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a href="#github" className="hover:text-white transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#twitter" className="hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#linkedin" className="hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  Explore Library
                </Link>
              </li>
              <li>
                <Link to="/upload" className="hover:text-white transition-colors">
                  Upload Notes
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/bookmarks" className="hover:text-white transition-colors">
                  My Bookmarks
                </Link>
              </li>
            </ul>
          </div>

          {/* Academic Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Departments</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/explore?dept=Computer+Science" className="hover:text-white transition-colors">
                  Computer Science & Engineering
                </Link>
              </li>
              <li>
                <Link to="/explore?dept=Electronics" className="hover:text-white transition-colors">
                  Electronics & Communication
                </Link>
              </li>
              <li>
                <Link to="/explore?dept=Mechanical" className="hover:text-white transition-colors">
                  Mechanical Engineering
                </Link>
              </li>
              <li>
                <Link to="/explore?dept=Mathematics" className="hover:text-white transition-colors">
                  Applied Mathematics
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Academic Integrity</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              NoteSphere is dedicated to peer learning and syllabus revision. All uploads are screened by campus moderators for academic honesty.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Shield className="w-4 h-4" />
              Verified & Secure Cloud CDN
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} NoteSphere. Built with React, Tailwind, Express & MongoDB.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Made for Students with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
