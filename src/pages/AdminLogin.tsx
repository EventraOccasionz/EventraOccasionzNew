import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { dataService } from '../lib/dataService';
import { verifyFirebaseConnection, db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Mail, ShieldCheck, Loader2, AlertTriangle, RefreshCcw, Database, Lock, Key } from 'lucide-react';

export default function AdminLogin() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  
  const [previewUrl, setPreviewUrl] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [lockoutTimer, setLockoutTimer] = useState(0);

  
  const logSecurityEvent = async (action: string, details: string, email: string) => {
    try {
      await setDoc(doc(db, 'audit_logs', Date.now().toString() + '-' + Math.random().toString(36).substring(7)), {
        action,
        details,
        email,
        timestamp: new Date().toISOString(),
        ip: 'client'
      });
    } catch (e) {
      console.error('Audit log failed', e);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();
  const isConfigured = dataService.isConfigured();

  useEffect(() => {
    const lockedUntil = localStorage.getItem('admin_lockout');
    if (lockedUntil && parseInt(lockedUntil) > Date.now()) {
      setLockoutTimer(Math.ceil((parseInt(lockedUntil) - Date.now()) / 1000));
    }
  }, [isConfigured]);

  useEffect(() => {
    let timer: any;
    if (lockoutTimer > 0) {
      timer = setInterval(() => setLockoutTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setLoading(true);
    setError('');
    const emailClean = email.toLowerCase().trim();
    try {
      const { user, role } = await dataService.login(emailClean, password);

      if (role !== 'admin') {
        await dataService.logout();
        throw new Error('Authorized access denied. You do not possess administrator level clearance.');
      }

      // Generate a secure 6-digit OTP code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Save the OTP in Firestore under the admin_otps collection
      await setDoc(doc(db, 'admin_otps', user.uid), {
        email: emailClean,
        code: otpCode,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
        verified: false,
        updatedAt: new Date().toISOString()
      });

      // Retrieve mobile number from Firestore to send OTP over MSG91 SMS if available
      let mobileNumber = '';
      try {
        const profileDoc = await getDoc(doc(db, 'registered_accounts', user.uid));
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          mobileNumber = profileData.phone || profileData.mobile || profileData.phoneNumber || '';
        }

        // Also query admin_config for any customized/additional mapping
        if (!mobileNumber) {
          const configDoc = await getDoc(doc(db, 'venue_settings', 'admin_config'));
          if (configDoc.exists()) {
            const configData = configDoc.data();
            if (configData.mobiles && configData.mobiles[emailClean]) {
              mobileNumber = configData.mobiles[emailClean];
            } else if (configData.mobile) {
              mobileNumber = configData.mobile;
            }
          }
        }
      } catch (dbErr) {
        console.warn('Could not fetch mobile number for 2FA, using default flow:', dbErr);
      }

      // Dispatch OTP email/SMS via our backend service
      try {
        const response = await fetch('/api/send-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: emailClean, 
            otp: otpCode,
            mobile: mobileNumber || undefined
          })
        });
        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || 'Failed to dispatch security code email.');
        }
        if (resData.previewUrl) {
          setPreviewUrl(resData.previewUrl);
        }
        if (resData.otp) {
          setDevOtp(resData.otp);
        }
      } catch (emailErr: any) {
        console.error('Email dispatch failed, but OTP is saved in Firestore:', emailErr);
        // We still continue to step 2 so user can login, they can check console or we can show a notice
      }

      localStorage.removeItem('admin_failed_attempts');
      await logSecurityEvent('LOGIN_STEP1_SUCCESS', 'Email and password verified, OTP generated', emailClean);
      setStep(2);

    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check your credentials.');
      await logSecurityEvent('LOGIN_FAILED', err?.message || 'Invalid credentials', emailClean);
      
      const attempts = parseInt(localStorage.getItem('admin_failed_attempts') || '0') + 1;
      localStorage.setItem('admin_failed_attempts', attempts.toString());
      if (attempts >= 5) {
        const lockoutTime = Date.now() + 15 * 60 * 1000;
        localStorage.setItem('admin_lockout', lockoutTime.toString());
        setLockoutTimer(15 * 60);
        setError('Too many failed attempts. Account temporarily locked for 15 minutes.');
        await logSecurityEvent('ACCOUNT_LOCKED', 'Account locked due to 5 failed login attempts', emailClean);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!auth.currentUser) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const uid = auth.currentUser.uid;
      const otpDocRef = doc(db, 'admin_otps', uid);
      const otpDoc = await getDoc(otpDocRef);

      if (!otpDoc.exists()) {
        throw new Error('Verification session not found. Please log in again.');
      }

      const otpData = otpDoc.data();
      if (otpData.verified) {
        throw new Error('This security code has already been verified.');
      }

      if (Date.now() > otpData.expiresAt) {
        throw new Error('The security code has expired. Please log in again to request a new one.');
      }

      if (otpData.code !== otp.trim()) {
        throw new Error('Incorrect code. Please verify the code sent to your email.');
      }

      // Mark OTP as verified
      await setDoc(otpDocRef, { verified: true }, { merge: true });
      
      await logSecurityEvent('LOGIN_SUCCESS', 'Email OTP verification successful, admin logged in', email);
      localStorage.setItem('admin_otp_verified', 'true');
      localStorage.setItem('admin_otp_timestamp', Date.now().toString());
      
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid OTP code. Please try again.');
      await logSecurityEvent('OTP_FAILED', err.message || 'Invalid OTP code entered', email);
      
      const otpAttempts = parseInt(localStorage.getItem('admin_otp_failed_attempts') || '0') + 1;
      localStorage.setItem('admin_otp_failed_attempts', otpAttempts.toString());
      if (otpAttempts >= 3) {
        setStep(1);
        setOtp('');
        setError('Too many failed OTP attempts. Please login again to request a new code.');
        localStorage.removeItem('admin_otp_failed_attempts');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetryConnection = async () => {
    setRetrying(true);
    try {
      const conn = await verifyFirebaseConnection();
      if (conn.success) {
        window.location.reload();
      } else {
        setError(conn.error || 'Connection attempt failed. Database is still offline.');
      }
    } catch (err) {
      setError('Database integration could not be reached.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 px-6 bg-dark-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 bg-dark-2 border border-gold/40 relative z-10"
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-dark-3 border border-gold/40 rounded-full flex items-center justify-center text-gold">
          {isConfigured ? <ShieldCheck size={40} /> : <AlertTriangle className="text-red-400" size={40} />}
        </div>
        <div className="text-center mt-6 mb-10">
          <h2 className="font-serif text-3xl text-cream mb-2 tracking-tight">Admin Portal</h2>
          <div className="w-10 h-[1px] bg-gold mx-auto mb-4" />
          <p className="text-[0.6rem] text-text-secondary uppercase tracking-[0.2em]">
            Authorized personnel only. Eventra Management System.
          </p>
        </div>

        {!isConfigured ? (
          <div className="space-y-6">
            <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-lg text-center space-y-4">
              <Database className="mx-auto text-red-400/80 mb-2" size={32} />
              <h3 className="text-xs uppercase tracking-widest text-red-400 font-bold">Secure Service Unavailable</h3>
              <p className="text-[11px] text-text-secondary leading-relaxed uppercase tracking-wider">
                The database server is currently offline or unconfigured. 
                All administrative interfaces and protected resources are locked securely.
              </p>
            </div>
            {error && (
              <p className="text-red-400 text-[10px] text-center uppercase tracking-wider bg-red-950/10 p-3 border border-red-500/10">
                {error}
              </p>
            )}
            <button
              onClick={handleRetryConnection}
              disabled={retrying}
              className="w-full py-4 bg-gold text-dark text-[0.74rem] tracking-[0.3em] uppercase font-bold transition-all hover:bg-gold-light disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {retrying ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <RefreshCcw size={14} className="animate-spin-slow" />
                  Retry Server Handshake
                </>
              )}
            </button>
          </div>
        ) : lockoutTimer > 0 ? (
          <div className="text-center p-6 bg-dark-3 rounded-xl border border-gold/20">
            <Lock className="w-12 h-12 text-gold mx-auto mb-4" />
            <h3 className="text-lg text-cream mb-2 tracking-wide">Account Temporarily Locked</h3>
            <p className="text-text-secondary text-sm">
              Please try again in {Math.floor(lockoutTimer / 60)}:{(lockoutTimer % 60).toString().padStart(2, '0')} minutes.
            </p>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[0.6rem] uppercase tracking-widest text-text-secondary ml-1">Email Identifier</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border border-gold/20 p-4 text-text-primary outline-none focus:border-gold transition-colors"
                placeholder="admin@eventra.com"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[0.6rem] uppercase tracking-widest text-text-secondary ml-1">Secure Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border border-gold/20 p-4 text-text-primary outline-none focus:border-gold transition-colors"
                placeholder="••••••••"
              />
              {error && <p className="text-red-400 text-[0.65rem] mt-1 uppercase tracking-widest">{error}</p>}
            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full py-4 bg-gold text-dark text-[0.74rem] tracking-[0.3em] uppercase font-bold transition-all hover:bg-gold-light disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Authenticate'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center p-4 bg-dark-3 rounded-xl border border-gold/20 flex flex-col items-center gap-2">
              <Mail className="w-8 h-8 text-gold mb-1" />
              <p className="text-text-secondary text-xs tracking-wide leading-relaxed">
                A 2FA verification code has been dispatched to your registered email address:<br/>
                <span className="text-cream font-bold block mt-1 font-mono">{email}</span>
              </p>
            </div>

            {previewUrl && (
              <div className="p-4 bg-gold/5 border border-gold/20 text-[10px] text-text-secondary rounded-lg leading-relaxed text-center space-y-2">
                <span className="font-bold text-gold uppercase tracking-wider block">✦ Developer Mailbox Access ✦</span>
                <p>Since the system is running in the sandbox workspace, the email has been sent via an Ethereal SMTP test account. You can open the mailbox below to read the message and retrieve the OTP code:</p>
                <a 
                  href={previewUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-block px-3 py-1.5 bg-gold/15 hover:bg-gold/30 border border-gold/40 text-gold font-bold rounded uppercase tracking-wider text-[9px] transition-all"
                >
                  Open Ethereal Mailbox ↗
                </a>
              </div>
            )}

            {!previewUrl && devOtp && (
              <div className="p-4 bg-gold/5 border border-gold/20 text-[10px] text-text-secondary rounded-lg leading-relaxed text-center space-y-1">
                <span className="font-bold text-gold uppercase tracking-wider block">✦ Sandbox Developer Mode ✦</span>
                <p>The campaign API was triggered successfully. For instant sandbox verification, your generated 2FA security code is:</p>
                <span className="text-xl text-gold font-bold block tracking-[0.2em] font-mono select-all bg-white/5 py-1.5 rounded mt-1">{devOtp}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[0.6rem] uppercase tracking-widest text-text-secondary ml-1">6-Digit Code</label>
              <input
                required
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="bg-white/5 border border-gold/20 p-4 text-text-primary outline-none focus:border-gold transition-colors text-center text-2xl tracking-[0.5em]"
                placeholder="000000"
              />
              {error && <p className="text-red-400 text-[0.65rem] mt-1 uppercase tracking-widest">{error}</p>}
            </div>

            <button
              disabled={loading || otp.length !== 6}
              type="submit"
              className="w-full py-4 bg-gold text-dark text-[0.74rem] tracking-[0.3em] uppercase font-bold transition-all hover:bg-gold-light disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify & Access'}
            </button>
          </form>
        )}

        <div className="mt-10 pt-6 border-t border-gold/10 text-center space-y-2">
            <p className="text-[0.55rem] text-text-secondary/50 uppercase tracking-widest">
                Security Protocol Active. All attempts logged.
            </p>
        </div>
      </motion.div>
    </div>
  );
}
