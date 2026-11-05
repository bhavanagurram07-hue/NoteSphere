import api from './api';

export const reportService = {
  // Submit a report for an inappropriate or copyrighted document
  submitReport: async (resourceId, { reason, description }) => {
    const response = await api.post(`/reports/${resourceId}`, {
      reason,
      description,
    });
    return response.data;
  },

  // View reports submitted by current student
  getMyReports: async () => {
    const response = await api.get('/reports/my-reports');
    return response.data;
  },
};

export default reportService;
