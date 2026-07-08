import { motion } from 'framer-motion';

const testimonials = [
  { name: 'Priya & Rahul Sharma', evt: 'Wedding Ceremony, Mumbai', stars: 5, txt: 'Eventra Occasionz exceeded every expectation. The florals, the lighting, the seamless flow — it was like living inside a dream. We couldn\'t have asked for a more perfect day.' },
  { name: 'Ananya Mehta', evt: '30th Birthday Celebration, Pune', stars: 5, txt: 'My birthday décor was absolutely stunning. Every corner was Pinterest-worthy. The team was professional, warm, and completely in tune with my vision from the very first call.' },
  { name: 'Sharma Enterprises', evt: 'Annual Corporate Gala, New Delhi', stars: 5, txt: 'Impeccably organised from start to finish. The branding was spot-on, the venue looked spectacular, and our 400 guests were thoroughly impressed.' },
  { name: 'Nisha & Vikram Patel', evt: 'Anniversary Dinner, Bangalore', stars: 5, txt: 'We wanted something intimate and breathtaking. What we received was beyond beautiful. The custom monogram lighting and bespoke florals truly moved us both to tears.' },
  { name: 'The Kaur Family', evt: 'Punjabi Wedding, Chandigarh', stars: 5, txt: 'Three days of events — every single one was flawless. The sangeet décor alone had our guests gasping. Absolutely world-class service, execution, and heart.' },
];

export default function Testimonials() {
  return (
    <section id="testi" className="bg-dark-2 py-32 overflow-hidden">
      <div className="px-8 md:px-20 mb-20 text-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
        >
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">Client Stories</span>
          <h2 className="font-serif text-4xl md:text-6xl text-cream mb-6">Words of <em className="italic text-gold">Gratitude</em></h2>
          <div className="w-11 h-[1px] bg-gold mx-auto mb-6" />
          <p className="text-sm md:text-base text-text-secondary font-extralight leading-relaxed max-w-lg mx-auto">
            Real experiences from families and organisations who trusted us with their most important moments.
          </p>
        </motion.div>
      </div>

      <div className="relative group">
        {/* Gradients to fade out edges */}
        <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-dark-2 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-gradient-to-l from-dark-2 to-transparent z-10 pointer-events-none" />

        <div className="flex animate-scroll hover:pause">
          {[...testimonials, ...testimonials].map((t, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-80 md:w-96 bg-white/5 border border-gold/10 p-8 mx-3 relative"
            >
              <span className="absolute top-4 right-6 text-5xl font-serif text-gold/10 italic">❝</span>
              <div className="text-gold text-xs mb-4">
                {'★'.repeat(t.stars)}
              </div>
              <p className="text-sm md:text-base text-text-secondary leading-relaxed italic mb-8 font-extralight">
                "{t.txt}"
              </p>
              <p className="text-[0.72rem] tracking-[0.15em] uppercase text-gold mb-1 font-medium">{t.name}</p>
              <p className="text-[0.7rem] text-text-secondary">{t.evt}</p>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
          width: max-content;
        }
        .pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
