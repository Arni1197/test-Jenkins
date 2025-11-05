import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { BattleModule } from '../battle/battle.module';
import { BuildingsModule } from '../buildings/buildings.module';
import { ResourcesModule } from '../resources/resources.module';

@Module({
  imports: [BattleModule, BuildingsModule, ResourcesModule],
  providers: [GameGateway, GameService],
  exports: [GameService],
})
export class GameModule {}