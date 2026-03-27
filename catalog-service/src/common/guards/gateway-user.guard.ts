import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  userId?: string;
}

@Injectable()
export class GatewayUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();

    const userIdHeader = req.headers['x-user-id'];

    const userId = Array.isArray(userIdHeader)
      ? userIdHeader[0]
      : userIdHeader;

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    req.userId = userId.trim();

    return true;
  }
}

@Injectable()
export class OptionalGatewayUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();

    const userIdHeader = req.headers['x-user-id'];

    const userId = Array.isArray(userIdHeader)
      ? userIdHeader[0]
      : userIdHeader;

    if (userId && typeof userId === 'string' && userId.trim()) {
      req.userId = userId.trim();
    }

    return true;
  }
}