const fs = require('fs');
let code = fs.readFileSync('src/pages/EntryPass.tsx', 'utf8');

// Replace the useEffect block for Audio setup
code = code.replace(
  /  \/\/ Audio setup[\s\S]*?\}, \[isOpen\]\);/,
  `  // Audio setup disabled to avoid NotSupportedError
  useEffect(() => {
    // Audio feature disabled
  }, [isOpen]);`
);

// And replace the togglePlay function
code = code.replace(
  /  \/\/ Handle music toggle[\s\S]*?  \};/,
  `  // Handle music toggle
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };`
);

fs.writeFileSync('src/pages/EntryPass.tsx', code);
