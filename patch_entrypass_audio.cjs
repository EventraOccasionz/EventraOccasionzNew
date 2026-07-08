const fs = require('fs');
let code = fs.readFileSync('src/pages/EntryPass.tsx', 'utf8');

code = code.replace(
  "      const audio = new Audio(BG_MUSIC_URL);\n      audio.loop = true;\n      audio.volume = 0.45;\n      audioRef.current = audio;\n      \n      const playPromise = audio.play();",
  "      const audio = new Audio(BG_MUSIC_URL);\n      audio.loop = true;\n      audio.volume = 0.45;\n      audioRef.current = audio;\n      \n      audio.addEventListener('error', (e) => {\n        console.warn('Audio failed to load or play', e);\n      });\n\n      const playPromise = audio.play();"
);

fs.writeFileSync('src/pages/EntryPass.tsx', code);
