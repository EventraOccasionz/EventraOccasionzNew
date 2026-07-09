import React, { useState } from 'react';
import { TransportRequest, Family } from '../../types';
import { Edit, X, Loader2, Phone, ShieldAlert, Sparkles, Car } from 'lucide-react';
import { dataService } from '../../lib/dataService';

interface TransportTabProps {
  transports: TransportRequest[];
  families: Family[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export default function TransportTab({
  transports,
  families,
  onRefresh,
  showToast
}: TransportTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingTransport, setEditingTransport] = useState<Partial<TransportRequest> | null>(null);
  const [saving, setSaving] = useState(false);

  const handleOpenEdit = (t: TransportRequest) => {
    setEditingTransport({ ...t });
    setShowModal(true);
  };

  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransport || !editingTransport.id) return;
    setSaving(true);

    try {
      // If we don't have an ID, we use standard family_id mapping
      const cleanTransport = {
        ...editingTransport,
        updated_at: new Date().toISOString()
      };
      
      await dataService.submitTransport(cleanTransport as TransportRequest);
      showToast('success', 'Driver and vehicle dispatch details published successfully.');
      setShowModal(false);
      onRefresh();
    } catch (err) {
      showToast('error', 'Failed saving dispatch details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="admin-transports-panel" className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <span className="text-gold uppercase tracking-[0.2em] text-[9px] font-mono font-bold flex items-center gap-1">
            <Car size={10} /> Fleet Operations
          </span>
          <h3 className="font-serif text-2xl text-cream">Transport & Dispatches</h3>
          <p className="text-xs text-text-secondary">Dispatch airport cars, assign drivers, and publish vehicle schedules in real-time.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table id="admin-transports-table" className="w-full border-collapse min-w-[900px]">
          <thead className="text-[0.6rem] text-gold uppercase tracking-[0.2em] border-b border-gold/10">
            <tr>
              <th className="text-left py-4 px-4">Guest Group</th>
              <th className="text-left py-4 px-4">Arrival Mode</th>
              <th className="text-left py-4 px-4">Cab Required</th>
              <th className="text-left py-4 px-4">Pickup Location</th>
              <th className="text-left py-4 px-4">Driver Name</th>
              <th className="text-left py-4 px-4">Vehicle Number</th>
              <th className="text-left py-4 px-4">Driver Contact</th>
              <th className="text-left py-4 px-4">Pickup Time</th>
              <th className="text-left py-4 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs text-text-secondary">
            {transports.map((t) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-4 px-4">
                  <p className="text-cream font-medium">{families.find(f => f.id === t.family_id)?.name || 'Guest Group'}</p>
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
                <td className="py-4 px-4 text-cream max-w-[150px] truncate">{t.pickup_location || 'N/A'}</td>
                <td className="py-4 px-4 text-cream font-medium">{t.driver_name || <span className="opacity-40 italic">TBD</span>}</td>
                <td className="py-4 px-4 font-mono text-gold">{t.vehicle_number || <span className="opacity-40 italic">TBD</span>}</td>
                <td className="py-4 px-4 font-mono">{t.driver_contact || <span className="opacity-40 italic">TBD</span>}</td>
                <td className="py-4 px-4 text-cream font-medium">{t.pickup_time || <span className="opacity-40 italic">TBD</span>}</td>
                <td className="py-4 px-4">
                  <button 
                    onClick={() => handleOpenEdit(t)} 
                    className="p-1.5 rounded-lg bg-gold/5 border border-gold/25 text-gold hover:bg-gold hover:text-dark transition-all flex items-center gap-1 uppercase text-[9px] font-mono tracking-wider font-bold"
                    title="Dispatch Driver"
                  >
                    <Edit size={12} /> Dispatch
                  </button>
                </td>
              </tr>
            ))}
            {transports.length === 0 && (
              <tr>
                <td colSpan={9} className="py-20 text-center text-text-secondary uppercase tracking-widest opacity-40">
                  No transport requests stashed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && editingTransport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark border border-white/10 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-cream"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-gold animate-pulse" size={18} />
              <h3 className="font-serif text-2xl text-cream">Dispatch Logistics Coordinator</h3>
            </div>
            
            <p className="text-xs text-text-secondary mb-6">
              Enter driver information and vehicle details below to publish schedules directly to the guest's mobile dashboard.
            </p>
            
            <form onSubmit={handleSaveDispatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-2 font-mono font-bold">Driver Name</label>
                  <input
                    type="text"
                    required
                    value={editingTransport.driver_name || ''}
                    onChange={e => setEditingTransport({...editingTransport, driver_name: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-2 font-mono font-bold">Vehicle Number</label>
                  <input
                    type="text"
                    required
                    value={editingTransport.vehicle_number || ''}
                    onChange={e => setEditingTransport({...editingTransport, vehicle_number: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all font-mono"
                    placeholder="e.g. GA-01-AB-1234"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-2 font-mono font-bold">Driver Contact</label>
                  <input
                    type="tel"
                    required
                    value={editingTransport.driver_contact || ''}
                    onChange={e => setEditingTransport({...editingTransport, driver_contact: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all font-mono"
                    placeholder="e.g. +91 98765 43219"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-2 font-mono font-bold">Pickup Time</label>
                  <input
                    type="text"
                    required
                    value={editingTransport.pickup_time || ''}
                    onChange={e => setEditingTransport({...editingTransport, pickup_time: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                    placeholder="e.g. 18 May, 3:30 PM"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-white/5 text-cream border border-white/10 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-gold text-black font-bold text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-gold/15"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Saving...
                    </>
                  ) : (
                    'Publish Dispatch'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
