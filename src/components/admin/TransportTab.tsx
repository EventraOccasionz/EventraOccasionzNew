import React from 'react';
import { TransportRequest, Family } from '../../types';

interface TransportTabProps {
  transports: TransportRequest[];
  families: Family[];
}

export default function TransportTab({
  transports,
  families
}: TransportTabProps) {
  return (
    <table id="admin-transports-table" className="w-full border-collapse min-w-[800px]">
      <thead className="text-[0.6rem] text-gold uppercase tracking-[0.2em] border-b border-gold/10">
        <tr>
          <th className="text-left py-4 px-4">Guest Group</th>
          <th className="text-left py-4 px-4 font-normal uppercase">Arrival Mode</th>
          <th className="text-left py-4 px-4 font-normal uppercase">Need Local Cab</th>
          <th className="text-left py-4 px-4 font-normal uppercase">Pickup Location</th>
          <th className="text-left py-4 px-4 font-normal uppercase">Arrival Flight / Train Info</th>
        </tr>
      </thead>
      <tbody className="text-xs text-text-secondary">
        {transports.map((t) => (
          <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
            <td className="py-4 px-4">
              <p className="text-cream font-medium">{families.find(f => f.id === t.family_id)?.name || 'Guest'}</p>
            </td>
            <td className="py-4 px-4 uppercase tracking-wider text-[10px] text-gold font-mono">{t.mode || 'N/A'}</td>
            <td className="py-4 px-4">
              {t.need_cab ? (
                <span className="text-[#D4AF37] text-[10px] font-semibold border border-gold/20 bg-gold/5 px-2 py-0.5 rounded">
                  Cab Requested
                </span>
              ) : (
                <span className="opacity-40">Self / Not Required</span>
              )}
            </td>
            <td className="py-4 px-4">{t.pickup_location || 'N/A'}</td>
            <td className="py-4 px-4 font-sans text-xs max-w-xs truncate">{t.details || t.arrival_time || 'N/A'}</td>
          </tr>
        ))}
        {transports.length === 0 && (
          <tr>
            <td colSpan={5} className="py-20 text-center text-text-secondary uppercase tracking-widest opacity-40">
              No transport requests stashed.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
