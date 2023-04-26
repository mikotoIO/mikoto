export {};
// export class ClientChannel implements Channel {
//   id: string;
//   name: string;
//   spaceId: string;
//   order: number;
//   lastUpdated: string | null;
//   type: string;
//
//   constructor(private client: MikotoClient, base: Channel, space: ClientSpace) {
//     this.id = base.id;
//     this.name = base.name;
//     this.spaceId = base.spaceId;
//     this.order = base.order;
//     this.lastUpdated = base.lastUpdated;
//     this.type = base.type;
//     client.channelWeakMap.set(this.id, this);
//   }
//
//   delete() {
//     return this.client.client.channels.delete(this.id);
//   }
//
//   simplify(): Channel {
//     return {
//       id: this.id,
//       name: this.name,
//       order: this.order,
//       spaceId: this.spaceId,
//       lastUpdated: this.lastUpdated,
//       type: this.type,
//     };
//   }
// }
