import api from './api';

export const facultyService = {
  // Get real-time academic analytics and curriculum charts
  getAnalytics: async () => {
    try {
      const response = await api.get('/faculty/analytics');
      return response.data;
    } catch (e) {
      const fallback = await api.get('/admin/analytics');
      return fallback.data;
    }
  },

  // Student directory and profiles
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/faculty/users', { params });
      return response.data;
    } catch (e) {
      const fallback = await api.get('/admin/users', { params });
      return fallback.data;
    }
  },

  getUserProfile: async (id) => {
    try {
      const response = await api.get(`/faculty/users/${id}`);
      return response.data;
    } catch (e) {
      const fallback = await api.get(`/admin/users/${id}`);
      return fallback.data;
    }
  },

  // Academic resource repository and moderation
  getResources: async (params = {}) => {
    try {
      const response = await api.get('/faculty/resources', { params });
      return response.data;
    } catch (e) {
      const fallback = await api.get('/admin/resources', { params });
      return fallback.data;
    }
  },

  moderateResource: async (id, status) => {
    try {
      const response = await api.put(`/faculty/resources/${id}/moderate`, { status });
      return response.data;
    } catch (e) {
      const fallback = await api.put(`/admin/resources/${id}/moderate`, { status });
      return fallback.data;
    }
  },

  deleteResource: async (id) => {
    try {
      const response = await api.delete(`/faculty/resources/${id}`);
      return response.data;
    } catch (e) {
      const fallback = await api.delete(`/admin/resources/${id}`);
      return fallback.data;
    }
  },

  // Reports moderation
  getReports: async (params = {}) => {
    try {
      const response = await api.get('/faculty/reports', { params });
      return response.data;
    } catch (e) {
      const fallback = await api.get('/admin/reports', { params });
      return fallback.data;
    }
  },

  updateReportStatus: async (id, status, actionTaken) => {
    try {
      const response = await api.put(`/faculty/reports/${id}`, { status, actionTaken });
      return response.data;
    } catch (e) {
      const fallback = await api.put(`/admin/reports/${id}`, { status, actionTaken });
      return fallback.data;
    }
  },
};

export default facultyService;
