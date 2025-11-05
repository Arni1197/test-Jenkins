import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { JwtAuthGuard } from '../../common//guards/jwt-auth.guard';
import { ResourcesService } from '../resources/resources.service';

@Controller('buildings')
export class BuildingsController {
  constructor(
    private readonly buildingsService: BuildingsService,
    private readonly resourcesService: ResourcesService,
  ) {}

  // Получить все здания пользователя
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyBuildings(@Req() req) {
    const userId = req.user.userId;
    return this.buildingsService.getBuildings(userId);
  }

  // Построить новое здание (и потратить ресурсы)
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createBuilding(@Req() req, @Body() body: { type: string }) {
    const userId = req.user.userId;
    const { type } = body;

    // Стоимость строительства
    const costs = {
      mine: { wood: 50, stone: 20, gold: 10 },
      lumbermill: { wood: 20, stone: 10, gold: 5 },
      castle: { wood: 100, stone: 100, gold: 50 },
    };

    const cost = costs[type];
    if (!cost) {
      return { message: 'Unknown building type' };
    }

    // Проверяем ресурсы игрока
    const resources = await this.resourcesService.getResources(userId);
    if (!resources) {
      return { message: 'Resources not found for user' };
    }

    // Проверяем хватает ли ресурсов
    if (
      resources.wood < cost.wood ||
      resources.stone < cost.stone ||
      resources.gold < cost.gold
    ) {
      return { message: 'Not enough resources to build' };
    }

    // Списываем ресурсы
    await this.resourcesService.addResource(userId, 'wood', -cost.wood);
    await this.resourcesService.addResource(userId, 'stone', -cost.stone);
    await this.resourcesService.addResource(userId, 'gold', -cost.gold);

    // Создаём здание
    const building = await this.buildingsService.createBuilding(userId, type);
    return { message: 'Building created successfully', building };
  }
}