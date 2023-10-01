import { Channel, Member, Message, Role, Space, User } from '.';

export const emitterModel = {
  createSpace: Space,
  updateSpace: Space,
  deleteSpace: Space,

  createChannel: Channel,
  updateChannel: Channel,
  deleteChannel: Channel,

  createMember: Member,
  updateMember: Member,
  deleteMember: Member,

  createMessage: Message,
  updateMessage: Message,
  deleteMessage: Message,

  createRole: Role,
  updateRole: Role,
  deleteRole: Role,

  updateUser: User,
};
