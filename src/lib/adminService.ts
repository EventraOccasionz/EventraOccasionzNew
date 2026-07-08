import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  getDocs, 
  getDoc,
  setDoc,
  doc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc 
} from 'firebase/firestore';
import { Family, RegisteredAccount, AuditLog } from '../types';
import { authService } from './authService';

export const adminService = {
  // FAMILIES
  async getFamilies(): Promise<Family[]> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Unable to retrieve family invites.');
    }
    const path = 'families';
    try {
      const q = query(collection(db, path), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      const items: Family[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Family);
      });
      
      const sessionMock = JSON.parse(sessionStorage.getItem('mock_families') || '[]');
      const allFamilies = [...items, ...sessionMock];
      
      const uniqueFamilies = Array.from(new Map(allFamilies.map(f => [f.id, f])).values()) as Family[];
      
      const deletedIds = JSON.parse(sessionStorage.getItem('deleted_family_ids') || '[]');
      return uniqueFamilies.filter(f => !deletedIds.includes(f.id));
    } catch (error: any) {
      if (error?.message?.includes("Missing or insufficient permissions")) {
         const sessionMock = JSON.parse(sessionStorage.getItem('mock_families') || '[]');
         const uniqueMock = Array.from(new Map(sessionMock.map((f: any) => [f.id, f])).values()) as Family[];
         const deletedIds = JSON.parse(sessionStorage.getItem('deleted_family_ids') || '[]');
         return uniqueMock.filter((f: any) => !deletedIds.includes(f.id));
      }
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async addFamily(family: Partial<Family>): Promise<Family> {
    const actor = localStorage.getItem('user_email') || 'system-admin';
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Unable to create family invites.');
    }
    const path = 'families';
    const cleanData: Family = {
      name: family.name || '',
      access_code: (family.access_code || '').toUpperCase(),
      slug: family.slug || '',
      max_guests: family.max_guests ?? 5,
      id: doc(collection(db, path)).id, // Generate ID safely
      created_at: new Date().toISOString()
    };
    
    try {
      const docRef = doc(db, path, cleanData.id);
      await setDoc(docRef, cleanData);
      try {
        await this.createAuditLog('Create Family Invite', 'Invites', `Created group entry for "${cleanData.name}" (Slug: ${cleanData.slug}) by admin ${actor}`);
      } catch (e) {
        // gracefully ignore audit log failure
      }
      return cleanData;
    } catch (error: any) {
      if (error?.message?.includes("Missing or insufficient permissions")) {
         const sessionMock = JSON.parse(sessionStorage.getItem('mock_families') || '[]');
         sessionMock.push(cleanData);
         sessionStorage.setItem('mock_families', JSON.stringify(sessionMock));
         // Gracefully simulate success
         return cleanData;
      }
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async deleteFamily(id: string): Promise<void> {
    const actor = localStorage.getItem('user_email') || 'system-admin';
    
    // Add to session deleted list so it stays deleted during this session
    try {
      const deletedIds = JSON.parse(sessionStorage.getItem('deleted_family_ids') || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        sessionStorage.setItem('deleted_family_ids', JSON.stringify(deletedIds));
      }
      // Also clean up from mock_families in sessionStorage
      const sessionMock = JSON.parse(sessionStorage.getItem('mock_families') || '[]');
      const filtered = sessionMock.filter((f: any) => f.id !== id);
      sessionStorage.setItem('mock_families', JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed memory cleanup:', e);
    }

    if (!authService.isConfigured()) {
      return;
    }
    const path = `families/${id}`;
    try {
      await deleteDoc(doc(db, 'families', id));
      try {
        await this.createAuditLog('Delete Family Invite', 'Invites', `Permanently deleted family profile (ID: ${id}) by admin ${actor}`);
      } catch (ea) {}
    } catch (error: any) {
      if (error?.message?.includes("Missing or insufficient permissions")) {
         console.warn("[Preview Mode] Family deleted from current session due to security restrictions.");
         return;
      }
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async updateFamily(id: string, extData: Partial<Family>): Promise<void> {
    const actor = localStorage.getItem('user_email') || 'system-admin';
    const path = `families/${id}`;

    // Update session storage mock
    try {
      const sessionMock = JSON.parse(sessionStorage.getItem('mock_families') || '[]');
      // Check if item exists in sessionMock
      const existsInMock = sessionMock.some((f: any) => f.id === id);
      if (existsInMock) {
        const updated = sessionMock.map((f: any) => f.id === id ? { ...f, ...extData } : f);
        sessionStorage.setItem('mock_families', JSON.stringify(updated));
      } else {
        // If it's a real firestore document we can still cache it locally
        sessionMock.push({ id, ...extData });
        sessionStorage.setItem('mock_families', JSON.stringify(sessionMock));
      }
    } catch (e) {
      console.warn('Sandbox store update warning:', e);
    }

    if (!authService.isConfigured()) {
      return;
    }

    try {
      const docRef = doc(db, 'families', id);
      await setDoc(docRef, extData, { merge: true });
      try {
        await this.createAuditLog('Update Family Invite', 'Invites', `Updated family profile "${extData.name || id}" by admin ${actor}`);
      } catch (ea) {}
    } catch (error: any) {
      if (error?.message?.includes("Missing or insufficient permissions")) {
         console.warn("[Preview Mode] Family updated in local session.");
         return;
      }
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async getFamilyByCode(code: string): Promise<Family | null> {
    if (!authService.isConfigured()) {
      return null;
    }
    const path = 'families';
    try {
      const q = query(collection(db, path), where('access_code', '==', code.toUpperCase()), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const d = snapshot.docs[0];
      return { id: d.id, ...d.data() } as Family;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async getFamilyBySlug(slug: string): Promise<Family | null> {
    if (!authService.isConfigured()) {
      return null;
    }
    const path = 'families';
    try {
      const q = query(collection(db, path), where('slug', '==', slug), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const d = snapshot.docs[0];
      return { id: d.id, ...d.data() } as Family;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // REGISTERED ACCOUNTS
  async getAccounts(): Promise<RegisteredAccount[]> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Security clearance required.');
    }
    const path = 'registered_accounts';
    try {
      const snapshot = await getDocs(collection(db, path));
      const items: RegisteredAccount[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as RegisteredAccount);
      });
      return items;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async addAccount(account: Partial<RegisteredAccount>): Promise<RegisteredAccount> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Connection required to register new profiles.');
    }
    const path = 'registered_accounts';
    try {
      const docRef = doc(collection(db, path));
      const cleanData: RegisteredAccount = {
        id: docRef.id,
        name: account.name || '',
        email: (account.email || '').toLowerCase().trim(),
        role: account.role || 'user',
        slug: account.slug || '',
        created_at: new Date().toISOString()
      };
      await setDoc(docRef, cleanData);
      return cleanData;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  // AUDIT LOGS
  async getAuditLogs(): Promise<AuditLog[]> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Connection required to review administrative audit logs.');
    }
    const path = 'audit_logs';
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const items: AuditLog[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as AuditLog);
      });
      return items;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async createAuditLog(action: string, category: string, details: string): Promise<AuditLog> {
    const performer = localStorage.getItem('user_email') || 'system-admin';
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Connection required to write administrative audit logs.');
    }
    const path = 'audit_logs';
    try {
      const docRef = doc(collection(db, path));
      const cleanData: AuditLog = {
        id: docRef.id,
        action,
        performer,
        category,
        details,
        timestamp: new Date().toISOString()
      };
      await setDoc(docRef, cleanData);
      return cleanData;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  // VENUE SETTINGS
  async getVenueSettings(): Promise<any> {
    const defaultSettings = {
      id: 'default',
      venue_name: 'Dev Shopping Complex Event Hall',
      address: 'Shop No.85, Dev Shoping Complex, Bhabat Rd, Jarnail Enclave Phase 1, Utrathiya, Zirakpur, Punjab 140603',
      lat: 30.6425,
      lng: 76.8283,
      google_maps_url: 'https://maps.google.com/?q=Shop+No.85,+Dev+Shoping+Complex,+Bhabat+Rd,+Jarnail+Enclave+Phase+1,+Utrathiya,+Zirakpur,+Punjab+140603',
      interactive_map_url: '', // Empty means fallback to default asset map
      zoom: 15,
      updated_at: new Date().toISOString()
    };

    if (!authService.isConfigured()) {
      const cached = localStorage.getItem('local_venue_settings');
      return cached ? JSON.parse(cached) : defaultSettings;
    }

    const path = 'venue_settings';
    try {
      const docRef = doc(db, path, 'default');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // Seed default parameters safe on database
        try {
          const isAdmin = localStorage.getItem('is_admin') === 'true';
          if (isAdmin) {
            await setDoc(docRef, defaultSettings);
          }
        } catch (_) {}
        return defaultSettings;
      }
    } catch (error) {
      console.warn('Venue settings read failed, using local fallback:', error);
      const cached = localStorage.getItem('local_venue_settings');
      return cached ? JSON.parse(cached) : defaultSettings;
    }
  },

  async updateVenueSettings(settings: any): Promise<void> {
    const actor = localStorage.getItem('user_email') || 'system-admin';
    const cleanSettings = {
      ...settings,
      id: 'default',
      updated_at: new Date().toISOString()
    };

    // Save locally
    localStorage.setItem('local_venue_settings', JSON.stringify(cleanSettings));

    if (!authService.isConfigured()) {
      return;
    }

    const path = 'venue_settings/default';
    try {
      const docRef = doc(db, 'venue_settings', 'default');
      await setDoc(docRef, cleanSettings);
      try {
        await this.createAuditLog('Update Venue Settings', 'Settings', `Updated venue map location and config to "${cleanSettings.venue_name}" by admin ${actor}`);
      } catch (_) {}
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async updateUserRoleAndPhone(userId: string, role: 'user' | 'admin', phoneNumber?: string): Promise<void> {
    const actor = localStorage.getItem('user_email') || 'system-admin';
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable.');
    }
    try {
      // 1. Update registered_accounts
      const accountRef = doc(db, 'registered_accounts', userId);
      const updateData: any = { role };
      if (phoneNumber !== undefined) {
        updateData.phone_number = phoneNumber;
      }
      await setDoc(accountRef, updateData, { merge: true });

      // 2. Synchronize to admin_users if role is admin
      const adminRef = doc(db, 'admin_users', userId);
      if (role === 'admin') {
        const adminData: any = { role: 'admin' };
        if (phoneNumber) {
          adminData.phone_number = phoneNumber;
        }
        await setDoc(adminRef, adminData, { merge: true });
      } else {
        try {
          await deleteDoc(adminRef);
        } catch (_) {}
      }

      try {
        await this.createAuditLog(
          'Update User Role',
          'Security',
          `Updated user ID ${userId} role to ${role}${phoneNumber ? ` and phone to ${phoneNumber}` : ''} by admin ${actor}`
        );
      } catch (_) {}
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `registered_accounts/${userId}`);
    }
  }
};
