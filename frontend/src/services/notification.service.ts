import api from '../api/axios';

export const notificationService = {
  getNotifications: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/notifications', { params });
    return response.data; // { success, data: { notifications[], unreadCount, pagination } }
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};
