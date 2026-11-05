import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Menu, X, ArrowLeft } from 'lucide-react';

const DashboardLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <div className="max-w-7xl w-full mx-auto flex-1 flex">
        {/* Persistent Desktop Sidebar */}
        <Sidebar className="hidden lg:flex" />

        {/* Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-64 bg-white z-10 shadow-elevated">
              <div className="p-4 flex items-center justify-between border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Navigation</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-navy-900 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar className="w-full h-auto border-r-0" />
            </div>
          </div>
        )}

        {/* Main Dashboard Content Area */}
        <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 lg:p-8">
          {/* Mobile subheader button for sidebar trigger */}
          <div className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-navy-800 shadow-subtle"
            >
              <Menu className="w-4 h-4 text-brand-600" />
              Menu Navigation
            </button>
            <Link
              to="/explore"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Explore Library &rarr;
            </Link>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
