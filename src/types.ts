export interface Comment {
  id: string;
  postId: string;
  authorName: string;
  authorAvatar?: string;
  authorCompany?: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  companyId: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  comments: Comment[];
  likesCount?: number;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  category: string;
  city: string;
  description: string;
  whatsapp: string;
  address: string;
  mapQuery?: string;
  lat?: number;
  lng?: number;
  hours: string;
  keywords: string[];
  isOwner?: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: 'comment';
  postId: string;
  companyId: string;
  postImageUrl: string;
  authorName: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Auth0User {
  isAuthenticated: boolean;
  sub?: string;
  name: string;
  email: string;
  picture: string;
  companyId?: string;
}

export type ActiveTab = 'feed' | 'profile' | 'search' | 'explore-companies' | 'map';
