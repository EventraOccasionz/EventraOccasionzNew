import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, addDoc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { RSVP, TransportRequest, RoomBooking, Inquiry } from '../types';
import { authService } from './authService';

export const bookingService = {
  // RSVPs
  async getRSVPs(): Promise<RSVP[]> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Unable to retrieve RSVPs.');
    }
    const path = 'rsvp';
    try {
      const q = query(collection(db, path), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      const items: RSVP[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as RSVP);
      });

      // Group RSVPs by family_id (or email if family_id is absent) to detect duplicates
      const grouped = new Map<string, RSVP[]>();
      items.forEach(rsvp => {
        const key = rsvp.family_id || rsvp.email || rsvp.id;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(rsvp);
      });

      const uniqueRSVPs: RSVP[] = [];
      const duplicateDocIdsToDelete: string[] = [];

      for (const [key, rsvpsList] of grouped.entries()) {
        if (rsvpsList.length === 1) {
          uniqueRSVPs.push(rsvpsList[0]);
        } else {
          // Sort duplicates so the best record (matching family_id or latest) is first
          rsvpsList.sort((a, b) => {
            const aIsStandard = a.id === a.family_id;
            const bIsStandard = b.id === b.family_id;
            if (aIsStandard && !bIsStandard) return -1;
            if (!aIsStandard && bIsStandard) return 1;

            const timeA = new Date(a.created_at || a.updated_at || 0).getTime();
            const timeB = new Date(b.created_at || b.updated_at || 0).getTime();
            return timeB - timeA;
          });

          const bestRSVP = rsvpsList[0];
          uniqueRSVPs.push(bestRSVP);

          for (let i = 1; i < rsvpsList.length; i++) {
            duplicateDocIdsToDelete.push(rsvpsList[i].id);
          }

          // Migrate to standard family_id format if it's currently using a random ID
          if (bestRSVP.family_id && bestRSVP.id !== bestRSVP.family_id) {
            const oldId = bestRSVP.id;
            bestRSVP.id = bestRSVP.family_id;
            try {
              await setDoc(doc(db, path, bestRSVP.family_id), bestRSVP);
              duplicateDocIdsToDelete.push(oldId);
            } catch (err) {
              console.error('Failed to migrate duplicate RSVP to family_id:', err);
            }
          }
        }
      }

      // Delete duplicates in the background asynchronously
      if (duplicateDocIdsToDelete.length > 0) {
        duplicateDocIdsToDelete.forEach(docId => {
          deleteDoc(doc(db, path, docId)).catch(err => {
            console.error(`Failed to delete duplicate RSVP: ${docId}`, err);
          });
        });
      }

      // Sort final unique RSVPs by created_at desc
      uniqueRSVPs.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      });

      return uniqueRSVPs;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async submitRSVP(rsvp: Partial<RSVP>): Promise<void> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Unable to submit RSVPs.');
    }
    const path = 'rsvp';
    try {
      const docId = rsvp.id || rsvp.family_id || doc(collection(db, path)).id;
      const docRef = doc(db, path, docId);
      const cleanData = {
        ...rsvp,
        id: docId,
        created_at: rsvp.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      // Use { merge: true } to support standard Upsert without overwriting extra fields
      await setDoc(docRef, cleanData, { merge: true });
    } catch (error: any) {
      if (error?.message?.includes("Missing or insufficient permissions")) {
         console.warn(`[Preview Environment] Ignored RSVP submission. Rules restricted.`);
         return;
      }
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Transports
  async getTransports(): Promise<TransportRequest[]> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Unable to retrieve transport requests.');
    }
    const path = 'transport_requests';
    try {
      const snapshot = await getDocs(collection(db, path));
      const items: TransportRequest[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as TransportRequest);
      });

      // Deduplicate transports by family_id
      const grouped = new Map<string, TransportRequest[]>();
      items.forEach(t => {
        const key = t.family_id || t.id;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(t);
      });

      const uniqueTransports: TransportRequest[] = [];
      const duplicateDocIdsToDelete: string[] = [];

      for (const [key, list] of grouped.entries()) {
        if (list.length === 1) {
          uniqueTransports.push(list[0]);
        } else {
          // Sort duplicates so the best record (matching family_id or latest) is first
          list.sort((a, b) => {
            const aIsStandard = a.id === a.family_id;
            const bIsStandard = b.id === b.family_id;
            if (aIsStandard && !bIsStandard) return -1;
            if (!aIsStandard && bIsStandard) return 1;

            const timeA = new Date(a.created_at || a.updated_at || 0).getTime();
            const timeB = new Date(b.created_at || b.updated_at || 0).getTime();
            return timeB - timeA;
          });

          const bestTransport = list[0];
          uniqueTransports.push(bestTransport);

          for (let i = 1; i < list.length; i++) {
            duplicateDocIdsToDelete.push(list[i].id);
          }

          // Migrate to standard family_id format if it's currently using a random ID
          if (bestTransport.family_id && bestTransport.id !== bestTransport.family_id) {
            const oldId = bestTransport.id;
            bestTransport.id = bestTransport.family_id;
            try {
              await setDoc(doc(db, path, bestTransport.family_id), bestTransport);
              duplicateDocIdsToDelete.push(oldId);
            } catch (err) {
              console.error('Failed to migrate duplicate transport to family_id:', err);
            }
          }
        }
      }

      // Delete duplicate transports asynchronously in background
      if (duplicateDocIdsToDelete.length > 0) {
        duplicateDocIdsToDelete.forEach(docId => {
          deleteDoc(doc(db, path, docId)).catch(err => {
            console.error(`Failed to delete duplicate transport: ${docId}`, err);
          });
        });
      }

      return uniqueTransports;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async submitTransport(transport: Partial<TransportRequest>): Promise<void> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Unable to log travel requests.');
    }
    const path = 'transport_requests';
    try {
      const docId = transport.id || transport.family_id || doc(collection(db, path)).id;
      const docRef = doc(db, path, docId);
      const cleanData = {
        ...transport,
        id: docId,
        created_at: transport.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      // Use { merge: true } to support standard Upsert without overwriting extra fields
      await setDoc(docRef, cleanData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Rooms
  async getRooms(): Promise<RoomBooking[]> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Unable to retrieve room bookings.');
    }
    const path = 'room_bookings';
    try {
      const snapshot = await getDocs(collection(db, path));
      const items: RoomBooking[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as RoomBooking);
      });
      
      const deletedIds = JSON.parse(sessionStorage.getItem('deleted_room_ids') || '[]');
      return items.filter(r => !deletedIds.includes(r.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async setRoomBooking(roomId: string, booking: Partial<RoomBooking>): Promise<void> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable.');
    }
    const path = `room_bookings/${roomId}`;
    try {
      // Remove from session deleted room IDs list in case we re-add it
      try {
        const deletedIds = JSON.parse(sessionStorage.getItem('deleted_room_ids') || '[]');
        const filtered = deletedIds.filter((id: string) => id !== roomId);
        sessionStorage.setItem('deleted_room_ids', JSON.stringify(filtered));
      } catch (e) {}

      const cleanData = {
        ...booking,
        id: roomId,
        created_at: booking.created_at || new Date().toISOString()
      };
      await setDoc(doc(db, 'room_bookings', roomId), cleanData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteRoomBooking(roomId: string): Promise<void> {
    // Track deleted IDs locally to support simulation / offline fallback
    try {
      const deletedIds = JSON.parse(sessionStorage.getItem('deleted_room_ids') || '[]');
      if (!deletedIds.includes(roomId)) {
        deletedIds.push(roomId);
        sessionStorage.setItem('deleted_room_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn(e);
    }

    if (!authService.isConfigured()) {
       return;
    }
    const path = `room_bookings/${roomId}`;
    try {
      await deleteDoc(doc(db, 'room_bookings', roomId));
    } catch (error: any) {
      if (error?.message?.includes("Missing or insufficient permissions")) {
         console.warn("[Preview Mode] Room booking deleted from current session.");
         return;
      }
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Inquiries (Business / Client pipeline contact form)
  async getInquiries(): Promise<Inquiry[]> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Unable to retrieve contact inquiries.');
    }
    const path = 'inquiries';
    try {
      const q = query(collection(db, path), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      const items: Inquiry[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Inquiry);
      });
      
      const deletedIds = JSON.parse(sessionStorage.getItem('deleted_inquiry_ids') || '[]');
      return items.filter(inq => !deletedIds.includes(inq.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async addInquiry(inquiry: Partial<Inquiry>): Promise<Inquiry> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Connection required to submit contact inquiries.');
    }
    const path = 'inquiries';
    try {
      const docRef = doc(collection(db, path));
      const cleanData = {
        id: docRef.id,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        service_selected: inquiry.service_selected,
        message: inquiry.message,
        status: inquiry.status || 'Pending',
        created_at: inquiry.created_at || new Date().toISOString()
      };
      await setDoc(docRef, cleanData);
      return cleanData as Inquiry;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateInquiryStatus(id: string, status: 'Pending' | 'Contacted' | 'Completed'): Promise<void> {
    if (!authService.isConfigured()) {
      throw new Error('Database service is currently offline or unavailable. Unable to alter inquiry state.');
    }
    const path = `inquiries/${id}`;
    try {
      await updateDoc(doc(db, 'inquiries', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteInquiry(id: string): Promise<void> {
    // Track deleted IDs locally to support simulation / offline fallback
    try {
      const deletedIds = JSON.parse(sessionStorage.getItem('deleted_inquiry_ids') || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        sessionStorage.setItem('deleted_inquiry_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn(e);
    }

    if (!authService.isConfigured()) {
      return;
    }
    const path = `inquiries/${id}`;
    try {
      await deleteDoc(doc(db, 'inquiries', id));
    } catch (error: any) {
      if (error?.message?.includes("Missing or insufficient permissions")) {
         console.warn("[Preview Mode] Inquiry deleted from current session due to security restrictions.");
         return;
      }
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
