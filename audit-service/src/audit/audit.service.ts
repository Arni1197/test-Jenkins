import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';

export type AuditEventPayload = {
  eventId?: string;
  eventType: string;
  userId?: string;
  productId?: string;
  requestId?: string;
  kongRequestId?: string;
  sourceService?: string;
  sourceTransport?: string;
  topic?: string;
  entityType?: string;
  entityId?: string;
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

  private getString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private getRequestId(payload: AuditEventPayload): string | null {
    return (
      this.getString(payload.requestId) ??
      this.getString(payload.metadata?.requestId) ??
      null
    );
  }

  private getKongRequestId(payload: AuditEventPayload): string | null {
    return (
      this.getString(payload.kongRequestId) ??
      this.getString(payload.metadata?.kongRequestId) ??
      null
    );
  }

  private inferEntityType(payload: AuditEventPayload): string | null {
    if (this.getString(payload.entityType)) return this.getString(payload.entityType);

    if (this.getString(payload.productId)) return 'Product';

    if (
      payload.eventType === 'CartItemAdded' ||
      payload.eventType === 'CartItemRemoved'
    ) {
      return 'Cart';
    }

    if (
      payload.eventType === 'FavoriteAdded' ||
      payload.eventType === 'FavoriteRemoved'
    ) {
      return 'Favorite';
    }

    if (payload.eventType === 'UserProfileUpdated') {
      return 'UserProfile';
    }

    return null;
  }

  private inferEntityId(payload: AuditEventPayload): string | null {
    return (
      this.getString(payload.entityId) ??
      this.getString(payload.productId) ??
      null
    );
  }

  private inferSourceService(payload: AuditEventPayload): string | null {
    if (this.getString(payload.sourceService)) {
      return this.getString(payload.sourceService);
    }

    if (
      payload.eventType === 'UserProfileUpdated' ||
      this.getString(payload.topic)
    ) {
      return 'user-service';
    }

    if (this.getString(payload.productId)) {
      return 'catalog-service';
    }

    return null;
  }

  private inferSourceTransport(payload: AuditEventPayload): string | null {
    if (this.getString(payload.sourceTransport)) {
      return this.getString(payload.sourceTransport);
    }

    if (
      payload.eventType === 'UserProfileUpdated' ||
      this.getString(payload.topic)
    ) {
      return 'kafka';
    }

    if (this.getString(payload.productId)) {
      return 'rabbitmq';
    }

    return null;
  }

  async saveAuditLog(payload: AuditEventPayload) {
    const eventType =
      typeof payload.eventType === 'string' ? payload.eventType : 'unknown';

    const requestId = this.getRequestId(payload);
    const kongRequestId = this.getKongRequestId(payload);

    try {
      const result = await this.prisma.auditLog.create({
        data: {
          eventId: this.getString(payload.eventId),
          eventType,
          userId: this.getString(payload.userId),
          productId: this.getString(payload.productId),
          requestId,
          sourceService: this.inferSourceService(payload),
          sourceTransport: this.inferSourceTransport(payload),
          topic: this.getString(payload.topic),
          entityType: this.inferEntityType(payload),
          entityId: this.inferEntityId(payload),
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
          eventId: payload.eventId,
          requestId,
          kongRequestId,
          userId: payload.userId,
          productId: payload.productId,
          sourceService: result.sourceService,
          sourceTransport: result.sourceTransport,
          topic: result.topic,
          entityType: result.entityType,
          entityId: result.entityId,
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
          eventId: payload.eventId,
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