import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  Download,
  Bookmark,
  Award,
  ArrowRight,
  BookOpen,
  PlusCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Activity,
  FileCheck2,
  ThumbsUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useResources } from '../context/ResourceContext';
import authService from '../services/authService';
import ResourceCard from '../components/notes/ResourceCard';
import Button from '../components/common/Button';

const StudentDashboardPage = () => {
  const { user } = useAuth();
  const { resources, userUploads, bookmarks } = useResources();
  const [backendStats, setBackendStats] = useState(null);

  // Fetch live stats from backend API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await authService.getDashboardStats();
        if (data?.success && data?.stats) {
          setBackendStats(data.stats);
        }
      } catch (err) {
        // Fall back to local calculation
      }
    };
    fetchStats();
  }, []);

  // Metrics calculation
  const totalUploads = userUploads.length;
  const totalDownloads = userUploads.reduce(
    (acc, curr) => acc + (curr.downloads || curr.downloadsCount || 0),
    0
  );
  const totalBookmarks = bookmarks.length;
  const totalUpvotes = userUploads.reduce((acc, curr) => acc + (curr.upvotesCount || 0), 0);

  // Popular resources sorted by upvotes & downloads
  const popularResources = [...resources]
    .sort(
      (a, b) =>
        ((b.upvotesCount || 0) + (b.downloads || b.downloadsCount || 0)) -
        ((a.upvotesCount || 0) + (a.downloads || a.downloadsCount || 0))
    )
    .slice(0, 3);

  // Recent activity stream
  const activities = [
    {
      id: 'act-1',
      icon: UploadCloud,
      color: 'text-brand-600 bg-brand-50',
      title: 'Uploaded new lecture notes',
      subject: userUploads[0]?.title || 'Data Structures Midterm Revision',
      time: '2 hours ago',
    },
    {
      id: 'act-2',
      icon: ThumbsUp,
      color: 'text-amber-600 bg-amber-50',
      title: 'Received 12 upvotes on your document',
      subject: 'Algorithms and Analysis Guide',
      time: 'Yesterday',
    },
    {
      id: 'act-3',
      icon: Bookmark,
      color: 'text-violet-600 bg-violet-50',
      title: 'Bookmarked a resource',
      subject: 'Operating Systems Solved End-Semester Papers',
      time: '3 days ago',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl w-full">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-brand-900 to-indigo-950 text-white p-6 sm:p-8 shadow-elevated">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Academic Year 2025–2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {user?.department} &bull; {user?.semester} &bull; {user?.email}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/upload">
              <Button variant="primary" className="bg-brand-500 hover:bg-brand-600 text-white border-0 shadow-glow-brand">
                <PlusCircle className="w-4 h-4 mr-1.5" /> Quick Upload
              </Button>
            </Link>
            <Link to="/explore">
              <Button variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Explore Resources
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Uploads</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <UploadCloud className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-navy-900">{totalUploads}</div>
          <p className="text-[11px] text-slate-400">Published study guides</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Downloads</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{totalDownloads}</div>
          <p className="text-[11px] text-slate-400">By student peers</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Bookmarks</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-violet-600">{totalBookmarks}</div>
          <p className="text-[11px] text-slate-400">Saved for exam revision</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Reputation Score</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {totalUpvotes * 10 + 120} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <p className="text-[11px] text-slate-400">Rank: Active Contributor</p>
        </div>
      </div>

      {/* Main Grid: Recently Uploaded Resources & Popular Resources */}
      <div className="space-y-8">
        {/* Popular Resources Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <div>
                <h2 className="text-lg font-bold text-navy-900 tracking-tight">
                  Popular Resources
                </h2>
                <p className="text-xs text-slate-500">
                  Most downloaded and highly rated documents across the university repository.
                </p>
              </div>
            </div>
            <Link to="/explore" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Explore All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularResources.map((note) => (
              <ResourceCard key={note._id || note.id} resource={note} />
            ))}
          </div>
        </div>

        {/* Recently Uploaded Resources Summary Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <h3 className="text-base font-bold text-navy-900">Recently Uploaded Resources</h3>
            </div>
            <Link to="/my-uploads" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Manage All Uploads &rarr;
            </Link>
          </div>

          {userUploads.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="p-3 w-fit mx-auto rounded-full bg-slate-100 text-slate-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500">You haven't uploaded any notes yet.</p>
              <Link to="/upload">
                <Button size="sm" variant="primary">
                  Upload First Note
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {userUploads.slice(0, 3).map((upload) => {
                const uploadId = upload._id || upload.id;
                const dl = upload.downloads || upload.downloadsCount || 0;
                const uv = upload.upvotesCount || 0;
                return (
                  <div key={uploadId} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        to={`/resources/${uploadId}`}
                        className="text-xs sm:text-sm font-bold text-navy-900 hover:text-brand-600 transition-colors truncate block"
                      >
                        {upload.title}
                      </Link>
                      <span className="text-[11px] text-slate-400">
                        {upload.subject} &bull; {dl} downloads &bull; {uv} upvotes
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      Published
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Activity className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-navy-900">Recent Activity</h3>
          </div>

          <div className="space-y-4">
            {activities.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex items-start gap-3.5 text-xs">
                  <div className={`p-2 rounded-xl shrink-0 ${act.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="font-semibold text-navy-900">{act.title}</p>
                    <p className="text-slate-500">{act.subject}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{act.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
