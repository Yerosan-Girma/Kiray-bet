import api from '../api/axios';

export const messageService = {
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data; // { success, data: conversations[] }
  },

  getMessages: async (partnerId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/messages/${partnerId}`, { params });
    return response.data; // { success, data: messages[], pagination }
  },

  sendMessage: async (partnerId: string, content: string, houseId?: string) => {
    const response = await api.post(`/messages/${partnerId}`, { content, houseId });
    return response.data;
  },
};
