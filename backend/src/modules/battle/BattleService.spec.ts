import { Test, TestingModule } from '@nestjs/testing';
import { BattleService } from './battle.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

describe('BattleService', () => {
  let service: BattleService;
  const mockBattleModel = {
    create: jest.fn(),
    find: jest.fn(),
  };

  // валидный 24-символьный hex для ObjectId
  const validId = '64f0e3ec68d502d31ae9fe2d';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattleService,
        { provide: getModelToken('Battle'), useValue: mockBattleModel },
      ],
    }).compile();

    service = module.get<BattleService>(BattleService);
  });

  it('should create a battle', async () => {
    mockBattleModel.create.mockResolvedValue('BattleCreated');
    const result = await service.createBattle(validId, validId, 50);
    expect(result).toBe('BattleCreated');
    expect(mockBattleModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ attackerId: expect.anything(), defenderId: expect.anything(), damage: 50 }),
    );
  });

  it('should get battles for user', async () => {
    mockBattleModel.find.mockResolvedValue(['Battle1', 'Battle2']);
    const result = await service.getBattlesForUser(validId);
    expect(result).toEqual(['Battle1', 'Battle2']);
    expect(mockBattleModel.find).toHaveBeenCalledWith({
      $or: [{ attackerId: expect.anything() }, { defenderId: expect.anything() }],
    });
  });
});