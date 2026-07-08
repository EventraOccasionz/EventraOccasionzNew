const fs = require('fs');
let code = fs.readFileSync('src/components/layout/ProtectedRoute.tsx', 'utf8');

const inactivityLogic = `
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
`;

code = code.replace(
  '  if (loading) {\n    return (',
  `${inactivityLogic}\n  if (loading) {\n    return (`
);

fs.writeFileSync('src/components/layout/ProtectedRoute.tsx', code);
