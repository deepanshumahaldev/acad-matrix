import { api } from '@/lib/apiClient';
import type { ReadinessStatus } from '../types';

export const getReadiness = async () => (await api.get<ReadinessStatus>('/health/ready')).data;
