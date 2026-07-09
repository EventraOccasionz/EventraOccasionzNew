import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../lib/firebase';
import { Shield, Key, Download, Copy, Check, Loader2, AlertTriangle, ArrowRight, LogOut } from 'lucide-react';
import { dataService } from '../lib/dataService';

export default function EnableTwoFactor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    
    const initiateSetup = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/admin/login');
        return;
      }

      try {
        const response = await fetch('/api/2fa/setup-initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to generate 2FA credentials.';
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) errorMessage = errorJson.error;
          } catch (_) {}
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (active) {
          setQrCode(data.qrCodeUrl);
          setRecoveryCodes(data.recoveryCodes);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to connect to the authentication server.');
          setLoading(false);
        }
      }
    };

    initiateSetup();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleCopyCodes = () => {
    const codesText = recoveryCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCodes = () => {
    const email = auth.currentUser?.email || 'Admin';
    const text = `EVENTRA OCCASIONZ - 2FA RECOVERY CODES\n=======================================\n\nAdmin Account: ${email}\nGenerated: ${new Date().toLocaleString()}\n\nKeep these codes in a very secure, offline place.\nEach code can be used ONLY ONCE to login if you lose access to your Authenticator app.\n\nRecovery Codes:\n${recoveryCodes.map((c, i) => `[ ] Code ${String(i+1).padStart(2, '0')}: ${c}`).join('\n')}\n\n=======================================\nSecurity Protocol Active. Keep confidential.\n`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `eventra_2fa_recovery_codes_${email.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    link.click();
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setVerifying(true);
    setError('');

    const user = auth.currentUser;
    if (!user) {
      setError('Session expired. Please log in again.');
      setVerifying(false);
      return;
    }

    try {
      const response = await fetch('/api/2fa/setup-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          code: code
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Setup verification failed. Incorrect code.';
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) errorMessage = errorJson.error;
        } catch (_) {}
        throw new Error(errorMessage);
      }
      
      const data = await response.json();

      // Mark local storage as 2FA-verified
      localStorage.setItem('admin_otp_verified', 'true');
      localStorage.setItem('admin_otp_timestamp', Date.now().toString());

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Incorrect verification code. Please check your app and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dataService.logout();
    } catch (e) {}
    localStorage.removeItem('is_admin');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex flex-col items-center justify-center bg-dark-4 text-cream">
        <div className="flex flex-col items-center gap-4 p-8 bg-dark-2 border border-gold/20 max-w-sm text-center">
          <Loader2 className="animate-spin text-gold" size={32} />
          <h3 className="font-serif text-lg text-cream tracking-tight">Securing Portal Connection</h3>
          <p className="text-xs text-text-secondary uppercase tracking-widest">Generating unique TOTP keypair...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-6 bg-dark-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl p-10 bg-dark-2 border border-gold/40 relative z-10"
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-dark-3 border border-gold/40 rounded-full flex items-center justify-center text-gold">
          <Shield size={40} />
        </div>

        <div className="text-center mt-6 mb-8">
          <h2 className="font-serif text-3xl text-cream mb-2 tracking-tight">Two-Factor Authentication Setup</h2>
          <div className="w-10 h-[1px] bg-gold mx-auto mb-4" />
          <p className="text-[0.65rem] text-text-secondary uppercase tracking-[0.2em] leading-relaxed max-w-md mx-auto">
            Enhance administrative clearance security. Scan the QR code below to bind Google Authenticator.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12 space-y-4"
            >
              <div className="w-16 h-16 bg-gold/10 border border-gold/40 rounded-full flex items-center justify-center text-gold mx-auto animate-bounce">
                <Check size={32} />
              </div>
              <h3 className="font-serif text-2xl text-cream">Setup Complete</h3>
              <p className="text-xs text-text-secondary uppercase tracking-widest">
                2FA is now fully active. Redirecting to Eventra Workspace...
              </p>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {error && (
                <div className="flex items-center gap-3 bg-red-950/20 border border-red-500/20 p-4 text-red-400 text-xs uppercase tracking-wider rounded">
                  <AlertTriangle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* QR Code and Instructions */}
                <div className="space-y-4 text-center md:text-left">
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-gold font-bold block">Step 1: Scan QR Code</span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Open your Google Authenticator, Authy, or compatible TOTP client, click add account, and scan this QR code:
                  </p>
                  
                  <div className="bg-white p-3 rounded-xl inline-block mx-auto md:mx-0 shadow-lg border border-gold/20">
                    {qrCode && (
                      <img 
                        src={qrCode} 
                        alt="2FA QR Code" 
                        className="w-40 h-40" 
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                  
                  <div className="bg-dark-3 border border-white/5 p-3 rounded text-[10px] text-text-secondary font-mono leading-relaxed uppercase tracking-wider">
                    ✦ Issue scanning? Bind account manually with issuer: <span className="text-gold">Eventra Occasionz</span>.
                  </div>
                </div>

                {/* Recovery Codes */}
                <div className="space-y-4">
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-gold font-bold block">Step 2: Save Recovery Codes</span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Save these 10 one-time recovery codes. If you ever lose your phone, you can enter any code to access your admin account.
                  </p>

                  <div className="bg-dark-3 border border-gold/10 p-4 rounded-lg font-mono text-xs text-cream grid grid-cols-2 gap-2 text-center shadow-inner relative group">
                    {recoveryCodes.map((c, i) => (
                      <div key={i} className="py-1 bg-white/5 border border-white/5 rounded text-[11px] tracking-wider select-all">
                        {c}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 justify-center md:justify-start">
                    <button
                      onClick={handleCopyCodes}
                      className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-cream text-[0.65rem] uppercase tracking-widest font-bold flex items-center gap-2 rounded transition-all"
                    >
                      {copied ? <Check size={12} className="text-gold" /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy All'}
                    </button>
                    <button
                      onClick={handleDownloadCodes}
                      className="px-4 py-2 bg-gold/15 border border-gold/30 hover:bg-gold/20 text-gold text-[0.65rem] uppercase tracking-widest font-bold flex items-center gap-2 rounded transition-all"
                    >
                      <Download size={12} />
                      Download Codes (.txt)
                    </button>
                  </div>
                </div>
              </div>

              {/* Verify form */}
              <div className="pt-6 border-t border-white/5">
                <form onSubmit={handleVerifySetup} className="max-w-md mx-auto space-y-6">
                  <div className="text-center space-y-2">
                    <span className="text-[0.6rem] uppercase tracking-[0.2em] text-gold font-bold block">Step 3: Verification Check</span>
                    <p className="text-xs text-text-secondary">
                      Enter the current 6-digit verification code from your Authenticator app to finalize set up:
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 max-w-[240px] mx-auto">
                    <input
                      required
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="bg-white/5 border border-gold/20 p-4 text-text-primary outline-none focus:border-gold transition-colors text-center text-3xl tracking-[0.5em] font-mono"
                      placeholder="000000"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 py-4 border border-white/10 text-cream text-[0.68rem] tracking-[0.3em] uppercase font-bold transition-all hover:bg-white/5 rounded-lg flex items-center justify-center gap-2"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                    <button
                      disabled={verifying || code.length !== 6}
                      type="submit"
                      className="flex-grow-[2] py-4 bg-gold text-dark text-[0.68rem] tracking-[0.3em] uppercase font-bold transition-all hover:bg-gold-light disabled:opacity-50 rounded-lg flex items-center justify-center gap-2"
                    >
                      {verifying ? <Loader2 className="animate-spin" size={16} /> : (
                        <>
                          Activate 2FA <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-gold/10 text-center">
          <p className="text-[0.55rem] text-text-secondary/40 uppercase tracking-widest font-mono">
            Secure Cryptographic Setup • Admin Token Active
          </p>
        </div>
      </motion.div>
    </div>
  );
}
