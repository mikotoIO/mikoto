import { z } from 'zod';

import { h } from './core';
import {
  ChannelService,
  DocumentService,
  MemberService,
  MessageService,
  RelationService,
  RoleService,
  SpaceService,
  UserService,
  VoiceService,
} from './services';

export * from './models';
export * from './services';

export const MainService = h
  .service({
    channels: ChannelService,
    documents: DocumentService,
    spaces: SpaceService,
    members: MemberService,
    users: UserService,
    messages: MessageService,
    roles: RoleService,
    voice: VoiceService,
    relations: RelationService,

    ping: h.fn({}, z.string()).do(async () => 'pong'),
  })
  .root();
