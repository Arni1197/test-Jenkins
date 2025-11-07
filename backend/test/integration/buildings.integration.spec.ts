// test/integration/buildings.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BuildingsService } from '../../src/modules/buildings/buildings.service';
import { ResourcesService } from '../../src/modules/resources/resources.service';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

describe('BuildingsService Integration', () => {
  let service: BuildingsService;
  const validId = new Types.ObjectId().toHexString();

  const mockBuildingModel = { create: jest.fn() };
  const mockResourcesService = { getResources: jest.fn(), addResource: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuildingsService,
        { provide: getModelToken('Building'), useValue: mockBuildingModel },
        { provide: ResourcesService, useValue: mockResourcesService },
      ],
    }).compile();

    service = module.get<BuildingsService>(BuildingsService);
  });

  it('should create a building when resources are enough', async () => {
    mockResourcesService.getResources.mockResolvedValue({ wood: 50, stone: 50, gold: 50 });
    mockBuildingModel.create.mockResolvedValue({ userId: validId, type: 'lumberMill' });

    const result = await service.createBuilding(validId, 'lumberMill');
    expect(result).toEqual({ userId: validId, type: 'lumberMill' });
  });
});