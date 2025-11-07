import { Test, TestingModule } from '@nestjs/testing';
import { BuildingsService } from './buildings.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

describe('BuildingsService', () => {
  let service: BuildingsService;
  let buildingModel: Model<any>;
  let resourcesModel: Model<any>;

  const mockBuildingModel = {
    create: jest.fn(),
    find: jest.fn(),
  };

  const mockResourcesModel = {
    findOne: jest.fn(),
  };

  const validId = '64f0e3ec68d502d31ae9fe2d'; // валидный ObjectId

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuildingsService,
        { provide: getModelToken('Building'), useValue: mockBuildingModel },
        { provide: getModelToken('Resources'), useValue: mockResourcesModel },
      ],
    }).compile();

    service = module.get<BuildingsService>(BuildingsService);
    buildingModel = module.get<Model<any>>(getModelToken('Building'));
    resourcesModel = module.get<Model<any>>(getModelToken('Resources'));
  });

  it('should create a building when resources are enough', async () => {
    mockResourcesModel.findOne.mockResolvedValue({ wood: 50, stone: 20, gold: 10, save: jest.fn() });
    mockBuildingModel.create.mockResolvedValue('BuildingCreated');

    const result = await service.createBuilding(validId, 'lumberMill');
    expect(result.building).toBe('BuildingCreated');
  });

  it('should throw error when resources are insufficient', async () => {
    mockResourcesModel.findOne.mockResolvedValue({ wood: 10, stone: 5, gold: 0, save: jest.fn() });

    await expect(service.createBuilding(validId, 'lumberMill')).rejects.toThrow(
      '⚠️ Недостаточно ресурсов для строительства',
    );
  });

  it('should throw error for invalid building type', async () => {
    mockResourcesModel.findOne.mockResolvedValue({ wood: 100, stone: 100, gold: 100, save: jest.fn() });

    await expect(service.createBuilding(validId, 'invalidBuilding')).rejects.toThrow('❌ Неверный тип здания');
  });
});