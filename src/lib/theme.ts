import { StoreCategory, StoreTypeConfig } from '../types';

export const STORE_THEMES: Record<StoreCategory, StoreTypeConfig> = {
  fashion: {
    id: 'fashion',
    name: 'موضة وإلكترونيات وفخامة',
    description: 'أسود فخم، رمادي أنيق، مع لمسات برتقالية دافئة',
    primary: '#0f172a', // deep slate black
    primaryLight: '#334155',
    primaryDark: '#020617',
    accent: '#f97316', // sharp bright orange
    accentHover: '#ea580c',
    badgeBg: '#ffedd5',
    badgeText: '#9a3412',
  },
  food: {
    id: 'food',
    name: 'مأكولات ومطاعم',
    description: 'درجات أحمر وبرتقالي شهية ومشرقة',
    primary: '#b91c1c', // rich culinary crimson
    primaryLight: '#dc2626',
    primaryDark: '#7f1d1d',
    accent: '#f59e0b', // warm golden amber
    accentHover: '#d97706',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
  },
  health: {
    id: 'health',
    name: 'منتجات صحية وعضوية',
    description: 'أخضر طبيعي وألوان ترابية مهدئة',
    primary: '#047857', // emerald green
    primaryLight: '#059669',
    primaryDark: '#064e3b',
    accent: '#10b981', // vivid mint green
    accentHover: '#059669',
    badgeBg: '#d1fae5',
    badgeText: '#065f46',
  },
  medical: {
    id: 'medical',
    name: 'مستلزمات طبية ومالية',
    description: 'أزرق كحلي موثوق ودقيق',
    primary: '#1e3a8a', // deep corporate navy
    primaryLight: '#2563eb',
    primaryDark: '#172554',
    accent: '#0284c7', // vibrant cyan/sky
    accentHover: '#0369a1',
    badgeBg: '#e0f2fe',
    badgeText: '#075985',
  },
  beauty: {
    id: 'beauty',
    name: 'تجميل وعناية بالبشرة',
    description: 'وردي باستيل وموف أنيق وجذاب',
    primary: '#86198f', // elegant plum/fuchsia
    primaryLight: '#a21caf',
    primaryDark: '#581c87',
    accent: '#ec4899', // bright rose pink
    accentHover: '#db2777',
    badgeBg: '#fce7f3',
    badgeText: '#9d174d',
  },
};
