import { Controller, Get } from '@nestjs/common';

@Controller('catalog')
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'catalog-service' };
  }
}
