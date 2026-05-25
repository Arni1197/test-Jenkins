import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { AuditEventsService } from '../audit/audit-events.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditEventsService: AuditEventsService,
    private readonly metricsService: MetricsService,
  ) {}

  async getOrCreateProfile(authUserId: string) {
    if (!authUserId) {
      throw new BadRequestException('authUserId is required');
    }

    const existing = await this.prisma.userProfile.findUnique({
      where: { authUserId },
    });

    if (existing) return existing;

    try {
      const created = await this.prisma.userProfile.create({
        data: { authUserId },
      });

      this.metricsService.userDbWriteSuccessTotal.inc({
        source: 'user-service',
        service: 'user-service',
        operation: 'create_profile',
      });

      return created;
    } catch (error) {
      this.metricsService.userDbWriteFailedTotal.inc({
        source: 'user-service',
        service: 'user-service',
        operation: 'create_profile',
      });

      throw error;
    }
  }

  async updateMyProfile(
    authUserId: string,
    dto: UpdateUserProfileDto,
    context?: {
      requestId?: string;
      kongRequestId?: string;
    },
  ) {
    if (!authUserId) {
      throw new BadRequestException('authUserId is required');
    }

    const existing = await this.prisma.userProfile.findUnique({
      where: { authUserId },
    });

    if (!existing) {
      throw new NotFoundException('Profile not found');
    }

    let updated;

    try {
      updated = await this.prisma.userProfile.update({
        where: { authUserId },
        data: { ...dto },
      });

      this.metricsService.userDbWriteSuccessTotal.inc({
        source: 'user-service',
        service: 'user-service',
        operation: 'update_profile',
      });
    } catch (error) {
      this.metricsService.userDbWriteFailedTotal.inc({
        source: 'user-service',
        service: 'user-service',
        operation: 'update_profile',
      });

      throw error;
    }

    const changedFields = Object.keys(dto).filter(
      (field) => dto[field as keyof UpdateUserProfileDto] !== undefined,
    );

    if (changedFields.length > 0) {
      await this.auditEventsService.emitUserProfileUpdated({
        userId: authUserId,
        profileId: updated.id,
        changedFields,
        requestId: context?.requestId,
        kongRequestId: context?.kongRequestId,
      });
    }

    return updated;
  }

  async getProfileOrThrow(authUserId: string) {
    if (!authUserId) {
      throw new BadRequestException('authUserId is required');
    }

    const profile = await this.prisma.userProfile.findUnique({
      where: { authUserId },
    });

    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }
}