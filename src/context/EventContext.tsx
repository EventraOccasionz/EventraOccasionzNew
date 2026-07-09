import React, { createContext, useContext, useState, useEffect } from 'react';
import { WeddingEvent } from '../types';

interface EventContextType {
  activeEvent: WeddingEvent | null;
  setActiveEvent: (event: WeddingEvent | null) => void;
}

const EventContext = createContext<EventContextType>({
  activeEvent: null,
  setActiveEvent: () => {},
});

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEvent, setActiveEvent] = useState<WeddingEvent | null>(() => {
    const saved = localStorage.getItem('active_event');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (activeEvent) {
      localStorage.setItem('active_event', JSON.stringify(activeEvent));
    } else {
      localStorage.removeItem('active_event');
    }
  }, [activeEvent]);

  return (
    <EventContext.Provider value={{ activeEvent, setActiveEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => useContext(EventContext);
