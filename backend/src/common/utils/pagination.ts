import { z } from 'zod';
import type { PageMeta } from './response';

/** Reusable query schema for list endpoints. Modules extend it with their own filters. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().regex(/^[a-zA-Z_]+$/).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().min(1).max(100).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function toSkipTake({ page, limit }: Pick<PaginationQuery, 'page' | 'limit'>) {
  return { skip: (page - 1) * limit, take: limit };
}

export function buildPageMeta(total: number, { page, limit }: Pick<PaginationQuery, 'page' | 'limit'>): PageMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** Whitelists a client-supplied sort field so it can never reach the ORM unchecked. */
export function safeSort<T extends string>(
  requested: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(requested as T) ? (requested as T) : fallback;
}
