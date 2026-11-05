import axios from 'axios';

/**
 * Pre-configured Axios instance for NoteSphere API communication.
 * Reads the base URL from Vite environment variables (fallback to /api for Vite proxy).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: attach JWT token if found in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('notesphere_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: global error response logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // In Phase 2, this will trigger user logout / token cleanup
      console.warn('Session expired or unauthorized request.');
    }
    return Promise.reject(error);
  }
);

export default api;
