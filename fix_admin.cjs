const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(
  "                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');\n                audio.volume = 0.5;\n                audio.play();",
  "                // Use AudioContext for a simple beep instead of external URL to avoid 403 errors\n                try {\n                  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;\n                  if (AudioCtx) {\n                    const ctx = new AudioCtx();\n                    const osc = ctx.createOscillator();\n                    const gain = ctx.createGain();\n                    osc.connect(gain);\n                    gain.connect(ctx.destination);\n                    osc.type = 'sine';\n                    osc.frequency.setValueAtTime(523.25, ctx.currentTime);\n                    gain.gain.setValueAtTime(0.1, ctx.currentTime);\n                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);\n                    osc.start();\n                    osc.stop(ctx.currentTime + 0.5);\n                  }\n                } catch (e) { console.warn(e); }"
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
