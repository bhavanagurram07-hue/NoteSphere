import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import adminService from '../services/adminService';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminDashboardPage = () => {
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
      const data = await adminService.getAnalytics();
      if (data?.success) {
        setAnalytics(data);
      }
    } catch (err) {
      addToast('Failed to load database analytics', 'error');
    }
  }, [addToast]);

  // Fetch Moderation Resources
  const loadResources = useCallback(async () => {
    try {
      const params = {};
      if (resourceStatusFilter !== 'all') params.status = resourceStatusFilter;
      if (resourceSearch.trim()) params.q = resourceSearch.trim();
      const data = await adminService.getResources(params);
      if (data?.success) {
        setResources(data.resources || []);
      }
    } catch (err) {
      addToast('Failed to load resources for moderation', 'error');
    }
  }, [resourceStatusFilter, resourceSearch, addToast]);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    try {
      const params = {};
      if (userSearch.trim()) params.q = userSearch.trim();
      if (userRoleFilter !== 'all') params.role = userRoleFilter;
      const data = await adminService.getUsers(params);
      if (data?.success) {
        setUsersList(data.users || []);
      }
    } catch (err) {
      addToast('Failed to load user accounts', 'error');
    }
  }, [userSearch, userRoleFilter, addToast]);

  // Fetch Reports
  const loadReports = useCallback(async () => {
    try {
      const params = {};
      if (reportFilter !== 'all') params.status = reportFilter;
      const data = await adminService.getReports(params);
      if (data?.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      addToast('Failed to load reports queue', 'error');
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
      const data = await adminService.moderateResource(id, status);
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
    if (!window.confirm('Permanently delete this resource and all attached files?')) return;
    try {
      const data = await adminService.deleteResource(id);
      if (data?.success) {
        addToast('Resource deleted permanently', 'info');
        loadResources();
        loadAnalytics();
      }
    } catch (err) {
      addToast('Failed to delete resource', 'error');
    }
  };

  // User: Block / Unblock Toggle
  const handleToggleBlock = async (userItem) => {
    const actionName = userItem.isBlocked ? 're-activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionName} ${userItem.name}'s account?`)) return;

    try {
      const data = await adminService.toggleBlockUser(userItem._id, !userItem.isBlocked);
      if (data?.success) {
        addToast(data.message, 'success');
        loadUsers();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update user status', 'error');
    }
  };

  // Report: Resolve / Dismiss
  const handleUpdateReport = async (reportId, status, actionTaken) => {
    try {
      const data = await adminService.updateReportStatus(reportId, status, actionTaken);
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
        <LoadingSpinner text="Retrieving administrative data and analytics..." />
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
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Admin Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-elevated">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Campus Moderator &amp; Faculty Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Administrative Control Panel
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Audit student contributions, review pending syllabi, resolve copyright or inappropriate content reports, and monitor university analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadAnalytics();
                loadResources();
                loadUsers();
                loadReports();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Data
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
          Analytics &amp; KPIs
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
          Student Accounts ({metrics.totalStudents})
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
              <p className="text-[10px] text-emerald-600 font-medium">Verified campus users</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Total Documents</span>
              <div className="text-2xl font-black text-brand-600">{metrics.totalResources}</div>
              <p className="text-[10px] text-slate-400">In university repo</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Total Downloads</span>
              <div className="text-2xl font-black text-emerald-600">{metrics.totalDownloads}</div>
              <p className="text-[10px] text-slate-400">Served bandwidth</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Total Bookmarks</span>
              <div className="text-2xl font-black text-violet-600">{metrics.totalBookmarks}</div>
              <p className="text-[10px] text-slate-400">Saved to study shelves</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Pending Review</span>
              <div className="text-2xl font-black text-amber-600">{metrics.pendingResources}</div>
              <p className="text-[10px] text-amber-600 font-medium">Awaiting moderation</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Pending Reports</span>
              <div className="text-2xl font-black text-rose-600">{metrics.reportedResources}</div>
              <p className="text-[10px] text-rose-600 font-medium">Inappropriate flags</p>
            </div>
          </div>

          {/* Real MongoDB Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Most Popular Categories */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy-900">Most Popular Academic Categories</h3>
                  <p className="text-xs text-slate-400">Resource distribution by syllabus categorization</p>
                </div>
                <Layers className="w-4 h-4 text-brand-600" />
              </div>

              <div className="space-y-3 pt-2">
                {analytics?.charts?.categoryBreakdown?.length > 0 ? (
                  analytics.charts.categoryBreakdown.map((item) => {
                    const maxVal = Math.max(...analytics.charts.categoryBreakdown.map((c) => c.count), 1);
                    const pct = Math.round((item.count / maxVal) * 100);
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-navy-800">{item.category}</span>
                          <span className="text-slate-500 font-medium">{item.count} documents ({item.downloads} downloads)</span>
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

            {/* Chart 2: Department-Wise Distribution */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy-900">Department-Wise Resources &amp; Downloads</h3>
                  <p className="text-xs text-slate-400">Academic production across university faculties</p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-3 pt-2">
                {analytics?.charts?.departmentDistribution?.length > 0 ? (
                  analytics.charts.departmentDistribution.map((dept) => {
                    const maxDownloads = Math.max(...analytics.charts.departmentDistribution.map((d) => d.downloads || 1), 1);
                    const pct = Math.round(((dept.downloads || 0) / maxDownloads) * 100);
                    return (
                      <div key={dept.department} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-navy-800">{dept.department}</span>
                          <span className="text-slate-500 font-medium">{dept.count} docs &bull; {dept.downloads} downloads</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.max(8, pct)}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-4">No departmental records found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Top Downloaded Documents Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-4">
            <h3 className="text-sm font-bold text-navy-900">Top Performing Resources (By Peer Downloads)</h3>
            <div className="divide-y divide-slate-100">
              {analytics?.charts?.topDownloaded?.length > 0 ? (
                analytics.charts.topDownloaded.map((doc, idx) => (
                  <div key={doc._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-navy-900 font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-navy-900 truncate">{doc.title}</p>
                        <p className="text-[11px] text-slate-400">{doc.subject} &bull; {doc.department}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-brand-600 block">{doc.downloads} downloads</span>
                      <span className="text-[10px] text-slate-400">{doc.fileType?.toUpperCase()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4">No download activities recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESOURCE MODERATION */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          {/* Moderation Controls & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="Search resources by title or subject..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-navy-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
              <select
                value={resourceStatusFilter}
                onChange={(e) => setResourceStatusFilter(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-navy-800 focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Moderation Only</option>
                <option value="approved">Approved &amp; Live</option>
                <option value="rejected">Rejected Submissions</option>
              </select>
            </div>
          </div>

          {/* Resources List Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="divide-y divide-slate-100">
              {resources.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No resources match the selected moderation filter.
                </div>
              ) : (
                resources.map((item) => {
                  const isActing = actionLoadingId === item._id;
                  const uploader = item.uploadedBy || {};
                  return (
                    <div
                      key={item._id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={
                              item.status === 'approved'
                                ? 'success'
                                : item.status === 'pending'
                                ? 'warning'
                                : 'danger'
                            }
                            size="xs"
                          >
                            {item.status.toUpperCase()}
                          </Badge>
                          <Badge variant="brand" size="xs">
                            {item.subject}
                          </Badge>
                          <span className="text-xs text-slate-400">&bull;</span>
                          <span className="text-xs text-slate-500">{item.department}</span>
                          <span className="text-xs text-slate-400">&bull;</span>
                          <span className="text-xs text-slate-400">{item.semester}</span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-navy-900 truncate">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-500">
                          Uploaded by <span className="font-semibold text-navy-800">{uploader.name || 'Student'}</span>{' '}
                          ({uploader.email || 'N/A'}) &bull; {item.downloads || 0} downloads
                        </p>
                      </div>

                      {/* Moderation Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.status !== 'approved' && (
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleModerate(item._id, 'approved')}
                            disabled={isActing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                        )}

                        {item.status !== 'rejected' && (
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => handleModerate(item._id, 'rejected')}
                            disabled={isActing}
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        )}

                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => handleDeleteResource(item._id)}
                          disabled={isActing}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT & USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Search & Role Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by student name, email, or registration number..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-navy-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Account Role:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-navy-800 focus:outline-none focus:border-brand-500"
              >
                <option value="student">Students Only</option>
                <option value="admin">Administrators Only</option>
                <option value="all">All Roles</option>
              </select>
            </div>
          </div>

          {/* User Accounts Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="divide-y divide-slate-100">
              {usersList.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No accounts found matching your query.
                </div>
              ) : (
                usersList.map((st) => (
                  <div
                    key={st._id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          st.profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            st.name || 'S'
                          )}&background=4f46e5&color=fff&size=64`
                        }
                        alt={st.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-navy-900 truncate">{st.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              st.isBlocked
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {st.isBlocked ? 'SUSPENDED' : 'ACTIVE'}
                          </span>
                          {st.role === 'admin' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-700">
                              STAFF ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{st.email} &bull; {st.department} &bull; {st.semester}</p>
                        <p className="text-[11px] text-slate-400">
                          {st.uploadsCount || 0} uploads published &bull; {st.downloadsCount || 0} peer downloads
                        </p>
                      </div>
                    </div>

                    {/* Block / Unblock Action */}
                    {st.role !== 'admin' && (
                      <div className="shrink-0">
                        <Button
                          variant={st.isBlocked ? 'primary' : 'danger'}
                          size="xs"
                          onClick={() => handleToggleBlock(st)}
                        >
                          {st.isBlocked ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 mr-1" /> Reinstate Account
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5 mr-1" /> Suspend Student
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTED CONTENT QUEUE */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs sm:text-sm font-bold text-navy-900">
                Inappropriate Content &amp; Copyright Reports ({reports.length})
              </h3>
            </div>

            <select
              value={reportFilter}
              onChange={(e) => setReportFilter(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-navy-800 focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending Only</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="divide-y divide-slate-100">
              {reports.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No community reports currently pending review.
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

export default AdminDashboardPage;
