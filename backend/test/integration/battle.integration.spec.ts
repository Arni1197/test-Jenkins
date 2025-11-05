// test/integration/battle.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BattleService } from '../../src/modules/battle/battle.service';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

describe('BattleService Integration', () => {
  let service: BattleService;
  let battleModel: Model<any>;

  const validId = new Types.ObjectId().toHexString();

  const mockBattleModel = {
    create: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattleService,
        { provide: getModelToken('Battle'), useValue: mockBattleModel },
      ],
    }).compile();

    service = module.get<BattleService>(BattleService);
    battleModel = module.get<Model<any>>(getModelToken('Battle'));
  });

  it('should create a battle', async () => {
    mockBattleModel.create.mockResolvedValue({ attackerId: validId, defenderId: validId, damage: 50 });
    const result = await service.createBattle(validId, validId, 50);
    expect(result).toEqual({ attackerId: validId, defenderId: validId, damage: 50 });
  });

  it('should get battles for user', async () => {
    mockBattleModel.find.mockResolvedValue([{ attackerId: validId }]);
    const result = await service.getBattlesForUser(validId);
    expect(result).toEqual([{ attackerId: validId }]);
  });
});