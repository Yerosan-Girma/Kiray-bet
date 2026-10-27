import api from '../api/axios';
import type { HouseFilters } from '../types';

export const houseService = {
  getHouses: async (params?: HouseFilters) => {
    const response = await api.get('/houses', { params });
    return response.data; // { success, data: houses[], pagination }
  },

  getNearbyHouses: async (params: { longitude: number; latitude: number; radius?: number; page?: number; limit?: number }) => {
    const response = await api.get('/houses/nearby', { params });
    return response.data;
  },

  getMyListings: async () => {
    const response = await api.get('/houses/my-listings');
    return response.data;
  },

  getHouse: async (id: string) => {
    const response = await api.get(`/houses/${id}`);
    return response.data; // { success, data: house }
  },

  createHouse: async (data: any) => {
    const response = await api.post('/houses', data);
    return response.data;
  },

  updateHouse: async (id: string, data: Partial<any>) => {
    const response = await api.put(`/houses/${id}`, data);
    return response.data;
  },

  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await api.post('/houses/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.urls;
  },

  deleteHouse: async (id: string) => {
    const response = await api.delete(`/houses/${id}`);
    return response.data;
  },
};
