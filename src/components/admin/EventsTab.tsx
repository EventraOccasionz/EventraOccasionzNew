import React, { useState } from 'react';
import { 
  Search, Plus, Calendar, MapPin, Heart, ShieldAlert, Loader2, 
  CheckCircle2, Archive, Play, Trash2, X, Users, Sparkles, ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import EventDetailsDashboard from './EventDetailsDashboard';

export interface EventData {
  id: string;
  name: string;
  bride: string;
  groom: string;
  date: string;
  venue: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Archived' | 'Active';
  created_at: string;
  
  // New Event Creation Fields
  familyName?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  city?: string;
  state?: string;
  clientName?: string;
  clientMobile?: string;
  clientEmail?: string;
  expectedGuests?: number;
  hotelName?: string;
}

interface EventsTabProps {
  events: EventData[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onCreateEvent: (event: Omit<EventData, 'id' | 'created_at'>) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateEventStatus: (id: string, status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Archived' | 'Active') => void;
  loading?: boolean;
}

export default function EventsTab({
  events,
  selectedEventId,
  onSelectEvent,
  onCreateEvent,
  onDeleteEvent,
  onUpdateEventStatus,
  loading = false
}: EventsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Ongoing' | 'Completed' | 'Archived'>('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeEvent, setActiveEvent] = useState<EventData | null>(null);

  // Expanded Event form state
  const [name, setName] = useState('');
  const [bride, setBride] = useState('');
  const [groom, setGroom] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [type, setType] = useState('Wedding');
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [expectedGuests, setExpectedGuests] = useState<number>(100);
  const [hotelName, setHotelName] = useState('');
  const [status, setStatus] = useState<'Upcoming' | 'Ongoing' | 'Completed' | 'Archived'>('Upcoming');

  // Mini Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: null, message: '' });
    }, 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !bride || !groom || !date || !venue) {
      showToast('error', 'Please fill in all mandatory fields.');
      return;
    }

    onCreateEvent({ 
      name, 
      bride, 
      groom, 
      date, 
      venue, 
      status,
      familyName,
      type,
      startDate: startDate || date,
      endDate: endDate || date,
      city,
      state,
      clientName,
      clientMobile,
      clientEmail,
      expectedGuests: Number(expectedGuests),
      hotelName
    });

    // Reset Form
    setName('');
    setBride('');
    setGroom('');
    setFamilyName('');
    setType('Wedding');
    setDate('');
    setStartDate('');
    setEndDate('');
    setVenue('');
    setCity('');
    setState('');
    setClientName('');
    setClientMobile('');
    setClientEmail('');
    setExpectedGuests(100);
    setHotelName('');
    setStatus('Upcoming');
    setShowCreateForm(false);
  };

  // Advanced Search filter
  const filteredEvents = events.filter(ev => {
    const matchesSearch = 
      ev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.bride.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.groom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.clientMobile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status normalization ('Active' displays as 'Ongoing' to maintain full compatibility)
    const normalizedStatus = ev.status === 'Active' ? 'Ongoing' : ev.status;
    const matchesStatus = statusFilter === 'All' || normalizedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calendar calculations
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  // If activeEvent details dashboard is open, render it
  if (activeEvent) {
    return (
      <EventDetailsDashboard 
        event={activeEvent} 
        onBack={() => setActiveEvent(null)}
        showToast={showToast}
      />
    );
  }

  return (
    <div id="events-management-panel" className="space-y-8 relative">
      {/* Toast Feedback */}
      {feedback.message && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[6000] px-6 py-4 rounded-xl shadow-2xl border transition-all ${
          feedback.type === 'error' 
            ? 'bg-red-950/90 border-red-500/30 text-red-100' 
            : 'bg-gold/10 border-gold/40 text-gold'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Upper Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Search events by Couple, Client, Mobile, or ID..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-gold/10 pl-12 pr-6 py-3 text-sm outline-none focus:border-gold transition-colors text-cream rounded-lg"
          />
        </div>
        
        <button 
          onClick={() => setShowCreateForm(true)} 
          className="px-6 py-3 bg-gold text-dark text-xs uppercase tracking-widest font-bold flex items-center gap-2 rounded-lg hover:brightness-110 active:scale-95 transition-all self-start md:self-auto"
        >
          <Plus size={16} /> Create Event
        </button>
      </div>

      {/* Create Event Modal Form */}
      {showCreateForm && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#141414] border border-gold/20 rounded-2xl p-6 sm:p-8 relative shadow-2xl my-8">
            <button 
              onClick={() => setShowCreateForm(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-white p-1"
            >
              <X size={20} />
            </button>
            
            <h3 className="font-serif text-2xl text-gold mb-1 flex items-center gap-2">
              <Sparkles className="text-gold" size={20} /> Create New Event
            </h3>
            <p className="text-xs text-text-secondary mb-6">Register a comprehensive multi-module event workspace. All guest, transport, and room databases partition automatically.</p>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Event Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Event Name *</label>
                  <input
                    type="text" required
                    placeholder="e.g. Royal Rajput Wedding"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Event Type *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Baby Shower">Baby Shower</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Couple Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Bride Name *</label>
                  <input
                    type="text" required
                    placeholder="Bride Name"
                    value={bride}
                    onChange={e => setBride(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Groom Name *</label>
                  <input
                    type="text" required
                    placeholder="Groom Name"
                    value={groom}
                    onChange={e => setGroom(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Family Name *</label>
                  <input
                    type="text" required
                    placeholder="e.g. Shekhawat Family"
                    value={familyName}
                    onChange={e => setFamilyName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              {/* Dates & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Event Date *</label>
                  <input
                    type="date" required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Expected Guests</label>
                  <input
                    type="number"
                    value={expectedGuests}
                    onChange={e => setExpectedGuests(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Venue Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Venue Name / Location *</label>
                  <input
                    type="text" required
                    placeholder="e.g. Umaid Bhawan Palace"
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Primary Hotel</label>
                  <input
                    type="text"
                    placeholder="Primary Hotel Name"
                    value={hotelName}
                    onChange={e => setHotelName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Jodhpur"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajasthan"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Client Name</label>
                  <input
                    type="text"
                    placeholder="Client Contact Name"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Client Mobile</label>
                  <input
                    type="tel"
                    placeholder="Mobile contact"
                    value={clientMobile}
                    onChange={e => setClientMobile(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Client Email</label>
                  <input
                    type="email"
                    placeholder="Email contact"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5 border-t border-white/5 pt-4">
                <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Event Status Setting</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing (Active)</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-xs uppercase tracking-wider text-text-secondary hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gold text-dark font-bold rounded-xl text-xs uppercase tracking-wider hover:brightness-110 transition-all"
                >
                  Register Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Filter Sub-Bar */}
      <div className="flex gap-2 border-b border-white/5 pb-4 overflow-x-auto select-none no-scrollbar">
        {([ 'All', 'Upcoming', 'Ongoing', 'Completed', 'Archived' ] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 text-xs uppercase tracking-wider rounded-xl transition-all border ${
              statusFilter === tab 
                ? 'bg-gold/15 border-gold text-gold font-bold' 
                : 'border-transparent text-text-secondary hover:text-cream hover:bg-white/5'
            }`}
          >
            {tab === 'Ongoing' ? 'Ongoing (Active)' : tab} Events
          </button>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-gold" size={40} />
          <p className="text-sm text-text-secondary uppercase tracking-widest font-thin">Refreshing Event Database...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/5 rounded-2xl p-8">
          <ShieldAlert className="mx-auto text-gold/50 mb-3" size={32} />
          <h4 className="text-cream font-serif text-lg mb-1">No Matching Events Found</h4>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">Try refining your search filter or status selection, or register a new event workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(ev => {
            const isSelected = selectedEventId === ev.id;
            const displayStatus = ev.status === 'Active' ? 'Ongoing' : ev.status;
            return (
              <div 
                key={ev.id} 
                className={`group relative bg-[#141414] border rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between h-[230px] ${
                  isSelected 
                    ? 'border-gold bg-gold/[0.02] shadow-lg shadow-gold/5' 
                    : 'border-white/5 hover:border-gold/30 hover:bg-white/[0.01]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono font-bold ${
                      displayStatus === 'Ongoing' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : displayStatus === 'Upcoming'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : displayStatus === 'Completed'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-white/10 text-text-secondary border border-white/5'
                    }`}>
                      {displayStatus}
                    </span>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextStatus = ev.status === 'Upcoming' ? 'Active' : ev.status === 'Active' ? 'Completed' : 'Archived';
                          onUpdateEventStatus(ev.id, nextStatus as any);
                        }}
                        title="Rotate Status"
                        className="p-1 text-text-secondary hover:text-gold transition-colors"
                      >
                        {ev.status === 'Upcoming' ? <Play size={14} /> : ev.status === 'Active' ? <CheckCircle2 size={14} /> : <Archive size={14} />}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Permanently delete event workspace "${ev.name}"?`)) {
                            onDeleteEvent(ev.id);
                          }
                        }}
                        title="Delete Workspace"
                        className="p-1 text-text-secondary hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-serif text-lg text-cream mb-1 leading-snug group-hover:text-gold transition-colors">{ev.name}</h3>
                  
                  <div className="flex items-center gap-1 text-xs text-gold/80 mb-4 font-serif">
                    <Heart size={12} className="text-[#ff6b8b]" />
                    <span>{ev.bride}</span>
                    <span className="text-white/40 font-sans mx-1">&amp;</span>
                    <span>{ev.groom}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1 text-[11px] text-text-secondary font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-white/30" />
                      <span>{ev.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-white/30" />
                      <span className="truncate max-w-[220px]">{ev.venue}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onSelectEvent(ev.id);
                      }}
                      className={`py-2 px-3 rounded-xl font-mono text-[9px] uppercase tracking-widest font-bold transition-all border ${
                        isSelected
                          ? 'bg-gold/25 text-gold border-gold/40'
                          : 'bg-white/5 hover:bg-white/10 text-text-secondary border-white/10'
                      }`}
                    >
                      {isSelected ? 'Active Link' : 'Select Link'}
                    </button>
                    <button
                      onClick={() => {
                        onSelectEvent(ev.id);
                        setActiveEvent(ev);
                      }}
                      className="py-2 px-3 bg-gold text-dark border border-gold hover:brightness-110 rounded-xl font-mono text-[9px] uppercase tracking-widest font-bold transition-all"
                    >
                      Open Dash
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COMPREHENSIVE INTERACTIVE CALENDAR SECTION */}
      <div className="border-t border-white/5 pt-10 mt-12 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-serif text-xl text-cream flex items-center gap-2">
              <Calendar className="text-gold" size={20} /> Operational Events Calendar
            </h3>
            <p className="text-xs text-text-secondary">Keep synchronized alignment over simultaneous weddings and schedules.</p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 text-text-secondary hover:text-gold transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-mono font-bold text-cream min-w-[110px] text-center">
              {monthNames[month]} {year}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 text-text-secondary hover:text-gold transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid card */}
          <div className="lg:col-span-2 bg-[#101010] border border-white/5 rounded-2xl p-5">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase font-mono font-bold text-gold mb-3">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {/* Offsets */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`offset-${i}`} className="h-10 sm:h-12 bg-white/[0.01] rounded-lg opacity-20" />
              ))}
              
              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                
                // Find event scheduled on this date
                const dayEvents = events.filter(e => e.date === dateStr);
                const hasEvent = dayEvents.length > 0;
                
                return (
                  <div 
                    key={`day-${dayNum}`} 
                    className={`h-10 sm:h-12 rounded-lg p-1.5 flex flex-col justify-between transition-all relative ${
                      hasEvent 
                        ? 'bg-gold/10 border border-gold text-gold shadow-md shadow-gold/5' 
                        : 'bg-white/[0.02] border border-white/5 text-text-secondary'
                    }`}
                  >
                    <span className="text-[10px] font-mono leading-none font-bold">{dayNum}</span>
                    {hasEvent && (
                      <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {dayEvents.map(de => (
                          <span 
                            key={de.id} 
                            onClick={() => setActiveEvent(de)}
                            title={`${de.name} (${de.bride} & ${de.groom})`}
                            className="w-1.5 h-1.5 rounded-full bg-gold inline-block cursor-pointer hover:scale-150 transition-transform shrink-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side schedule board card */}
          <div className="bg-[#101010] border border-white/5 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-gold font-bold font-mono">Month Schedule List</h4>
            <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
              {events
                .filter(e => {
                  const evDate = new Date(e.date);
                  return evDate.getFullYear() === year && evDate.getMonth() === month;
                })
                .map(ev => (
                  <div 
                    key={ev.id} 
                    onClick={() => setActiveEvent(ev)}
                    className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-gold/30 cursor-pointer transition-all space-y-1"
                  >
                    <span className="text-[9px] uppercase tracking-wider font-mono bg-white/5 px-2 py-0.5 rounded text-text-secondary">
                      {ev.status === 'Active' ? 'Ongoing' : ev.status}
                    </span>
                    <h5 className="font-serif text-sm text-cream font-medium leading-snug mt-1">{ev.name}</h5>
                    <p className="text-[10px] text-text-secondary flex items-center gap-1 font-mono">
                      <Calendar size={10} className="text-gold" /> {ev.date}
                    </p>
                  </div>
                ))}
              {events.filter(e => {
                const evDate = new Date(e.date);
                return evDate.getFullYear() === year && evDate.getMonth() === month;
              }).length === 0 && (
                <div className="text-center py-10 text-text-secondary text-xs italic opacity-40">
                  No weddings scheduled this month.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
