import { h } from './core';
import { ChannelService, MemberService, SpaceService } from './services';

export * from './models';
export * from './services';

export const MainService = h
  .service({
    channels: ChannelService,
    spaces: SpaceService,
    members: MemberService,
  })
  .root();
