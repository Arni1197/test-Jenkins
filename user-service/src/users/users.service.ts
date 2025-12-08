import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateProfile(authUserId: string) {
    const existing = await this.prisma.userProfile.findUnique({
      where: { authUserId },
    });

    if (existing) return existing;

    // ✅ можно задать дефолт displayName позже из события (username)
    return this.prisma.userProfile.create({
      data: {
        authUserId,
      },
    });
  }

  async updateMyProfile(authUserId: string, dto: UpdateUserProfileDto) {
    const existing = await this.prisma.userProfile.findUnique({
      where: { authUserId },
    });

    if (!existing) {
      throw new NotFoundException('Profile not found');
    }

    return this.prisma.userProfile.update({
      where: { authUserId },
      data: {
        ...dto,
      },
    });
  }
}