const fs = require('fs');
let code = fs.readFileSync('src/pages/EntryPass.tsx', 'utf8');

code = code.replace(
  "      const audio = new Audio(BG_MUSIC_URL);",
  "      const audio = new Audio(); // disabled"
);

fs.writeFileSync('src/pages/EntryPass.tsx', code);
