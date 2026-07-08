import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let AnimationFrameId: number;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.5 + 0.4,
      a: Math.random() * 0.65 + 0.1
    }));

    const draw = () => {
      if (document.hidden) {
        AnimationFrameId = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 168, 76, ${p.a})`;
        ctx.fill();
      });
      AnimationFrameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      if (W < 768) {
        cancelAnimationFrame(AnimationFrameId);
      } else {
        cancelAnimationFrame(AnimationFrameId);
        draw();
      }
    };

    window.addEventListener('resize', handleResize);
    if (W >= 768) draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(AnimationFrameId);
    };
  }, []);

  return (
    <section id="hero" className="relative h-screen min-h-[680px] flex items-center justify-center text-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 bg-dark" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_60%_30%,#1f1608_0%,#0a0805_45%,transparent_100%),radial-gradient(ellipse_at_20%_80%,#1a1206_0%,transparent_55%)]" />
      
      {/* Glow Animation */}
      <motion.div 
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 z-1 luxury-glow" 
      />

      {/* Decorative Rings */}
      <div className="absolute inset-0 z-1 flex items-center justify-center pointer-events-none">
        {[460, 700, 950].map((size, i) => (
          <motion.div
            key={i}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.04, opacity: 1 }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              repeatType: "reverse", 
              delay: i * 1.5,
              ease: "easeInOut" 
            }}
            style={{ width: size, height: size }}
            className="absolute rounded-full border border-gold/10"
          />
        ))}
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 z-2 pointer-events-none w-full h-full" />

      <div className="relative z-10 max-w-4xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-[0.65rem] tracking-[0.5em] uppercase text-gold mb-8"
        >
          ✦ &nbsp; Luxury Event Management &nbsp; ✦
        </motion.p>
        
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.72 }}
          className="font-serif text-3xl sm:text-5xl md:text-8xl lg:text-9xl leading-[1.04] text-cream mb-8 text-balance"
        >
          Crafting <em className="italic text-gold">Moments</em><br />
          Into Memories
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.98 }}
          className="text-base md:text-lg font-extralight text-text-secondary tracking-[0.07em] leading-relaxed max-w-lg mx-auto mb-12"
        >
          From intimate gatherings to grand celebrations — we design experiences that linger long after the last guest has departed.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.24 }}
          className="flex flex-col sm:flex-row gap-6 justify-center"
        >
          <a
            href="#booking"
            className="px-10 py-4 bg-gold text-dark text-[0.74rem] tracking-[0.2em] uppercase font-medium transition-all hover:bg-gold-light hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(201,168,76,0.32)]"
          >
            Book Your Event
          </a>
          <a
            href="#gallery"
            className="px-10 py-4 border border-gold text-gold text-[0.74rem] tracking-[0.2em] uppercase transition-all hover:bg-gold/10 hover:-translate-y-1"
          >
            View Our Work
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <p className="text-[0.58rem] tracking-[0.35em] uppercase text-text-secondary">Scroll</p>
        <div className="w-[1px] h-12 bg-gradient-to-b from-gold to-transparent relative overflow-hidden">
          <motion.div
            animate={{ top: ['-100%', '100%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 w-full h-full bg-gold-light"
          />
        </div>
      </motion.div>
    </section>
  );
}
