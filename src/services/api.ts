import axios from 'axios';

// Base API URL
const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { username: string; password: string }) => 
    api.post('/auth/login', credentials),
  signup: (userData: { username: string; password: string; fullName: string; email: string }) =>
    api.post('/auth/signup', userData),
  health: () => api.get('/auth/health'),
};

export const policyAPI = {
  createPolicyWithClient: (policyData: {
    clientFullName: string;
    clientEmail: string;
    clientPhoneNumber: string;
    clientWhatsappNumber?: string;
    clientAddress?: string;
    policyNumber: string;
    policyType: string;
    vehicleType?: string;
    registrationNumber?: string;
    insurerName?: string;
    startDate: string;
    expiryDate: string;
    premium: number;
    premiumFrequency: string;
    policyDescription?: string;
    pdfFilePath?: string;
  }) => api.post('/policies/create', policyData),
  
  getAllMyPolicies: () => api.get('/policies'),
  
  getPolicyById: (id: number) => api.get(`/policies/${id}`),
  
  updatePolicyStatus: (id: number, status: string) => 
    api.put(`/policies/${id}/status`, { status }),
  
  deletePolicy: (id: number) => api.delete(`/policies/${id}`),

  // Manual renewal - mark policy as contacted manually by agent
  markAsManuallyRenewed: (id: number, notes: string, renewed: boolean) =>
    api.post(`/policies/${id}/manual-renew`, { notes, renewed }),
  
  // PDF storage disabled
  // uploadPdf: (file: File, clientEmail: string, policyNumber: string) => {
  //   const formData = new FormData();
  //   formData.append('file', file);
  //   formData.append('clientEmail', clientEmail);
  //   formData.append('policyNumber', policyNumber);
  //   
  //   return api.post('/policies/upload-pdf', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //     },
  //   });
  // },
  
  // extractFromPdf: (file: File) => {
  //   const formData = new FormData();
  //   formData.append('file', file);
  //   
  //   return api.post('/policies/extract-from-pdf', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //     },
  //   });
  // },
};

// Client API
export const clientAPI = {
  getMyClients: () => api.get('/clients'),
  
  getClientById: (id: string) => api.get(`/clients/${id}`),
  
  createClient: (clientData: {
    fullName: string;
    email: string;
    phoneNumber: string;
    address?: string;
  }) => api.post('/clients', clientData),
};

export const messagesAPI = {
  getAllLogs: () => api.get('/messages/logs'),

  // Retry a failed message (max 3 attempts)
  retryMessage: (id: number) => api.post(`/messages/${id}/retry`),
  
  // Bulk trigger reminders manually
  triggerBulkReminders: () => api.post('/messages/send-bulk'),
};

export const dashboardAPI = {
  getSummary: (period: number = 30) => api.get(`/dashboard/summary?period=${period}`),
  getClaimsDistribution: () => api.get('/dashboard/claims-distribution'),
  getCommunicationStats: () => api.get('/dashboard/communication-stats'),
  getAiInsights: () => api.get('/dashboard/ai-insights'),
  getProjectedRenewals: (period: number = 30) => api.get(`/dashboard/projected-renewals?period=${period}`),
};

export default api;