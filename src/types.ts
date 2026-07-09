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
  event_id?: string;
  name: string; // e.g. "Sharma Family"
  access_code: string; // e.g. "SHARMA2026"
  slug: string; // e.g. "sharma-family"
  max_guests: number;
  created_at: string;
  guest_image?: string; // Optional custom guest or family photo link (Base64 or URL)
  custom_greeting?: string; // Optional customized welcome narrative
  custom_title?: string; // Optional relationship title/caption (e.g. "Beloved Groom's Friends", "Our Honored Uncle")
  documents?: UploadedDocument[];
  rsvp_locked?: boolean; // Admin can lock RSVP editing
}

export interface RSVP {
  id: string;
  event_id?: string;
  family_id: string;
  guest_name: string;
  email: string;
  attending: boolean;
  total_guests: number;
  children_count: number;
  custom_notes?: string;
  dietary_requirements?: string;
  events: string[]; // e.g. ["Haldi", "Mehndi", "Wedding"]
  checked_in?: boolean;
  checked_in_at?: string; // Save check-in time for admin check-in
  created_at: string;
  updated_at?: string;
  
  // Premium RSVP Fields
  family_name?: string;
  primary_guest?: string;
  mobile_number?: string;
  adults_count?: number;
  family_members?: string[]; // Names of all family members
  arrival_method?: 'Flight' | 'Train' | 'Bus' | 'Car' | 'Other';
  pickup_required?: boolean;
  pickup_location?: string;
  arrival_date?: string;
  arrival_time?: string;
  flight_number?: string;
  train_number?: string;
  drop_required?: boolean;
  drop_location?: string;
  drop_date?: string;
  drop_time?: string;
  aadhaar_url?: string; // Aadhaar card upload
  special_requests?: string;
  functions_attending?: string[]; // Functions list they are attending
  rsvp_locked?: boolean; // Admin can lock individual RSVP
}

export interface TransportRequest {
  id: string;
  event_id?: string;
  family_id: string;
  mode: 'Car' | 'Bus' | 'Train' | 'Flight';
  need_cab: boolean;
  pickup_location?: string;
  arrival_time?: string;
  details?: string;
  created_at: string;
  updated_at?: string;
  
  // Premium Vehicle Fields published by Admin
  driver_name?: string;
  vehicle_number?: string;
  driver_contact?: string;
  pickup_time?: string;
}

export interface RoomBooking {
  id: string;
  event_id?: string;
  family_id: string;
  hotel_name?: string;
  room_number?: string;
  floor?: string; // Room floor
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
  phone_number?: string;
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

