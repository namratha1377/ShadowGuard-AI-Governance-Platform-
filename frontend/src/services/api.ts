import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shadowguard_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear stored auth tokens & user session
      localStorage.removeItem('shadowguard_access_token');
      localStorage.removeItem('shadowguard_refresh_token');
      localStorage.removeItem('shadowguard_user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  getHarnessTraces: async (params?: { page?: number; limit?: number }) => {
    const res = await api.get('/harness-traces', { params });
    return res.data;
  },
  getHarnessTraceById: async (interactionId: number) => {
    const res = await api.get(`/harness-traces/${interactionId}`);
    return res.data;
  },
  getDashboardMetrics: async () => {
    const res = await api.get('/dashboard/metrics');
    return res.data;
  },
  getAiInteractions: async (params?: any) => {
    const res = await api.get('/ai-interactions', { params });
    return res.data;
  },
  createAiInteraction: async (payload: any) => {
    const res = await api.post('/ai-interactions', payload);
    return res.data;
  },
  getRiskAssessments: async (params?: any) => {
    const res = await api.get('/risk-assessments', { params });
    return res.data;
  },
  getDataSecurityLogs: async (params?: any) => {
    const res = await api.get('/data-security', { params });
    return res.data;
  },
  getPolicies: async () => {
    const res = await api.get('/policies');
    return res.data;
  },
  updatePolicy: async (id: number, payload: any) => {
    const res = await api.patch(`/policies/${id}`, payload);
    return res.data;
  },
  getAuditLogs: async (params?: any) => {
    const res = await api.get('/audit-logs', { params });
    return res.data;
  },
  getSettings: async () => {
    const res = await api.get('/settings');
    return res.data;
  },
  updateSettings: async (payload: any) => {
    const res = await api.patch('/settings', payload);
    return res.data;
  },
  sendChatbotQuery: async (
    question: string,
    history?: { sender: 'user' | 'assistant' | 'model'; text: string }[],
    interactionId?: number
  ) => {
    const res = await api.post('/chatbot/query', { question, history, interactionId });
    return res.data;
  },
};

export default api;
