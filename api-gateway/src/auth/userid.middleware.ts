import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = {
  sub?: string;
  userId?: string;
  id?: string;
  email?: string;
};

export function attachUserIdFromJwt(req: Request, res: Response, next: NextFunction) {
  try {
    // 1) Bearer
    const auth = req.headers.authorization;
    const tokenFromHeader =
      auth && auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;

    // 2) Cookie (если используешь)
    const tokenFromCookie =
      (req as any).cookies?.accessToken ||
      (req as any).cookies?.jwt ||
      null;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: missing token' });
    }

    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT secret is not configured in gateway' });
    }

    const payload = jwt.verify(token, secret) as JwtPayload;

    const userId = payload.sub ?? payload.userId ?? payload.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: userId not found in token' });
    }

    // сохраним для прокси
    (req as any).userId = userId;

    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: invalid token' });
  }
}