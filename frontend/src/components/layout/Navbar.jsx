import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Search, UploadCloud, Bookmark, LayoutDashboard, Shield, Menu, X, LogIn, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const Navbar = () => {
  const { user, isAuthenticated, logout, toggleRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full glass-nav border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-600 text-white shadow-subtle group-hover:shadow-glow-brand transition-all duration-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-navy-900 group-hover:text-brand-600 transition-colors">
                Note<span className="text-brand-600">Sphere</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 tracking-wider -mt-1 uppercase">Academic Sharing</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5">
            <Link
              to="/explore"
              className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                isActive('/explore')
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-navy-700 hover:text-navy-900 hover:bg-slate-100/70'
              }`}
            >
              Explore Notes
            </Link>
            <Link
              to="/upload"
              className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                isActive('/upload')
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-navy-700 hover:text-navy-900 hover:bg-slate-100/70'
              }`}
            >
              Upload
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-navy-700 hover:text-navy-900 hover:bg-slate-100/70'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/bookmarks"
                  className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                    isActive('/bookmarks')
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-navy-700 hover:text-navy-900 hover:bg-slate-100/70'
                  }`}
                >
                  Bookmarks
                </Link>
                {(user?.role === 'faculty' || user?.role === 'admin') && (
                  <Link
                    to="/faculty"
                    className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                      isActive('/faculty') || isActive('/admin')
                        ? 'bg-purple-50 text-purple-700 font-semibold border border-purple-200'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    Faculty Portal
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Desktop Actions & User info */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                {/* Verified Account Role Badge */}
                <span
                  title={`Authenticated Role: ${user?.role?.toUpperCase()}`}
                  className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 font-semibold ${
                    user?.role === 'faculty' || user?.role === 'admin'
                      ? 'bg-purple-50 border-purple-300 text-purple-800'
                      : 'bg-brand-50 border-brand-200 text-brand-700'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Role: <span className="uppercase">{user?.role}</span>
                </span>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 bg-white hover:border-brand-300 hover:shadow-subtle transition-all"
                >
                  <img
                    src={user?.profileImage || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={user?.name || 'Student'}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <span className="text-xs font-semibold text-navy-800 max-w-[100px] truncate">
                    {(user?.name || 'Student').split(' ')[0]}
                  </span>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-xs text-slate-500 hover:text-rose-600"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium rounded-lg text-navy-800 hover:bg-slate-50"
          >
            Explore Notes
          </Link>
          <Link
            to="/upload"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium rounded-lg text-navy-800 hover:bg-slate-50"
          >
            Upload Resource
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-lg text-navy-800 hover:bg-slate-50"
              >
                Dashboard
              </Link>
              <Link
                to="/my-uploads"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-lg text-navy-800 hover:bg-slate-50"
              >
                My Uploads
              </Link>
              <Link
                to="/bookmarks"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-lg text-navy-800 hover:bg-slate-50"
              >
                Bookmarks
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-lg text-navy-800 hover:bg-slate-50"
              >
                My Profile
              </Link>
              {(user?.role === 'faculty' || user?.role === 'admin') && (
                <Link
                  to="/faculty"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium rounded-lg text-purple-700 bg-purple-50 font-semibold"
                >
                  Faculty Academic Portal
                </Link>
              )}
            </>
          )}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full"
              >
                Sign Out
              </Button>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
