import { apiClient } from './client';

export const assumptionsApi = {
  list: (category?: string) => {
    const q = category ? `?category=${category}` : '';
    return apiClient.get<any[]>(`/assumptions${q}`);
  },

  create: (data: any) => {
    return apiClient.post<any>('/assumptions', data);
  },
};
