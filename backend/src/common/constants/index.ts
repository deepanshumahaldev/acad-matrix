export const API_PREFIX = '/api/v1';

export const ROLES = ['ADMIN', 'FACULTY', 'STUDENT'] as const;
export type RoleName = (typeof ROLES)[number];
