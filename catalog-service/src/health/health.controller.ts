// src/health/health.controller.ts
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { isShuttingDown } from '../main';

@Controller('health')
export class HealthController {
  @Get('live')
  live() {
    return {
      status: 'ok',
    };
  }

  @Get('ready')
  ready() {
    if (isShuttingDown) {
      throw new HttpException(
        {
          status: 'shutting_down',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return {
      status: 'ready',
    };
  }
}