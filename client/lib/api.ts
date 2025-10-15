import axios from 'axios';

// Create a common axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Auth API endpoints - /api/auth/*
export const authAPI = {
  signOut: () => api.post('/api/auth/signout'),
  
  getMe: () => api.get('/api/auth/me'),
  
  getTokens: () => api.get('/api/auth/tokens'),
  
  // Google OAuth - redirect handled by server
  googleAuth: () => `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
};

// User API endpoints - /api/user/*
export const userAPI = {
  // Knowledge Base
  getKnowledgeBase: () => api.get('/api/user/kb'),
  saveKnowledgeBase: (kb: string) => api.post('/api/user/kb', { kb }),
  deleteKnowledgeBase: () => api.delete('/api/user/kb'),
  // Slack Configuration
  getSlackConfig: () => api.get('/api/user/slack-config'),
  saveSlackConfig: (slackBotToken: string, slackBotId: string, slackChannel: string) =>
    api.post('/api/user/slack-config', { slackBotToken, slackBotId, slackChannel }),
    
  // Profile  // User Profile
  getProfile: () => api.get('/api/user/profile'),
  updateSettings: (settings: any) => api.post('/api/user/settings', { settings }),
  
  // Widget Customization
  getWidgetConfig: () => api.get('/api/user/widget-config'),
  saveWidgetConfig: (config: any) => api.post('/api/user/widget-config', { config }),
};

// Chat API endpoints - /api/chat/*
export const chatAPI = {
  sendMessage: (message: string, conversationId: string, agentId: string) =>
    api.post('/api/chat/chat', { message, conversationId, agentId }),
  
  getHealth: () => api.get('/api/chat/health'),
  
  // SSE endpoint URL (not axios call)
  getEventsUrl: (userId: string) => `${api.defaults.baseURL}/api/chat/events/${userId}`,
};

// Webhook API endpoints - /api/webhook/*
export const webhookAPI = {
  slack: (action: string, conversationId: string, response: string, approver: string) =>
    api.post('/api/webhook/slack', { action, conversationId, response, approver }),
    
  email: (data: any) => api.post('/api/webhook/email', data),
  
  external: (data: any) => api.post('/api/webhook/external', data),
  getHealth: () => api.get('/api/webhook/health'),
};

// Approval API endpoints - /api/approvals/*
export const approvalAPI = {
  // Get pending approvals for user
  getPendingApprovals: (approverEmail: string) =>
    api.get(`/api/approvals/pending/${approverEmail}`),
  
  // Get completed approvals for user
  getCompletedApprovals: (approverEmail: string) =>
    api.get(`/api/approvals/completed/${approverEmail}`),
  
  // Get workflow details
  getWorkflow: (workflowId: string) => 
    api.get(`/api/approvals/workflows/${workflowId}`),
  
  // Get workflows by conversation
  getWorkflowsByConversation: (conversationId: string) =>
    api.get(`/api/approvals/workflows/conversation/${conversationId}`),
  
  // Approve step
  approveStep: (workflowId: string, approver: string, response?: string, formResponse?: any) =>
    api.post(`/api/approvals/workflows/${workflowId}/approve`, { 
      approver, 
      response, 
      formResponse 
    }),
  
  // Reject step
  rejectStep: (workflowId: string, approver: string, response?: string, formResponse?: any) =>
    api.post(`/api/approvals/workflows/${workflowId}/reject`, { 
      approver, 
      response, 
      formResponse 
    }),
  
  // Delegate approval
  delegateApproval: (workflowId: string, currentApprover: string, delegateTo: string, reason?: string) =>
    api.post(`/api/approvals/workflows/${workflowId}/delegate`, {
      currentApprover,
      delegateTo,
      reason
    }),
  
  // Cancel workflow
  cancelWorkflow: (workflowId: string, cancelledBy: string, reason?: string) =>
    api.post(`/api/approvals/workflows/${workflowId}/cancel`, {
      cancelledBy,
      reason
    }),
  
  // Rollback workflow
  rollbackWorkflow: (workflowId: string, triggeredBy: string) =>
    api.post(`/api/approvals/workflows/${workflowId}/rollback`, {
      triggeredBy
    }),
  
  // Get templates
  getTemplates: (agentId: string) =>
    api.get(`/api/approvals/templates/${agentId}`),
  
  // Get template details
  getTemplate: (templateId: string) =>
    api.get(`/api/approvals/templates/detail/${templateId}`),
  
  // Create custom template
  createTemplate: (template: any) =>
    api.post('/api/approvals/templates', template),
  
  // Create default templates
  createDefaultTemplates: (agentId: string) =>
    api.post(`/api/approvals/templates/defaults/${agentId}`),
  
  // Delete template
  deleteTemplate: (templateId: string) =>
    api.delete(`/api/approvals/templates/${templateId}`),
  
  // Set template as default
  setDefaultTemplate: (templateId: string) =>
    api.put(`/api/approvals/templates/${templateId}/default`),
  
  // Get statistics
  getStats: (agentId?: string) =>
    agentId 
      ? api.get(`/api/approvals/stats/${agentId}`)
      : api.get('/api/approvals/stats'),
};

// General API health check
export const healthAPI = {
  check: () => api.get('/api/health'),
  getInfo: () => api.get('/api/'),
};

export default api;
