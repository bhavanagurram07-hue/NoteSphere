import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  UploadCloud,
  FolderOpen,
  Bookmark,
  User,
  Shield,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ className = '' }) => {
  const { user, logout, isFaculty, isAdmin } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Explore Resources', path: '/explore', icon: Compass },
    { name: 'Upload Notes', path: '/upload', icon: UploadCloud },
    { name: 'My Uploads', path: '/my-uploads', icon: FolderOpen },
    { name: 'My Bookmarks', path: '/bookmarks', icon: Bookmark },
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  return (
    <aside
      className={`w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-4 shrink-0 h-[calc(100vh-4rem)] sticky top-16 ${className}`}
    >
      <div className="space-y-6">
        {/* User Mini Profile Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 border border-brand-100 flex items-center gap-3">
          <img
            src={user?.profileImage || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'Student'}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-subtle shrink-0"
          />
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-navy-900 truncate">{user?.name || 'Student'}</h4>
            <p className="text-[11px] text-slate-500 truncate">{user?.department || 'Student'}</p>
            <span className="inline-block text-[10px] font-semibold text-brand-700 uppercase tracking-wider mt-0.5">
              {user?.role || 'student'} &bull; {user?.semester || 'Semester 1'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20 font-semibold'
                      : 'text-navy-700 hover:bg-slate-100 hover:text-navy-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Faculty link if user is faculty */}
          {(isFaculty || isAdmin) && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                  Academic Portal
                </p>
              </div>
              <NavLink
                to="/faculty"
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm font-semibold'
                      : 'text-purple-800 hover:bg-purple-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span>Faculty Dashboard</span>
                </div>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Bottom actions */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        {/* Verified Account Role display */}
        <div className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700">
          <span className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-brand-600" />
            Account Role
          </span>
          <span
            className={`font-bold text-[11px] uppercase px-2 py-0.5 rounded-md border ${
              user?.role === 'faculty' || user?.role === 'admin'
                ? 'bg-purple-100 text-purple-800 border-purple-300'
                : 'bg-white text-brand-700 border-slate-200'
            }`}
          >
            {user?.role}
          </span>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
