// src/modules/game/game.service.ts
import { Injectable } from '@nestjs/common';
import { BattleService } from '../battle/battle.service';
import { BuildingsService } from '../buildings/buildings.service';
import { ResourcesService } from '../resources/resources.service';

@Injectable()
export class GameService {
  constructor(
    private readonly battleService: BattleService,
    private readonly buildingsService: BuildingsService,
    private readonly resourcesService: ResourcesService,
  ) {}

  async buildBuilding(userId: string, type: string) {
    const resources = await this.resourcesService.getResources(userId);
    if (!resources || resources.wood < 10) throw new Error('Not enough resources');
    await this.resourcesService.addResource(userId, 'wood', -10);
    return this.buildingsService.createBuilding(userId, type);
  }

  async attackUser(attackerId: string, defenderId: string, damage: number) {
    return this.battleService.createBattle(attackerId, defenderId, damage);
  }
}