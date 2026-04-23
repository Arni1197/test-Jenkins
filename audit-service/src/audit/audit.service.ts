import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';

export type AuditEventPayload = {
  eventType: string;
  userId?: string;
  productId?: string;
  emittedAt?: string;
  [key: string]: unknown;
};

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) {}

  async saveAuditLog(payload: AuditEventPayload) {
    const eventType =
      typeof payload.eventType === 'string' ? payload.eventType : 'unknown';

    try {
      const result = await this.prisma.auditLog.create({
        data: {
          eventType,
          userId: typeof payload.userId === 'string' ? payload.userId : null,
          productId:
            typeof payload.productId === 'string' ? payload.productId : null,
          emittedAt: payload.emittedAt ? new Date(payload.emittedAt) : null,
          payload: payload as Prisma.InputJsonValue,
        },
      });

      this.metricsService.auditEventsPersistSuccessTotal.inc({
        service: 'audit-service',
        event: eventType,
      });

      return result;
    } catch (error) {
      this.metricsService.auditEventsPersistFailedTotal.inc({
        service: 'audit-service',
        event: eventType,
      });

      this.metricsService.auditEventsProcessingFailedTotal.inc({
        service: 'audit-service',
        event: eventType,
        stage: 'persist',
      });

      throw error;
    }
  }
}