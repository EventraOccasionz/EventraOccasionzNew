import React from 'react';
import { GalleryItem } from '../../types';
import { ArrowUp, ArrowDown, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';

interface GalleryTabProps {
  filteredGallery: GalleryItem[];
  gallery: GalleryItem[];
  handleShiftGalleryOrder: (index: number, direction: 'up' | 'down') => Promise<void>;
  toggleGalleryVisibility: (item: GalleryItem) => Promise<void>;
  openGalleryModal: (item: GalleryItem | 'add') => void;
  handleDeleteGallery: (id: string) => Promise<void>;
}

export default function GalleryTab({
  filteredGallery,
  gallery,
  handleShiftGalleryOrder,
  toggleGalleryVisibility,
  openGalleryModal,
  handleDeleteGallery
}: GalleryTabProps) {
  return (
    <table id="admin-gallery-table" className="w-full border-collapse min-w-[850px]">
      <thead className="text-[0.6rem] text-gold uppercase tracking-[0.2em] border-b border-gold/10">
        <tr>
          <th className="text-left py-4 px-4">Reorder</th>
          <th className="text-left py-4 px-4">Thumbnail Asset</th>
          <th className="text-left py-4 px-4">Category</th>
          <th className="text-left py-4 px-4">Display Status</th>
          <th className="text-right py-4 px-4">Control</th>
        </tr>
      </thead>
      <tbody className="text-xs text-text-secondary">
        {filteredGallery.map((item, index) => {
          // Find actual index in primary unfiltered array
          const actualIndex = gallery.findIndex(g => g.id === item.id);
          return (
            <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
              <td className="py-4 px-4">
                <div className="flex items-center gap-1">
                  <button 
                    disabled={actualIndex === 0}
                    onClick={() => handleShiftGalleryOrder(actualIndex, 'up')}
                    className="p-1 text-text-secondary hover:text-gold disabled:opacity-20"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button 
                    disabled={actualIndex === gallery.length - 1}
                    onClick={() => handleShiftGalleryOrder(actualIndex, 'down')}
                    className="p-1 text-text-secondary hover:text-gold disabled:opacity-20"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <span className="font-mono text-[10px] text-text-secondary/40 ml-1">#{item.order_index}</span>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0 border border-white/10 relative">
                    {item.image_url ? (
                      <img src={item.image_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full animate-pulse" style={{ background: item.bg || 'linear-gradient(135deg,#2a1c10,#1a1008)' }} />
                    )}
                  </div>
                  <p className="text-cream text-sm font-serif font-medium">{item.lbl}</p>
                </div>
              </td>
              <td className="py-4 px-4 uppercase tracking-widest text-[10px] text-gold">{item.cat}</td>
              <td className="py-4 px-4">
                <button 
                  onClick={() => toggleGalleryVisibility(item)}
                  className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest ${
                    item.visible !== false ? 'text-green-400' : 'text-red-400 opacity-60'
                  }`}
                >
                  {item.visible !== false ? (
                    <><Eye size={12} /> Live</>
                  ) : (
                    <><EyeOff size={12} /> Stashed</>
                  )}
                </button>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => openGalleryModal(item)}
                    className="p-2 text-text-secondary hover:text-gold hover:bg-white/5 rounded"
                    title="Edit Digital Product Asset"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteGallery(item.id)}
                    className="p-2 text-text-secondary hover:text-red-400 hover:bg-white/5 rounded"
                    title="Delete Asset and Purge"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
        {filteredGallery.length === 0 && (
          <tr>
            <td colSpan={5} className="py-20 text-center text-text-secondary uppercase tracking-widest opacity-40">
              No gallery moments catalogued.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
