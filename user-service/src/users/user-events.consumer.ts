// src/users/user-events.consumer.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UsersService } from './users.service';

type UserRegisteredPayload = {
  userId: string;
  email: string;
  username?: string;
  createdAt?: string;
};

@Processor('user-events')
export class UserEventsConsumer extends WorkerHost {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  async process(job: Job<UserRegisteredPayload>) {
    if (job.name !== 'UserRegistered') return;

    const { userId } = job.data;

    // ✅ идемпотентно
    await this.usersService.getOrCreateProfile(userId);

    return { ok: true };
  }
}