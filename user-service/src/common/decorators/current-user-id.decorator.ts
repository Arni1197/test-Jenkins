// src/common/decorators/current-user-id.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    const header =
      request.headers['x-user-id'] ??
      request.headers['x-userid'] ??
      request.headers['x-user_id'];

    if (typeof header !== 'string') {
      // позже добавим guard и будем кидать 401
      return null;
    }

    return header;
  },
);