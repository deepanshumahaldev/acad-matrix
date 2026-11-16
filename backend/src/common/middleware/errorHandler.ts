import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../errors';
import { config } from '../config';
import { logger } from '../utils/logger';

interface Normalized {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

function normalize(err: unknown): Normalized {
  if (err instanceof AppError) {
    return { status: err.statusCode, code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof ZodError) {
    return {
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    };
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return {
        status: 409,
        code: 'CONFLICT',
        message: 'A record with the same unique value already exists',
        details: { fields: err.meta?.target },
      };
    }
    if (err.code === 'P2025') return { status: 404, code: 'NOT_FOUND', message: 'Record not found' };
    if (err.code === 'P2003') {
      return { status: 409, code: 'CONFLICT', message: 'Record is referenced by other data' };
    }
  }
  const e = err as { type?: string; status?: number };
  if (e?.type === 'entity.parse.failed') {
    return { status: 400, code: 'BAD_REQUEST', message: 'Malformed JSON body' };
  }
  if (e?.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' };
  }
  return { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong' };
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const n = normalize(err);
  const requestId = res.locals.requestId as string | undefined;

  if (n.status >= 500) {
    logger.error({ err, requestId, method: req.method, url: req.originalUrl }, 'Unhandled error');
  }

  res.status(n.status).json({
    success: false,
    error: {
      code: n.code,
      message: n.message,
      ...(n.details ? { details: n.details } : {}),
      ...(!config.isProd && n.status >= 500 && err instanceof Error ? { stack: err.stack } : {}),
    },
    requestId,
  });
};
