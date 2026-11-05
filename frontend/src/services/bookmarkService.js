import api from './api';

export const bookmarkService = {
  // Toggle bookmark for a resource (optimistic toggle)
  toggleBookmark: async (resourceId) => {
    const response = await api.post(`/bookmarks/${resourceId}/toggle`);
    return response.data;
  },

  // Explicitly add bookmark
  addBookmark: async (resourceId) => {
    const response = await api.post(`/bookmarks/${resourceId}`);
    return response.data;
  },

  // Remove bookmark
  removeBookmark: async (resourceId) => {
    const response = await api.delete(`/bookmarks/${resourceId}`);
    return response.data;
  },

  // Check if resource is bookmarked
  checkStatus: async (resourceId) => {
    const response = await api.get(`/bookmarks/status/${resourceId}`);
    return response.data;
  },

  // Get array of all bookmarked resource IDs for logged-in user
  getMyBookmarkIds: async () => {
    const response = await api.get('/bookmarks/ids');
    return response.data;
  },

  // Get full populated resource objects for saved bookmarks
  getMyBookmarks: async () => {
    const response = await api.get('/bookmarks/my-bookmarks');
    return response.data;
  },
};

export default bookmarkService;
