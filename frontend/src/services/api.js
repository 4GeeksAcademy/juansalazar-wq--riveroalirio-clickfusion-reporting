import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

// Agregar token automáticamente a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const getClients = () =>
  api.get('/api/clients');

export const getMetrics = (clientId, startDate, endDate) => {
  let url = `/api/clients/${clientId}/metrics`;
  if (startDate && endDate) {
    url += `?start_date=${startDate}&end_date=${endDate}`;
  }
  return api.get(url);
};

export const syncContacts = (clientId) =>
  api.post(`/api/clients/${clientId}/sync`);

export const forgotPassword = (email) =>
  api.post('/api/auth/forgot-password', { email });

export const resetPassword = (token, password) =>
  api.post('/api/auth/reset-password', { token, password });

export default api;