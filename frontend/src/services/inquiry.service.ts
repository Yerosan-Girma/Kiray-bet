import api from '../api/axios';

export const inquiryService = {
  createInquiry: async (data: { houseId: string; contactPhone: string; message: string }) => {
    const response = await api.post('/inquiries', data);
    return response.data;
  },

  getInquiries: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/inquiries', { params });
    return response.data; // { success, data: inquiries[], pagination }
  },

  addReply: async (id: string, data: { message: string }) => {
    const response = await api.post(`/inquiries/${id}/reply`, data);
    return response.data;
  },
};
