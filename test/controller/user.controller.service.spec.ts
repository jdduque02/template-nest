import { Test, TestingModule } from '@nestjs/testing';
import { UserControllerService } from '../../src/services/user/user.controller.service';

describe('UserControllerService', () => {
  let service: UserControllerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserControllerService],
    }).compile();

    service = module.get<UserControllerService>(UserControllerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
