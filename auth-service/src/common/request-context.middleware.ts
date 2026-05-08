import { NextFunction, Request, Response } from 'express';

export type RequestWithContext = Request & {
  requestId?: string;
  kongRequestId?: string;
  userId?: string;
};

function getHeader(value: unknown): string | undefined {
  if (Array.isArray(value)) return value[0];

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return undefined;
}

export function requestContextMiddleware(
  req: RequestWithContext,
  res: Response,
  next: NextFunction,
) {
  req.requestId = getHeader(req.headers['x-request-id']);
  req.kongRequestId = getHeader(req.headers['x-kong-request-id']);
  req.userId = getHeader(req.headers['x-user-id']);

  if (req.requestId) {
    res.setHeader('x-request-id', req.requestId);
  }

  if (req.kongRequestId) {
    res.setHeader('x-kong-request-id', req.kongRequestId);
  }

  next();
}