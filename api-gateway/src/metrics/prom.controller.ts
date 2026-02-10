import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Registry } from 'prom-client';

@Controller()
export class PromController {
  constructor(private readonly registry: Registry) {}

  @Get('/metrics')
  async metrics(@Res() res: Response) {
    res.setHeader('Content-Type', this.registry.contentType);
    res.end(await this.registry.metrics());
  }
}