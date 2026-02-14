export interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
}

export interface Profile {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  birthDate?: string;
  deleted?: boolean;
  isFollowing?: boolean;
}

export interface Asset {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  url?: string;
}

export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group',
}

export interface ChatParticipant {
  id: string;
  profileId: string;
  role: 'admin' | 'member';
  profile: Profile;
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  description?: string;
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
  isDeleted?: boolean;
  profile: Profile;
  assets?: { id: string; asset: Asset }[];
  reactions?: MessageReaction[];
  replyTo?: Message;
  sharedPost?: Post;
}

export interface MessageReaction {
  id: string;
  reaction: string;
  profileId: string;
}

export interface Post {
  id: string;
  content: string;
  isArchived?: boolean;
  assets: { id: string; orderIndex: number; asset: Asset }[];
  profile: Profile;
  createdAt: string;
  updatedAt?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  profileId: string;
  parentId?: string;
  createdAt: string;
  profile: Profile;
  replies?: Comment[];
  likesCount?: number;
  isLiked?: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'subscription' | 'system';
  title: string;
  message: string;
  targetUserId: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ProfileFollow {
  id: string;
  followerId: string;
  followingId: string;
  accepted: boolean | null;
  follower: Profile;
  following: Profile;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
