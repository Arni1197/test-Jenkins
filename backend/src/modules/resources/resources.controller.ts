import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { ResourcesService } from './resources.service';
import type { UserPayload } from  'src/modules/types/user.types';
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyResources(@User() user: UserPayload) {
    return this.resourcesService.getResources(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  addResource(
    @User() user: UserPayload,
    @Body() body: { resource: 'wood' | 'stone' | 'gold'; amount: number },
  ) {
    return this.resourcesService.addResource(user.userId, body.resource, body.amount);
  }
}