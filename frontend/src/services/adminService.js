import api from './api';

export const adminService = {
  // Get real-time MongoDB analytics and charts
  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  // Student and user management
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserProfile: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  toggleBlockUser: async (id, isBlocked) => {
    const response = await api.put(`/admin/users/${id}/block`, { isBlocked });
    return response.data;
  },

  // Academic resource moderation
  getResources: async (params = {}) => {
    const response = await api.get('/admin/resources', { params });
    return response.data;
  },

  moderateResource: async (id, status) => {
    const response = await api.put(`/admin/resources/${id}/moderate`, { status });
    return response.data;
  },

  deleteResource: async (id) => {
    const response = await api.delete(`/admin/resources/${id}`);
    return response.data;
  },

  // Reports moderation queue
  getReports: async (params = {}) => {
    const response = await api.get('/admin/reports', { params });
    return response.data;
  },

  updateReportStatus: async (id, status, actionTaken) => {
    const response = await api.put(`/admin/reports/${id}`, { status, actionTaken });
    return response.data;
  },
};

export default adminService;
