import api from '../api/axios';

export const rentService = {
  // Search registered tenant by email (for broker / admin)
  searchTenant: async (email: string) => {
    const response = await api.get('/rentals/search-tenant', { params: { email } });
    return response.data; // { success: true, data: User }
  },

  // Get users who submitted inquiries for a house
  getHouseInquirers: async (houseId: string) => {
    const response = await api.get(`/rentals/house-inquiries/${houseId}`);
    return response.data; // { success: true, data: User[] }
  },

  // Broker: Create rental agreement
  createRentalAgreement: async (data: {
    houseId: string;
    tenantId: string;
    leaseStartDate: string;
    leaseEndDate: string;
    monthlyRent: number;
    securityDeposit?: number;
    paymentSchedule?: 'monthly' | 'quarterly' | 'yearly';
    paymentMethod?: 'cash' | 'bank_transfer' | 'telebirr' | 'chapa' | 'mpesa';
    terms?: string;
    isAutoRenew?: boolean;
    noticePeriod?: number;
    agreementDocument?: string;
  }) => {
    const response = await api.post('/rentals', data);
    return response.data;
  },

  // Get rentals for authenticated user
  getMyRentals: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/rentals/my-rentals', { params });
    return response.data;
  },

  // Get single rental by ID
  getRentalById: async (rentId: string) => {
    const response = await api.get(`/rentals/${rentId}`);
    return response.data;
  },

  // Update rental status (terminate/complete)
  updateRentalStatus: async (rentId: string, data: {
    status: 'terminated' | 'completed';
    terminationReason?: string;
  }) => {
    const response = await api.put(`/rentals/${rentId}/status`, data);
    return response.data;
  },

  // Add payment record
  addPaymentRecord: async (rentId: string, data: {
    amount: number;
    paymentDate?: string;
    dueDate?: string;
    status?: 'paid' | 'pending' | 'overdue' | 'partial';
    transactionId?: string;
    notes?: string;
  }) => {
    const response = await api.post(`/rentals/${rentId}/payments`, data);
    return response.data;
  },
};
