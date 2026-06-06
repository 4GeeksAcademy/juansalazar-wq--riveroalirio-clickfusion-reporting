import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

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

export const getInvestment = (clientId, startDate, endDate) =>
  api.get(`/api/clients/${clientId}/investment?start_date=${startDate}&end_date=${endDate}`);

export const getGA4 = (clientId, startDate, endDate) =>
  api.get(`/api/clients/${clientId}/ga4?start_date=${startDate}&end_date=${endDate}`);

export const getUsers = () =>
  api.get('/api/users');

export const deleteUser = (userId) =>
  api.delete(`/api/users/${userId}`);

export const forgotPassword = (email) =>
  api.post('/api/auth/forgot-password', { email });

export const resetPassword = (token, password) =>
  api.post('/api/auth/reset-password', { token, password });

export default api;

export const getFieldConfig = (clientId) =>
  api.get(`/api/clients/${clientId}/field-config`);

export const saveFieldConfig = (clientId, fields) =>
  api.post(`/api/clients/${clientId}/field-config`, { fields });

export const getFieldLabels = (clientId) =>
  api.get(`/api/clients/${clientId}/custom-fields-labels`);

export const getFieldData = (clientId, startDate, endDate) =>
  api.get(`/api/clients/${clientId}/field-data?start_date=${startDate}&end_date=${endDate}`);

export const getAISummary = (clientId, metrics, fbMetrics, fieldData, currentMonth = {}) =>
  api.post(`/api/clients/${clientId}/ai-summary`, { metrics, fb_metrics: fbMetrics, field_data: fieldData, current_month: currentMonth });

export const getGlobalSummary = () =>
  api.get('/api/summary');