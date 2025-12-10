import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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

  async updateMyProfile(authUserId: string, dto: UpdateUserProfileDto) {
    if (!authUserId) {
      throw new BadRequestException('authUserId is required');
    }

    const existing = await this.prisma.userProfile.findUnique({
      where: { authUserId },
    });

    if (!existing) {
      throw new NotFoundException('Profile not found');
    }

    return this.prisma.userProfile.update({
      where: { authUserId },
      data: { ...dto },
    });
  }

  // 🔧 опционально: пригодится позже
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