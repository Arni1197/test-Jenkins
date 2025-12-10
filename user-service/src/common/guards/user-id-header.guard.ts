import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class UserIdHeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    const header =
      req.headers['x-user-id'] ??
      req.headers['x-userid'] ??
      req.headers['x-user_id'];

    if (typeof header !== 'string' || !header.trim()) {
      throw new UnauthorizedException('Missing x-user-id');
    }

    return true;
  }
}