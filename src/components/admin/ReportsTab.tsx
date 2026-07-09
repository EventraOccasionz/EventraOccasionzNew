import React from 'react';
import { Download, PieChart, TrendingUp, Users, Car, Hotel, FileText, AlertCircle } from 'lucide-react';
import { RSVP, Family, TransportRequest, RoomBooking } from '../../types';

interface ReportsTabProps {
  rsvps: RSVP[];
  families: Family[];
  transports: TransportRequest[];
  rooms: RoomBooking[];
  eventName: string;
  onExport: (type: 'guests' | 'families' | 'transport' | 'rooms') => void;
}

export default function ReportsTab({
  rsvps,
  families,
  transports,
  rooms,
  eventName,
  onExport
}: ReportsTabProps) {
  // Compute Stats
  const confirmedCount = rsvps.filter(r => r.attending).length;
  const declinedCount = rsvps.filter(r => !r.attending && r.id).length; // if they submitted declined
  const totalRsvpsCount = rsvps.length;

  // Diet breakdown
  const diets: { [key: string]: number } = {};
  rsvps.forEach(r => {
    if (r.attending && r.dietary_requirements) {
      const d = r.dietary_requirements.trim().toLowerCase();
      diets[d] = (diets[d] || 0) + 1;
    }
  });

  // Transport breakdown
  const transportModes = { Car: 0, Bus: 0, Train: 0, Flight: 0 };
  transports.forEach(t => {
    if (t.mode in transportModes) {
      transportModes[t.mode as keyof typeof transportModes]++;
    }
  });
  const needCabCount = transports.filter(t => t.need_cab).length;

  // Hotel rooms breakdown
  const roomStatus = { Pending: 0, Confirmed: 0, 'Checked-in': 0, 'Checked-out': 0 };
  rooms.forEach(rm => {
    if (rm.status in roomStatus) {
      roomStatus[rm.status as keyof typeof roomStatus]++;
    }
  });

  // Documents uploaded
  const familiesWithDocs = families.filter(f => f.documents && f.documents.length > 0).length;

  return (
    <div id="reports-tab-panel" className="space-y-8">
      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#121212]/50 border border-white/5 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-gold">
            <span className="text-[10px] uppercase tracking-widest font-mono">RSVP Responses</span>
            <Users size={16} />
          </div>
          <p className="text-3xl font-serif text-cream">{totalRsvpsCount}</p>
          <div className="flex gap-3 text-[10px] font-mono text-text-secondary">
            <span className="text-emerald-400">Yes: {confirmedCount}</span>
            <span className="text-white/30">•</span>
            <span>No: {totalRsvpsCount - confirmedCount}</span>
          </div>
        </div>

        <div className="bg-[#121212]/50 border border-white/5 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-gold">
            <span className="text-[10px] uppercase tracking-widest font-mono">Transport Requests</span>
            <Car size={16} />
          </div>
          <p className="text-3xl font-serif text-cream">{transports.length}</p>
          <div className="flex gap-3 text-[10px] font-mono text-text-secondary">
            <span className="text-emerald-400">Cab Needs: {needCabCount}</span>
          </div>
        </div>

        <div className="bg-[#121212]/50 border border-white/5 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-gold">
            <span className="text-[10px] uppercase tracking-widest font-mono">Rooms Booked</span>
            <Hotel size={16} />
          </div>
          <p className="text-3xl font-serif text-cream">{rooms.length}</p>
          <div className="flex gap-3 text-[10px] font-mono text-text-secondary">
            <span className="text-emerald-400">Confirmed: {roomStatus.Confirmed}</span>
            <span className="text-white/30">•</span>
            <span>Pending: {roomStatus.Pending}</span>
          </div>
        </div>

        <div className="bg-[#121212]/50 border border-white/5 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-gold">
            <span className="text-[10px] uppercase tracking-widest font-mono">Guest Documents</span>
            <FileText size={16} />
          </div>
          <p className="text-3xl font-serif text-cream">{familiesWithDocs} / {families.length}</p>
          <p className="text-[10px] text-text-secondary font-mono">Groups with uploaded identity proofs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Diet & Transport Breakdown Graphs */}
        <div className="bg-[#121212]/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6">
          <h4 className="font-serif text-base text-gold flex items-center gap-2">
            <PieChart size={18} /> Detail Breakdowns
          </h4>

          {/* Transport Mode bar chart simulator */}
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-cream/70">Arrival Transport Mode</span>
            <div className="space-y-3">
              {Object.entries(transportModes).map(([mode, count]) => {
                const max = Math.max(...Object.values(transportModes), 1);
                const percent = (count / max) * 100;
                return (
                  <div key={mode} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-text-secondary">
                      <span>{mode}</span>
                      <span className="text-cream">{count} guests</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-gold h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diet requirements */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-cream/70 block mb-2">Dietary Requirements list</span>
            {Object.keys(diets).length === 0 ? (
              <p className="text-xs text-text-secondary font-mono">No custom dietary requirements declared.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                {Object.entries(diets).map(([diet, count]) => (
                  <div key={diet} className="p-2.5 bg-white/5 rounded-lg border border-white/5 flex justify-between">
                    <span className="capitalize text-text-secondary">{diet}</span>
                    <span className="text-gold font-bold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Excel / CSV Exporters Panel */}
        <div className="bg-[#121212]/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <h4 className="font-serif text-base text-gold flex items-center gap-2 mb-2">
              <Download size={18} /> Excel / CSV Export Center
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Generate and download production-ready CSV spreadsheets containing verified, clean data exclusively for <strong>{eventName}</strong>. No cross-event data leakage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => onExport('guests')}
              className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:border-gold/50 transition-all flex flex-col justify-between h-[120px]"
            >
              <div className="p-2 bg-gold/10 text-gold rounded-lg w-fit">
                <Users size={18} />
              </div>
              <div>
                <span className="text-xs text-cream block font-bold">Export RSVPs</span>
                <span className="text-[9px] text-text-secondary font-mono">Guest responses & diets</span>
              </div>
            </button>

            <button
              onClick={() => onExport('families')}
              className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:border-gold/50 transition-all flex flex-col justify-between h-[120px]"
            >
              <div className="p-2 bg-gold/10 text-gold rounded-lg w-fit">
                <FileText size={18} />
              </div>
              <div>
                <span className="text-xs text-cream block font-bold">Export Invitations</span>
                <span className="text-[9px] text-text-secondary font-mono">Passcodes, limits & slugs</span>
              </div>
            </button>

            <button
              onClick={() => onExport('transport')}
              className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:border-gold/50 transition-all flex flex-col justify-between h-[120px]"
            >
              <div className="p-2 bg-gold/10 text-gold rounded-lg w-fit">
                <Car size={18} />
              </div>
              <div>
                <span className="text-xs text-cream block font-bold">Export Transport</span>
                <span className="text-[9px] text-text-secondary font-mono">Shuttles, cabs & arrivals</span>
              </div>
            </button>

            <button
              onClick={() => onExport('rooms')}
              className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:border-gold/50 transition-all flex flex-col justify-between h-[120px]"
            >
              <div className="p-2 bg-gold/10 text-gold rounded-lg w-fit">
                <Hotel size={18} />
              </div>
              <div>
                <span className="text-xs text-cream block font-bold">Export Hotel</span>
                <span className="text-[9px] text-text-secondary font-mono">Rooms, check-ins/outs</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
