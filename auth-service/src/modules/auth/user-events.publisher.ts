// src/modules/auth/user-events.publisher.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// ✅ У тебя user.id = string (cuid/uuid), поэтому userId здесь тоже string
export type UserRegisteredPayload = {
  userId: string;
  email: string;
  username?: string | null;
};

export type UserEmailVerifiedPayload = {
  userId: string;
  email: string;
};

@Injectable()
export class UserEventsPublisher {
  constructor(
    @InjectQueue('user-events') private readonly queue: Queue,
  ) {}

  async publishUserRegistered(payload: UserRegisteredPayload) {
    await this.queue.add(
      'UserRegistered',
      {
        ...payload,
        // нормализуем username, чтобы не тащить null туда, где не ждёшь
        username: payload.username ?? undefined,
        createdAt: new Date().toISOString(),
      },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    );
  }

  // на будущее:
  async publishUserEmailVerified(payload: UserEmailVerifiedPayload) {
    await this.queue.add(
      'UserEmailVerified',
      {
        ...payload,
        verifiedAt: new Date().toISOString(),
      },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    );
  }
}