import { Test, TestingModule } from '@nestjs/testing';
import { GroupMessageController } from './group-message.controller';

describe('GroupMessageController', () => {
  let controller: GroupMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupMessageController],
    }).compile();

    controller = module.get<GroupMessageController>(GroupMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
