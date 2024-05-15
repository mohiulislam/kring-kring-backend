import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeChatGateway } from './realtime-chat.gateway';

describe('RealtimeChatGateway', () => {
  let gateway: RealtimeChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealtimeChatGateway],
    }).compile();

    gateway = module.get<RealtimeChatGateway>(RealtimeChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
