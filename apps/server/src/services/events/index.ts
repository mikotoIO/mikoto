import { MainService } from '..';
import { RedisPubSub } from '../../functions/pubsub';
import { Member, Channel, Message, Role, Space, User } from '../schema';

export function buildPubSub(
  ps: RedisPubSub<any>,
  service: MainService,
  id: string,
) {
  return {
    createSpace(space: Space) {
      ps.sub(`space:${space.id}`);
      service.spaces.$(id).onCreate(space);
    },
    deleteSpace(space: Space) {
      ps.unsub(`space:${space.id}`);
      service.spaces.$(id).onDelete(space);
    },

    createChannel(channel: Channel) {
      service.channels.$(id).onCreate(channel);
    },

    updateChannel(channel: Channel) {
      service.channels.$(id).onUpdate(channel);
    },

    deleteChannel(channel: Channel) {
      service.channels.$(id).onDelete(channel);
    },

    createMember(member: Member) {
      service.members.$(id).onCreate(member);
    },
    updateMember(member: Member) {
      service.members.$(id).onUpdate(member);
    },
    deleteMember(member: Member) {
      service.members.$(id).onDelete(member);
    },

    createMessage(message: Message) {
      service.messages.$(id).onCreate(message);
    },

    updateMessage(message: Message) {
      service.messages.$(id).onUpdate(message);
    },

    deleteMessage(message: { messageId: string; channelId: string }) {
      service.messages.$(id).onDelete(message);
    },

    createRole(role: Role) {
      service.roles.$(id).onCreate(role);
    },

    updateRole(role: Role) {
      service.roles.$(id).onUpdate(role);
    },

    deleteRole(role: Role) {
      service.roles.$(id).onDelete(role);
    },

    updateUser(user: User) {
      service.users.$(id).onUpdate(user);
    },
  };
}
