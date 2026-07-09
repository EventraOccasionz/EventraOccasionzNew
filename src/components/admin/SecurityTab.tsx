import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, ShieldCheck, Loader2, Key, HelpCircle } from 'lucide-react';
import { auth } from '../../lib/firebase';

export default function SecurityTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetch2FaStatus = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const res = await fetch(`/api/2fa/status?uid=${user.uid}`);
      const data = await res.json();
      if (res.ok) {
        setEnabled(data.enabled);
      } else {
        throw new Error(data.error || 'Failed to fetch 2FA status.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with security servers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch2FaStatus();
  }, []);

  const handleDisable = async () => {
    if (!confirm('WARNING: Disabling Two-Factor Authentication reduces account security. Are you sure you want to proceed?')) return;
    
    setUpdating(true);
    setError('');
    setSuccess('');
    
    const user = auth.currentUser;
    if (!user) {
      setError('Session expired. Please log in again.');
      setUpdating(false);
      return;
    }

    try {
      const response = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA.');
      }

      setEnabled(false);
      setSuccess('Two-factor authentication has been successfully disabled.');
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA.');
    } finally {
      setUpdating(false);
    }
  };

  const handleEnable = () => {
    navigate('/admin/enable-2fa');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin text-gold" size={40} />
        <p className="text-sm text-text-secondary uppercase tracking-widest font-thin">Querying Security Config...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 bg-dark-3/50 border border-white/5 rounded-2xl">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="p-3 bg-gold/10 border border-gold/20 text-gold rounded-xl">
          <Shield size={24} />
        </div>
        <div>
          <h3 className="font-serif text-2xl text-cream">Portal Access Security</h3>
          <p className="text-xs text-text-secondary uppercase tracking-widest">Manage Two-Factor Authentication (2FA) clearances</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-xs uppercase tracking-widest rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-gold/10 border border-gold/30 text-gold text-xs uppercase tracking-widest rounded-lg animate-pulse">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        <div className="md:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-sm text-cream font-medium tracking-wide uppercase">Google Authenticator (TOTP)</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Two-Factor Authentication adds a rigorous security gate to your admin clearance. When enabled, signing in will require your secret Google Authenticator 6-digit dynamic code, or one of your secure downloadable recovery keys, in addition to your password credentials.
            </p>
            <div className="bg-black/20 p-4 border border-white/5 rounded-xl space-y-2 text-[11px] text-text-secondary leading-relaxed">
              <span className="text-gold font-bold uppercase tracking-wider block flex items-center gap-2">
                <HelpCircle size={14} /> Security Recommendations:
              </span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Never share your 2FA QR code or secret text key with anyone.</li>
                <li>Store your printed recovery codes in a secure offline safe or drawer.</li>
                <li>Ensure your mobile device's time clock is accurately synchronized.</li>
              </ul>
            </div>
          </div>

          <div>
            {enabled ? (
              <button
                disabled={updating}
                onClick={handleDisable}
                className="px-6 py-3 bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs uppercase tracking-widest font-bold flex items-center gap-2 rounded-lg transition-all"
              >
                {updating ? <Loader2 className="animate-spin" size={16} /> : 'Disable Two-Factor Authentication'}
              </button>
            ) : (
              <button
                onClick={handleEnable}
                className="px-6 py-3 bg-gold text-dark hover:bg-gold-light text-xs uppercase tracking-widest font-bold flex items-center gap-2 rounded-lg hover:shadow-lg transition-all"
              >
                <Key size={16} /> Setup Two-Factor Authentication
              </button>
            )}
          </div>
        </div>

        {/* Status Card Visualizer */}
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-inner">
          {enabled ? (
            <>
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/5 animate-pulse">
                <ShieldCheck size={36} />
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 uppercase tracking-[0.2em] font-bold block">Status: SECURE</span>
                <h4 className="font-serif text-cream mt-1">2FA Clearances Active</h4>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                Your portal identifier is fortified. Authenticator binds are locked in.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/5">
                <ShieldAlert size={36} />
              </div>
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-[0.2em] font-bold block">Status: VULNERABLE</span>
                <h4 className="font-serif text-cream mt-1">2FA Clearance Bypassed</h4>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                Only password credentials are currently guarding your administrator node.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
