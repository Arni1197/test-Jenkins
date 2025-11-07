// test/integration/game.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from '../../src/modules/game/game.service';
import { BattleService } from '../../src/modules/battle/battle.service';
import { BuildingsService } from '../../src/modules/buildings/buildings.service';
import { ResourcesService } from '../../src/modules/resources/resources.service';
import { Types } from 'mongoose';

describe('GameService Integration', () => {
  let service: GameService;
  const validId = new Types.ObjectId().toHexString();

  const mockBattleService = { createBattle: jest.fn() };
  const mockBuildingsService = { createBuilding: jest.fn() };
  const mockResourcesService = { getResources: jest.fn(), addResource: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: BattleService, useValue: mockBattleService },
        { provide: BuildingsService, useValue: mockBuildingsService },
        { provide: ResourcesService, useValue: mockResourcesService },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should build building correctly', async () => {
    mockResourcesService.getResources.mockResolvedValue({ wood: 50 });
    mockBuildingsService.createBuilding.mockResolvedValue('BuildingDone');

    const result = await service.buildBuilding(validId, 'lumberMill');
    expect(result).toBe('BuildingDone');
  });

  it('should attack user correctly', async () => {
    mockBattleService.createBattle.mockResolvedValue('BattleDone');
    const result = await service.attackUser(validId, validId, 50);
    expect(result).toBe('BattleDone');
  });
});