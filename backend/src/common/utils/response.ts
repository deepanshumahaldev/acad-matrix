import type { Response } from 'express';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SuccessBody<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

export function sendSuccess<T>(res: Response, data: T, status = 200, meta?: PageMeta): Response {
  const body: SuccessBody<T> = meta ? { success: true, data, meta } : { success: true, data };
  return res.status(status).json(body);
}

export const sendCreated = <T>(res: Response, data: T): Response => sendSuccess(res, data, 201);

export const sendNoContent = (res: Response): Response => res.status(204).send();
