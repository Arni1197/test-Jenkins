import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
export const KONG_REQUEST_ID_HEADER = 'x-kong-request-id';

export type RequestWithIds = Request & {
  requestId?: string;
  kongRequestId?: string;
};

function getHeaderValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return value[0];

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return undefined;
}

export function requestIdMiddleware(
  req: RequestWithIds,
  res: Response,
  next: NextFunction,
) {
  const incomingRequestId = getHeaderValue(req.headers[REQUEST_ID_HEADER]);
  const kongRequestId = getHeaderValue(req.headers[KONG_REQUEST_ID_HEADER]);

  const requestId = incomingRequestId ?? randomUUID();

  req.requestId = requestId;
  req.kongRequestId = kongRequestId;

  req.headers[REQUEST_ID_HEADER] = requestId;

  res.setHeader(REQUEST_ID_HEADER, requestId);

  if (kongRequestId) {
    res.setHeader(KONG_REQUEST_ID_HEADER, kongRequestId);
  }

  next();
}