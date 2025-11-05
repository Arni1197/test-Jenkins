import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { BattleService } from '../battle/battle.service';
import { BuildingsService } from '../buildings/buildings.service';
import { ResourcesService } from '../resources/resources.service';

describe('GameService', () => {
  let service: GameService;

  const mockResourcesService = {
    getResources: jest.fn(),
    addResource: jest.fn(),
  };
  const mockBuildingsService = { createBuilding: jest.fn() };
  const mockBattleService = { createBattle: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: ResourcesService, useValue: mockResourcesService },
        { provide: BuildingsService, useValue: mockBuildingsService },
        { provide: BattleService, useValue: mockBattleService },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should build building when enough resources', async () => {
    mockResourcesService.getResources.mockResolvedValue({ wood: 20 });
    mockResourcesService.addResource.mockResolvedValue({});
    mockBuildingsService.createBuilding.mockResolvedValue('BuildingCreated');

    const result = await service.buildBuilding('user1', 'lumberMill');
    expect(result).toBe('BuildingCreated');
    expect(mockResourcesService.addResource).toHaveBeenCalledWith('user1', 'wood', -10);
  });

  it('should throw error if resources insufficient', async () => {
    mockResourcesService.getResources.mockResolvedValue({ wood: 5 });
    await expect(service.buildBuilding('user1', 'lumberMill')).rejects.toThrow('Not enough resources');
  });

  it('should create a battle', async () => {
    mockBattleService.createBattle.mockResolvedValue('BattleCreated');
    const result = await service.attackUser('attacker', 'defender', 50);
    expect(result).toBe('BattleCreated');
    expect(mockBattleService.createBattle).toHaveBeenCalledWith('attacker', 'defender', 50);
  });
});