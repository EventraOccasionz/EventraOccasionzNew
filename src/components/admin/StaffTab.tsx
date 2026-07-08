import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/dataService';
import { RegisteredAccount } from '../../types';
import { ShieldAlert, ShieldCheck, UserPlus, Search, Edit2, Save, X, Phone, User, RefreshCw, CheckCircle, Mail } from 'lucide-react';

export default function StaffTab() {
  const [accounts, setAccounts] = useState<RegisteredAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [editPhone, setEditPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAccounts();
      setAccounts(data);
    } catch (e: any) {
      console.error(e);
      showToast('error', 'Failed to retrieve accounts. Verify database permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStartEdit = (account: RegisteredAccount) => {
    setEditingId(account.id);
    setEditRole(account.role || 'user');
    setEditPhone(account.phone_number || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    setUpdating(true);
    try {
      // Validate phone number format if provided
      const cleanPhone = editPhone.trim();
      if (cleanPhone && !/^\+?[1-9]\d{1,14}$/.test(cleanPhone)) {
        showToast('error', 'Invalid phone number format. Use E.164 (e.g. +15555555555).');
        setUpdating(false);
        return;
      }

      await dataService.updateUserRoleAndPhone(id, editRole, cleanPhone);
      showToast('success', 'User clearance and authentication profile updated successfully.');
      setEditingId(null);
      fetchAccounts();
    } catch (e: any) {
      console.error(e);
      showToast('error', e.message || 'Failed to update user profile.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredAccounts = accounts.filter(acc => {
    const term = searchTerm.toLowerCase().trim();
    return (
      (acc.name || '').toLowerCase().includes(term) ||
      (acc.email || '').toLowerCase().includes(term) ||
      (acc.phone_number || '').toLowerCase().includes(term) ||
      (acc.role || '').toLowerCase().includes(term)
    );
  });

  return (
    <div id="staff-roles-panel" className="space-y-6">
      {/* Toast message internal to tab */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[3000] px-5 py-3 rounded-lg border shadow-lg ${
          toast.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-100' : 'bg-gold/10 border-gold/40 text-gold'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
        <div>
          <h4 className="font-serif text-2xl text-cream flex items-center gap-2 italic">
            <ShieldCheck className="text-gold" size={22} /> Administrators & Staff Clearance
          </h4>
          <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">
            Manage administrative privilege levels and secure 2FA/OTP whitelisted mobile numbers
          </p>
        </div>
        <button 
          onClick={fetchAccounts}
          className="px-4 py-2 border border-gold/20 text-gold text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-gold/10 transition-all font-semibold"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Reload Staff
        </button>
      </div>

      {/* Info notice block */}
      <div className="bg-gold/5 border border-gold/20 p-4 rounded-xl text-[11px] text-text-secondary leading-relaxed">
        <span className="text-gold font-bold uppercase tracking-wider block mb-1">How Admin Security Works:</span>
        To authorize another user as an administrator:
        <ol className="list-decimal pl-5 mt-1 space-y-1">
          <li>Have them register (create an account) with their email via the <strong className="text-cream">Client Portal</strong> on the main landing page.</li>
          <li>Find their registered account in the list below, click <strong className="text-cream">Edit Clearance</strong>, set their role to <strong className="text-gold">Admin</strong>, and input their <strong className="text-cream">whitelisted phone number</strong> (E.164 format with country code, e.g. <strong className="text-gold font-mono">+15555555555</strong>).</li>
          <li>Upon their next login to the <strong className="text-cream">Admin Portal</strong>, they will be sent a secure SMS OTP verification code to that mobile number to complete authentication.</li>
        </ol>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
        <input 
          type="text" 
          placeholder="Filter registered users..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/5 pl-9 pr-4 py-2.5 text-xs outline-none focus:border-gold transition-colors text-cream rounded-lg"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="animate-spin text-gold" size={32} />
          <p className="text-[10px] text-text-secondary uppercase tracking-widest font-light">Retrieving user clearing details...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-black/10">
          <p className="text-sm text-text-secondary">No registered users found matching these search criteria.</p>
        </div>
      ) : (
        <div className="border border-white/5 rounded-xl overflow-hidden bg-black/10">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase tracking-wider text-text-secondary">
                <th className="p-4 font-semibold">User details</th>
                <th className="p-4 font-semibold">Access Privilege</th>
                <th className="p-4 font-semibold">Whitelisted SMS 2FA</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAccounts.map((acc) => {
                const isEditing = editingId === acc.id;
                const isSelf = acc.email === localStorage.getItem('user_email');

                return (
                  <tr key={acc.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold">
                          {acc.name ? acc.name.charAt(0).toUpperCase() : <User size={14} />}
                        </div>
                        <div>
                          <p className="font-medium text-cream flex items-center gap-1.5">
                            {acc.name || 'Anonymous User'}
                            {isSelf && (
                              <span className="text-[9px] bg-gold/20 text-gold px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                Super Admin
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-text-secondary font-mono flex items-center gap-1">
                            <Mail size={10} className="opacity-60" />
                            {acc.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <select
                          disabled={isSelf}
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as 'user' | 'admin')}
                          className="bg-dark border border-gold/30 rounded px-2.5 py-1.5 text-xs text-cream outline-none focus:border-gold"
                        >
                          <option value="user">User (Guest Portal Only)</option>
                          <option value="admin">Admin (Clearance Level)</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold ${
                          acc.role === 'admin' 
                            ? 'bg-gold/15 text-gold border border-gold/30' 
                            : 'bg-white/5 text-text-secondary border border-white/10'
                        }`}>
                          {acc.role || 'user'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-[11px]">
                      {isEditing ? (
                        <div className="relative max-w-[180px]">
                          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gold/50" size={12} />
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="+1555555555"
                            className="bg-dark border border-gold/30 rounded pl-7 pr-2 py-1.5 w-full text-cream outline-none focus:border-gold"
                          />
                        </div>
                      ) : (
                        acc.phone_number ? (
                          <span className="text-cream flex items-center gap-1.5">
                            <Phone size={12} className="text-gold/60" />
                            {acc.phone_number}
                          </span>
                        ) : (
                          <span className="text-text-secondary/50 italic flex items-center gap-1.5">
                            <ShieldAlert size={12} className="text-amber-500/60" />
                            No 2FA whitelisted (Requires step-2 fallback)
                          </span>
                        )
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSaveEdit(acc.id)}
                            disabled={updating}
                            className="p-1.5 bg-gold/15 hover:bg-gold/30 border border-gold/40 text-gold rounded-md transition-all flex items-center gap-1"
                            title="Save clearance changes"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-cream rounded-md transition-all flex items-center gap-1"
                            title="Cancel modification"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(acc)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-gold/10 border border-white/5 hover:border-gold/30 text-text-secondary hover:text-gold rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <Edit2 size={11} /> Edit Clearance
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
