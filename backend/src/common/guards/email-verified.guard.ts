// src/modules/auth/guards/email-verified.guard.ts
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
  
  @Injectable()
  export class EmailVerifiedGuard implements CanActivate {
    constructor(private readonly usersService: UsersService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest();
      const userFromJwt = req.user as { id: string; email?: string };
  
      if (!userFromJwt || !userFromJwt.id) {
        throw new UnauthorizedException('No user in request');
      }
  
      const user = await this.usersService.findById(userFromJwt.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
  
      if (!user.emailVerified) {
        throw new UnauthorizedException('Email is not verified');
      }
  
      return true;
    }
  }