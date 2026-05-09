import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';

export type AuditEventPayload = {
  eventType: string;
  userId?: string;
  productId?: string;
  emittedAt?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) {}

  async saveAuditLog(payload: AuditEventPayload) {
    const eventType =
      typeof payload.eventType === 'string' ? payload.eventType : 'unknown';

    const requestId =
      typeof payload.metadata?.requestId === 'string'
        ? payload.metadata.requestId
        : undefined;

    const kongRequestId =
      typeof payload.metadata?.kongRequestId === 'string'
        ? payload.metadata.kongRequestId
        : undefined;

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

      this.logger.log(
        JSON.stringify({
          type: 'audit_event_persisted',
          service: 'audit-service',
          eventType,
          requestId,
          kongRequestId,
          userId: payload.userId,
          productId: payload.productId,
          auditLogId: result.id,
          result: 'success',
        }),
      );

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

      this.logger.error(
        JSON.stringify({
          type: 'audit_event_persist_failed',
          service: 'audit-service',
          eventType,
          requestId,
          kongRequestId,
          userId: payload.userId,
          productId: payload.productId,
          error: error instanceof Error ? error.message : String(error),
        }),
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }
}