import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Battle, BattleDocument } from '../../schemas/battle.schema';

@Injectable()
export class BattleService {
  constructor(@InjectModel(Battle.name) private battleModel: Model<BattleDocument>) {}

  async getBattlesForUser(userId: string) {
    return this.battleModel.find({
      $or: [
        { attackerId: new Types.ObjectId(userId) },
        { defenderId: new Types.ObjectId(userId) },
      ],
    });
  }

  async createBattle(attackerId: string, defenderId: string, damage: number) {
    return this.battleModel.create({
      attackerId: new Types.ObjectId(attackerId),
      defenderId: new Types.ObjectId(defenderId),
      damage,
      createdAt: new Date(),
    });
  }
}