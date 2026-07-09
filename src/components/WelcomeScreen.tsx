import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { GlassCard } from './layout/GlassCard';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          <span>Premier Wedding Planning Excellence</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
          Welcome to <br />
          <span className="text-gradient-gold">Eventra Occasionz</span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
          Let's estimate your event budget in just a few steps. 
          Our AI-powered assistant will help you craft a vision that reflects your unique story.
        </p>

        <button
          onClick={onStart}
          className="btn-gold group flex items-center gap-2 mx-auto text-lg"
        >
          Start Estimating
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
};
