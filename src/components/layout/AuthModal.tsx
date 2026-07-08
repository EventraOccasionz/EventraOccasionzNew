import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../../lib/authService';
import { X, Mail, Lock, User, Chrome, Sparkles } from 'lucide-react';
import eventraLogo from '../../assets/images/eventra_logo_1783423905494.jpg';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setEmail('');
      setPassword('');
      setName('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        await authService.signUp(email, password, name);
      } else {
        await authService.login(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await authService.signInWithGoogle();
      // Ensure we get their details from google
      const currentUser = authService.getCurrentUser();
      // if not in localStorage we might need a quick reload or fetch from authService 
      // Actually authService doesn't set localStorage for Google auth yet!
      // Let's modify authService later to support saving google auth details in localStorage.
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-dark/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-dark-2 border border-gold/20 rounded-2xl p-8 relative overflow-hidden shadow-2xl shadow-gold/10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-text-secondary hover:text-gold transition-colors p-2"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-dark border border-gold/30 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                <img 
                  src={eventraLogo} 
                  alt="Eventra Logo" 
                  className="w-12 h-12 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="font-serif text-2xl text-cream mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-text-secondary text-sm">
                {mode === 'login' 
                  ? 'Sign in to submit your event inquiry.' 
                  : 'Register to plan your dream event with us.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-white/5 border border-gold/20 rounded-xl py-3 pl-12 pr-4 text-cream placeholder-text-secondary focus:border-gold outline-none transition-colors"
                  />
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-white/5 border border-gold/20 rounded-xl py-3 pl-12 pr-4 text-cream placeholder-text-secondary focus:border-gold outline-none transition-colors"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-white/5 border border-gold/20 rounded-xl py-3 pl-12 pr-4 text-cream placeholder-text-secondary focus:border-gold outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="text-rose-400 text-xs text-center p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gold text-dark font-bold tracking-widest uppercase text-sm rounded-xl hover:bg-gold-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-4">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-xs text-text-secondary uppercase tracking-widest">Or</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-6 w-full py-3 bg-white/5 border border-gold/20 text-cream rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Chrome className="text-gold" size={18} />
              <span className="text-sm">Continue with Google</span>
            </button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-gold/70 hover:text-gold text-sm transition-colors"
              >
                {mode === 'login' 
                  ? "Don't have an account? Sign Up" 
                  : "Already have an account? Sign In"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}