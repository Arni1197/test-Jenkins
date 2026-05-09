import { NextFunction, Request, Response } from 'express';

type RequestWithContext = Request & {
  requestId?: string;
  kongRequestId?: string;
  userId?: string;
};

export function httpLoggerMiddleware(service: string) {
  return (req: RequestWithContext, res: Response, next: NextFunction) => {
    const startedAt = Date.now();

    res.on('finish', () => {
      const log = {
        type: 'http_request',
        service,
        env: process.env.NODE_ENV ?? 'local',

        requestId: req.requestId ?? req.headers['x-request-id'],
        kongRequestId: req.kongRequestId ?? req.headers['x-kong-request-id'],
        userId: req.userId ?? req.headers['x-user-id'],

        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,

        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };

      console.log(JSON.stringify(log));
    });

    next();
  };
}