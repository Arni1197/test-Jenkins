import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { BattleService } from './battle.service';
import type { UserPayload } from '../types/user.types';

@Controller('battles')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyBattles(@User() user: UserPayload) {
    return this.battleService.getBattlesForUser(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('attack')
  attack(@User() user: UserPayload, @Body() body: { defenderId: string; damage: number }) {
    return this.battleService.createBattle(user.userId, body.defenderId, body.damage);
  }
}