import React from 'react';
import { Service } from '../../types';
import { ArrowUp, ArrowDown, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';

interface ServicesTabProps {
  filteredServices: Service[];
  services: Service[];
  handleShiftServiceOrder: (index: number, direction: 'up' | 'down') => Promise<void>;
  toggleServiceVisibility: (serv: Service) => Promise<void>;
  openServiceModal: (serv: Service | 'add') => void;
  handleDeleteService: (id: string) => Promise<void>;
}

export default function ServicesTab({
  filteredServices,
  services,
  handleShiftServiceOrder,
  toggleServiceVisibility,
  openServiceModal,
  handleDeleteService
}: ServicesTabProps) {
  return (
    <table id="admin-services-table" className="w-full border-collapse min-w-[850px]">
      <thead className="text-[0.6rem] text-gold uppercase tracking-[0.2em] border-b border-gold/10">
        <tr>
          <th className="text-left py-4 px-4">Order</th>
          <th className="text-left py-4 px-4">Service Details</th>
          <th className="text-left py-4 px-4">Category</th>
          <th className="text-left py-4 px-4">Display Status</th>
          <th className="text-right py-4 px-4">Control</th>
        </tr>
      </thead>
      <tbody className="text-xs text-text-secondary">
        {filteredServices.map((serv, index) => {
          // Find actual index in primary unfiltered array
          const actualIndex = services.findIndex(s => s.id === serv.id);
          return (
            <tr key={serv.id} className="border-b border-white/5 hover:bg-white/[0.02]">
              <td className="py-4 px-4">
                <div className="flex items-center gap-1">
                  <button 
                    disabled={actualIndex === 0}
                    onClick={() => handleShiftServiceOrder(actualIndex, 'up')}
                    className="p-1 text-text-secondary hover:text-gold disabled:opacity-20 translate-y-[1px]"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button 
                    disabled={actualIndex === services.length - 1}
                    onClick={() => handleShiftServiceOrder(actualIndex, 'down')}
                    className="p-1 text-text-secondary hover:text-gold disabled:opacity-20 translate-y-[-1px]"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <span className="font-mono text-[10px] text-text-secondary/40 ml-1">#{serv.order_index}</span>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl pt-0.5">{serv.ico}</span>
                  <div>
                    <p className="text-cream text-base font-serif font-medium">{serv.name}</p>
                    {serv.price && <p className="text-[10px] text-[#D4AF37] font-semibold mt-0.5">{serv.price}</p>}
                    <p className="text-xs text-text-secondary/70 max-w-md line-clamp-2 mt-1">{serv.desc}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 uppercase tracking-widest text-[10px] text-gold">
                {serv.cat}
              </td>
              <td className="py-4 px-4">
                <button 
                  onClick={() => toggleServiceVisibility(serv)}
                  className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest ${
                    serv.visible !== false ? 'text-green-400' : 'text-red-400 opacity-60'
                  }`}
                >
                  {serv.visible !== false ? (
                    <><Eye size={12} /> Visible</>
                  ) : (
                    <><EyeOff size={12} /> Hidden</>
                  )}
                </button>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => openServiceModal(serv)}
                    className="p-2 text-text-secondary hover:text-gold hover:bg-white/5 rounded"
                    title="Edit Service Settings"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteService(serv.id)}
                    className="p-2 text-text-secondary hover:text-red-400 hover:bg-white/5 rounded"
                    title="Delete Service Offering"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
        {filteredServices.length === 0 && (
          <tr>
            <td colSpan={5} className="py-20 text-center text-text-secondary uppercase tracking-widest opacity-40">
              No service catalog items.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
