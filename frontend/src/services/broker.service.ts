import api from '../api/axios';

export const brokerService = {
  // Public
  getApprovedBrokers: async () => {
    const response = await api.get('/broker/approved');
    return response.data; // { success, data: brokers[] }
  },

  // Any logged-in user — apply to become a broker
  applyBroker: async (data: {
    companyName?: string;
    officeAddress: string;
    yearsExperience: number;
    description: string;
    nationalId?: string;
    paymentMethod: 'telebirr' | 'bank_transfer';
  }) => {
    const response = await api.post('/broker/apply', data);
    return response.data;
  },

  // Confirm broker payment
  confirmBrokerPayment: async (transactionId: string) => {
    const response = await api.post('/broker/confirm-payment', { transactionId });
    return response.data;
  },

  // Owner submits property to a specific broker
  ownerSubmitToBroker: async (data: {
    brokerId: string;
    title: string;
    description: string;
    price: number;
    location: string;
    coordinates: { type: 'Point'; coordinates: [number, number] };
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
    amenities: string[];
    contactPhone: string;
  }) => {
    const response = await api.post('/broker/submit-property', data);
    return response.data;
  },

  // Broker: get submissions from owners
  getMySubmissions: async (status?: string) => {
    const response = await api.get('/broker/submissions', { params: { status } });
    return response.data;
  },

  // Broker: accept or reject an owner submission
  respondToSubmission: async (houseId: string, action: 'accept' | 'reject', notes?: string) => {
    const response = await api.put(`/broker/submissions/${houseId}/respond`, { action, notes });
    return response.data;
  },

  // Admin: get broker applications
  getBrokerApplications: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/broker/applications', { params });
    return response.data;
  },

  // Admin: approve broker
  approveBrokerApplication: async (userId: string) => {
    const response = await api.put(`/broker/applications/${userId}/approve`);
    return response.data;
  },

  // Admin: reject broker
  rejectBrokerApplication: async (userId: string, reason: string) => {
    const response = await api.put(`/broker/applications/${userId}/reject`, { reason });
    return response.data;
  },
};
