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
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  authorId: string | null;
  channelId: string;

  author?: User;
}

export interface User {
  name: string;
  avatar: string;
}

export interface SimpleUser {
  id: string;
  name: string;
  user: User;
}

export interface Channel {
  id: string;
  spaceId: string;
  name: string;
  order: number;
}

export interface Role {}
