import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add cache-busting
  config.headers['Cache-Control'] = 'no-cache';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData)
};

export const usersAPI = {
  getShops: () => api.get('/users/shops'),
  getUsers: (page = 1, limit = 20, shopId = null, status = null, cardType = null, timeSlot = null) => {
    const params = new URLSearchParams();
    params.append('page', page || 1);
    params.append('limit', limit || 20);
    if (shopId) params.append('shopId', shopId);
    if (status) params.append('status', status);
    if (cardType) params.append('cardType', cardType);
    if (timeSlot) params.append('timeSlot', timeSlot);
    return api.get(`/users?${params.toString()}`);
  },
  searchUsers: (query) => api.get(`/users/search?query=${encodeURIComponent(query)}`),
  getUser: (id) => api.get(`/users/${id}`),
  getCardCounts: (shopId) => api.get('/users/counts', { params: { shopId } }),
  register: (data) => api.post('/users/register', data),
  deleteAllUsers: (shopId) => api.delete('/users/all', { data: { shopId } }),
  updateUser: (id, data) => api.patch(`/users/${id}/collect`, data),
  uploadCSV: (formData) => api.post('/users/upload-users', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

export const inventoryAPI = {
  getInventory: () => api.get('/inventory'),
  updateInventory: (data) => api.post('/inventory/update', data),
  resetInventory: (shopId) => api.post('/inventory/reset', { shopId })
};

export const slotsAPI = {
  getSlots: () => api.get('/slots'),
  createSlot: (data) => api.post('/slots/create', data),
  deleteAllSlots: (shopId) => api.delete('/slots/all', { data: { shopId } })
};

export const scheduleAPI = {
  generateAI: (data) => api.post('/schedule/generate-ai', data),
  assignAI: (data) => api.post('/schedule/assign-ai', data),
  getToday: () => api.get('/schedule/today'),
  getTodaySummary: () => api.get('/schedule/today-summary'),
  generateSchedule: () => api.post('/schedule/generate-schedule'),
  runSchedule: (shopId, delayDays = null) => api.post('/schedule/run-schedule', { shopId, delayDays }),
  markMissed: (shopId) => api.post('/schedule/mark-missed', { shopId }),
  rescheduleMissed: (shopId, delayDays = null) => api.post('/schedule/reschedule-missed', { shopId, delayDays }),
  processMissed: (shopId, delayDays = null) => api.post('/schedule/process-missed', { shopId, delayDays })
};

export const otpAPI = {
  send: (data) => api.post('/otp/send', data),
  verify: (data) => api.post('/otp/verify', data)
};

export const reputationAPI = {
  getUserReputation: (userId) => api.get(`/reputation/${userId}`),
  updateScore: (data) => api.post('/reputation/update', data)
};

export const fraudAPI = {
  getLogs: () => api.get('/fraud/logs'),
  getStats: () => api.get('/fraud/stats')
};

export const notificationsAPI = {
  getNotifications: (limit = 20) => api.get(`/notifications?limit=${limit}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  createNotification: (data) => api.post('/notifications', data)
};

export const queuesAPI = {
  getQueues: () => api.get('/queues'),
  getMyQueues: () => api.get('/queues/my'),
  createQueue: (data) => api.post('/queues', data),
  updateStatus: (id, status) => api.patch(`/queues/${id}/status`, { status })
};

export const rationsAPI = {
  verifyComplete: (data) => api.post('/rations/verify-complete', data),
  getHistory: () => api.get('/rations/history')
};

export const verifyAPI = {
  verify: (data) => api.post('/api/verify', data),
  notifyUsers: () => api.post('/api/verify/notify')
};

export default api;
