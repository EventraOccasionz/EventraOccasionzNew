import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { GalleryItem } from '../../types';

export default function Gallery() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
      try {
        const fetched = await dataService.getGallery();
        setItems(fetched.filter(item => item.visible !== false));
      } catch (err) {
        console.error('Error fetching gallery:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => (item.cat || '').toLowerCase() === filter.toLowerCase());

  return (
    <section id="gallery" className="bg-dark-1 py-32 px-8 md:px-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">Our Showcase</span>
          <h2 className="font-serif text-4xl md:text-6xl text-cream mb-6">Moments of <em className="italic text-gold">Splendor</em></h2>
          <div className="w-11 h-[1px] bg-gold mx-auto mb-6" />
          <p className="text-sm md:text-base text-text-secondary font-extralight leading-relaxed max-w-lg mx-auto">
            A visual retrospective of luxury and memory we've crafted for our distinguished celebrants.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {['all', 'wedding', 'birthday', 'corporate'].map((cat) => (
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
          <motion.div 
            layout 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, id) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  className="group relative h-96 overflow-hidden cursor-pointer rounded-xl border border-white/5"
                >
                  {/* Background Rendering */}
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.lbl}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div 
                      className="absolute inset-0 transition-transform duration-700 group-hover:scale-110" 
                      style={{ background: item.bg || 'linear-gradient(135deg,#2a1c10,#1a1008)' }} 
                    />
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  
                  {/* Details Card */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-[0.6rem] tracking-[0.3em] uppercase text-gold block mb-2">
                      {item.cat}
                    </span>
                    <h3 className="font-serif text-2xl text-cream block mb-3 opacity-90 group-hover:opacity-100 transition-opacity">
                      {item.lbl}
                    </h3>
                    <div className="w-0 group-hover:w-12 h-[1px] bg-gold transition-all duration-500 mb-4" />
                    <p className="text-[0.62rem] tracking-widest text-[#D4AF37]/80 uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      View details
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredItems.length === 0 && (
              <div className="col-span-full py-24 text-center text-text-secondary text-sm uppercase tracking-widest opacity-60">
                No items found for this category.
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
