import { Test, TestingModule } from '@nestjs/testing';
import { SearchRequestsController } from './search-requests.controller';

describe('SearchRequestsController', () => {
  let controller: SearchRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchRequestsController],
    }).compile();

    controller = module.get<SearchRequestsController>(SearchRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
