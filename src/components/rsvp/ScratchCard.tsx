import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScratchCardProps {
  dateText: string;
  onComplete: () => void;
}

export default function ScratchCard({ dateText, onComplete }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on container
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;

      // Draw premium gold foil background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#B38728');
      grad.addColorStop(0.25, '#FBF5B7');
      grad.addColorStop(0.5, '#DAA520');
      grad.addColorStop(0.75, '#FBF5B7');
      grad.addColorStop(1, '#AA771C');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add a subtle luxurious metallic border pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
      ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

      // Add elegant typography on scratch surface
      ctx.fillStyle = '#1f0205'; // Royal crimson text
      ctx.font = 'bold 13px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦ SACRED BOND ✦', canvas.width / 2, canvas.height / 2 - 25);
      
      ctx.fillStyle = '#4c0c13';
      ctx.font = '10px sans-serif';
      ctx.fillText('SCRATCH TO REVEAL', canvas.width / 2, canvas.height / 2 + 5);
      ctx.fillText('THE AUSPICIOUS DATE', canvas.width / 2, canvas.height / 2 + 20);

      // Draw simple ornate design flourishes
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 40, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#1f0205';
      ctx.fill();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startScratching = (e: any) => {
    setIsDrawing(true);
    scratch(e);
  };

  const stopScratching = () => {
    setIsDrawing(false);
    checkScratchPercentage();
  };

  const scratch = (e: any) => {
    if (!isDrawing || isScratched) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    // Scratch effect: transparency
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparentCount = 0;

    // Sample every 4th pixel for performance
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] === 0) {
        transparentCount++;
      }
    }

    const totalSamples = pixels.length / 16;
    const percentage = (transparentCount / totalSamples) * 100;

    if (percentage > 40) {
      setIsScratched(true);
      setTimeout(() => {
        onComplete();
      }, 800);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm h-48 mx-auto bg-black/60 rounded-xl overflow-hidden border border-gold/40 shadow-[0_0_25px_rgba(212,175,55,0.15)] flex flex-col justify-center items-center">
      {/* Background Revealed Text */}
      <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center select-none bg-radial bg-[#230408]">
        <div className="border border-gold/20 p-4 rounded-lg w-full h-full flex flex-col justify-center items-center">
          <span className="text-[10px] tracking-[0.3em] text-gold uppercase mb-2">The Auspicious Muhurat</span>
          <h4 className="font-serif text-xl sm:text-2xl text-cream font-bold tracking-tight">
            {dateText}
          </h4>
          <span className="text-[9px] text-text-secondary/80 uppercase tracking-widest mt-2">
            ✦ Join Us For The Sacred Vows ✦
          </span>
        </div>
      </div>

      {/* Foreground Scratch Canvas */}
      <AnimatePresence>
        {!isScratched && (
          <motion.canvas
            ref={canvasRef}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 cursor-crosshair z-10 touch-none"
            onMouseDown={startScratching}
            onMouseMove={scratch}
            onMouseUp={stopScratching}
            onMouseLeave={stopScratching}
            onTouchStart={startScratching}
            onTouchMove={scratch}
            onTouchEnd={stopScratching}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
