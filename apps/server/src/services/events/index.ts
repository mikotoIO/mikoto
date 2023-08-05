import { MainService } from '..';
import { Member, Message } from '../schema';

export function buildPubSub(service: MainService, id: string) {
  return {
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

    deleteMessage(message: { messageId: string; channelId: string }) {
      service.messages.$(id).onDelete(message);
    },
  };
}
