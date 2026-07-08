const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminLogin.tsx', 'utf8');

code = code.replace(
  "setError('Invalid OTP code. Please try again.');\n    } finally {",
  `setError('Invalid OTP code. Please try again.');\n      \n      const otpAttempts = parseInt(localStorage.getItem('admin_otp_failed_attempts') || '0') + 1;\n      localStorage.setItem('admin_otp_failed_attempts', otpAttempts.toString());\n      if (otpAttempts >= 3) {\n        setStep(1);\n        setOtp('');\n        setError('Too many failed OTP attempts. Please login again to request a new code.');\n        localStorage.removeItem('admin_otp_failed_attempts');\n      }\n    } finally {`
);

fs.writeFileSync('src/pages/AdminLogin.tsx', code);
