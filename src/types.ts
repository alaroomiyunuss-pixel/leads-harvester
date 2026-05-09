export type LeadStatus =
  | 'new'
  | 'design'
  | 'review'
  | 'sent_client'
  | 'client_edits'
  | 'paid'
  | 'done';

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string; bg: string }[] = [
  { value: 'new',          label: 'جديد',              color: '#93c5fd', bg: 'rgba(59,130,246,0.15)' },
  { value: 'design',       label: 'التصميم',           color: '#c4b5fd', bg: 'rgba(139,92,246,0.15)' },
  { value: 'review',       label: 'المراجعة',          color: '#fcd34d', bg: 'rgba(245,158,11,0.15)' },
  { value: 'sent_client',  label: 'مرسل للعميل',       color: '#67e8f9', bg: 'rgba(6,182,212,0.15)' },
  { value: 'client_edits', label: 'تعديلات العميل',    color: '#fb923c', bg: 'rgba(249,115,22,0.15)' },
  { value: 'paid',         label: 'تم الدفع ✓',        color: '#86efac', bg: 'rgba(34,197,94,0.2)'  },
  { value: 'done',         label: 'تم الانتهاء ✓✓',   color: '#4ade80', bg: 'rgba(34,197,94,0.3)'  },
];

export const TEAM_MEMBERS = ['يونس', 'أحمد', 'سارة', 'محمد'];

export interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  reviews?: string[];
  category?: string;
  website?: string;
  googleMapsUrl?: string;
  status: LeadStatus;
  assignee?: string;
  notes?: string;
  deliveryUrl?: string;   // رابط الموقع/التطبيق المُسلَّم للعميل
  timestamp: Date;
  placeId?: string;
  country?: string;
  city?: string;
}

export interface AppSettings {
  googleApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
}

export interface SearchParams {
  query: string;
  countryCode: string;
  countryAr: string;
  cityAr: string;
  cityEn: string;
  radius: number;
  maxResults: number;
  cityLat?: number;
  cityLng?: number;
}

export interface Stats {
  total: number;
  contacted: number;
  replied: number;
  successRate: number;
}
