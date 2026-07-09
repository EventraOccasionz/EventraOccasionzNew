import React from 'react';
import { motion } from 'framer-motion';
import { Send, Phone, MessageSquare, Mail, MapPin, Calendar, Users, IndianRupee } from 'lucide-react';
import { GlassCard } from '../layout/GlassCard';
import { LeadInquiry, WeddingPlanningData } from '../../types';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface LeadFormProps {
  weddingData: WeddingPlanningData;
}

export const LeadForm: React.FC<LeadFormProps> = ({ weddingData }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    requirements: ''
  });
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const lead: LeadInquiry = {
        ...formData,
        city: weddingData.city,
        eventDate: weddingData.timeline,
        guestCount: weddingData.guestCount,
        requirements: formData.requirements || weddingData.services.join(', '),
        created_at: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'wedding_leads'), lead);
      setStatus('success');
    } catch (err) {
      console.error('Error submitting lead:', err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-20"
      >
        <GlassCard gold>
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-white mb-4">Inquiry Submitted Successfully</h2>
          <p className="text-gray-400 mb-8">
            Thank you for choosing Eventra Occasionz. Our lead planner will contact you within 24 hours to discuss your dream wedding.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="btn-outline flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> WhatsApp Us
            </a>
            <button onClick={() => window.location.reload()} className="btn-gold">
              Back to Home
            </button>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-8 py-10">
      <div className="md:col-span-2 space-y-6">
        <h2 className="text-4xl font-serif font-bold text-white">Get a Detailed Quotation</h2>
        <p className="text-gray-400">
          Ready to turn your vision into reality? Fill out the form and our luxury wedding consultants will prepare a 
          personalized final quotation and venue availability report for you.
        </p>
        
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center text-gold-400">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Call Us</p>
              <p className="text-white font-medium">+91 99999 99999</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center text-gold-400">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email Us</p>
              <p className="text-white font-medium">hello@eventraoccasionz.com</p>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-3">
        <GlassCard gold>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Full Name</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-gold-500/50 pl-12"
                    placeholder="John Doe"
                  />
                  <Users className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Phone Number</label>
                <div className="relative">
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-gold-500/50 pl-12"
                    placeholder="+91 99999 99999"
                  />
                  <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Email Address</label>
              <div className="relative">
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-gold-500/50 pl-12"
                  placeholder="john@example.com"
                />
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Additional Requirements</label>
              <textarea
                rows={4}
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-gold-500/50"
                placeholder="Any specific themes, venues, or special requests..."
              />
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="btn-gold w-full flex items-center justify-center gap-2 text-lg"
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit Inquiry'}
              <Send className="w-5 h-5" />
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};
