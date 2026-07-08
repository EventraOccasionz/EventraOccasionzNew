import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import AuthModal from '../layout/AuthModal';
import { authService } from '../../lib/authService';

export default function Contact() {
  const [venueSettings, setVenueSettings] = useState<any>({
    venue_name: 'Our Location',
    address: 'Shop No.85, Dev Shoping Complex, Bhabat Rd, Jarnail Enclave Phase 1, Utrathiya, Zirakpur, Punjab 140603',
    google_maps_url: 'https://maps.google.com/?q=Shop+No.85,+Dev+Shoping+Complex,+Bhabat+Rd,+Jarnail+Enclave+Phase+1,+Utrathiya,+Zirakpur,+Punjab+140603'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);


  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await dataService.getVenueSettings();
        if (settings) {
          setVenueSettings(settings);
        }
      } catch (err) {
        console.warn('Could not load dynamic settings for contact:', err);
      }
    };
    loadSettings();
  }, []);

  const processSubmit = async () => {
    setLoading(true);
    try {
      await dataService.addInquiry({
        name,
        email,
        phone: 'Not provided', // General contact form doesn't ask for phone by default in this component
        service_selected: `General Inquiry: ${subject}`,
        message,
        status: 'Pending'
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting contact message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    await processSubmit();
  };
  return (
    <section id="contact" className="bg-dark-2 py-32 px-8 md:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start mb-24">
        
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">Reach Us</span>
          <h2 className="font-serif text-4xl md:text-6xl text-cream mb-6">Let's <em className="italic text-gold">Connect</em></h2>
          <div className="w-11 h-[1px] bg-gold mb-8" />
          <p className="text-sm md:text-base text-text-secondary font-extralight leading-relaxed max-w-lg mb-10">
            Our team is ready to bring your dream event to life. Reach out — we'd love to hear your vision.
          </p>

          <div className="flex flex-col gap-5 mb-8">
            <div className="bg-white/5 border border-gold/10 p-6 flex gap-6 items-start hover:border-gold/40 transition-colors">
              <MapPin size={24} className="text-gold flex-shrink-0" />
              <div>
                <h4 className="font-serif text-lg text-cream mb-1">{venueSettings.venue_name}</h4>
                <p className="text-sm text-text-secondary leading-normal mb-2">{venueSettings.address}</p>
                {venueSettings.google_maps_url && (
                  <a 
                    href={venueSettings.google_maps_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-gold text-xs hover:underline inline-flex items-center gap-1 font-mono uppercase mt-2 border border-gold/15 bg-gold/5 px-2.5 py-1 rounded"
                  >
                    Open in Google Maps ↗
                  </a>
                )}
              </div>
            </div>
            <div className="bg-white/5 border border-gold/10 p-6 flex gap-6 items-start hover:border-gold/40 transition-colors">
              <Phone size={24} className="text-gold flex-shrink-0" />
              <div>
                <h4 className="font-serif text-lg text-cream mb-1">Phone / WhatsApp</h4>
                <a href="tel:+918360126372" className="text-sm text-text-secondary hover:text-gold transition-colors">+918360126372</a>
              </div>
            </div>
            <div className="bg-white/5 border border-gold/10 p-6 flex gap-6 items-start hover:border-gold/40 transition-colors">
              <Mail size={24} className="text-gold flex-shrink-0" />
              <div>
                <h4 className="font-serif text-lg text-cream mb-1">Email Us</h4>
                <a href="mailto:eventraoccasionz@gmail.com" className="text-sm text-text-secondary hover:text-gold transition-colors">eventraoccasionz@gmail.com</a>
              </div>
            </div>
          </div>

          <a
            href="https://wa.me/918360126372"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#25d366] text-white text-[0.74rem] tracking-widest uppercase transition-all hover:brightness-110 hover:-translate-y-1"
          >
            <MessageSquare size={18} /> Chat on WhatsApp
          </a>

          <div className="mt-12">
            <p className="text-[0.62rem] tracking-[0.28em] uppercase text-gold mb-3 font-medium">Business Hours</p>
            <div className="space-y-2 max-w-xs">
              <div className="flex justify-between text-sm py-1 border-b border-white/5">
                <span className="text-text-secondary">Monday – Friday</span>
                <span className="text-gold">9 AM – 8 PM</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-white/5">
                <span className="text-text-secondary">Saturday</span>
                <span className="text-gold">10 AM – 6 PM</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-text-secondary">Sunday</span>
                <span className="text-gold">By Appointment</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, x: 40 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true }}
           className="bg-dark-3 border border-gold/20 p-8 md:p-12 relative"
        >
          {isSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <CheckCircle2 size={50} className="text-gold mx-auto mb-6" />
              <h3 className="font-serif text-2xl text-cream mb-2">Message Sent</h3>
              <p className="text-text-secondary text-sm">Thank you! Your inquiries are received, and we'll reply shortly.</p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="mt-8 px-6 py-2 border border-gold/40 text-gold text-xs uppercase tracking-widest hover:bg-gold/10"
              >
                Send Another
              </button>
            </motion.div>
          ) : (
            <>
              <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-8">Send a Message</span>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] tracking-widest uppercase text-text-secondary">Your Name</label>
                  <input 
                    required 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-white/5 border border-gold/20 p-4 text-text-primary outline-none focus:border-gold transition-colors" 
                    placeholder="Full name" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] tracking-widest uppercase text-text-secondary">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-white/5 border border-gold/20 p-4 text-text-primary outline-none focus:border-gold transition-colors" 
                    placeholder="you@email.com" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] tracking-widest uppercase text-text-secondary">Subject</label>
                  <input 
                    required 
                    type="text" 
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="bg-white/5 border border-gold/20 p-4 text-text-primary outline-none focus:border-gold transition-colors" 
                    placeholder="How can we help?" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] tracking-widest uppercase text-text-secondary">Message</label>
                  <textarea 
                    rows={5} 
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="bg-white/5 border border-gold/20 p-4 text-text-primary outline-none focus:border-gold transition-colors resize-none" 
                    placeholder="Tell us about your event..."
                  />
                </div>
                <button
                   disabled={loading}
                   type="submit"
                   className="w-full py-4 bg-gold text-dark text-[0.74rem] tracking-widest uppercase font-bold transition-all hover:bg-gold-light disabled:opacity-50"
                >
                  {loading ? 'Sending Message...' : 'Send Message'}
                </button>
              </form>
            </>
          )}
        </motion.div>

      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto w-full h-[400px] border border-gold/20 relative grayscale hover:grayscale-0 transition-all duration-500"
      >
        <iframe 
          src="https://maps.google.com/maps?q=Shop+No.85,+Dev+Shoping+Complex,+Bhabat+Rd,+Jarnail+Enclave+Phase+1,+Utrathiya,+Zirakpur,+Punjab+140603&t=&z=15&ie=UTF8&iwloc=&output=embed"
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen={false} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Eventra Occasionz Location Map"
        ></iframe>
        <div className="absolute inset-0 pointer-events-none border-[6px] border-dark-2 z-10" />
      </motion.div>
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          processSubmit();
        }}
      />
    </section>
  );
}
