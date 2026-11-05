import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  FileCheck2,
  Users,
  Download,
  AlertTriangle,
  Check,
  X,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  UserX,
  UserCheck,
  BarChart3,
  TrendingUp,
  Bookmark,
  Flag,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Layers,
  UploadCloud,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import facultyService from '../services/facultyService';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const FacultyDashboardPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'moderation' | 'users' | 'reports'
  const [isLoading, setIsLoading] = useState(true);

  // Analytics Data
  const [analytics, setAnalytics] = useState(null);

  // Moderation Data
  const [resources, setResources] = useState([]);
  const [resourceStatusFilter, setResourceStatusFilter] = useState('all');
  const [resourceSearch, setResourceSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Users Data
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('student');

  // Reports Data
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('all');

  // Fetch Analytics & Overview
  const loadAnalytics = useCallback(async () => {
    try {
      const data = await facultyService.getAnalytics();
      if (data?.success) {
        setAnalytics(data);
      }
    } catch (err) {
      addToast('Failed to load faculty analytics', 'error');
    }
  }, [addToast]);

  // Fetch Moderation Resources
  const loadResources = useCallback(async () => {
    try {
      const params = {};
      if (resourceStatusFilter !== 'all') params.status = resourceStatusFilter;
      if (resourceSearch.trim()) params.search = resourceSearch.trim();
      const data = await facultyService.getResources(params);
      if (data?.success) {
        setResources(data.resources || []);
      }
    } catch (err) {
      addToast('Failed to load academic resources', 'error');
    }
  }, [resourceStatusFilter, resourceSearch, addToast]);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    try {
      const params = {};
      if (userSearch.trim()) params.search = userSearch.trim();
      if (userRoleFilter !== 'all') params.role = userRoleFilter;
      const data = await facultyService.getUsers(params);
      if (data?.success) {
        setUsersList(data.users || []);
      }
    } catch (err) {
      addToast('Failed to load student directory', 'error');
    }
  }, [userSearch, userRoleFilter, addToast]);

  // Fetch Reports
  const loadReports = useCallback(async () => {
    try {
      const params = {};
      if (reportFilter !== 'all') params.status = reportFilter;
      const data = await facultyService.getReports(params);
      if (data?.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      addToast('Failed to load academic reports', 'error');
    }
  }, [reportFilter, addToast]);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadAnalytics(), loadResources(), loadUsers(), loadReports()]);
      setIsLoading(false);
    };
    init();
  }, [loadAnalytics, loadResources, loadUsers, loadReports]);

  // Moderation: Approve / Reject
  const handleModerate = async (id, status) => {
    setActionLoadingId(id);
    try {
      const data = await facultyService.moderateResource(id, status);
      if (data?.success) {
        addToast(`Resource status set to ${status}`, 'success');
        loadResources();
        loadAnalytics();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Moderation action failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Moderation: Delete Resource
  const handleDeleteResource = async (id) => {
    if (!window.confirm('Permanently remove this academic resource?')) return;
    try {
      const data = await facultyService.deleteResource(id);
      if (data?.success) {
        addToast('Resource removed successfully', 'info');
        loadResources();
        loadAnalytics();
      }
    } catch (err) {
      addToast('Failed to delete resource', 'error');
    }
  };

  // Report: Resolve / Dismiss
  const handleUpdateReport = async (reportId, status, actionTaken) => {
    try {
      const data = await facultyService.updateReportStatus(reportId, status, actionTaken);
      if (data?.success) {
        addToast(`Report marked as ${status}`, 'success');
        loadReports();
        loadAnalytics();
      }
    } catch (err) {
      addToast('Failed to update report status', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner text="Retrieving faculty curriculum and analytics..." />
      </div>
    );
  }

  const metrics = analytics?.metrics || {
    totalStudents: 0,
    totalResources: 0,
    totalDownloads: 0,
    totalBookmarks: 0,
    pendingResources: 0,
    reportedResources: 0,
    myUploadsCount: 0,
  };

  const categoryData =
    analytics?.charts?.categoryBreakdown ||
    analytics?.analytics?.categoryBreakdown?.map((c) => ({
      category: c.name,
      count: c.value,
      downloads: c.downloads || 0,
    })) ||
    [];

  const departmentData =
    analytics?.charts?.departmentDistribution ||
    analytics?.analytics?.departmentBreakdown?.map((d) => ({
      department: d.name,
      count: d.value,
      downloads: d.downloads || 0,
    })) ||
    [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Faculty Academic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-elevated">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Faculty Academic Portal &amp; Curriculum Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Faculty Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Publish official academic resources, upload syllabus notes, question papers &amp; lab manuals, moderate curriculum materials, and monitor campus engagement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/upload"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-subtle flex items-center gap-2 transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload Official Resource
            </Link>

            <Link
              to="/my-resources"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-3.5 h-3.5" />
              My Uploads ({metrics.myUploadsCount || 0})
            </Link>

            <button
              onClick={() => {
                loadAnalytics();
                loadResources();
                loadUsers();
                loadReports();
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-brand-600 text-white shadow-subtle'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Academic Analytics &amp; KPIs
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'moderation'
              ? 'bg-brand-600 text-white shadow-subtle'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Resource Moderation
          {metrics.pendingResources > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-navy-950 font-black">
              {metrics.pendingResources}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-brand-600 text-white shadow-subtle'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Student Directory ({metrics.totalStudents})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reports'
              ? 'bg-brand-600 text-white shadow-subtle'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Flag className="w-4 h-4" />
          Reported Content
          {metrics.reportedResources > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
              {metrics.reportedResources}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ANALYTICS & CHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Total Students</span>
              <div className="text-2xl font-black text-navy-900">{metrics.totalStudents}</div>
              <p className="text-[10px] text-emerald-600 font-medium">Enrolled learners</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Academic Resources</span>
              <div className="text-2xl font-black text-brand-600">{metrics.totalResources}</div>
              <p className="text-[10px] text-slate-400">Curriculum catalog</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Total Downloads</span>
              <div className="text-2xl font-black text-emerald-600">{metrics.totalDownloads}</div>
              <p className="text-[10px] text-slate-400">Study materials accessed</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Total Bookmarks</span>
              <div className="text-2xl font-black text-violet-600">{metrics.totalBookmarks}</div>
              <p className="text-[10px] text-slate-400">Saved to study desks</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Pending Review</span>
              <div className="text-2xl font-black text-amber-600">{metrics.pendingResources}</div>
              <p className="text-[10px] text-amber-600 font-medium">Awaiting moderation</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Pending Reports</span>
              <div className="text-2xl font-black text-rose-600">{metrics.reportedResources}</div>
              <p className="text-[10px] text-rose-600 font-medium">Academic flags</p>
            </div>
          </div>

          {/* Academic Analytics Breakdown Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Academic Categories */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy-900">Academic Category Distribution</h3>
                  <p className="text-xs text-slate-400">Notes, Question Papers, Lab Manuals &amp; Syllabus</p>
                </div>
                <Layers className="w-4 h-4 text-brand-600" />
              </div>

              <div className="space-y-3 pt-2">
                {categoryData.length > 0 ? (
                  categoryData.map((item) => {
                    const maxVal = Math.max(...categoryData.map((c) => c.count), 1);
                    const pct = Math.round((item.count / maxVal) * 100);
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-navy-800">{item.category}</span>
                          <span className="text-slate-500 font-medium">
                            {item.count} items ({item.downloads} downloads)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-4">No category distribution data recorded yet.</p>
                )}
              </div>
            </div>

            {/* Chart 2: Department Distribution */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy-900">Departmental Resource Distribution</h3>
                  <p className="text-xs text-slate-400">Upload volume per academic department</p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-3 pt-2">
                {departmentData.length > 0 ? (
                  departmentData.map((item) => {
                    const maxVal = Math.max(...departmentData.map((d) => d.count), 1);
                    const pct = Math.round((item.count / maxVal) * 100);
                    return (
                      <div key={item.department} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-navy-800">{item.department}</span>
                          <span className="text-slate-500 font-medium">
                            {item.count} items ({item.downloads} downloads)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-4">No department distribution recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESOURCE MODERATION */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resources by title, subject..."
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadResources()}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={resourceStatusFilter}
                onChange={(e) => setResourceStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="all">All Moderation Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <Button variant="secondary" size="sm" onClick={loadResources}>
                Filter
              </Button>
            </div>
          </div>

          {/* Resources Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                    <th className="p-4">Title &amp; Subject</th>
                    <th className="p-4">Category &amp; Dept</th>
                    <th className="p-4">Uploaded By</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Faculty Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No resources matching selected criteria.
                      </td>
                    </tr>
                  ) : (
                    resources.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 space-y-1">
                          <Link
                            to={`/resources/${item._id}`}
                            className="font-bold text-navy-900 hover:text-brand-600 line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>{item.subject}</span>
                            <span>•</span>
                            <span className="uppercase">{item.fileType || 'PDF'}</span>
                          </div>
                        </td>

                        <td className="p-4 space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700">
                            {item.category}
                          </span>
                          <div className="text-[11px] text-slate-500">{item.department}</div>
                        </td>

                        <td className="p-4 space-y-0.5">
                          <div className="font-semibold text-navy-800">
                            {item.uploadedBy?.name || 'Unknown User'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.uploadedBy?.email || 'N/A'}
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              item.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status !== 'approved' && (
                              <button
                                disabled={actionLoadingId === item._id}
                                onClick={() => handleModerate(item._id, 'approved')}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors title='Approve'"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {item.status !== 'rejected' && (
                              <button
                                disabled={actionLoadingId === item._id}
                                onClick={() => handleModerate(item._id, 'rejected')}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors title='Reject'"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              disabled={actionLoadingId === item._id}
                              onClick={() => handleDeleteResource(item._id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors title='Delete'"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student by name, email, reg no..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <Button variant="secondary" size="sm" onClick={loadUsers}>
              Search Directory
            </Button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                    <th className="p-4">Student</th>
                    <th className="p-4">Registration No</th>
                    <th className="p-4">Department &amp; Semester</th>
                    <th className="p-4">Uploads</th>
                    <th className="p-4">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No students found matching your search.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((stu) => (
                      <tr key={stu._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={stu.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={stu.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-navy-900">{stu.name}</div>
                            <div className="text-[11px] text-slate-400">{stu.email}</div>
                          </div>
                        </td>

                        <td className="p-4 font-mono text-[11px] text-slate-600">
                          {stu.registrationNumber || 'Not provided'}
                        </td>

                        <td className="p-4 space-y-0.5">
                          <div className="font-semibold text-slate-700">{stu.department || 'General'}</div>
                          <div className="text-[11px] text-slate-400">{stu.semester || 'Semester 1'}</div>
                        </td>

                        <td className="p-4 font-bold text-brand-600">
                          {stu.uploadsCount !== undefined ? stu.uploadsCount : '—'}
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              stu.role === 'faculty'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-sky-50 text-sky-700'
                            }`}
                          >
                            {stu.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTED CONTENT */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="divide-y divide-slate-100">
              {reports.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No academic reports currently pending review.
                </div>
              ) : (
                reports.map((rep) => {
                  const reporter = rep.reportedBy || {};
                  const doc = rep.resource || {};
                  return (
                    <div key={rep._id} className="p-5 sm:p-6 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                            {rep.reason}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              rep.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : rep.status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {rep.status.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Filed {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-navy-900">
                          Target Document: <span className="font-normal text-slate-700">{doc.title || 'Removed Resource'}</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Reported by: <span className="font-semibold text-navy-800">{reporter.name || 'Student'}</span> ({reporter.email || 'N/A'})
                        </p>
                        {rep.description && (
                          <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700 italic border border-slate-200/60 mt-2">
                            "{rep.description}"
                          </div>
                        )}
                        {rep.actionTaken && (
                          <p className="text-xs text-emerald-700 font-semibold pt-1">
                            Action Taken: {rep.actionTaken}
                          </p>
                        )}
                      </div>

                      {/* Report Resolution Actions */}
                      {rep.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-2">
                          {doc._id && (
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={async () => {
                                await handleDeleteResource(doc._id);
                                await handleUpdateReport(rep._id, 'resolved', 'Resource deleted from library');
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Document &amp; Resolve
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => handleUpdateReport(rep._id, 'dismissed', 'Dismissed as safe content')}
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Dismiss Report
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboardPage;
