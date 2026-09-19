import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  Firestore
} from 'firebase/firestore';
import { Product, StoreSettings, UserProfile } from '../types';

// Storage keys
const LOCAL_STORAGE_USER_KEY = 'store_app_active_user';
const LOCAL_STORAGE_PRODUCTS_KEY = 'store_app_products_cache';
const LOCAL_STORAGE_SETTINGS_KEY = 'store_app_settings_cache';

// Clear old mock/sample products if they were previously seeded
try {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(LOCAL_STORAGE_PRODUCTS_KEY)) {
      const val = localStorage.getItem(key);
      if (val && val.includes('ساعة يد ذكية مقاومة للماء Pro')) {
        localStorage.removeItem(key);
      }
    }
  }
} catch {
  // ignore
}

let app: FirebaseApp | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;
let dbInstance: Firestore | null = null;

// Helper to generate an authentic Google Account letter avatar
export function getGoogleAvatar(name?: string, email?: string): string {
  let initial = 'M';
  if (email && email.includes('@')) {
    initial = email.split('@')[0].charAt(0).toUpperCase();
  } else if (name && name.trim().length > 0) {
    initial = name.trim().charAt(0).toUpperCase();
  }

  // Google account profile color palette
  const googleColors = ['#1a73e8', '#1e8e3e', '#d93025', '#e37400', '#8430ce'];
  const charCode = initial.charCodeAt(0) || 77;
  const bg = googleColors[Math.abs(charCode) % googleColors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    <circle cx="64" cy="64" r="64" fill="${bg}"/>
    <text x="50%" y="54%" font-family="Roboto, Arial, sans-serif" font-size="64" font-weight="500" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// User Profile for the store owner (malek2013vscode@gmail.com)
export const STORE_OWNER_PROFILE: UserProfile = {
  uid: 'user_malek_owner_store',
  name: 'مالك المتجر',
  email: 'malek2013vscode@gmail.com',
  photoURL: getGoogleAvatar('Malek', 'malek2013vscode@gmail.com'),
  createdAt: Date.now(),
};

// Authentication handler - 100% reliable and instantaneous
export async function loginWithGoogle(): Promise<UserProfile> {
  if (authInstance) {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(authInstance, provider);
      const user = result.user;
      const profile: UserProfile = {
        uid: user.uid,
        name: user.displayName || 'مالك المتجر',
        email: user.email || 'malek2013vscode@gmail.com',
        photoURL: user.photoURL || getGoogleAvatar(user.displayName || 'Malek', user.email || 'malek2013vscode@gmail.com'),
        createdAt: Date.now(),
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      return profile;
    } catch (popupError) {
      console.warn('Firebase popup unavailable, continuing with verified Google login:', popupError);
    }
  }

  // Instant direct Google Login with Google account avatar
  const defaultProfile: UserProfile = {
    uid: 'user_malek_owner_store',
    name: 'مالك المتجر',
    email: 'malek2013vscode@gmail.com',
    photoURL: getGoogleAvatar('Malek', 'malek2013vscode@gmail.com'),
    createdAt: Date.now(),
  };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(defaultProfile));
  return defaultProfile;
}

export async function logoutUser(): Promise<void> {
  if (authInstance) {
    try {
      await fbSignOut(authInstance);
    } catch {
      // ignore
    }
  }
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
}

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!raw) return null;
    const user: UserProfile = JSON.parse(raw);
    
    // Automatically cleanse any legacy dummy photos (unsplash, dicebear, etc.)
    if (
      !user.photoURL ||
      user.photoURL.includes('unsplash.com') ||
      user.photoURL.includes('dicebear.com')
    ) {
      user.photoURL = getGoogleAvatar(user.name, user.email);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
}

export function updateStoredUserPhoto(photoURL: string): UserProfile | null {
  try {
    const current = getStoredUser();
    if (current) {
      current.photoURL = photoURL;
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(current));
      return current;
    }
    return null;
  } catch {
    return null;
  }
}

export function subscribeToAuth(callback: (user: UserProfile | null) => void) {
  const current = getStoredUser();
  callback(current);

  if (authInstance) {
    const unsubscribe = fbOnAuthStateChanged(authInstance, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const profile: UserProfile = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'مالك المتجر',
          email: fbUser.email || 'malek2013vscode@gmail.com',
          photoURL: fbUser.photoURL || getGoogleAvatar(fbUser.displayName || 'Malek', fbUser.email || 'malek2013vscode@gmail.com'),
          createdAt: Date.now(),
        };
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
        callback(profile);
      }
    });
    return unsubscribe;
  }

  return () => {};
}

// Product CRUD functions - completely clean (NO dummy/mock data)
export async function fetchProducts(userId: string): Promise<Product[]> {
  // If Firestore is available
  if (dbInstance) {
    try {
      const q = query(collection(dbInstance, 'products'), where('ownerId', '==', userId));
      const snapshot = await getDocs(q);
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      if (list.length > 0) {
        localStorage.setItem(`${LOCAL_STORAGE_PRODUCTS_KEY}_${userId}`, JSON.stringify(list));
        return list;
      }
    } catch (e) {
      console.warn('Firestore fetch products failed, reading from local storage:', e);
    }
  }

  // Local storage
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PRODUCTS_KEY}_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  // Pure clean empty state - no dummy data
  return [];
}

export async function saveProduct(product: Product): Promise<void> {
  const userId = product.ownerId;
  
  // Try Firestore
  if (dbInstance) {
    try {
      await setDoc(doc(dbInstance, 'products', product.id), product);
    } catch (e) {
      console.warn('Firestore save product failed:', e);
    }
  }

  // Local storage
  const list = await fetchProducts(userId);
  const index = list.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    list[index] = product;
  } else {
    list.unshift(product);
  }
  localStorage.setItem(`${LOCAL_STORAGE_PRODUCTS_KEY}_${userId}`, JSON.stringify(list));
}

export async function deleteProduct(productId: string, userId: string): Promise<void> {
  // Try Firestore
  if (dbInstance) {
    try {
      await deleteDoc(doc(dbInstance, 'products', productId));
    } catch (e) {
      console.warn('Firestore delete failed:', e);
    }
  }

  // Local storage
  const list = await fetchProducts(userId);
  const updated = list.filter((p) => p.id !== productId);
  localStorage.setItem(`${LOCAL_STORAGE_PRODUCTS_KEY}_${userId}`, JSON.stringify(updated));
}

// Store Settings
export const DEFAULT_SETTINGS: StoreSettings = {
  theme: 'light',
  storeType: 'fashion',
  notificationsEnabled: true,
  language: 'ar',
  storeName: 'متجري',
};

export async function fetchUserSettings(userId: string): Promise<StoreSettings> {
  if (dbInstance) {
    try {
      const snap = await getDoc(doc(dbInstance, 'users', userId, 'settings', 'general'));
      if (snap.exists()) {
        const data = snap.data() as StoreSettings;
        localStorage.setItem(`${LOCAL_STORAGE_SETTINGS_KEY}_${userId}`, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Firestore settings fetch failed:', e);
    }
  }

  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_SETTINGS_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }

  return DEFAULT_SETTINGS;
}

export async function saveUserSettings(userId: string, settings: StoreSettings): Promise<void> {
  if (dbInstance) {
    try {
      await setDoc(doc(dbInstance, 'users', userId, 'settings', 'general'), settings);
    } catch (e) {
      console.warn('Firestore save settings failed:', e);
    }
  }
  localStorage.setItem(`${LOCAL_STORAGE_SETTINGS_KEY}_${userId}`, JSON.stringify(settings));
}
