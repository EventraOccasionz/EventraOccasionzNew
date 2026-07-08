const fs = require('fs');
let code = fs.readFileSync('src/lib/authService.ts', 'utf8');

const logLogout = `
    const email = localStorage.getItem('user_email') || 'unknown';
    try {
      await setDoc(doc(db, 'audit_logs', Date.now().toString() + '-' + Math.random().toString(36).substring(7)), {
        action: 'LOGOUT',
        details: 'User logged out securely',
        email,
        timestamp: new Date().toISOString(),
        ip: 'client'
      });
    } catch (e) {
      console.warn('Logout audit failed');
    }
`;

code = code.replace(
  'async logout(): Promise<void> {\n    if (this.isConfigured()) {\n      try {\n        await signOut(auth);\n      } catch (e) {\n        console.warn(\'Sign out operation errored: \', e);\n      }\n    }',
  `async logout(): Promise<void> {\n    if (this.isConfigured()) {\n${logLogout}\n      try {\n        await signOut(auth);\n      } catch (e) {\n        console.warn('Sign out operation errored: ', e);\n      }\n    }`
);

fs.writeFileSync('src/lib/authService.ts', code);
