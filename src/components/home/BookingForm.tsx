import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import AuthModal from '../layout/AuthModal';
import { authService } from '../../lib/authService';

export default function BookingForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [eventType, setEventType] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [notes, setNotes] = useState('');

  const processSubmit = async () => {
    setLoading(true);
    try {
      const selectedServiceDetails = `${eventType} Event (${guestCount} guests, on ${preferredDate})`;
      await dataService.addInquiry({
        name: fullName,
        email: email,
        phone: phone,
        service_selected: selectedServiceDetails,
        message: notes.trim() || 'No additional notes provided.',
        status: 'Pending'
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      alert('Failed to submit enquiry. Please try again.');
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
    <section id="booking" className="bg-dark-2 py-32 px-8 md:px-20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[0.62rem] tracking-[0.4em] uppercase text-gold block mb-4">Enquire Now</span>
          <h2 className="font-serif text-4xl md:text-6xl text-cream mb-6">Book Your <em className="italic text-gold">Event</em></h2>
          <div className="w-11 h-[1px] bg-gold mx-auto mb-6" />
          <p className="text-sm md:text-base text-text-secondary font-extralight leading-relaxed max-w-lg mx-auto">
            Fill in your details and our team will reach out within 24 hours.
          </p>
        </motion.div>

        {isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="premium-card p-12 text-center"
          >
            <CheckCircle2 className="text-gold mx-auto mb-6" size={60} />
            <h3 className="font-serif text-3xl text-cream mb-4">Enquiry Received</h3>
            <p className="text-text-secondary italic">"Your vision is now our mission. We will reach out within 24 hours."</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#121212] p-8 md:p-12 border border-white/5 rounded-2xl">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37]/60 ml-1">Full Name</label>
              <input 
                required 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold transition-colors" 
                placeholder="Your full name" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37]/60 ml-1">Phone / WhatsApp</label>
              <input 
                required 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold transition-colors" 
                placeholder="+91 00000 00000" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37]/60 ml-1">Email Address</label>
              <input 
                required 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold transition-colors" 
                placeholder="you@email.com" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37]/60 ml-1">Event Type</label>
              <select 
                required 
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold transition-colors appearance-none cursor-pointer text-[#a3a3a3]"
              >
                <option value="" className="bg-[#121212] text-text-secondary">Select event type</option>
                <option value="Wedding" className="bg-[#121212] text-cream">Wedding</option>
                <option value="Birthday" className="bg-[#121212] text-cream">Birthday Celebration</option>
                <option value="Corporate" className="bg-[#121212] text-cream">Corporate Event</option>
                <option value="Anniversary" className="bg-[#121212] text-cream">Anniversary</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37]/60 ml-1">Preferred Date</label>
              <input 
                required 
                type="date" 
                value={preferredDate}
                onChange={e => setPreferredDate(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold transition-colors" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37]/60 ml-1">Guest Count</label>
              <select 
                required 
                value={guestCount}
                onChange={e => setGuestCount(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold transition-colors appearance-none cursor-pointer text-[#a3a3a3]"
              >
                <option value="" className="bg-[#121212] text-text-secondary">Select range</option>
                <option value="Under 50" className="bg-[#121212] text-cream">Under 50</option>
                <option value="50 – 150" className="bg-[#121212] text-cream">50 – 150</option>
                <option value="150 – 300" className="bg-[#121212] text-cream">150 – 300</option>
                <option value="300 – 500" className="bg-[#121212] text-cream">300 – 500</option>
                <option value="500+" className="bg-[#121212] text-cream">500+</option>
              </select>
            </div>
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37]/60 ml-1">Additional Notes</label>
              <textarea 
                rows={4} 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold transition-colors resize-none" 
                placeholder="Share any special requests or details about your vision..."
              />
            </div>
            <div className="md:col-span-2 mt-4 text-center">
              <button
                disabled={loading}
                type="submit"
                className="btn-primary w-full py-4 text-[13px]"
              >
                {loading ? 'Processing Engagement...' : 'Request Proposal'}
              </button>
            </div>
          </form>
        )}
      </div>
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
