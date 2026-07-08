const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminLogin.tsx', 'utf8');

// Helper to log event
const auditLogger = `
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
`;

code = code.replace(
  'const navigate = useNavigate();',
  `${auditLogger}\n  const navigate = useNavigate();`
);

// Successful password login (Step 1 complete)
code = code.replace(
  'localStorage.removeItem(\'admin_failed_attempts\');\n      setStep(2);',
  'localStorage.removeItem(\'admin_failed_attempts\');\n      await logSecurityEvent(\'LOGIN_STEP1_SUCCESS\', \'Email and password verified\', emailClean);\n      setStep(2);'
);

// Failed password login
code = code.replace(
  'setError(\'Too many failed attempts. Account temporarily locked for 15 minutes.\');',
  'setError(\'Too many failed attempts. Account temporarily locked for 15 minutes.\');\n        await logSecurityEvent(\'ACCOUNT_LOCKED\', \'Account locked due to 5 failed login attempts\', emailClean);'
);
code = code.replace(
  'setError(err?.message || \'Verification failed. Please check your credentials.\');\n      \n      const attempts = parseInt(localStorage.getItem(\'admin_failed_attempts\') || \'0\') + 1;',
  'setError(err?.message || \'Verification failed. Please check your credentials.\');\n      await logSecurityEvent(\'LOGIN_FAILED\', err?.message || \'Invalid credentials\', emailClean);\n      \n      const attempts = parseInt(localStorage.getItem(\'admin_failed_attempts\') || \'0\') + 1;'
);

// Failed OTP
code = code.replace(
  `setError('Invalid OTP code. Please try again.');`,
  `setError('Invalid OTP code. Please try again.');\n      await logSecurityEvent('OTP_FAILED', 'Invalid OTP code entered', email);`
);

// Successful OTP
code = code.replace(
  `localStorage.setItem('admin_otp_verified', 'true');`,
  `await logSecurityEvent('LOGIN_SUCCESS', 'OTP verification successful, admin logged in', email);\n      localStorage.setItem('admin_otp_verified', 'true');`
);

fs.writeFileSync('src/pages/AdminLogin.tsx', code);
