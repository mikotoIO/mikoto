export interface Message {
  id: string;
  content: string;
  timestamp: string;
  authorId: string | null;
  channelId: string;

  author: SimpleUser | null;
}

export interface SimpleUser {
  id: string;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
}