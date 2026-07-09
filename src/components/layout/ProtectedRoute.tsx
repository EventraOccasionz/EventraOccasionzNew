import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { dataService } from '../../lib/dataService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'user')[];
}

export default function ProtectedRoute({ children, allowedRoles = ['admin'] }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const checkAuth = async (user: any) => {
      if (!dataService.isConfigured()) {
        if (active) {
          setAuthorized(false);
          setLoading(false);
        }
        return;
      }

      try {
        const profileDoc = await getDoc(doc(db, 'registered_accounts', user.uid));
        const isAdminProfile = profileDoc.exists() && profileDoc.data()?.role === 'admin';
        const whitelist = await dataService.getAdminWhitelist();
        const isDevAdmin = user.email ? whitelist.includes(user.email.toLowerCase().trim()) : false;

        let isAdminInCollection = false;
        try {
          const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
          if (adminDoc.exists()) {
            isAdminInCollection = true;
          }
        } catch (_) {}

        if (isAdminProfile || isAdminInCollection || isDevAdmin) {
          // Check OTP requirement for admins
          const isOtpVerified = localStorage.getItem('admin_otp_verified') === 'true';
          const otpTimestamp = parseInt(localStorage.getItem('admin_otp_timestamp') || '0');
          // Session timeout: 24 hours
          const isOtpFresh = Date.now() - otpTimestamp < 24 * 60 * 60 * 1000;

          if (!isOtpVerified || !isOtpFresh) {
            localStorage.removeItem('admin_otp_verified');
            
            // Allow access to the 2FA enablement page for authenticated admins who need to set it up
            const isEnable2FaPage = location.pathname === '/admin/enable-2fa';
            if (isEnable2FaPage) {
              localStorage.setItem('user_email', user.email || '');
              localStorage.setItem('user_role', 'admin');
              localStorage.setItem('user_name', (profileDoc.exists() && profileDoc.data()?.name) || user.displayName || 'Administrator');
              localStorage.setItem('is_admin', 'true');
              if (active) {
                setAuthorized(true);
                setLoading(false);
              }
              return;
            }

            if (active) {
              setAuthorized(false);
              setLoading(false);
            }
            return;
          }

          localStorage.setItem('user_email', user.email || '');
          localStorage.setItem('user_role', 'admin');
          localStorage.setItem('user_name', (profileDoc.exists() && profileDoc.data()?.name) || user.displayName || 'Administrator');
          localStorage.setItem('is_admin', 'true');

          if (active) {
            setAuthorized(true);
            setLoading(false);
          }
        } else {
          if (active) {
            setAuthorized(false);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Authentication guard resolution failed:', err);
        if (active) {
          setAuthorized(false);
          setLoading(false);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkAuth(user);
      } else {
        localStorage.removeItem('is_admin');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_name');
        localStorage.removeItem('admin_otp_verified');
        localStorage.removeItem('admin_otp_timestamp');
        if (active) {
          setAuthorized(false);
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);


  // Inactivity Logout
  useEffect(() => {
    if (!authorized) return;

    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 15 minutes of inactivity
      timeoutId = setTimeout(async () => {
        try {
          await dataService.logout();
          window.location.href = '/#/admin/login';
        } catch (e) {}
      }, 15 * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [authorized]);

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex flex-col items-center justify-center bg-dark-4 text-cream">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 p-8 bg-dark-2 border border-gold/20 max-w-sm text-center"
        >
          <Loader2 className="animate-spin text-gold" size={32} />
          <h3 className="font-serif text-lg text-cream tracking-tight">Resolving Security Gate</h3>
          <p className="text-xs text-text-secondary uppercase tracking-widest">Parsing session tokens...</p>
        </motion.div>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
