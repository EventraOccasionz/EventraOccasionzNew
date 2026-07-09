import React, { useState } from 'react';
import { Search, Check, X, Loader2, UserCheck, Users, ShieldAlert, Hotel, Sparkles, Smartphone, Hash, Lock, CheckCircle2 } from 'lucide-react';
import { RSVP, Family, RoomBooking } from '../../types';

interface CheckinTabProps {
  rsvps: RSVP[];
  families?: Family[];
  rooms?: RoomBooking[];
  onToggleCheckin: (id: string, currentStatus: boolean, checkinTime?: string) => Promise<void>;
}

export default function CheckinTab({ rsvps, families = [], rooms = [], onToggleCheckin }: CheckinTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const confirmedRsvps = rsvps.filter(r => r.attending);

  // Stats
  const checkedInCount = confirmedRsvps.filter(r => r.checked_in).length;
  const remainingCount = confirmedRsvps.length - checkedInCount;

  // Search filter
  const term = searchTerm.toLowerCase().trim();
  const filteredRsvps = confirmedRsvps.filter(r => {
    if (!term) return true;
    
    // 1. Search Guest Name or Email
    const nameMatch = r.guest_name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term);
    
    // 2. Search Mobile Number
    const mobileMatch = r.mobile_number && r.mobile_number.toLowerCase().includes(term);
    
    // Find linked family
    const family = families.find(f => f.id === r.family_id);
    
    // 3. Search Family Name or Access Code
    const familyMatch = family && (
      family.name.toLowerCase().includes(term) || 
      family.access_code.toLowerCase().includes(term)
    );

    return nameMatch || mobileMatch || familyMatch;
  });

  const handleCheckinToggle = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      const nowIso = new Date().toISOString();
      await onToggleCheckin(id, currentStatus, nowIso);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div id="checkin-tab-panel" className="space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-gold uppercase tracking-[0.3em] text-[10px] font-mono font-bold flex items-center gap-1">
            <Sparkles size={12} /> Master Desk Services
          </span>
          <h3 className="font-serif text-3xl text-cream mt-1">Check-in Terminal</h3>
          <p className="text-xs text-text-secondary mt-1">Search guests, view room allotment, and check-in attendees in real-time.</p>
        </div>

        {/* Action-packed Statistics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
          <div className="bg-[#121212]/50 border border-white/5 rounded-xl px-3 py-2.5 sm:px-5 sm:py-3 text-center min-w-[90px] sm:min-w-[110px]">
            <p className="text-[9px] text-text-secondary uppercase tracking-widest font-mono">Confirmed</p>
            <p className="text-lg sm:text-2xl font-serif text-cream mt-1">{confirmedRsvps.length}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2.5 sm:px-5 sm:py-3 text-center min-w-[90px] sm:min-w-[110px]">
            <p className="text-[9px] text-emerald-400 uppercase tracking-widest font-mono">Present</p>
            <p className="text-lg sm:text-2xl font-serif text-emerald-300 mt-1">{checkedInCount}</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl px-3 py-2.5 sm:px-5 sm:py-3 text-center min-w-[90px] sm:min-w-[110px]">
            <p className="text-[9px] text-amber-400 uppercase tracking-widest font-mono">Pending</p>
            <p className="text-lg sm:text-2xl font-serif text-amber-300 mt-1">{remainingCount}</p>
          </div>
        </div>
      </div>

      {/* Multi-Criteria Search Console */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold font-mono">Master Search Hub</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/60" size={18} />
          <input 
            type="text" 
            placeholder="Search by Family Name, Access Code, Mobile, or Guest Name..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-gold/20 pl-12 pr-6 py-4 text-sm outline-none focus:border-gold transition-colors text-cream rounded-xl shadow-inner placeholder-white/30"
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-text-secondary font-mono px-1">
          <span className="flex items-center gap-1"><Smartphone size={10} /> Mobile Search Enabled</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Lock size={10} /> Access Code Auto-link</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Hotel size={10} /> Hotel Status Tracker</span>
        </div>
      </div>

      {/* Guest Check-in Cards Feed */}
      <div className="space-y-4">
        {filteredRsvps.length === 0 ? (
          <div className="text-center py-20 p-8 border border-white/5 bg-[#121212]/20 rounded-2xl">
            <ShieldAlert className="mx-auto text-gold/40 mb-3" size={40} />
            <h4 className="text-cream font-serif text-lg mb-1">No Matching Attendees</h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">We couldn't locate any confirmed guest matching "{searchTerm}". Please refine your criteria.</p>
          </div>
        ) : (
          filteredRsvps.map(guest => {
            // Find family
            const family = families.find(f => f.id === guest.family_id);
            // Find room
            const room = rooms.find(rm => rm.family_id === guest.family_id);
            // Find co-guests (other family members)
            const familyMembers = confirmedRsvps.filter(r => r.family_id === guest.family_id && r.id !== guest.id);

            return (
              <div 
                key={guest.id} 
                className="bg-[#121212]/40 border border-white/5 rounded-2xl p-6 hover:border-gold/30 transition-all space-y-6 shadow-xl relative overflow-hidden"
              >
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full filter blur-2xl pointer-events-none" />

                {/* Card Top: Primary Info and Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif text-xl text-cream font-medium tracking-tight">
                        {guest.guest_name}
                      </span>
                      {guest.primary_guest && (
                        <span className="px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 text-[8px] uppercase tracking-widest font-mono font-bold">
                          Primary Guest
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-text-secondary">
                      {family && (
                        <span className="flex items-center gap-1.5 text-cream/90 font-mono">
                          <Users size={12} className="text-gold/60" />
                          Family: <strong className="text-cream">{family.name}</strong>
                        </span>
                      )}
                      {family && (
                        <span className="flex items-center gap-1.5 font-mono">
                          <Lock size={12} className="text-gold/60" />
                          Code: <strong className="text-cream">{family.access_code}</strong>
                        </span>
                      )}
                      {guest.mobile_number && (
                        <span className="flex items-center gap-1.5 font-mono">
                          <Smartphone size={12} className="text-gold/60" />
                          Mobile: <strong className="text-cream">{guest.mobile_number}</strong>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 font-mono">
                        <Hash size={12} className="text-gold/60" />
                        Guests: <strong className="text-cream">{guest.total_guests} Adults, {guest.children_count || 0} Kids</strong>
                      </span>
                    </div>
                  </div>

                  {/* Immediate Check-In Button */}
                  <div className="w-full sm:w-auto text-right self-stretch sm:self-center flex flex-col justify-center">
                    <button
                      disabled={updatingId === guest.id}
                      onClick={() => handleCheckinToggle(guest.id, !!guest.checked_in)}
                      className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs uppercase tracking-widest font-mono font-bold transition-all border shadow-lg flex items-center justify-center gap-2 ${
                        guest.checked_in
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-gold text-dark border-gold/40 hover:brightness-110 hover:shadow-gold/10 hover:scale-[1.02]'
                      }`}
                    >
                      {updatingId === guest.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : guest.checked_in ? (
                        <>
                          <CheckCircle2 size={14} /> Checked In
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} /> CHECK IN
                        </>
                      )}
                    </button>
                    {guest.checked_in && guest.checked_in_at && (
                      <span className="block text-[9px] text-emerald-400/80 font-mono mt-1.5 text-center sm:text-right">
                        Time: {new Date(guest.checked_in_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-[1px] bg-white/5" />

                {/* Card Bottom Grid: Room status & Co-guests */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Hotel Room Allotment Section */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gold font-bold">
                      <Hotel size={14} /> Room Allotment Status
                    </div>
                    {room ? (
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <p className="text-text-secondary text-[10px]">Hotel Name</p>
                          <p className="text-cream font-medium mt-0.5">{room.hotel_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary text-[10px]">Room / Floor</p>
                          <p className="text-cream font-bold mt-0.5 text-gold">
                            {room.room_number ? `Room ${room.room_number}` : 'Allotment Pending'}
                          </p>
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5 text-[10px] text-text-secondary mt-1 pt-1.5 border-t border-white/5">
                          <span>Status:</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                            room.status === 'Confirmed' ? 'bg-blue-500/10 text-blue-400' :
                            room.status === 'Checked-in' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/50'
                          }`}>
                            {room.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-text-secondary text-xs italic py-2">
                        Room will be allotted before check-in.
                      </div>
                    )}
                  </div>

                  {/* Family Co-guests check-in status */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gold font-bold">
                      <Users size={14} /> Family Co-guests ({familyMembers.length + 1})
                    </div>
                    {familyMembers.length === 0 ? (
                      <p className="text-xs text-text-secondary italic py-2">No other family members registered under this passcode.</p>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                        {familyMembers.map(member => (
                          <div key={member.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                            <span className="text-cream">{member.guest_name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] uppercase tracking-widest font-mono ${member.checked_in ? 'text-emerald-400 font-bold' : 'text-text-secondary'}`}>
                                {member.checked_in ? 'Present' : 'Absent'}
                              </span>
                              <button 
                                disabled={updatingId === member.id}
                                onClick={() => handleCheckinToggle(member.id, !!member.checked_in)}
                                className={`p-1 rounded transition-colors ${
                                  member.checked_in ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-white/5 text-text-secondary hover:bg-gold/10 hover:text-gold'
                                }`}
                              >
                                {member.checked_in ? <Check size={10} /> : <X size={10} className="rotate-45" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
