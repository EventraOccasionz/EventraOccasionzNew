const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');

code = code.replace(
  "import LoadingGateway from './LoadingGateway';",
  "import AuthModal from './AuthModal';"
);

code = code.replace(
  "      {forcingGate && (\n        <LoadingGateway \n          onUnlock={() => setUnlocked(true)} \n          forcingGate={forcingGate} \n          onCancelForce={() => setForcingGate(false)} \n        />\n      )}",
  "      <AuthModal \n        isOpen={forcingGate} \n        onClose={() => setForcingGate(false)} \n        onSuccess={() => {\n          setForcingGate(false);\n          // ForcingGate was requested via Navbar (Client Portal) \n          // So successful auth just closes modal\n        }} \n      />"
);

fs.writeFileSync('src/components/layout/Layout.tsx', code);
