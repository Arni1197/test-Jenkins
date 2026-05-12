// user-service/src/users/users.controller.ts
import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserIdHeaderGuard } from 'src/common/guards/user-id-header.guard';
import { RequestWithContext } from '../common/request-context.middleware';

@UseGuards(UserIdHeaderGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUserId() authUserId: string) {
    return this.usersService.getOrCreateProfile(authUserId);
  }

  @Patch('me')
  async updateMe(
    @CurrentUserId() authUserId: string,
    @Body() dto: UpdateUserProfileDto,
    @Req() req: Request & RequestWithContext,
  ) {
    return this.usersService.updateMyProfile(authUserId, dto, {
      requestId: req.requestId,
      kongRequestId: req.kongRequestId,
    });
  }
}