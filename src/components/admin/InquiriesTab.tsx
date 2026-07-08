import React from 'react';
import { Inquiry } from '../../types';
import { Trash2 } from 'lucide-react';

interface InquiriesTabProps {
  filteredInquiries: Inquiry[];
  handleUpdateInquiryStatus: (id: string, status: 'Pending' | 'Contacted' | 'Completed') => Promise<void>;
  handleDeleteInquiry: (id: string) => Promise<void>;
}

export default function InquiriesTab({ 
  filteredInquiries, 
  handleUpdateInquiryStatus, 
  handleDeleteInquiry 
}: InquiriesTabProps) {
  return (
    <table id="admin-inquiries-table" className="w-full border-collapse min-w-[900px]">
      <thead className="text-[0.6rem] text-gold uppercase tracking-[0.2em] border-b border-gold/10">
        <tr>
          <th className="text-left py-4 px-4">Enquirer</th>
          <th className="text-left py-4 px-4">Contact</th>
          <th className="text-left py-4 px-4">Required Arrangement</th>
          <th className="text-left py-4 px-4">Status Tracker</th>
          <th className="text-right py-4 px-4">Actions</th>
        </tr>
      </thead>
      <tbody className="text-xs text-text-secondary">
        {filteredInquiries.map((inq) => (
          <tr key={inq.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
            <td className="py-5 px-4 font-serif text-cream">
              {inq.name}
            </td>
            <td className="py-5 px-4 font-mono">
              <p className="text-sm text-cream/90">{inq.email}</p>
              <p className="text-[10px] text-text-secondary/50 mt-1">Phone: {inq.phone}</p>
            </td>
            <td className="py-5 px-4">
              <span className="text-gold/90 font-medium">{inq.service_selected}</span>
              <p className="text-xs italic mt-1 text-text-secondary line-clamp-2" title={inq.message}>"{inq.message}"</p>
            </td>
            <td className="py-5 px-4">
              <select 
                value={inq.status}
                onChange={e => handleUpdateInquiryStatus(inq.id, e.target.value as any)}
                className={`p-2 bg-black/40 border text-xs font-semibold rounded-md uppercase outline-none cursor-pointer ${
                  inq.status === 'Completed' 
                    ? 'border-green-500/40 text-green-400' 
                    : inq.status === 'Contacted' 
                      ? 'border-blue-500/40 text-blue-400' 
                      : 'border-amber-500/40 text-amber-400'
                }`}
              >
                <option value="Pending" className="bg-[#121212]">Pending</option>
                <option value="Contacted" className="bg-[#121212]">Contacted</option>
                <option value="Completed" className="bg-[#121212]">Completed</option>
              </select>
            </td>
            <td className="py-5 px-4 text-right">
              <button
                onClick={() => handleDeleteInquiry(inq.id)}
                className="text-text-secondary hover:text-red-500 p-2 rounded transition-colors"
                title="Delete Inquiry Profile"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
        {filteredInquiries.length === 0 && (
          <tr>
            <td colSpan={5} className="py-20 text-center text-text-secondary uppercase tracking-widest opacity-45">
              No enquiry submissions match search parameters.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
