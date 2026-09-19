export type StoreCategory = 'fashion' | 'food' | 'health' | 'medical' | 'beauty';

export interface StoreTypeConfig {
  id: StoreCategory;
  name: string;
  description: string;
  primary: string; // 30% secondary/brand color
  primaryLight: string;
  primaryDark: string;
  accent: string; // 10% action color
  accentHover: string;
  badgeBg: string;
  badgeText: string;
}

export interface Product {
  id: string;
  ownerId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category?: string;
  description?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  createdAt: number;
}

export interface StoreSettings {
  theme: 'light' | 'dark';
  storeType: StoreCategory;
  notificationsEnabled: boolean;
  language: 'ar';
  storeName: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
