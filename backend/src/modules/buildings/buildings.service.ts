import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Building, BuildingDocument } from '../../schemas/building.schema';
import { Resources, ResourcesDocument } from '../../schemas/resources.schema';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectModel(Building.name) private buildingModel: Model<BuildingDocument>,
    @InjectModel(Resources.name) private resourcesModel: Model<ResourcesDocument>,
  ) {}

  private buildingCosts = {
    lumberMill: { wood: 50, stone: 20, gold: 10 },
    mine: { wood: 20, stone: 50, gold: 15 },
    goldVault: { wood: 40, stone: 40, gold: 50 },
  };

  async getBuildings(userId: string) {
    return this.buildingModel.find({ userId: new Types.ObjectId(userId) });
  }

  async createBuilding(userId: string, type: string) {
    const cost = this.buildingCosts[type];
    if (!cost) {
      throw new Error('❌ Неверный тип здания');
    }

    const resources = await this.resourcesModel.findOne({ userId });
    if (!resources) {
      throw new Error('❌ Ресурсы не найдены');
    }

    // Проверяем, хватает ли ресурсов
    if (
      resources.wood < cost.wood ||
      resources.stone < cost.stone ||
      resources.gold < cost.gold
    ) {
      throw new Error('⚠️ Недостаточно ресурсов для строительства');
    }

    // Списываем ресурсы
    resources.wood -= cost.wood;
    resources.stone -= cost.stone;
    resources.gold -= cost.gold;
    await resources.save();

    // Создаём здание
    const newBuilding = await this.buildingModel.create({
      userId: new Types.ObjectId(userId),
      type,
      createdAt: new Date(),
    });

    return {
      message: `✅ Здание "${type}" построено!`,
      building: newBuilding,
      remainingResources: resources,
    };
  }
}