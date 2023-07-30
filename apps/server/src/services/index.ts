import { ChannelService, MessageService } from './ChannelService';
import { RelationService } from './RelationService';
import { RoleService } from './RoleService';
import { SpaceService } from './SpaceService';
import { MemberService, UserService } from './UserService';
import { VoiceService } from './VoiceService';
import { AbstractMainService } from './schema';

export class MainService extends AbstractMainService {
  spaces = new SpaceService(this.sophonCore);
  channels = new ChannelService(this.sophonCore);
  members = new MemberService(this.sophonCore);
  users = new UserService(this.sophonCore);
  messages = new MessageService(this.sophonCore);
  roles = new RoleService(this.sophonCore);
  voice = new VoiceService(this.sophonCore);
  relations = new RelationService(this.sophonCore);
}
