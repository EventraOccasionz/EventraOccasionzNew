const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');

code = code.replace(
  "  return (\n    <div className=\"min-h-screen flex flex-col font-sans bg-dark text-text-primary selection:bg-gold selection:text-dark\">\n      {(!unlocked || forcingGate) && (\n        <LoadingGateway \n          onUnlock={() => setUnlocked(true)} \n          forcingGate={forcingGate} \n          onCancelForce={() => setForcingGate(false)} \n        />\n      )}\n      <Navbar />\n      <main className=\"flex-grow\">\n        <Outlet />\n      </main>\n      <Footer />\n    </div>\n  );",
  "  return (\n    <div className=\"min-h-screen flex flex-col font-sans bg-dark text-text-primary selection:bg-gold selection:text-dark\">\n      <AuthModal \n        isOpen={forcingGate} \n        onClose={() => setForcingGate(false)} \n        onSuccess={() => {\n          setForcingGate(false);\n        }} \n      />\n      <Navbar />\n      <main className=\"flex-grow\">\n        <Outlet />\n      </main>\n      <Footer />\n    </div>\n  );"
);

fs.writeFileSync('src/components/layout/Layout.tsx', code);
