const fs = require('fs');
let code = fs.readFileSync('src/lib/authService.ts', 'utf8');
code = code.replace(
  "      // Informational local states (strictly for non-security UI hints)\n      localStorage.setItem('user_role', role);\n      localStorage.setItem('user_email', emailLower);\n      localStorage.setItem('user_name', name);\n      if (role === 'admin') {\n        localStorage.setItem('is_admin', 'true');\n      } else {\n        localStorage.removeItem('is_admin');\n      }\n            \n      return { user, role };",
  "      // Informational local states (strictly for non-security UI hints)\n      localStorage.setItem('user_role', role);\n      localStorage.setItem('user_email', emailLower);\n      localStorage.setItem('user_name', name);\n      if (role === 'admin') {\n        localStorage.setItem('is_admin', 'true');\n      } else {\n        localStorage.removeItem('is_admin');\n      }\n      sessionStorage.setItem('eventra_auth_type', 'user');\n      sessionStorage.setItem('eventra_auth_name', name);\n      window.dispatchEvent(new Event('eventra-auth-changed'));\n      return { user, role };"
);
fs.writeFileSync('src/lib/authService.ts', code);
