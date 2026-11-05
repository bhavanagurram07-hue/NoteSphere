import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  ArrowRight,
  UploadCloud,
  FileCheck2,
  Users,
  ShieldCheck,
  Sparkles,
  Download,
  GraduationCap,
  Layers,
  Award,
} from 'lucide-react';
import { useResources } from '../context/ResourceContext';
import ResourceCard from '../components/notes/ResourceCard';
import Button from '../components/common/Button';

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { resources, categories } = useResources();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const featuredNotes = resources.slice(0, 3);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 bg-gradient-to-b from-blue-50/70 via-white to-[#f8fafc]">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-300/20 to-accent-300/20 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold shadow-subtle animate-in fade-in slide-in-from-top-2 duration-300">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>The Next-Gen Academic Resource Sharing Hub</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-navy-900 leading-[1.15]">
            Share Knowledge.{' '}
            <span className="bg-gradient-to-r from-brand-600 via-accent-600 to-indigo-600 bg-clip-text text-transparent">
              Learn Together.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            NoteSphere is a collaborative platform where university students and faculty exchange verified lecture notes, previous years' exam papers, and syllabus guides — completely free.
          </p>

          {/* Hero Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto flex items-center bg-white p-2 rounded-2xl border border-slate-200/90 shadow-elevated focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all"
          >
            <div className="pl-3 text-slate-400">
              <Search className="w-5 h-5 text-brand-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject (e.g. Data Structures, Calculus, DSP)..."
              className="w-full px-3 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none"
            />
            <Button type="submit" size="sm" variant="primary">
              Search
            </Button>
          </form>

          {/* Call to action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/explore">
              <Button size="lg" variant="primary">
                Explore Resources <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="secondary">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Quick Platform Metrics */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-slate-200/60 text-center">
            <div className="p-3">
              <p className="text-2xl font-black text-navy-900">12,500+</p>
              <p className="text-xs text-slate-500 font-medium">Lecture Notes</p>
            </div>
            <div className="p-3">
              <p className="text-2xl font-black text-brand-600">4,800+</p>
              <p className="text-xs text-slate-500 font-medium">Past Exam Papers</p>
            </div>
            <div className="p-3">
              <p className="text-2xl font-black text-accent-600">35,000+</p>
              <p className="text-xs text-slate-500 font-medium">Student Downloads</p>
            </div>
            <div className="p-3">
              <p className="text-2xl font-black text-emerald-600">98.5%</p>
              <p className="text-xs text-slate-500 font-medium">Exam Pass Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Resources Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Top Curated</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Featured Academic Resources
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Handpicked, highly rated lecture notes and formula guides by verified students and faculty.
            </p>
          </div>
          <Link to="/explore">
            <Button variant="outline" size="sm">
              View All Resources &rarr;
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredNotes.map((note) => (
            <ResourceCard key={note._id || note.id} resource={note} />
          ))}
        </div>
      </section>

      {/* Academic Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-600">Organized Learning</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Browse By Academic Department
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Find documents sorted by engineering discipline, mathematics, or management.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/explore?dept=${encodeURIComponent(cat.name)}`}
              className="group p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-brand-300 shadow-subtle hover:shadow-card transition-all duration-200 text-center flex flex-col items-center gap-3"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.color} text-white flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform`}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-navy-900 group-hover:text-brand-600 transition-colors">
                  {cat.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{cat.count}+ resources</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-b from-slate-50 to-blue-50/40 py-16 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Simple Process</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              How NoteSphere Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Three seamless steps to level up your exam preparation and share your knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 font-black flex items-center justify-center text-sm border border-brand-200">
                01
              </div>
              <h3 className="text-base font-bold text-navy-900">Upload Your Materials</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your handwritten or typed lecture notes, solved assignments, and question papers directly in PDF or DOCX format.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-700 font-black flex items-center justify-center text-sm border border-accent-200">
                02
              </div>
              <h3 className="text-base font-bold text-navy-900">Campus Verification</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Resources are indexed by semester, subject, and course code, then reviewed by moderators for academic authenticity.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-black flex items-center justify-center text-sm border border-emerald-200">
                03
              </div>
              <h3 className="text-base font-bold text-navy-900">Study & Ace Exams</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Search with instant filters, preview documents in browser, bookmark key chapters, and download for offline revision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Why NoteSphere?</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Built For Smart Academics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Engineered with student pain-points in mind, removing paywalls and scattered WhatsApp groups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
            <div className="p-3 w-fit rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-navy-900">100% Free Access</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              No hidden paywalls or subscription tokens. Pure peer-to-peer education sharing.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
            <div className="p-3 w-fit rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-navy-900">Verified Quality</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upvotes and peer reviews filter out outdated content so you get only exam-relevant material.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
            <div className="p-3 w-fit rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-navy-900">Syllabus-Aligned</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Notes are categorized cleanly by semester (1 through 8) and course syllabus branches.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
            <div className="p-3 w-fit rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-navy-900">Contributor Badges</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Earn community reputation, upload milestones, and campus prestige for sharing quality notes.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-navy-900 via-brand-900 to-navy-950 text-white text-center space-y-6 shadow-elevated relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Ace Your Next Semester?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Join thousands of students and educators exchanging study materials across universities today.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
            <Link to="/register">
              <Button size="lg" variant="primary" className="bg-white text-navy-900 hover:bg-slate-100">
                Join NoteSphere Free
              </Button>
            </Link>
            <Link to="/explore">
              <Button size="lg" variant="secondary" className="border-slate-700 bg-navy-800 text-white hover:bg-navy-700">
                Browse Resources
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
