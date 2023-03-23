export interface AppError {
  name: string;
  message: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface Space {
  id: string;
  name: string;
  channels: Channel[];
  roles: Role[];
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  authorId: string | null;
  channelId: string;

  author: User | null;
}

export interface Member {
  id: string;
  spaceId: string;
  user: User;
  roleIds: string[];
}

export interface User {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Channel {
  id: string;
  spaceId: string;
  name: string;
  order: number;
  lastUpdated: string | null;
  type: string;
}

export interface Role {
  id: string;
  name: string;
  color: string | undefined;
  permissions: string;
  position: number;
}

export interface VoiceResponse {
  url: string;
  token: string;
}
