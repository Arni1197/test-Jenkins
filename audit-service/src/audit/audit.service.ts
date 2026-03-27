import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditEventPayload = {
  eventType: string;
  userId?: string;
  productId?: string;
  emittedAt?: string;
  [key: string]: unknown;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async saveAuditLog(payload: AuditEventPayload) {
    return this.prisma.auditLog.create({
      data: {
        eventType: payload.eventType,
        userId: typeof payload.userId === 'string' ? payload.userId : null,
        productId: typeof payload.productId === 'string' ? payload.productId : null,
        emittedAt: payload.emittedAt ? new Date(payload.emittedAt) : null,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }
}