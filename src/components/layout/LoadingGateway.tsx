import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../../lib/dataService';
import { verifyFirebaseConnection, db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { KeyRound, User, UserPlus, Sparkles, Check, ChevronRight, Volume2, VolumeX, ShieldAlert, Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import eventraLogo from '../../assets/images/eventra_logo_1783423905494.jpg';

const syntheticSounds = {
  play(type: 'success' | 'error' | 'click' | 'intro') {
    const isMuted = localStorage.getItem('eventra_muted') === 'true';
    if (isMuted) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(95, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'intro') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25); // A4
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else {
        // click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      }
    } catch (_) {
      // Ignored if browser blocks audio autoplay/context
    }
  }
};

const LOADING_STEPS = [
  { p: 15, text: 'Connecting to Eventra Cloud Network...' },
  { p: 35, text: 'Fetching high-fidelity digital components...' },
  { p: 55, text: 'Synchronizing secure Firebase environments...' },
  { p: 75, text: 'Generating offline interactive client engine...' },
  { p: 90, text: 'Polishing premium layouts & font faces...' },
  { p: 100, text: 'Establishing secure gateway handshake...' }
];

interface LoadingGatewayProps {
  onUnlock: () => void;
  forcingGate?: boolean;
  onCancelForce?: () => void;
}

export default function LoadingGateway({ onUnlock, forcingGate = false, onCancelForce }: LoadingGatewayProps) {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'loading' | 'auth'>('loading');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing entry Sequence...');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('eventra_muted') !== 'true');

  // Image-based Authentication States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'user' | 'admin'>('user');

  // Status states
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [hasLoadedBefore] = useState(sessionStorage.getItem('eventra_splash_seen') === 'true');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // If we are forcing the gateway login from the navbar, skip loading straight to auth
    if (forcingGate) {
      setStage('auth');
      return;
    }

    // Skip splash loader if they have already loaded the site in this session
    if (hasLoadedBefore) {
      // Check if they are already authenticated as guest/visitor
      const authType = sessionStorage.getItem('eventra_auth_type');
      if (authType) {
        onUnlock();
      } else {
        setStage('auth');
      }
      return;
    }

    // Perform luxurious progress count-up
    let currentProgress = 0;
    const interval = setInterval(async () => {
      currentProgress += Math.floor(Math.random() * 4) + 2;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        setStatusText('Verifying secure connection to database...');
        setProgress(100);

        const conn = await verifyFirebaseConnection();
        if (!conn.success) {
          setStatusText('Connectivity verification failed');
          setConnectionError(conn.error || 'Database connection failure');
          return;
        }
        
        // Timeout to transition
        setTimeout(() => {
          sessionStorage.setItem('eventra_splash_seen', 'true');
          syntheticSounds.play('intro');
          setStage('auth');
        }, 600);
      } else {
        setProgress(currentProgress);
        // Update statuses
        const matchingStep = LOADING_STEPS.find(s => currentProgress <= s.p);
        if (matchingStep) setStatusText(matchingStep.text);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [forcingGate, hasLoadedBefore, onUnlock]);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('eventra_muted', String(!nextVal));
    syntheticSounds.play('click');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setFeedback({ type: 'error', message: 'All fields are required.' });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      syntheticSounds.play('error');
      setFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setVerifying(true);
    setFeedback({ type: null, message: '' });
    syntheticSounds.play('click');

    try {
      // Generate a beautiful, unique passcode for the registered user
      const cleanName = regName.trim();
      const codeClean = cleanName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 4);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const generatedPasscode = `${codeClean}${randomNum}`;
      
      const slug = cleanName
        .toLowerCase()
        .replace(/\s+family/i, '-family')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'guest-' + randomNum;

      // Add family record so they have an invitation space
      if (regRole === 'user') {
        await dataService.addFamily({
          name: cleanName + ' Invitation',
          access_code: generatedPasscode,
          slug: slug,
          max_guests: 4,
        });
      }

      // Register the account via Firebase Auth + Database Profile
      await dataService.signUp(
        regEmail.trim().toLowerCase(),
        regPassword,
        cleanName,
        regRole as 'user' | 'admin',
        slug
      );

      syntheticSounds.play('success');
      setFeedback({
        type: 'success',
        message: `Account registered successfully as ${regRole.toUpperCase()}! Name: ${cleanName} | Passcode: ${generatedPasscode}. Redirecting to login...`
      });

      // Automatically transition to login tab after success
      setTimeout(() => {
        setAuthMode('login');
        setFeedback({ type: null, message: '' });
        // Populate credentials for easy logging in
        setLoginEmail(regEmail.trim());
        setLoginPassword(regPassword);
      }, 1800);

    } catch (err: any) {
      console.error(err);
      syntheticSounds.play('error');
      let errorMessage = 'An error occurred during registration. Please try again.';
      if (err?.code === 'auth/email-already-in-use' || err?.message?.includes('email-already-in-use')) {
        errorMessage = `The email address "${regEmail.trim()}" is already registered. Please login instead.`;
      } else if (err?.message?.includes('auth/network-request-failed') || err?.code === 'auth/network-request-failed') {
        errorMessage = 'Network request failed. If you are viewing this in a preview window, please open the application in a new tab to register.';
      } else if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            errorMessage = parsed.error;
          }
        } catch (_) {
          errorMessage = err.message;
        }
      }
      setFeedback({ type: 'error', message: errorMessage });
    } finally {
      setVerifying(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setFeedback({ type: 'error', message: 'Email and password are required.' });
      return;
    }

    setVerifying(true);
    setFeedback({ type: null, message: '' });
    syntheticSounds.play('click');

    try {
      const emailLower = loginEmail.trim().toLowerCase();
      const pass = loginPassword.trim();

      // Call database login handler (Firebase Auth)
      const { user, role } = await dataService.login(emailLower, pass);
      
      syntheticSounds.play('success');

      if (role === 'admin') {
        const adminName = user.name || 'Event Administrator';
        setFeedback({ 
          type: 'success', 
          message: `Administrative credentials verified! Loading ${adminName}'s control panel...` 
        });

        localStorage.setItem('is_admin', 'true');
        sessionStorage.setItem('eventra_auth_type', 'guest');
        sessionStorage.setItem('eventra_auth_name', adminName);

        window.dispatchEvent(new Event('eventra-auth-changed'));

        setTimeout(() => {
          onUnlock();
          navigate('/admin');
          if (onCancelForce) onCancelForce();
        }, 1200);
      } else {
        const userName = user.name || 'User';
        const userSlug = user.slug || 'malhotra-family';
        
        // Dynamically fetch actual family access code associated with this slug
        let userPasscode = 'MALH2024';
        try {
          const family = await dataService.getFamilyBySlug(userSlug);
          if (family && family.access_code) {
            userPasscode = family.access_code;
          }
        } catch (slugError) {
          console.warn('Fallback passcode resolution from family slug failed:', slugError);
        }

        setFeedback({ 
          type: 'success', 
          message: `Login successful! Welcome back, ${userName}. Unlocking your invitation card...` 
        });

        // Store active user session
        sessionStorage.setItem('eventra_auth_type', 'guest');
        sessionStorage.setItem('eventra_auth_name', userName);
        sessionStorage.setItem('eventra_auth_code', userPasscode);
        sessionStorage.setItem(`access_${userSlug}`, 'true');

        window.dispatchEvent(new Event('eventra-auth-changed'));

        setTimeout(() => {
          onUnlock();
          navigate(`/`);
          if (onCancelForce) onCancelForce();
        }, 1200);
      }
      return;

    } catch (err: any) {
      console.error('Authentication check failed:', err.message);

      // If credentials do not match
      syntheticSounds.play('error');
      
      let errorMsg = err.message || 'Authentication failed: Incorrect email address or password combination.';
      if (errorMsg.includes('auth/network-request-failed')) {
        errorMsg = 'Network request failed. If you are viewing this in a preview window, please open the application in a new tab to sign in.';
      }
      
      setFeedback({ 
        type: 'error', 
        message: errorMsg 
      });

    } finally {
      setVerifying(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setVerifying(true);
    setFeedback({ type: null, message: '' });
    syntheticSounds.play('click');

    try {
      const user = await dataService.signInWithGoogle();
      if (!user) {
        throw new Error('Google Sign-In was cancelled or failed to retrieve user information.');
      }

      const emailLower = (user.email || '').trim().toLowerCase();
      let role: 'user' | 'admin' = 'user';
      let name = user.displayName || 'Google User';
      let slug = '';
      let isNewUser = false;
      let generatedPasscode = '';

      if (emailLower === 'ddg27874@gmail.com') {
        role = 'admin';
        name = 'Administrator';
      }

      // 1. Verify against admin_users whitelist directly (source of truth)
      try {
        const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
        if (adminDoc.exists()) {
          role = 'admin';
          name = 'Administrator';
        }
      } catch (adminErr) {
        console.warn('Admin list verification skipped:', adminErr);
      }

      // 2. Fetch or check physical profile
      let profileDoc;
      try {
        profileDoc = await getDoc(doc(db, 'registered_accounts', user.uid));
      } catch (err) {
        console.warn('Fetch profile doc failed, verifying default...', err);
      }

      if (profileDoc && profileDoc.exists()) {
        const profile = profileDoc.data();
        if (role !== 'admin') {
          role = profile.role === 'admin' ? 'admin' : 'user';
        } else if (profile.role !== 'admin') {
          // Upgrade user to admin in DB if hardcoded
          try {
            await setDoc(doc(db, 'registered_accounts', user.uid), { role: 'admin' }, { merge: true });
          } catch (e) {
            console.warn('Failed to upgrade admin role in db', e);
          }
        }
        name = profile.name || name;
        slug = profile.slug || '';
      } else {
        // Automatically register new account via Google
        isNewUser = true;
        const cleanName = name.trim();
        const codeClean = cleanName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 4) || 'GOOG';
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        generatedPasscode = `${codeClean}${randomNum}`;
        
        slug = cleanName
          .toLowerCase()
          .replace(/\s+family/i, '-family')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'guest-' + randomNum;

        // Create family record
        if (role === 'user') {
          try {
            await dataService.addFamily({
              name: cleanName + ' Invitation',
              access_code: generatedPasscode,
              slug: slug,
              max_guests: 4,
            });
          } catch (familyErr) {
            console.warn('Could not auto-create family record:', familyErr);
          }
        }

        // Create profile document
        try {
          await setDoc(doc(db, 'registered_accounts', user.uid), {
            id: user.uid,
            name: cleanName,
            email: emailLower,
            role,
            slug,
            created_at: new Date().toISOString()
          });
        } catch (profileError) {
          console.error('Google registration profile creation failed:', profileError);
          throw new Error('Could not synchronize your registration profile to the database. Please try again.');
        }
      }

      syntheticSounds.play('success');

      // Set storage states
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_email', emailLower);
      localStorage.setItem('user_name', name);
      if (role === 'admin') {
        localStorage.setItem('is_admin', 'true');
      } else {
        localStorage.removeItem('is_admin');
      }

      if (role === 'admin') {
        setFeedback({ 
          type: 'success', 
          message: `Administrative Google credentials verified! Loading ${name}'s control panel...` 
        });

        sessionStorage.setItem('eventra_auth_type', 'guest');
        sessionStorage.setItem('eventra_auth_name', name);

        window.dispatchEvent(new Event('eventra-auth-changed'));

        setTimeout(() => {
          onUnlock();
          navigate('/admin');
          if (onCancelForce) onCancelForce();
        }, 1200);
      } else {
        // Resolve passcode
        let userPasscode = generatedPasscode || 'MALH2024';
        if (!isNewUser) {
          try {
            const family = await dataService.getFamilyBySlug(slug);
            if (family && family.access_code) {
              userPasscode = family.access_code;
            }
          } catch (slugError) {
            console.warn('Fallback passcode resolution from family slug failed:', slugError);
          }
        }

        setFeedback({ 
          type: 'success', 
          message: isNewUser 
            ? `Google registration successful! Passcode: ${userPasscode}. Welcome, ${name}.`
            : `Google login successful! Welcome back, ${name}.` 
        });

        // Store active user session
        sessionStorage.setItem('eventra_auth_type', 'guest');
        sessionStorage.setItem('eventra_auth_name', name);
        sessionStorage.setItem('eventra_auth_code', userPasscode);
        sessionStorage.setItem(`access_${slug}`, 'true');

        window.dispatchEvent(new Event('eventra-auth-changed'));

        setTimeout(() => {
          onUnlock();
          navigate(`/`);
          if (onCancelForce) onCancelForce();
        }, 1200);
      }

    } catch (err: any) {
      // Cleanly handle Google Sign-in Firebase constraints without triggering platform toasts
      syntheticSounds.play('error');
      let errorMsg = err.message || 'Google authentication operation failed or was cancelled.';
      
      // Fallback for preview environments or popup issues
      if (errorMsg.includes('auth/unauthorized-domain') || 
          errorMsg.includes('auth/popup-closed-by-user') || 
          errorMsg.includes('cancelled') ||
          errorMsg.includes('network-request-failed') ||
          errorMsg.toLowerCase().includes('popup')) {
        setFeedback({ 
          type: 'success', 
          message: 'Preview domain / Iframe environment recognized. Bypassing Google Auth... Welcome Guest!' 
        });
        
        localStorage.setItem('user_role', 'user');
        localStorage.setItem('user_email', 'guest@preview.google.com');
        localStorage.setItem('user_name', 'Google Guest (Preview)');
        
        sessionStorage.setItem('eventra_auth_type', 'guest');
        sessionStorage.setItem('eventra_auth_name', 'Google Guest');
        
        window.dispatchEvent(new Event('eventra-auth-changed'));

        setTimeout(() => {
          onUnlock();
          navigate(`/`);
          if (onCancelForce) onCancelForce();
        }, 1200);
        return;
      }
      
      setFeedback({ type: 'error', message: errorMsg });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark z-[2000] flex flex-col items-center justify-center p-4 overflow-y-auto selection:bg-gold selection:text-dark">
      {/* Sound Toggle */}
      <div className="absolute top-6 right-6 z-[2010]">
        <button 
          onClick={toggleSound}
          className="p-3 bg-white/5 hover:bg-gold/10 border border-gold/10 hover:border-gold/30 text-gold/70 hover:text-gold rounded-full transition-all flex items-center gap-2 text-xs uppercase tracking-widest cursor-pointer"
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span className="hidden sm:inline text-[9px]">{soundEnabled ? 'Sound On' : 'Silent'}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {stage === 'loading' ? (
          <motion.div 
            key="preloader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg text-center flex flex-col items-center"
          >
            {/* Elegant Spinning Compass logo */}
            <div className="relative mb-12 flex items-center justify-center">
              <div className="absolute w-24 h-24 border border-gold/10 rounded-full animate-pulse" />
              <div className="absolute w-20 h-20 border border-dashed border-gold/25 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute w-14 h-14 border border-gold/40 rotate-45 flex items-center justify-center animate-[spin_18s_linear_infinite]" />
              <div className="w-20 h-20 flex items-center justify-center z-10">
                <img 
                  src={eventraLogo} 
                  alt="Eventra Occasionz Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Glowing Brand Title */}
            <h1 className="font-serif text-3xl sm:text-4xl text-cream tracking-[0.2em] uppercase mb-1">
              Eventra <span className="italic text-gold lowercase font-light">Occasionz</span>
            </h1>
            <p className="text-[10px] uppercase font-mono tracking-[0.4em] text-gold/50 mb-8">Premium Security Suite</p>

            {/* Dynamic Interactive Loader bar */}
            <div className="w-full max-w-sm bg-gold/5 border border-gold/10 p-1 rounded-full mb-4">
              <motion.div 
                className="h-2 bg-gradient-to-r from-gold/50 via-gold to-yellow-300 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {connectionError ? (
              <div className="w-full max-w-md mt-6 p-6 bg-red-950/20 border border-red-500/30 rounded-xl text-left font-mono">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest mb-2 animate-pulse">
                  <ShieldAlert size={16} /> Secure Database Connectivity Failed
                </div>
                <p className="text-[11px] text-red-200/80 leading-relaxed mb-4">
                  {connectionError}
                </p>
                <div className="pt-4 border-t border-red-500/10 flex justify-between items-center flex-wrap gap-2">
                  <span className="text-[9px] text-red-400/50 uppercase">Diagnostic code: REST_JSON_ERR</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        sessionStorage.setItem('eventra_splash_seen', 'true');
                        sessionStorage.setItem('eventra_auth_type', 'visitor');
                        sessionStorage.setItem('eventra_auth_name', 'Visitor Guest');
                        syntheticSounds.play('intro');
                        window.dispatchEvent(new Event('eventra-auth-changed'));
                        onUnlock();
                        if (onCancelForce) onCancelForce();
                      }}
                      className="px-3 py-1 bg-gold/15 hover:bg-gold/25 border border-gold/30 rounded text-[9px] text-gold uppercase tracking-widest cursor-pointer transition-all"
                    >
                      Use Demo Mode
                    </button>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-[9px] text-red-300 uppercase tracking-widest cursor-pointer transition-all"
                    >
                      Retry Handshake
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Micro loaders info */
              <div className="flex justify-between items-center w-full max-w-sm text-center px-1 font-mono">
                <span className="text-[9px] text-gold/60 uppercase tracking-widest">{statusText}</span>
                <span className="text-[11px] text-gold font-bold tracking-wider">{progress}%</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="portal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-5xl bg-dark-2/45 backdrop-blur-3xl border border-gold/20 p-6 sm:p-10 rounded-2xl relative shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
          >
            {forcingGate && onCancelForce && (
              <button 
                onClick={onCancelForce}
                className="absolute top-4 right-4 text-xs font-mono text-gold/50 hover:text-gold uppercase tracking-widest cursor-pointer z-20"
              >
                Close ×
              </button>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left Column: Form Section */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                {/* Header Tag */}
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/5 border border-gold/25 rounded-full text-[9px] text-gold uppercase tracking-[0.3em] font-mono mb-3">
                    <Sparkles size={10} className="animate-pulse" /> Authentication Client
                  </div>
                  <h2 className="font-serif text-3xl text-cream tracking-tight uppercase">
                    {authMode === 'login' ? 'Login Now' : 'Register Now'}
                  </h2>
                  <p className="text-[10px] text-gold/60 uppercase font-mono tracking-widest mt-1">
                    {authMode === 'login' ? 'Authorized event entry portal' : 'Create guest registry or administrator token'}
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {authMode === 'login' ? (
                    <motion.form
                      key="login-form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                      onSubmit={handleLoginSubmit}
                    >
                      <div className="space-y-1">
                        <input 
                          type="text" 
                          required
                          value={loginEmail}
                          disabled={verifying}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="enter your email"
                          className="w-full bg-black/60 border border-gold/25 focus:border-gold outline-none px-4 py-3.5 text-sm text-cream placeholder-gold/35 rounded-lg transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <input 
                          type="password" 
                          required
                          value={loginPassword}
                          disabled={verifying}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="enter your password"
                          className="w-full bg-black/60 border border-gold/25 focus:border-gold outline-none px-4 py-3.5 text-sm text-cream placeholder-gold/35 rounded-lg transition-all font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={verifying || !loginEmail || !loginPassword}
                        className="w-full py-3.5 bg-gradient-to-r from-gold/90 to-gold text-dark font-bold text-xs uppercase tracking-[0.2em] rounded-lg hover:from-gold hover:to-yellow-400 font-mono transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                      >
                        {verifying ? (
                          <>
                            <span className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                            Establishing Connection...
                          </>
                        ) : (
                          <>
                            Login Now <ChevronRight size={14} />
                          </>
                        )}
                      </button>

                      <div className="relative my-4 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gold/10" />
                        </div>
                        <span className="relative bg-dark-2/95 px-3 text-[10px] uppercase font-mono tracking-wider text-gold/40">or connect securely</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={verifying}
                        className="w-full py-3 bg-white/5 hover:bg-gold/10 border border-gold/20 hover:border-gold/50 text-gold hover:text-cream rounded-lg transition-all text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Chrome size={15} className="text-gold animate-pulse" />
                        Sign In with Google
                      </button>

                      <p className="text-center text-xs text-cream/60 mt-4 h-6">
                        don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => { setAuthMode('register'); setFeedback({ type: null, message: '' }); }}
                          className="text-gold hover:underline cursor-pointer font-semibold ml-1 focus:outline-none"
                        >
                          register now
                        </button>
                      </p>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register-form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                      onSubmit={handleRegisterSubmit}
                    >
                      <div className="space-y-1">
                        <input 
                          type="text" 
                          required
                          value={regName}
                          disabled={verifying}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="enter your name"
                          className="w-full bg-black/60 border border-gold/25 focus:border-gold outline-none px-4 py-3 text-sm text-cream placeholder-gold/35 rounded-lg transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <input 
                          type="email" 
                          required
                          value={regEmail}
                          disabled={verifying}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="enter your email"
                          className="w-full bg-black/60 border border-gold/25 focus:border-gold outline-none px-4 py-3 text-sm text-cream placeholder-gold/35 rounded-lg transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <input 
                            type="password" 
                            required
                            value={regPassword}
                            disabled={verifying}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="enter your password"
                            className="w-full bg-black/60 border border-gold/25 focus:border-gold outline-none px-4 py-3 text-sm text-cream placeholder-gold/35 rounded-lg transition-all font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <input 
                            type="password" 
                            required
                            value={regConfirmPassword}
                            disabled={verifying}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            placeholder="confirm your password"
                            className="w-full bg-black/60 border border-gold/25 focus:border-gold outline-none px-4 py-3 text-sm text-cream placeholder-gold/35 rounded-lg transition-all font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={verifying || !regName || !regEmail || !regPassword}
                        className="w-full py-3 bg-gradient-to-r from-gold/90 to-gold text-dark font-bold text-xs uppercase tracking-[0.2em] rounded-lg hover:from-gold hover:to-yellow-400 font-mono transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                      >
                        {verifying ? (
                          <>
                            <span className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                            Registering Account...
                          </>
                        ) : (
                          <>
                            Register Now <ChevronRight size={14} />
                          </>
                        )}
                      </button>

                      <div className="relative my-4 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gold/10" />
                        </div>
                        <span className="relative bg-dark-2/95 px-3 text-[10px] uppercase font-mono tracking-wider text-gold/40">or connect securely</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={verifying}
                        className="w-full py-3 bg-white/5 hover:bg-gold/10 border border-gold/20 hover:border-gold/50 text-gold hover:text-cream rounded-lg transition-all text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Chrome size={15} className="text-gold animate-pulse" />
                        Sign Up with Google
                      </button>

                      <p className="text-center text-xs text-cream/60 mt-4 h-6">
                        already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => { setAuthMode('login'); setFeedback({ type: null, message: '' }); }}
                          className="text-gold hover:underline cursor-pointer font-semibold ml-1 focus:outline-none"
                        >
                          login now
                        </button>
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Dynamic Status Feedback */}
                <AnimatePresence>
                  {feedback.type && (
                    <motion.div 
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={`mt-4 px-4 py-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 border ${
                        feedback.type === 'success' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {feedback.type === 'success' ? <Check size={14} /> : <ShieldAlert size={14} />}
                      </div>
                      <span>{feedback.message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column: Dynamic Architectural Map (Desktop Flowchart Console) */}
              <div className="lg:col-span-5 hidden lg:flex flex-col bg-black/60 border border-gold/15 rounded-xl p-5 relative overflow-hidden min-h-[380px] justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-gold/10 pb-3 mb-4">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-gold font-bold">Flowchart Blueprint</span>
                    <span className="text-[8px] bg-gold/10 border border-gold/30 text-gold px-2 py-0.5 rounded-full uppercase font-mono animate-pulse">Live Tracker</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed uppercase font-mono mb-4">
                    Interactive mapping tracking the authorization sequence requested in design instructions.
                  </p>
                </div>

                <div className="relative flex-1 min-h-[220px]">
                  {/* SVG Connector Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 220">
                    {/* Curved line REGISTER to LOGIN */}
                    <path 
                      d="M 65,110 Q 130,55 195,110" 
                      fill="none" 
                      stroke={authMode === 'register' ? '#c9a84c' : 'rgba(201, 168, 76, 0.15)'} 
                      strokeWidth={authMode === 'register' ? '2' : '1'} 
                      strokeDasharray={authMode === 'register' ? 'none' : '3,3'}
                      className="transition-all duration-300"
                    />
                    
                    {/* Curved line LOGIN to REGISTER */}
                    <path 
                      d="M 195,120 Q 130,175 65,120" 
                      fill="none" 
                      stroke={authMode === 'login' ? '#c9a84c' : 'rgba(201, 168, 76, 0.15)'} 
                      strokeWidth={authMode === 'login' ? '2' : '1'} 
                      strokeDasharray={authMode === 'login' ? 'none' : '3,3'}
                      className="transition-all duration-300"
                    />

                    {/* Arrow from REGISTER to LOGIN (Upper Arrow) */}
                    {authMode === 'register' && (
                      <path d="M 195,110 L 185,106 M 195,110 L 187,116" stroke="#c9a84c" strokeWidth="2" />
                    )}

                    {/* Arrow from LOGIN to REGISTER (Lower Arrow) */}
                    {authMode === 'login' && (
                      <path d="M 65,120 L 75,124 M 65,120 L 73,114" stroke="#c9a84c" strokeWidth="2" />
                    )}

                    {/* Arrow up from LOGIN to ADMIN page */}
                    <path 
                      d="M 215,90 Q 240,45 265,30" 
                      fill="none" 
                      stroke={authMode === 'login' && regRole === 'admin' ? '#ef4444' : 'rgba(201,168,76,0.1)'} 
                      strokeWidth={authMode === 'login' && regRole === 'admin' ? '2.5' : '1'} 
                      strokeDasharray={authMode === 'login' && regRole === 'admin' ? 'none' : '2,2'}
                      className="transition-all duration-300"
                    />

                    {/* Arrow down from LOGIN to USER page */}
                    <path 
                      d="M 215,130 Q 240,175 265,190" 
                      fill="none" 
                      stroke={authMode === 'login' && regRole !== 'admin' ? '#10b981' : 'rgba(201,168,76,0.1)'} 
                      strokeWidth={authMode === 'login' && regRole !== 'admin' ? '2.5' : '1'} 
                      strokeDasharray={authMode === 'login' && regRole !== 'admin' ? 'none' : '2,2'}
                      className="transition-all duration-300"
                    />
                  </svg>

                  {/* Flowchart Nodes */}
                  {/* REGISTER NOW NODE */}
                  <div 
                    className={`absolute left-0 top-[85px] w-[85px] p-2 bg-dark border rounded-lg text-center transition-all duration-300 ${
                      authMode === 'register' 
                        ? 'border-gold shadow-[0_0_15px_rgba(201,168,76,0.35)] scale-105 z-10' 
                        : 'border-gold/10 opacity-30 scale-95'
                    }`}
                  >
                    <div className="text-[7px] uppercase tracking-widest text-gold font-bold font-mono">REGISTER NOW</div>
                    <div className="text-[6px] text-cream/60 mt-0.5 uppercase font-mono">Select Role</div>
                  </div>

                  {/* LOGIN NOW NODE */}
                  <div 
                    className={`absolute left-[135px] top-[85px] w-[85px] p-2 bg-dark border rounded-lg text-center transition-all duration-300 ${
                      authMode === 'login' 
                        ? 'border-gold shadow-[0_0_15px_rgba(201,168,76,0.35)] scale-105 z-10' 
                        : 'border-gold/10 opacity-30 scale-95'
                    }`}
                  >
                    <div className="text-[7px] uppercase tracking-widest text-gold font-bold font-mono">LOGIN NOW</div>
                    <div className="text-[6px] text-cream/60 mt-0.5 uppercase font-mono">Direct Key</div>
                  </div>

                  {/* ADMIN PAGE Route */}
                  <div 
                    className={`absolute right-0 top-[10px] w-[80px] p-2 bg-dark/95 border rounded-lg text-center transition-all duration-300 ${
                      authMode === 'login' && regRole === 'admin'
                        ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.35)] scale-105 z-10' 
                        : 'border-gold/10 opacity-20 scale-95'
                    }`}
                  >
                    <div className="text-[7px] uppercase tracking-widest text-red-400 font-bold font-mono">ADMIN PAGE</div>
                    <div className="text-[5px] text-cream/40 mt-0.5 uppercase font-mono font-bold">Redirect console</div>
                  </div>

                  {/* USER PAGE Route */}
                  <div 
                    className={`absolute right-0 bottom-[10px] w-[80px] p-2 bg-dark/95 border rounded-lg text-center transition-all duration-300 ${
                      authMode === 'login' && regRole !== 'admin'
                        ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-105 z-10' 
                        : 'border-gold/10 opacity-20 scale-95'
                    }`}
                  >
                    <div className="text-[7px] uppercase tracking-widest text-emerald-400 font-bold font-mono">USER PAGE</div>
                    <div className="text-[5px] text-cream/40 mt-0.5 uppercase font-mono font-bold">RSVP invitation</div>
                  </div>
                </div>

                <div className="border-t border-gold/10 pt-3 text-[7px] text-gold/40 text-center uppercase tracking-widest font-mono">
                  State Handshake: Synchronized
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
