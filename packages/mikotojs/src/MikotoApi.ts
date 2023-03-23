import axios, { AxiosInstance } from 'axios';

import { Channel, Member, Message, Space } from './models';

export class MikotoApi {
  public axios: AxiosInstance;

  constructor(url: string) {
    this.axios = axios.create({
      baseURL: url,
    });
  }

  // // region Space
  // async getSpace(id: string) {
  //   return await this.axios.get<Space>(`/spaces/${id}`).then((x) => x.data);
  // }
  // async getSpaces() {
  //   return await this.axios.get<Space[]>('/spaces').then((x) => x.data);
  // }
  // async createSpace(name: string) {
  //   return await this.axios
  //     .post<Space>('/spaces', {
  //       name,
  //     })
  //     .then((x) => x.data);
  // }
  // async deleteSpace(id: string) {
  //   await this.axios.delete<Space>(`/spaces/${id}`);
  // }
  //
  // async joinSpace(id: string) {
  //   await this.axios.post<Space>(`/join/${id}`);
  // }
  // async leaveSpace(id: string) {
  //   await this.axios.post<Space>(`/leave/${id}`);
  // }
  // // endregion
  //
  // // region member
  // async getMember(spaceId: string, userId: string) {
  //   return await this.axios
  //     .get<Member>(`/spaces/${spaceId}/members/${userId}`)
  //     .then((x) => x.data);
  // }
  //
  // async updateMember(
  //   spaceId: string,
  //   userId: string,
  //   options: { roleIds: string[] },
  // ) {
  //   return await this.axios
  //     .patch(`/spaces/${spaceId}/members/${userId}`, options)
  //     .then((x) => x.data);
  // }
  // // endregion
  //
  // // region Channel
  // async getChannels(spaceId: string) {
  //   return await this.axios
  //     .get<Channel[]>(`/spaces/${spaceId}/channels`)
  //     .then((x) => x.data);
  // }
  //
  // async getChannel(channelId: string) {
  //   return await this.axios
  //     .get<Channel>(`/channels/${channelId}`)
  //     .then((x) => x.data);
  // }
  //
  // async createChannel(
  //   spaceId: string,
  //   options: {
  //     name: string;
  //     type: string;
  //   },
  // ) {
  //   return await this.axios
  //     .post<Channel>(`/channels`, {
  //       spaceId,
  //       name: options.name,
  //       type: options.type,
  //     })
  //     .then((x) => x.data);
  // }
  //
  // async deleteChannel(channelId: string) {
  //   await this.axios.delete<Channel>(`/channels/${channelId}`);
  // }
  //
  // async moveChannel(channelId: string, order: number) {
  //   await this.axios.post(`/channels/${channelId}/move`, {
  //     order,
  //   });
  // }
  // // endregion
  //
  // // region Message
  // async getMessages(
  //   channelId: string,
  //   params: { cursor?: string; limit?: number } = {},
  // ) {
  //   return await this.axios
  //     .get<Message[]>(`/channels/${channelId}/messages`, {
  //       params,
  //     })
  //     .then((x) => x.data);
  // }
  //
  // async sendMessage(channelId: string, content: string) {
  //   return await this.axios
  //     .post(`/channels/${channelId}/messages`, {
  //       content,
  //     })
  //     .then((x) => x.data);
  // }
  //
  // async deleteMessage(channelId: string, messageId: string) {
  //   return await this.axios
  //     .delete(`/channels/${channelId}/messages/${messageId}`)
  //     .then((x) => x.data);
  // }
  // // endregion
}
