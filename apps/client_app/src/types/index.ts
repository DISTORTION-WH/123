// apps/client_app/src/types/index.ts

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Profile {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
}

export interface Asset {
  id: string;
  url: string;
  mimeType: string;
}

// --- Chat Types ---

export enum ChatType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
}

export interface ChatParticipant {
  id: string;
  profileId: string;
  role: 'ADMIN' | 'MEMBER';
  profile: Profile;
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  participants: ChatParticipant[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  profileId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  isEdited: boolean;
  profile: Profile;
  assets?: { id: string; asset: Asset }[];
  reactions?: MessageReaction[];
  replyTo?: Message;
  sharedPost?: Post; // Если есть тип Post
}

export interface MessageReaction {
  id: string;
  reaction: string;
  profileId: string;
}

export interface Post {
  id: string;
  // ... поля поста, если нужны
  caption?: string;
  assets: { id: string; asset: Asset }[];
}