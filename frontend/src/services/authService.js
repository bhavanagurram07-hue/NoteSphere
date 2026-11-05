import api from './api';

export const authService = {
  // Register a new student account
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Authenticate with email & password
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user session from token/cookie
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Log user out and clear server cookie
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Update authenticated student profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/auth/dashboard-stats');
    return response.data;
  },
};

export default authService;
