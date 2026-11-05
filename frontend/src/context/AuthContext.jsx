import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('notesphere_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app load using token or cookie
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('notesphere_token');
      if (storedToken) {
        try {
          const data = await authService.getMe();
          if (data?.success && data?.user) {
            setUser(data.user);
          } else {
            handleSessionExpired();
          }
        } catch (error) {
          // Token is invalid, expired, or backend offline
          console.warn('Session restoration failed:', error.response?.data?.message || error.message);
          handleSessionExpired();
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const handleSessionExpired = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('notesphere_token');
    localStorage.removeItem('notesphere_user');
  };

  // Register student
  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      if (data.success && data.user) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('notesphere_token', data.token);
        localStorage.setItem('notesphere_user', JSON.stringify(data.user));
        addToast(data.message || 'Account created successfully! Welcome to NoteSphere.', 'success');
        return { success: true, user: data.user };
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.message === 'Network Error' || !error.response
          ? 'Cannot connect to backend server (port 5000). Please ensure the backend server is running.'
          : 'Registration failed. Please try again.');
      addToast(message, 'error');
      return { success: false, error: message };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const data = await authService.login({ email, password });
      if (data.success && data.user) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('notesphere_token', data.token);
        localStorage.setItem('notesphere_user', JSON.stringify(data.user));
        addToast(data.message || `Welcome back, ${data.user.name}!`, 'success');
        return { success: true, user: data.user };
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.message === 'Network Error' || !error.response
          ? 'Cannot connect to backend server (port 5000). Please ensure the backend server is running.'
          : 'Invalid email or password');
      addToast(message, 'error');
      return { success: false, error: message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      handleSessionExpired();
      addToast('Signed out successfully.', 'info');
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const data = await authService.updateProfile(profileData);
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('notesphere_user', JSON.stringify(data.user));
        addToast(data.message || 'Profile updated successfully!', 'success');
        return { success: true, user: data.user };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      addToast(message, 'error');
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isFaculty: user?.role === 'faculty',
        isAdmin: user?.role === 'faculty' || user?.role === 'admin',
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
