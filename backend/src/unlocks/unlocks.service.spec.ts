import { Test, TestingModule } from '@nestjs/testing';
import { UnlocksService } from './unlocks.service';

describe('UnlocksService', () => {
  let service: UnlocksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnlocksService],
    }).compile();

    service = module.get<UnlocksService>(UnlocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
