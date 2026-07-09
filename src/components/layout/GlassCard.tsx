import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', gold = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`relative overflow-hidden rounded-3xl p-8 ${gold ? 'glass-gold' : 'glass'} ${className}`}
    >
      {gold && (
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-gold-500/20 blur-3xl" />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
