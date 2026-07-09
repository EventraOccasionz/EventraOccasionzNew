import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { dataService } from '../lib/dataService';
import { useEvent } from '../context/EventContext';
import { WeddingEvent } from '../types';
import { Plus, Calendar, MapPin, Users, Loader2 } from 'lucide-react';

export default function EventSelector() {
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveEvent } = useEvent();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const fetchedEvents = await dataService.getEvents();
        setEvents(fetchedEvents);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleSelectEvent = (event: WeddingEvent) => {
    setActiveEvent(event);
    navigate('/admin/dashboard');
  };

  if (loading) return <div className="min-h-screen bg-[#060504] flex items-center justify-center text-gold"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#060504] p-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-5xl text-cream mb-12">Select an Event</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <motion.button
              key={event.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleSelectEvent(event)}
              className="bg-[#121212] border border-white/5 p-8 rounded-2xl text-left hover:border-gold/50 transition-all"
            >
              <h2 className="text-xl text-gold font-bold mb-1">{event.couple_name}</h2>
              <p className="text-cream text-sm mb-4">{event.event_name}</p>
              <div className="space-y-2 text-xs text-text-secondary">
                <div className="flex items-center gap-2"><Calendar size={14} /> {event.event_date}</div>
                <div className="flex items-center gap-2"><MapPin size={14} /> {event.venue}</div>
              </div>
            </motion.button>
          ))}
          
          <button className="bg-white/5 border border-dashed border-gold/20 p-8 rounded-2xl flex flex-col items-center justify-center text-gold hover:border-gold transition-all">
            <Plus size={32} className="mb-4" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>
    </div>
  );
}
