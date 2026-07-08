export type EventType = 'Wedding' | 'Birthday' | 'Corporate' | 'Anniversary' | 'Baby Shower' | 'Engagement' | 'Other';

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
}

export interface Family {
  id: string;
  name: string; // e.g. "Sharma Family"
  access_code: string; // e.g. "SHARMA2026"
  slug: string; // e.g. "sharma-family"
  max_guests: number;
  created_at: string;
  guest_image?: string; // Optional custom guest or family photo link (Base64 or URL)
  custom_greeting?: string; // Optional customized welcome narrative
  custom_title?: string; // Optional relationship title/caption (e.g. "Beloved Groom's Friends", "Our Honored Uncle")
  documents?: UploadedDocument[];
}

export interface RSVP {
  id: string;
  family_id: string;
  guest_name: string;
  email: string;
  attending: boolean;
  total_guests: number;
  children_count: number;
  custom_notes?: string;
  dietary_requirements?: string;
  events: string[]; // e.g. ["Haldi", "Mehndi", "Wedding"]
  created_at: string;
  updated_at?: string;
}

export interface TransportRequest {
  id: string;
  family_id: string;
  mode: 'Car' | 'Bus' | 'Train' | 'Flight';
  need_cab: boolean;
  pickup_location?: string;
  arrival_time?: string;
  details?: string;
  created_at: string;
  updated_at?: string;
}

export interface RoomBooking {
  id: string;
  family_id: string;
  hotel_name?: string;
  room_number?: string;
  check_in?: string;
  check_out?: string;
  status: 'Pending' | 'Confirmed' | 'Checked-in' | 'Checked-out';
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export interface RegisteredAccount {
  id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  passcode?: string;
  slug?: string;
  created_at?: string;
}

export type InquiryStatus = 'Pending' | 'Contacted' | 'Completed';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  service_selected: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
}

export interface Service {
  id: string;
  cat: string;
  ico: string;
  name: string;
  desc: string;
  feats: string[];
  price?: string;
  order_index: number;
  visible: boolean;
  created_at?: string;
}

export interface GalleryItem {
  id: string;
  cat: string;
  lbl: string;
  bg?: string; // fallback CSS background
  image_url?: string; // Firebase Storage public url
  order_index: number;
  visible: boolean;
  created_at?: string;
}

export interface AdminSettings {
  key: string;
  value: any;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  performer: string;
  category: string;
  details: string;
}

