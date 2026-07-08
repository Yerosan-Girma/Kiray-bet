import api from '../api/axios';

export const adminService = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  approveUser: async (id: string) => {
    const response = await api.put(`/admin/users/${id}/approve`);
    return response.data;
  },

  suspendUser: async (id: string, reason?: string, expiryDate?: string) => {
    const response = await api.put(`/admin/users/${id}/suspend`, { reason, expiryDate });
    return response.data;
  },

  banUser: async (id: string) => {
    const response = await api.put(`/admin/users/${id}/ban`);
    return response.data;
  },

  getListings: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/admin/listings', { params });
    return response.data;
  },

  approveListing: async (id: string) => {
    const response = await api.put(`/admin/listings/${id}/approve`);
    return response.data;
  },

  rejectListing: async (id: string, reason: string) => {
    const response = await api.put(`/admin/listings/${id}/reject`, { reason });
    return response.data;
  },

  deleteListing: async (id: string) => {
    const response = await api.delete(`/admin/listings/${id}`);
    return response.data;
  },

  getTransactions: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/admin/transactions', { params });
    return response.data;
  },

  getAuditLogs: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/admin/auditlogs', { params });
    return response.data;
  },
};
