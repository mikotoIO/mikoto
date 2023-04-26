import { channelService, messageService } from './ChannelService';
import { roleService } from './RoleService';
import { spaceService } from './SpaceService';
import { memberService, userService } from './UserService';
import { voiceService } from './VoiceService';
import { MainService } from './schema';
import { sophon } from './sophon';

export const mainService = sophon.create(MainService, {
  channels: channelService,
  spaces: spaceService,
  members: memberService,
  users: userService,
  messages: messageService,
  roles: roleService,
  voice: voiceService,
});
