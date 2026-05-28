import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { KafkaProducer } from '../kafka/kafka.producer';

type UserProfileUpdatedAuditEvent = {
  eventId: string;
  eventType: 'UserProfileUpdated';
  sourceService: 'user-service';
  userId: string;
  entityType: 'UserProfile';
  entityId: string;
  action: 'profile_updated';
  requestId?: string;
  kongRequestId?: string;
  changedFields: string[];
  emittedAt: string;
};

@Injectable()
export class AuditEventsService {
  private readonly logger = new Logger(AuditEventsService.name);

  constructor(
    private readonly kafkaProducer: KafkaProducer,
    private readonly configService: ConfigService,
  ) {}

  async emitUserProfileUpdated(params: {
    userId: string;
    profileId: string;
    changedFields: string[];
    requestId?: string;
    kongRequestId?: string;
  }) {
    const topic = this.configService.get<string>(
      'KAFKA_AUDIT_TOPIC',
      'audit.events',
    );

    const event: UserProfileUpdatedAuditEvent = {
      eventId: randomUUID(),
      eventType: 'UserProfileUpdated',
      sourceService: 'user-service',
      userId: params.userId,
      entityType: 'UserProfile',
      entityId: params.profileId,
      action: 'profile_updated',
      requestId: params.requestId,
      kongRequestId: params.kongRequestId,
      changedFields: params.changedFields,
      emittedAt: new Date().toISOString(),
    };

    try {
      await this.kafkaProducer.emit(topic, event, params.userId, {
        eventId: event.eventId,
        eventType: event.eventType,
        userId: event.userId,
        requestId: event.requestId ?? '',
        kongRequestId: event.kongRequestId ?? '',
        sourceService: event.sourceService,
      });

      this.logger.log(
        JSON.stringify({
          type: 'audit_event_sent',
          service: 'user-service',
          topic,
          eventType: event.eventType,
          eventId: event.eventId,
          userId: event.userId,
          requestId: event.requestId,
          kongRequestId: event.kongRequestId,
          result: 'success',
        }),
      );
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          type: 'audit_event_send_final_failed',
          service: 'user-service',
          topic,
          eventType: event.eventType,
          eventId: event.eventId,
          userId: event.userId,
          requestId: event.requestId,
          kongRequestId: event.kongRequestId,
          error: error instanceof Error ? error.message : String(error),
        }),
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }
}