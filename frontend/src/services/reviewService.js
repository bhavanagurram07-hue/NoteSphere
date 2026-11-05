import api from './api';

export const reviewService = {
  // Get all reviews for a resource
  getResourceReviews: async (resourceId) => {
    const response = await api.get(`/resources/${resourceId}/reviews`);
    return response.data;
  },

  // Submit a review for a resource
  addReview: async (resourceId, { rating, comment }) => {
    const response = await api.post(`/resources/${resourceId}/reviews`, {
      rating,
      comment,
    });
    return response.data;
  },

  // Update own existing review
  updateReview: async (reviewId, { rating, comment }) => {
    const response = await api.put(`/reviews/${reviewId}`, {
      rating,
      comment,
    });
    return response.data;
  },

  // Delete own review
  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};

export default reviewService;
