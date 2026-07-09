import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { WeddingEvent } from '../types';

export const eventService = {
  async getEvents(): Promise<WeddingEvent[]> {
    const path = 'events';
    try {
      const q = query(collection(db, path), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      const items: WeddingEvent[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as WeddingEvent);
      });
      return items;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async addEvent(event: Partial<WeddingEvent>): Promise<WeddingEvent> {
    const path = 'events';
    const cleanData: WeddingEvent = {
      id: doc(collection(db, path)).id,
      couple_name: event.couple_name || '',
      event_name: event.event_name || '',
      event_date: event.event_date || '',
      venue: event.venue || '',
      status: event.status || 'Upcoming',
      created_at: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, path, cleanData.id), cleanData);
      return cleanData;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async deleteEvent(id: string): Promise<void> {
    const path = `events/${id}`;
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  }
};
