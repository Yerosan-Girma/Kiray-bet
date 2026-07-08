import api from '../api/axios';

export const favoriteService = {
  addFavorite: async (houseId: string) => {
    const response = await api.post(`/favorites/${houseId}`);
    return response.data;
  },

  removeFavorite: async (houseId: string) => {
    const response = await api.delete(`/favorites/${houseId}`);
    return response.data;
  },

  getFavorites: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/favorites', { params });
    return response.data; // { success, data: favorites[], pagination }
  },
};
