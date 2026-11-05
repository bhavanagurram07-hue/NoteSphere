import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { ResourceProvider } from './context/ResourceContext';

// Layouts & Route Protection
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ExploreResourcesPage from './pages/ExploreResourcesPage';
import ResourceDetailsPage from './pages/ResourceDetailsPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import UploadResourcePage from './pages/UploadResourcePage';
import MyUploadsPage from './pages/MyUploadsPage';
import BookmarksPage from './pages/BookmarksPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import FacultyDashboardPage from './pages/FacultyDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ResourceProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Pages with Standard Header/Footer */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/explore" element={<ExploreResourcesPage />} />
                <Route path="/resources/:id" element={<ResourceDetailsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Student & Admin Protected Dashboard Pages with Sidebar */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<StudentDashboardPage />} />
                <Route path="/upload" element={<UploadResourcePage />} />
                <Route path="/my-uploads" element={<MyUploadsPage />} />
                <Route path="/bookmarks" element={<BookmarksPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                  path="/faculty"
                  element={
                    <ProtectedRoute facultyOnly>
                      <FacultyDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute facultyOnly>
                      <FacultyDashboardPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </ResourceProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
