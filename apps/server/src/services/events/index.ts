import { MainService } from '..';
import { Member } from '../schema';

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
  };
}
