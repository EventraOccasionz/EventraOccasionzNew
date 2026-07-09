import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const messages = [
  "Analyzing your requirements...",
  "Finding the best wedding plan...",
  "Consulting with our virtual experts...",
  "Preparing your luxury estimate...",
  "Curating personalized recommendations...",
];

export const ThinkingAnimation: React.FC = () => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mb-8"
      >
        <Loader2 className="w-16 h-16 text-gold-500" />
      </motion.div>
      
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-2xl font-serif text-gold-200 italic"
      >
        {messages[index]}
      </motion.div>
      
      <div className="mt-12 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 10, ease: "easeInOut" }}
          className="h-full bg-gold-500 shadow-[0_0_10px_rgba(255,180,41,0.5)]"
        />
      </div>
    </div>
  );
};
