import { useQuery } from '@tanstack/react-query';
import { getReadiness } from '../api/healthApi';

export const useReadiness = () =>
  useQuery({ queryKey: ['health', 'ready'], queryFn: getReadiness, refetchInterval: 15_000 });
