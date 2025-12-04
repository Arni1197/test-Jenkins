import { Controller, Get, Res } from '@nestjs/common';
// ⬇️ вот так, с `import type`
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(@Res() res: Response) {
    const registry = this.metricsService.getRegistry();
    res.setHeader('Content-Type', registry.contentType);
    res.send(await registry.metrics());
  }
}