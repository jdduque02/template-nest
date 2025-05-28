import { Test, TestingModule } from '@nestjs/testing';
import { UserControllerController } from '../../src/controllers/user/user.controller.controller';
import { UserControllerService } from '../../src/services/user/user.controller.service';

describe('UserControllerController', () => {
  let controller: UserControllerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserControllerController],
      providers: [UserControllerService],
    }).compile();

    controller = module.get<UserControllerController>(UserControllerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
