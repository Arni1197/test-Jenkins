import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'user-service' };
  }
}