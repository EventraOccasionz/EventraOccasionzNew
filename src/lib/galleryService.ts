import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { GalleryItem, Service } from '../types';
import { authService } from './authService';

const MOCK_SERVICES: Service[] = [
  { id: 's1', cat: 'wedding', ico: '💍', name: 'Wedding Planning', desc: 'From intimate ceremonies to grand celebrations, we orchestrate every detail of your perfect day.', feats: ['Full-day event coordination', 'Venue & vendor management', 'Bespoke décor conceptualisation', 'Bridal suite setup', 'Guest & RSVP management', 'Post-event breakdown'], order_index: 0, visible: true },
  { id: 's2', cat: 'birthday', ico: '🎂', name: 'Birthday Decoration', desc: 'Transform any space into a vibrant, personalised celebration tailored to the guest of honour.', feats: ['Custom theme design', 'Balloon installations', 'Cake table & dessert styling', 'Photo booth setup', 'Party favour curation', 'On-site coordination'], order_index: 1, visible: true },
  { id: 's3', cat: 'decor', ico: '🎈', name: 'Balloon Decoration', desc: 'Artistic balloon sculptures and installations that elevate any event space to something extraordinary.', feats: ['Organic balloon arches', 'Column & pillar décor', 'Floral balloon centrepieces', 'Ceiling cloud installations', 'Custom shapes & colour palettes', 'Outdoor-safe balloons'], order_index: 2, visible: true },
  { id: 's4', cat: 'wedding', ico: '📸', name: 'Photography & Film', desc: 'Timeless imagery capturing every emotion, every laugh, every fleeting moment of your special day.', feats: ['Full event coverage', 'Candid & portraiture photography', 'Edited digital gallery', 'Premium print packages', 'Cinematic videography', 'Same-day preview reel'], order_index: 3, visible: true },
  { id: 's5', cat: 'corporate', ico: '🎵', name: 'DJ Services', desc: 'Premium sound experiences curated to your event mood — from elegant ambience to full dance-floor energy.', feats: ['Professional DJ console', 'Premium line-array sound', 'Customised playlists', 'Live mixing & mashups', 'LED ambient uplighting', 'MC services on request'], order_index: 4, visible: true },
  { id: 's6', cat: 'corporate', ico: '🍽️', name: 'Catering', desc: 'Exquisite menus crafted by celebrated chefs, bringing culinary artistry to your celebration table.', feats: ['Custom multi-course menu design', 'Multi-cuisine live stations', 'Artisan dessert spreads', 'Dietary accommodation', 'Beverage menu curation', 'White-glove service staff'], order_index: 5, visible: true },
  { id: 's7', cat: 'decor', ico: '🌸', name: 'Venue Decoration', desc: 'We transform bare venues into breathtaking atmospheres with florals, draping, lighting, and bespoke décor.', feats: ['Floral centrepieces & arches', 'Premium ceiling & wall draping', 'Cinematic lighting design', 'Grand entrance installations', 'Stage & backdrop design', 'Furniture & linen styling'], order_index: 6, visible: true },
  { id: 's8', cat: 'corporate', ico: '🏛️', name: 'Corporate Events', desc: 'Professional event management for product launches, galas, conferences, and brand activations.', feats: ['Brand-aligned event design', 'AV & technical production', 'Guest registration & badges', 'Press & media coordination', 'Post-event analytics', 'Virtual & hybrid options'], order_index: 7, visible: true }
];

const MOCK_GALLERY: GalleryItem[] = [
  { id: 'g1', cat: 'wedding', lbl: 'Royal Wedding Ceremony', bg: 'linear-gradient(135deg,#2a1c10,#1a1008)', order_index: 0, visible: true },
  { id: 'g2', cat: 'birthday', lbl: 'Luxe Birthday Bash', bg: 'linear-gradient(135deg,#1e1428,#0f0b18)', order_index: 1, visible: true },
  { id: 'g3', cat: 'corporate', lbl: 'Executive Gala Night', bg: 'linear-gradient(135deg,#0e1822,#081015)', order_index: 2, visible: true },
  { id: 'g4', cat: 'wedding', lbl: 'Floral Arch Ceremony', bg: 'linear-gradient(135deg,#201a0c,#14100a)', order_index: 3, visible: true },
  { id: 'g5', cat: 'birthday', lbl: 'Balloon Dreamland', bg: 'linear-gradient(135deg,#0f1e14,#0a1510)', order_index: 4, visible: true },
  { id: 'g6', cat: 'corporate', lbl: 'Brand Launch Soirée', bg: 'linear-gradient(135deg,#1e0f22,#160a18)', order_index: 5, visible: true },
  { id: 'g7', cat: 'wedding', lbl: 'Candlelit Reception', bg: 'linear-gradient(135deg,#251808,#1a1005)', order_index: 6, visible: true },
  { id: 'g8', cat: 'birthday', lbl: 'Pastel Garden Party', bg: 'linear-gradient(135deg,#0d1c24,#081218)', order_index: 7, visible: true },
  { id: 'g9', cat: 'corporate', lbl: 'Innovation Summit 2025', bg: 'linear-gradient(135deg,#1a1520,#100c14)', order_index: 8, visible: true }
];

export const galleryService = {
  // SERVICES
  async getServices(): Promise<Service[]> {
    const deletedIds = JSON.parse(sessionStorage.getItem('deleted_service_ids') || '[]');
    if (authService.isConfigured()) {
      const path = 'services';
      try {
        const q = query(collection(db, path), orderBy('order_index', 'asc'));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const items: Service[] = [];
          snapshot.forEach((d) => {
            items.push({ id: d.id, ...d.data() } as Service);
          });
          return items.filter(s => !deletedIds.includes(s.id));
        }
        
        // Auto seed if DB holds no records (Only allowed for admin users)
        const currentUser = authService.getCurrentUser();
        const isAdminUser = currentUser?.role === 'admin' || localStorage.getItem('is_admin') === 'true';

        if (isAdminUser) {
          console.log('Seeding default services in Firestore...');
          for (const s of MOCK_SERVICES) {
            const docRef = doc(db, path, s.id);
            const { id, ...cleanS } = s;
            await setDoc(docRef, { ...cleanS, id: s.id, created_at: new Date().toISOString() });
          }
          
          const seededSnapshot = await getDocs(q);
          const items: Service[] = [];
          seededSnapshot.forEach((d) => {
            items.push({ id: d.id, ...d.data() } as Service);
          });
          return items.filter(s => !deletedIds.includes(s.id));
        } else {
          console.info('Firestore services collection is empty. Falling back to local services mock.');
          return MOCK_SERVICES.filter(s => !deletedIds.includes(s.id));
        }
      } catch (err) {
        console.warn('Firestore services fetch or seed failed - falling back to local mocks:', err);
      }
    }
    return MOCK_SERVICES.filter(s => !deletedIds.includes(s.id));
  },

  async addService(service: Partial<Service>): Promise<Service> {
    if (!authService.isConfigured()) {
      throw new Error('Database not configured: Unable to add service items.');
    }
    const path = 'services';
    try {
      const docRef = doc(collection(db, path));
      const cleanData: Service = {
        cat: service.cat || '',
        ico: service.ico || '✨',
        name: service.name || '',
        desc: service.desc || '',
        feats: service.feats || [],
        price: service.price,
        order_index: service.order_index ?? 99,
        visible: service.visible ?? true,
        id: docRef.id,
        created_at: new Date().toISOString()
      };
      await setDoc(docRef, cleanData);
      return cleanData;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateService(id: string, service: Partial<Service>): Promise<void> {
    if (!authService.isConfigured()) {
      throw new Error('Database not configured: Unable to update service items.');
    }
    const path = `services/${id}`;
    try {
      await updateDoc(doc(db, 'services', id), service);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteService(id: string): Promise<void> {
    // Track deleted IDs locally to support simulation / offline fallback
    try {
      const deletedIds = JSON.parse(sessionStorage.getItem('deleted_service_ids') || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        sessionStorage.setItem('deleted_service_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn(e);
    }

    if (!authService.isConfigured()) {
      return;
    }
    const path = `services/${id}`;
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (error: any) {
      if (error?.message?.includes("Missing or insufficient permissions")) {
         console.warn("[Preview Mode] Service deleted from current session.");
         return;
      }
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // GALLERY
  async getGallery(): Promise<GalleryItem[]> {
    const deletedIds = JSON.parse(sessionStorage.getItem('deleted_gallery_item_ids') || '[]');
    if (authService.isConfigured()) {
      const path = 'gallery_items';
      try {
        const q = query(collection(db, path), orderBy('order_index', 'asc'));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const items: GalleryItem[] = [];
          snapshot.forEach((d) => {
            items.push({ id: d.id, ...d.data() } as GalleryItem);
          });
          return items.filter(g => !deletedIds.includes(g.id));
        }
        
        // Auto seed if DB holds no records (Only allowed for admin users)
        const currentUser = authService.getCurrentUser();
        const isAdminUser = currentUser?.role === 'admin' || localStorage.getItem('is_admin') === 'true';

        if (isAdminUser) {
          console.log('Seeding default gallery_items in Firestore...');
          for (const g of MOCK_GALLERY) {
            const docRef = doc(db, path, g.id);
            const { id, ...cleanG } = g;
            await setDoc(docRef, { ...cleanG, id: g.id, created_at: new Date().toISOString() });
          }
          
          const seededSnapshot = await getDocs(q);
          const items: GalleryItem[] = [];
          seededSnapshot.forEach((d) => {
            items.push({ id: d.id, ...d.data() } as GalleryItem);
          });
          return items.filter(g => !deletedIds.includes(g.id));
        } else {
          console.info('Firestore gallery collection is empty. Falling back to local gallery mock.');
          return MOCK_GALLERY.filter(g => !deletedIds.includes(g.id));
        }
      } catch (err) {
        console.warn('Firestore gallery fetch or seed failed - falling back to local mocks:', err);
      }
    }
    return MOCK_GALLERY.filter(g => !deletedIds.includes(g.id));
  },

  async addGalleryItem(g: Partial<GalleryItem>): Promise<GalleryItem> {
    if (!authService.isConfigured()) {
      throw new Error('Database not configured: Unable to add gallery items.');
    }
    const path = 'gallery_items';
    try {
      const docRef = doc(collection(db, path));
      const cleanData: GalleryItem = {
        cat: g.cat || '',
        lbl: g.lbl || '',
        bg: g.bg,
        image_url: g.image_url,
        order_index: g.order_index ?? 99,
        visible: g.visible ?? true,
        id: docRef.id,
        created_at: new Date().toISOString()
      };
      await setDoc(docRef, cleanData);
      return cleanData;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateGalleryItem(id: string, g: Partial<GalleryItem>): Promise<void> {
    if (!authService.isConfigured()) {
      throw new Error('Database not configured: Unable to update gallery items.');
    }
    const path = `gallery_items/${id}`;
    try {
      await updateDoc(doc(db, 'gallery_items', id), g);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteGalleryItem(id: string): Promise<void> {
    // Track deleted IDs locally to support simulation / offline fallback
    try {
      const deletedIds = JSON.parse(sessionStorage.getItem('deleted_gallery_item_ids') || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        sessionStorage.setItem('deleted_gallery_item_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn(e);
    }

    if (!authService.isConfigured()) {
      return;
    }
    const path = `gallery_items/${id}`;
    try {
      await deleteDoc(doc(db, 'gallery_items', id));
    } catch (error: any) {
      if (error?.message?.includes("Missing or insufficient permissions")) {
         console.warn("[Preview Mode] Gallery item deleted from current session due to security restrictions.");
         return;
      }
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
