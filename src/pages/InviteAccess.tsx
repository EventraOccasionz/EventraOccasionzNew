import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { dataService } from '../lib/dataService';
import { KeyRound, Loader2 } from 'lucide-react';

export default function InviteAccess() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const family = await dataService.getFamilyByCode(code);

      if (!family) {
        setError('Invalid access code. Please check and try again.');
        return;
      }

      // Store access session
      sessionStorage.setItem(`access_${family.slug}`, 'true');
      navigate(`/invite/${family.slug}`);
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 px-6 bg-[radial-gradient(ellipse_at_center,#1a1206_0%,#090705_70%)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="premium-card w-full max-w-md p-8 md:p-12 text-center"
      >
        <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <div className="mb-10">
          <KeyRound className="mx-auto text-gold mb-6" size={48} />
          <h2 className="font-serif text-3xl text-cream mb-4 tracking-tight">Access Invitation</h2>
          <div className="w-10 h-[1px] bg-gold mx-auto mb-4" />
          <p className="text-[10px] text-text-secondary uppercase tracking-[0.2em] leading-relaxed">
            Please enter your unique family access code.
          </p>
        </div>

        <form onSubmit={handleAccess} className="space-y-6">
          <div className="flex flex-col gap-2">
            <input
              required
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl p-4 text-center text-xl tracking-[0.4em] text-text-primary outline-none focus:border-gold transition-colors uppercase"
              placeholder="CODE"
            />
            {error && <p className="text-red-400 text-[9px] text-center mt-1 uppercase tracking-widest">{error}</p>}
          </div>

          <button
            disabled={loading}
            type="submit"
            className="btn-primary w-full py-4 text-[13px]"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Reveal Invitation'}
          </button>
        </form>

        <p className="mt-10 text-center text-[0.6rem] text-text-secondary/60 uppercase tracking-[0.1em]">
          Don't have a code? Please contact the host family or event manager.
        </p>
      </motion.div>
    </div>
  );
}
