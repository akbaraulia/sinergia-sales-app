import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is important for ERP cookie-based auth
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // For ERP-based authentication, we rely on cookies rather than bearer tokens
    // The cookies are automatically sent with requests due to withCredentials: true
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // If we get 401, it means the ERP session is expired
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;