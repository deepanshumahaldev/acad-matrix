import { api } from '@/lib/apiClient';
import type { DashboardData } from '../types';

export const getDashboardData = async () =>
  (await api.get<DashboardData>('/api/v1/dashboard')).data;
