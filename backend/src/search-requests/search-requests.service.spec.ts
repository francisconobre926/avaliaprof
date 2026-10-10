import { Test, TestingModule } from '@nestjs/testing';
import { SearchRequestsService } from './search-requests.service';

describe('SearchRequestsService', () => {
  let service: SearchRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchRequestsService],
    }).compile();

    service = module.get<SearchRequestsService>(SearchRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
