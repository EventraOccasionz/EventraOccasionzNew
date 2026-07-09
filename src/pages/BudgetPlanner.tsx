import React from 'react';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { BudgetWizard } from '../components/planner/BudgetWizard';
import { motion, AnimatePresence } from 'framer-motion';

const BudgetPlanner: React.FC = () => {
  const [started, setStarted] = React.useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background with Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/src/assets/images/luxury_wedding_bg_1783573442549.jpg" 
          alt="Wedding Background" 
          className="w-full h-full object-cover opacity-30"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 pt-20 pb-20">
        <AnimatePresence mode="wait">
          {!started ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WelcomeScreen onStart={() => setStarted(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <BudgetWizard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent z-50" />
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-0" />
    </div>
  );
};

export default BudgetPlanner;
