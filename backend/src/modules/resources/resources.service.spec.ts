import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let model: Model<any>;

  const validUserId = new Types.ObjectId().toHexString();

  const mockResource = {
    userId: validUserId,
    wood: 100,
    stone: 50,
    gold: 30,
    save: jest.fn(),
  };

  const mockModel = {
    findOne: jest.fn().mockResolvedValue(mockResource),
    findOneAndUpdate: jest.fn().mockResolvedValue(mockResource),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: getModelToken('Resources'), useValue: mockModel },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
    model = module.get<Model<any>>(getModelToken('Resources'));
  });

  it('should get resources for user', async () => {
    const resources = await service.getResources(validUserId);
    expect(resources).toEqual(mockResource);
    expect(model.findOne).toHaveBeenCalledWith({ userId: expect.any(Types.ObjectId) });
  });

  it('should add resources for user', async () => {
    const updated = await service.addResource(validUserId, 'wood', 10);
    expect(updated).toEqual(mockResource);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: expect.any(Types.ObjectId) },
      { $inc: { wood: 10 } },
      { new: true, upsert: true },
    );
  });
});