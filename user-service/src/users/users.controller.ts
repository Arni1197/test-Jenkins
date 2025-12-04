// src/users/users.controller.ts
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUserId() userId: string) {
    // На проде сюда добавим guard, который проверяет наличие userId
    return this.usersService.getOrCreateProfile(userId);
  }

  @Patch('me')
  async updateMe(
    @CurrentUserId() userId: string,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateMyProfile(userId, dto);
  }
}