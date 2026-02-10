export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Profile {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string; 
}

export interface Asset {
  id: string;
  fileName: string; 
  fileType: string;
}

export interface PostAsset {
  id: string;
  asset: Asset;
}

export interface Post {
  id: string;
  caption: string;
  createdAt: string;
  profile: Profile; 
  assets: PostAsset[]; 
  likesCount?: number; 
  isLiked?: boolean;
}