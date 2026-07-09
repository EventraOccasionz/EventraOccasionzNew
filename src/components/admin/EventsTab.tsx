import React, { useState } from 'react';
import { Search, Plus, Calendar, MapPin, Heart, ShieldAlert, Loader2, CheckCircle2, Archive, Play, Trash2, X } from 'lucide-react';

export interface EventData {
  id: string;
  name: string;
  bride: string;
  groom: string;
  date: string;
  venue: string;
  status: 'Active' | 'Completed' | 'Archived';
  created_at: string;
}

interface EventsTabProps {
  events: EventData[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onCreateEvent: (event: Omit<EventData, 'id' | 'created_at'>) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateEventStatus: (id: string, status: 'Active' | 'Completed' | 'Archived') => void;
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
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed' | 'Archived'>('All');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New Event form state
  const [name, setName] = useState('');
  const [bride, setBride] = useState('');
  const [groom, setGroom] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [status, setStatus] = useState<'Active' | 'Completed' | 'Archived'>('Active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !bride || !groom || !date || !venue) return;
    onCreateEvent({ name, bride, groom, date, venue, status });
    // Reset Form
    setName('');
    setBride('');
    setGroom('');
    setDate('');
    setVenue('');
    setStatus('Active');
    setShowCreateForm(false);
  };

  const filteredEvents = events.filter(ev => {
    const matchesSearch = 
      ev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.bride.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.groom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || ev.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div id="events-management-panel" className="space-y-8">
      {/* Upper Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Search events by name, couple, or venue..." 
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
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#141414] border border-gold/20 rounded-2xl p-6 sm:p-8 relative shadow-2xl">
            <button 
              onClick={() => setShowCreateForm(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-white p-1"
            >
              <X size={20} />
            </button>
            
            <h3 className="font-serif text-2xl text-gold mb-2">Create New Event</h3>
            <p className="text-xs text-text-secondary mb-6">Register a premium event workspace to manage RSVPs, transportation, hotel bookings, and details.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Rajput Wedding"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Bride Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Bride"
                    value={bride}
                    onChange={e => setBride(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Groom Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Groom"
                    value={groom}
                    onChange={e => setGroom(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Event Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Initial Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gold/80 font-mono font-bold">Venue Name / Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Taj Exotica, Goa"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
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
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Filter Sub-Bar */}
      <div className="flex gap-2 border-b border-white/5 pb-4 overflow-x-auto">
        {(['All', 'Active', 'Completed', 'Archived'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 text-xs uppercase tracking-wider rounded-lg transition-all ${
              statusFilter === tab 
                ? 'bg-gold/10 border border-gold text-gold font-medium' 
                : 'border border-transparent text-text-secondary hover:text-cream'
            }`}
          >
            {tab} Events
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
                      ev.status === 'Active' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : ev.status === 'Completed'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-white/10 text-text-secondary border border-white/5'
                    }`}>
                      {ev.status}
                    </span>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextStatus = ev.status === 'Active' ? 'Completed' : ev.status === 'Completed' ? 'Archived' : 'Active';
                          onUpdateEventStatus(ev.id, nextStatus);
                        }}
                        title="Rotate Status"
                        className="p-1 text-text-secondary hover:text-gold transition-colors"
                      >
                        {ev.status === 'Active' ? <CheckCircle2 size={14} /> : ev.status === 'Completed' ? <Archive size={14} /> : <Play size={14} />}
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
                    <span className="text-white/40 font-sans mx-1">&</span>
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

                  <button
                    onClick={() => onSelectEvent(ev.id)}
                    className={`w-full py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-widest font-bold transition-all border ${
                      isSelected
                        ? 'bg-gold text-dark border-gold'
                        : 'bg-white/5 hover:bg-gold/10 text-gold border-gold/20 hover:border-gold/40'
                    }`}
                  >
                    {isSelected ? 'Active Workspace' : 'Open Workspace'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
