import api from '../api/axios';

export const paymentService = {
  createPayment: async (data: { amount: number; paymentMethod: 'chapa' | 'telebirr' | 'mpesa' }) => {
    const response = await api.post('/payments/create', data);
    return response.data;
  },

  getPaymentStatus: async (id: string) => {
    const response = await api.get(`/payments/status/${id}`);
    return response.data;
  },

  getPaymentHistory: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/payments/history', { params });
    return response.data; // { success, data: transactions[], pagination }
  },
};
