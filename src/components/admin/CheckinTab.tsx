import React, { useState } from 'react';
import { Search, Check, X, Loader2, UserCheck, Users, ShieldAlert } from 'lucide-react';
import { RSVP } from '../../types';

interface CheckinTabProps {
  rsvps: RSVP[];
  onToggleCheckin: (id: string, currentStatus: boolean) => Promise<void>;
}

export default function CheckinTab({ rsvps, onToggleCheckin }: CheckinTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const confirmedRsvps = rsvps.filter(r => r.attending);

  const filteredRsvps = confirmedRsvps.filter(r => 
    r.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkedInCount = confirmedRsvps.filter(r => r.checked_in).length;

  const handleCheckinToggle = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      await onToggleCheckin(id, currentStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div id="checkin-tab-panel" className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121212]/50 border border-white/5 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gold/10 text-gold">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">Confirmed Guests</p>
            <p className="text-xl font-serif text-cream">{confirmedRsvps.length}</p>
          </div>
        </div>
        <div className="bg-[#121212]/50 border border-white/5 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">Checked In</p>
            <p className="text-xl font-serif text-cream">{checkedInCount}</p>
          </div>
        </div>
        <div className="bg-[#121212]/50 border border-white/5 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">Remaining</p>
            <p className="text-xl font-serif text-cream">{confirmedRsvps.length - checkedInCount}</p>
          </div>
        </div>
      </div>

      {/* Search and control bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
        <input 
          type="text" 
          placeholder="Search confirmed guest names or emails..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-gold/10 pl-12 pr-6 py-3 text-sm outline-none focus:border-gold transition-colors text-cream rounded-lg"
        />
      </div>

      {/* Guest List */}
      <div className="border border-white/5 bg-[#121212]/30 rounded-xl overflow-hidden">
        {filteredRsvps.length === 0 ? (
          <div className="text-center py-16 p-8">
            <ShieldAlert className="mx-auto text-gold/40 mb-3" size={32} />
            <h4 className="text-cream font-serif text-lg mb-1">No Guests Found</h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">Either there are no confirmed RSVPs for this event yet, or no guests match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-wider text-gold font-mono">
                  <th className="px-6 py-4">Guest Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Dietary Req.</th>
                  <th className="px-6 py-4">Linked Events</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-cream/80">
                {filteredRsvps.map(r => (
                  <tr key={r.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-medium text-cream">{r.guest_name}</td>
                    <td className="px-6 py-4 font-mono text-text-secondary">{r.email}</td>
                    <td className="px-6 py-4 text-amber-400">{r.dietary_requirements || 'None'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {r.events?.map(ev => (
                          <span key={ev} className="px-1.5 py-0.5 bg-white/5 text-text-secondary rounded text-[9px] font-mono">
                            {ev}
                          </span>
                        )) || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={updatingId === r.id}
                        onClick={() => handleCheckinToggle(r.id, !!r.checked_in)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-mono font-bold transition-all border ${
                          r.checked_in
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-white/5 text-text-secondary border-white/10 hover:bg-gold/10 hover:text-gold hover:border-gold/30'
                        }`}
                      >
                        {updatingId === r.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : r.checked_in ? (
                          <>
                            <Check size={12} /> Checked In
                          </>
                        ) : (
                          <>
                            <X size={12} className="rotate-45" /> Mark Present
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
