import { h } from './core';
import { ChannelService } from './services/ChannelService';
import { SpaceService } from './services/SpaceService';

export * from './models';

export const MainService = h
  .service({
    channels: ChannelService,
    spaces: SpaceService,
  })
  .root();
