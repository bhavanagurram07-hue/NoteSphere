import api from './api';

export const resourceService = {
  // Upload a new resource with real progress tracking
  uploadResource: async (formData, onProgress) => {
    const response = await api.post('/resources', formData, {
      headers: {
        'Content-Type': undefined,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  // Get resources with search, filters, and pagination
  getResources: async (params = {}) => {
    const response = await api.get('/resources', { params });
    return response.data;
  },

  // Get single resource by ID
  getResourceById: async (id) => {
    const response = await api.get(`/resources/${id}`);
    return response.data;
  },

  // Update resource metadata
  updateResource: async (id, updateData) => {
    const response = await api.put(`/resources/${id}`, updateData);
    return response.data;
  },

  // Delete resource
  deleteResource: async (id) => {
    const response = await api.delete(`/resources/${id}`);
    return response.data;
  },

  // Get uploads of current authenticated user
  getMyUploads: async () => {
    const response = await api.get('/resources/my-uploads');
    return response.data;
  },

  // Trigger secure download and increment download count
  downloadResource: async (id) => {
    const response = await api.get(`/resources/${id}/download`);
    return response.data;
  },

  // Autocomplete search suggestions
  getSuggestions: async (q) => {
    const response = await api.get('/resources/suggestions', { params: { q } });
    return response.data;
  },
};

export default resourceService;