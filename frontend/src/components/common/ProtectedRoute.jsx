import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, facultyOnly = false, adminOnly = false }) => {
  const { isAuthenticated, isFaculty, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <LoadingSpinner text="Restoring authenticated session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, saving attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const requiresFaculty = facultyOnly || adminOnly;
  const hasFacultyAccess = isFaculty || isAdmin;

  if (requiresFaculty && !hasFacultyAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
