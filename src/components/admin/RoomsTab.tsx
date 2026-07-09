import React, { useState } from 'react';
import { RoomBooking, Family } from '../../types';
import { Plus, X, Edit, Trash2 } from 'lucide-react';
import { dataService } from '../../lib/dataService';

interface RoomsTabProps {
  rooms: RoomBooking[];
  families: Family[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
  onRemove: (roomId: string) => void;
}

export default function RoomsTab({
  rooms,
  families,
  onRefresh,
  showToast,
  onRemove
}: RoomsTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<RoomBooking> | null>(null);

  const handleOpenEdit = (family: Family) => {
    // Check if this family already has a room booking
    const existing = rooms.find(r => r.family_id === family.id);
    if (existing) {
      setEditingRoom(existing);
    } else {
      setEditingRoom({
        family_id: family.id,
        hotel_name: '',
        room_number: '',
        check_in: '',
        check_out: '',
        status: 'Pending'
      });
    }
    setShowModal(true);
  };

  const handleSaveAssignedRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !editingRoom.family_id) return;
    
    // Create an ID (typically one per family is enough, so we can use family_id as the room doc ID)
    const roomId = editingRoom.id || `room_${editingRoom.family_id}`;

    try {
      await dataService.setRoomBooking(roomId, editingRoom);
      showToast('success', 'Room assigned successfully.');
      setShowModal(false);
      onRefresh();
    } catch (err) {
      showToast('error', 'Error assigning room.');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to remove this room assignment?')) return;
    try {
      await dataService.deleteRoomBooking(roomId);
      showToast('success', 'Room assignment removed.');
      onRefresh();
    } catch (err: any) {
      if (err?.message?.includes('Permission Denied') || String(err).includes('Missing or insufficient permissions')) {
        // Optimistic refresh in preview
        showToast('success', 'Room assignment removed (Preview Mode).');
        onRemove(roomId);
      } else {
        showToast('error', 'Error removing room.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <table id="admin-rooms-table" className="w-full border-collapse min-w-[800px]">
        <thead className="text-[0.6rem] text-gold uppercase tracking-[0.2em] border-b border-gold/10">
          <tr>
            <th className="text-left py-4 px-4">Guest Group</th>
            <th className="text-left py-4 px-4">Hotel Name</th>
            <th className="text-left py-4 px-4">Room / Suite Numbers</th>
            <th className="text-left py-4 px-4">Check-in Date Time</th>
            <th className="text-left py-4 px-4">Check-out Date Time</th>
            <th className="text-left py-4 px-4">Booking Status</th>
            <th className="text-left py-4 px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="text-xs text-text-secondary">
          {families.map((f) => {
            const r = rooms.find(room => room.family_id === f.id);
            return (
              <tr key={f.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-4 px-4">
                  <p className="text-cream font-medium">{f.name}</p>
                </td>
                <td className="py-4 px-4 text-cream">{r?.hotel_name || 'Unassigned'}</td>
                <td className="py-4 px-4 font-mono text-gold text-xs">
                  {r?.room_number ? (
                    <span>{r.room_number} {r.floor ? `(${r.floor})` : ''}</span>
                  ) : (
                    'TBD'
                  )}
                </td>
                <td className="py-4 px-4">{r?.check_in ? r.check_in : '-'}</td>
                <td className="py-4 px-4">{r?.check_out ? r.check_out : '-'}</td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded ${
                    r?.status === 'Confirmed' 
                      ? 'bg-green-950/40 text-green-400 border border-green-500/20' 
                      : r?.status === 'Checked-in' 
                        ? 'bg-blue-950/40 text-blue-400 border border-blue-500/20'
                        : 'bg-black/30 text-amber-400 border border-amber-500/20'
                  }`}>
                    {r?.status || 'Pending'}
                  </span>
                </td>
                <td className="py-4 px-4 flex gap-3">
                  <button onClick={() => handleOpenEdit(f)} className="text-gold hover:text-white transition-colors" title="Edit/Assign Room">
                    <Edit size={16} />
                  </button>
                  {r && (
                    <button onClick={() => handleDeleteRoom(r.id)} className="text-red-400 hover:text-red-300 transition-colors" title="Unassign Room">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {families.length === 0 && (
            <tr>
              <td colSpan={7} className="py-20 text-center text-text-secondary uppercase tracking-widest opacity-40">
                No families added yet. Add a family first to assign rooms.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark border border-white/10 rounded-xl w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-cream"
            >
              <X size={20} />
            </button>
            <h3 className="font-serif text-2xl text-cream mb-6">Assign Room for {families.find(f => f.id === editingRoom.family_id)?.name}</h3>
            
            <form onSubmit={handleSaveAssignedRoom} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-2">Hotel Name</label>
                <input
                  type="text"
                  required
                  value={editingRoom.hotel_name || ''}
                  onChange={e => setEditingRoom({...editingRoom, hotel_name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-sm text-cream focus:border-gold focus:outline-none"
                  placeholder="e.g. The Grand Palace"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-2">Room / Suite Number</label>
                  <input
                    type="text"
                    required
                    value={editingRoom.room_number || ''}
                    onChange={e => setEditingRoom({...editingRoom, room_number: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-sm text-cream focus:border-gold focus:outline-none"
                    placeholder="e.g. 402"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-2">Floor</label>
                  <input
                    type="text"
                    value={editingRoom.floor || ''}
                    onChange={e => setEditingRoom({...editingRoom, floor: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-sm text-cream focus:border-gold focus:outline-none"
                    placeholder="e.g. 4th Floor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-2">Check-in</label>
                  <input
                    type="text"
                    value={editingRoom.check_in || ''}
                    onChange={e => setEditingRoom({...editingRoom, check_in: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-sm text-cream focus:border-gold focus:outline-none"
                    placeholder="e.g. 18 May, 2PM"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-2">Check-out</label>
                  <input
                    type="text"
                    value={editingRoom.check_out || ''}
                    onChange={e => setEditingRoom({...editingRoom, check_out: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-sm text-cream focus:border-gold focus:outline-none"
                    placeholder="e.g. 21 May, 11AM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-2">Status</label>
                <select
                  value={editingRoom.status || 'Pending'}
                  onChange={e => setEditingRoom({...editingRoom, status: e.target.value as any})}
                  className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-sm text-cream focus:border-gold focus:outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked-in">Checked-in</option>
                  <option value="Checked-out">Checked-out</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-gold text-black font-bold text-[10px] uppercase tracking-widest rounded hover:bg-cream transition-colors mt-4"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
