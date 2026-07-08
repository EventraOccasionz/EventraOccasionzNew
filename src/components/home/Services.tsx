import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { Service } from '../../types';

export default function Services() {
  const [filter, setFilter] = useState('all');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const fetched = await dataService.getServices();
        // Only show visible services on the consumer-facing frontend
        setServices(fetched.filter(s => s.visible !== false));
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  const filteredServices = filter === 'all' 
    ? services 
    : services.filter(s => (s.cat || '').toLowerCase() === filter.toLowerCase());

  return (
    <section id="services" className="bg-dark-2 py-32 px-8 md:px-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">What We Offer</span>
          <h2 className="font-serif text-4xl md:text-6xl text-cream mb-6">Our <em className="italic text-gold">Signature</em> Services</h2>
          <div className="w-11 h-[1px] bg-gold mx-auto mb-6" />
          <p className="text-sm md:text-base text-text-secondary font-extralight leading-relaxed max-w-lg mx-auto">
            Each service is meticulously curated to reflect your vision with elegance and precision.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {['all', 'wedding', 'birthday', 'corporate', 'decor'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-1.5 border text-[0.68rem] tracking-[0.14em] uppercase transition-all
                ${filter === cat 
                  ? 'border-gold text-gold bg-gold/10' 
                  : 'border-gold/20 text-text-secondary hover:border-gold/50'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="text-gold animate-spin" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredServices.map((service, i) => (
              <motion.div
                key={service.id || service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-white/5 border border-gold/20 p-8 overflow-hidden transition-all hover:-translate-y-2 hover:border-gold/45 cursor-pointer"
                onClick={() => setSelectedService(service)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="text-3xl mb-5 block">{service.ico}</span>
                <h3 className="font-serif text-xl text-cream mb-3">{service.name}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-6 line-clamp-3">
                  {service.desc}
                </p>
                <button 
                  className="text-[0.66rem] uppercase tracking-widest text-gold opacity-80 group-hover:opacity-100 transition-opacity"
                >
                  Learn More →
                </button>
              </motion.div>
            ))}
            {filteredServices.length === 0 && (
              <div className="col-span-full py-20 text-center text-text-secondary text-sm uppercase tracking-widest opacity-60">
                No services listed under this category.
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedService(null)}
              className="absolute inset-0 bg-dark/90 backdrop-blur-md" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-dark-2 border border-gold/30 p-6 md:p-12 z-[2001] rounded-2xl overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedService(null)}
                className="absolute top-6 right-6 text-text-secondary hover:text-gold transition-colors"
                id="close-modal"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <span className="text-5xl">{selectedService.ico}</span>
                <div>
                  <span className="text-[0.6rem] uppercase tracking-[0.3em] text-gold">{selectedService.cat}</span>
                  <h3 className="font-serif text-3xl text-cream">{selectedService.name}</h3>
                </div>
              </div>

              <p className="text-text-secondary leading-relaxed mb-10 text-lg italic">
                "{selectedService.desc}"
              </p>

              {selectedService.feats && selectedService.feats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedService.feats.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-white/5 border border-white/5 rounded-xl">
                      <CheckCircle2 className="text-gold shrink-0 mt-1" size={16} />
                      <span className="text-sm text-cream/80">{feat}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-12 pt-8 border-t border-white/5 flex justify-end">
                <a 
                  href="#booking" 
                  onClick={() => setSelectedService(null)}
                  className="px-8 py-3 bg-gold text-dark text-xs font-bold uppercase tracking-widest hover:bg-gold-light transition-all rounded-full"
                >
                  Book this service
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
