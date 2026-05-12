// user-service/src/users/users.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { AuditEventsService } from '../audit/audit-events.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditEventsService: AuditEventsService,
  ) {}

  async getOrCreateProfile(authUserId: string) {
    if (!authUserId) {
      throw new BadRequestException('authUserId is required');
    }

    const existing = await this.prisma.userProfile.findUnique({
      where: { authUserId },
    });

    if (existing) return existing;

    return this.prisma.userProfile.create({
      data: { authUserId },
    });
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

    const updated = await this.prisma.userProfile.update({
      where: { authUserId },
      data: { ...dto },
    });

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