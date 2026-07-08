import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, X, ZoomIn, ZoomOut } from 'lucide-react';

// Using the generated image from assets
import venueLayoutImage from '../../assets/images/venue_layout_map_1780754497017.png';

interface VenueLayoutViewerProps {
  isOpen: boolean;
  onClose: () => void;
  customMapUrl?: string;
}

export default function VenueLayoutViewer({ isOpen, onClose, customMapUrl }: VenueLayoutViewerProps) {
  const [scale, setScale] = useState(1);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl h-[85vh] bg-[#121212] border border-gold/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
             {/* Header */}
             <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/40">
                <div className="flex items-center gap-3">
                   <Map className="text-gold" size={24} />
                   <h3 className="font-serif text-xl text-cream">Interactive Venue Map</h3>
                </div>
                <button onClick={onClose} className="p-2 text-text-secondary hover:text-gold transition-colors rounded-full hover:bg-white/5">
                   <X size={20} />
                </button>
             </div>

             {/* Map Container */}
             <div className="relative flex-1 bg-[#0a0a0a] overflow-hidden flex items-center justify-center">
                
                {/* Controls */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
                   <button 
                     onClick={() => setScale(s => Math.min(s + 0.25, 3))} 
                     className="p-3 bg-black/80 border border-gold/30 text-white rounded-xl hover:bg-gold/20 hover:text-gold transition-all backdrop-blur-md"
                   >
                      <ZoomIn size={20} />
                   </button>
                   <button 
                     onClick={() => setScale(s => Math.max(s - 0.25, 0.5))} 
                     className="p-3 bg-black/80 border border-gold/30 text-white rounded-xl hover:bg-gold/20 hover:text-gold transition-all backdrop-blur-md"
                   >
                      <ZoomOut size={20} />
                   </button>
                </div>

                {/* Interactive Map */}
                <motion.div
                  animate={{ scale }}
                  className="w-full h-full flex items-center justify-center cursor-move p-8"
                  drag
                  dragConstraints={{ left: -800, right: 800, top: -800, bottom: 800 }}
                  dragElastic={0.1}
                >
                   <img 
                     src={customMapUrl || venueLayoutImage} 
                     alt="Eventra Occasionz Venue Layout Map" 
                     className="max-w-full max-h-full object-contain pointer-events-none rounded-lg shadow-[0_0_50px_rgba(201,168,76,0.1)]" 
                   />
                </motion.div>
                
                {/* Static Legend Overlay */}
                <div className="absolute top-6 left-6 p-5 bg-black/80 border border-white/10 rounded-xl backdrop-blur-md shadow-xl hidden sm:block">
                   <h4 className="text-[10px] uppercase tracking-[0.2em] text-gold mb-4 border-b border-gold/20 pb-2">Navigation Legend</h4>
                   <ul className="space-y-3 text-xs text-text-secondary">
                      <li className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-sm bg-gold/90 shadow-[0_0_10px_rgba(201,168,76,0.5)]"></span> Main Assembly Hall</li>
                      <li className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-sm bg-white/80"></span> Royal Dining Area</li>
                      <li className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-sm bg-[#8B6C2F]"></span> VIP Lounge & Suites</li>
                      <li className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-sm border border-white/40"></span> Entrance & Valet Parking</li>
                   </ul>
                </div>
             </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
