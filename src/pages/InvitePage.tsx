import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '../lib/dataService';
import { Family, RSVP, UploadedDocument, RoomBooking } from '../types';
import { Loader2, Calendar, MapPin, Music, Heart, ChevronDown, Check, Car, Hotel, Languages, Map, Image as ImageIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import DocumentUploadSection from '../components/rsvp/DocumentUploadSection';
import VenueLayoutViewer from '../components/layout/VenueLayoutViewer';

export default function InvitePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  
  // RSVP State
  const [rsvpCompleted, setRsvpCompleted] = useState(false);
  const [originalRSVPCreatedAt, setOriginalRSVPCreatedAt] = useState<string | null>(null);
  const [originalTransportCreatedAt, setOriginalTransportCreatedAt] = useState<string | null>(null);
  const [roomBooking, setRoomBooking] = useState<RoomBooking | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [formData, setFormData] = useState({
    guest_name: '',
    email: '',
    attending: 'yes',
    total_guests: 1,
    children_count: 0,
    events: [] as string[],
    custom_notes: '',
    dietary_requirements: '',
    transport_mode: 'Car',
    need_cab: false,
    pickup_location: '',
    arrival_time: ''
  });

  const eventList = ['Haldi', 'Mehndi', 'Wedding', 'Reception'];

  useEffect(() => {
    const checkAccess = async () => {
      // Basic session check
      const auth = sessionStorage.getItem(`access_${slug}`);
      if (!auth) {
        navigate('/invite-access');
        return;
      }

      setIsAuthorized(true);
      
      const data = await dataService.getFamilyBySlug(slug || '');

      if (!data) {
        navigate('/');
        return;
      }

      setFamily(data);
      if (data.documents) {
        setUploadedDocuments(data.documents);
      }

      try {
        const rooms = await dataService.getRooms();
        const familyRoom = rooms.find((r: any) => r.family_id === data.id);
        if (familyRoom) {
          setRoomBooking(familyRoom);
        }
      } catch (err) {
        console.error('Failed to load room details:', err);
      }

      // Fetch existing RSVP and Transport details
      try {
        const rsvps = await dataService.getRSVPs();
        const existingRSVP = rsvps.find((r: any) => r.family_id === data.id);
        
        let existingTransport = null;
        try {
          const transports = await dataService.getTransports();
          existingTransport = transports.find((t: any) => t.family_id === data.id);
        } catch (err) {
          console.error('Failed to load transport details:', err);
        }

        if (existingRSVP) {
          setOriginalRSVPCreatedAt(existingRSVP.created_at || null);
          if (existingTransport) {
            setOriginalTransportCreatedAt(existingTransport.created_at || null);
          }
          setFormData({
            guest_name: existingRSVP.guest_name || '',
            email: existingRSVP.email || '',
            attending: existingRSVP.attending ? 'yes' : 'no',
            total_guests: existingRSVP.total_guests || 1,
            children_count: existingRSVP.children_count || 0,
            events: existingRSVP.events || [],
            custom_notes: existingRSVP.custom_notes || '',
            dietary_requirements: existingRSVP.dietary_requirements || '',
            transport_mode: existingTransport?.mode || 'Car',
            need_cab: existingTransport?.need_cab || false,
            pickup_location: existingTransport?.pickup_location || '',
            arrival_time: existingTransport?.arrival_time ? existingTransport.arrival_time.substring(0, 16) : ''
          });
          setRsvpCompleted(true);
        } else {
          setFormData(prev => ({
            ...prev,
            guest_name: data.name || ''
          }));
        }
      } catch (err) {
        console.error('Failed to load RSVP details:', err);
      }

      setLoading(false);
    };

    checkAccess();
  }, [slug, navigate]);

  const handleDocumentsComplete = async (newDocs: UploadedDocument[]) => {
    const updated = [...uploadedDocuments, ...newDocs];
    setUploadedDocuments(updated);
    
    if (family) {
      try {
        await dataService.updateFamily(family.id, { documents: updated });
        setFamily(prev => prev ? { ...prev, documents: updated } : null);
      } catch (err) {
        console.error('Error auto-saving documents:', err);
      }
    }
  };

  const handleDocumentDelete = async (docId: string) => {
    const updated = uploadedDocuments.filter(d => d.id !== docId);
    setUploadedDocuments(updated);
    
    if (family) {
      try {
        await dataService.updateFamily(family.id, { documents: updated });
        setFamily(prev => prev ? { ...prev, documents: updated } : null);
      } catch (err) {
        console.error('Error auto-saving document deletion:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || submitting) return;
    setSubmitting(true);

    const now = new Date().toISOString();
    const rsvpCreatedAt = originalRSVPCreatedAt || now;
    const transportCreatedAt = originalTransportCreatedAt || now;

    try {
      // 1. Submit RSVP
      await dataService.submitRSVP({
        family_id: family.id,
        guest_name: formData.guest_name,
        email: formData.email,
        attending: formData.attending === 'yes',
        total_guests: formData.total_guests,
        children_count: formData.children_count,
        events: formData.events,
        custom_notes: formData.custom_notes,
        dietary_requirements: formData.dietary_requirements,
        created_at: rsvpCreatedAt
      });

      // 2. Submit Transport if needed
      if (formData.attending === 'yes') {
          await dataService.submitTransport({
            family_id: family.id,
            mode: formData.transport_mode as any,
            need_cab: formData.need_cab,
            pickup_location: formData.pickup_location,
            arrival_time: formData.arrival_time ? new Date(formData.arrival_time).toISOString() : undefined,
            created_at: transportCreatedAt
          });
      }

      setOriginalRSVPCreatedAt(rsvpCreatedAt);
      setOriginalTransportCreatedAt(transportCreatedAt);
      setRsvpCompleted(true);
    } catch (err) {
      alert('Error submitting RSVP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event) 
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  if (loading && !family) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-gold">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!family) return null;

  return (
    <div className="bg-dark min-h-screen text-text-primary pb-20">
      {/* Cinematic Invitation Heading */}
      <section className="h-screen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.15)_0%,transparent_70%)]" />
            <motion.div 
               animate={{ opacity: [0.3, 0.6, 0.3] }}
               transition={{ duration: 5, repeat: Infinity }}
               className="absolute inset-0 bg-dark-4 opacity-50" 
            />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="relative z-10 text-center px-6"
        >
          {family.guest_image ? (
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-gold/70 mx-auto mb-8 p-1 bg-dark/60 shadow-[0_0_30px_rgba(201,168,76,0.25)]">
              <img 
                src={family.guest_image} 
                alt={`${family.name}`} 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
          ) : (
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-dashed border-gold/30 flex flex-col items-center justify-center mx-auto mb-8 bg-black/30 p-4 text-center">
              <ImageIcon className="text-gold/40 mb-2 animate-pulse" size={24} />
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-mono leading-tight max-w-[120px]">
                A beautiful space reserved for family photo
              </span>
            </div>
          )}

          {family.custom_title && (
            <span className="text-gold tracking-[0.25em] text-xs uppercase mb-3 block px-4 font-mono">
              ✦ &nbsp; {family.custom_title} &nbsp; ✦
            </span>
          )}

          <h1 className="font-serif text-3xl sm:text-5xl md:text-8xl text-cream mb-6 tracking-tight text-balance">
            Welcoming The <br />
            <em className="text-gold italic">{family.name}</em>
          </h1>
          <div className="w-12 h-[1px] bg-gold mx-auto mb-8" />
          
          <p className="text-text-secondary uppercase tracking-[0.2em] max-w-xl mx-auto leading-relaxed text-xs sm:text-sm px-4">
            {family.custom_greeting || "We are honored to have you join us for the most special celebration of our lives."}
          </p>
          
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-20"
          >
            <ChevronDown className="text-gold mx-auto" size={32} />
          </motion.div>
        </motion.div>
      </section>

      {/* Invitation Details Bento Grids */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Date & Time */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="col-span-1 bg-white/5 border border-gold/20 p-8 flex flex-col items-center text-center"
        >
          <Calendar className="text-gold mb-6" size={32} />
          <h3 className="font-serif text-2xl text-cream mb-4">When</h3>
          <p className="text-text-secondary text-sm uppercase tracking-widest leading-relaxed">
            Monday, 18th May 2026<br />
            Beginning at 6:00 PM
          </p>
        </motion.div>

        {/* Venue */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.1 }}
           className="col-span-1 md:col-span-2 bg-white/5 border border-gold/20 p-8 flex flex-col items-center text-center md:flex-row md:text-left gap-8"
        >
          <MapPin className="text-gold mb-6 md:mb-0" size={48} />
          <div>
            <h3 className="font-serif text-2xl text-cream mb-2">The Grand Palace Venue</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              Palace Road, Near Royal Circle, Event City - 400001<br />
              Valet parking available for all guests.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <a href="#" className="flex items-center gap-2 text-gold text-xs uppercase tracking-widest border border-gold/40 px-4 py-2 rounded hover:bg-gold/10 transition-colors">
                <MapPin size={14} /> Google Maps
              </a>
              <button onClick={() => setShowMapModal(true)} className="flex items-center gap-2 text-dark bg-gold text-xs uppercase tracking-widest px-4 py-2 rounded hover:brightness-110 transition-all font-bold">
                <Map size={14} /> Venue Layout
              </button>
            </div>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.2 }}
           className="col-span-1 md:col-span-3 bg-gold/5 border border-gold/30 p-10 text-center"
        >
          <div className="flex justify-center gap-6 mb-6">
             <Music className="text-gold" size={24} />
             <Heart className="text-gold" size={24} />
             <Languages className="text-gold" size={24} />
          </div>
          <h3 className="font-serif text-3xl text-cream mb-4 italic">"True love is the greatest adventure"</h3>
          <p className="text-text-secondary max-w-2xl mx-auto font-light leading-relaxed">
            Your presence is the only gift we require. We look forward to creating unforgettable memories together across these multiple days of celebration.
          </p>
        </motion.div>
      </section>

      {/* Room Number Section */}
      <section className="max-w-6xl mx-auto px-6 py-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 border border-gold/20 p-8 rounded-2xl relative overflow-hidden"
        >
          {/* Subtle design decals */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.1),transparent)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[radial-gradient(circle_at_bottom_left,rgba(201,168,76,0.1),transparent)] pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10 text-left">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20 flex-shrink-0">
                <Hotel className="text-gold" size={24} />
              </div>
              <div>
                <h3 className="font-serif text-2xl text-cream mb-1">Room Number</h3>
                <p className="text-lg font-mono text-gold font-semibold tracking-wide">
                  {roomBooking?.room_number ? (
                    <span>Room {roomBooking.room_number} <span className="text-xs text-text-secondary font-sans font-normal">({roomBooking.hotel_name || 'The Grand Palace Resort'})</span></span>
                  ) : (
                    "To be Assigned"
                  )}
                </p>
              </div>
            </div>

            <div className="bg-gold/5 border border-gold/20 rounded-xl p-5 max-w-xl">
              <p className="text-xs text-text-secondary leading-relaxed">
                <strong className="text-gold">Note:</strong> Room numbers will be allotted <strong className="text-gold">7–10 days before the function</strong>. Guests will receive their assigned room details before the event.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Advanced RSVP & Management Form */}
      <section id="rsvp-section" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <span className="text-gold tracking-[0.4em] text-[0.65rem] uppercase block mb-4">Your Schedule & Response</span>
          <h2 className="font-serif text-4xl md:text-6xl text-cream mb-6">Kindly <em>Respond</em></h2>
          <div className="w-10 h-[1px] bg-gold mx-auto mb-8" />
        </div>

        {rsvpCompleted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="premium-card p-12 text-center"
          >
            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Check className="text-gold" size={40} />
            </div>
            <h3 className="font-serif text-3xl text-cream mb-4">RSVP Confirmed!</h3>
            <p className="text-text-secondary mb-10 italic">"Thank you for your response, {family.name}. We are thrilled to celebrate with you!"</p>
            
            <div className="flex flex-col items-center gap-6 p-8 border border-white/5 bg-black/40 rounded-2xl mb-8">
               <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Your Digital Entry Pass</p>
               <QRCodeSVG 
                 value={`${window.location.origin}${window.location.pathname}#/pass/${family.slug}`} 
                 size={180}
                 bgColor="transparent"
                 fgColor="#D4AF37"
               />
               <p className="text-[9px] text-[#D4AF37]/50 uppercase tracking-widest mt-4">Present this QR code for priority entry</p>
            </div>

            <button
              onClick={() => setRsvpCompleted(false)}
              className="px-6 py-3 border border-gold/40 text-gold hover:bg-gold/10 text-xs uppercase tracking-widest transition-colors font-bold rounded-xl"
            >
              Update RSVP Response
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-12 bg-[#121212] border border-white/5 p-8 md:p-12 rounded-2xl">
            
            {/* Step 1: RSVP */}
            <div className="space-y-6">
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-gold border-b border-gold/20 pb-3">1. Attendance & Guests</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Primary Guest Name</label>
                  <input 
                    required 
                    type="text" 
                    className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold transition-colors"
                    value={formData.guest_name}
                    onChange={e => setFormData({...formData, guest_name: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold transition-colors"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Will you attend?</label>
                <div className="flex gap-4">
                  {['yes', 'no'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData({...formData, attending: opt})}
                      className={`flex-1 py-4 border rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                        ${formData.attending === opt ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-white/40 hover:border-gold/30'}`}
                    >
                      {opt === 'yes' ? 'YES' : 'NO'}
                    </button>
                  ))}
                </div>
              </div>

              {formData.attending === 'yes' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Total Adults (incl. you)</label>
                    <select 
                      className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold appearance-none cursor-pointer"
                      value={formData.total_guests}
                      onChange={e => setFormData({...formData, total_guests: parseInt(e.target.value)})}
                    >
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n} className="bg-[#121212]">{n}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Children (Under 12)</label>
                    <select 
                      className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold appearance-none cursor-pointer"
                      value={formData.children_count}
                      onChange={e => setFormData({...formData, children_count: parseInt(e.target.value)})}
                    >
                      {[0,1,2,3,4].map(n => <option key={n} value={n} className="bg-[#121212]">{n}</option>)}
                    </select>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Step 2: Events & Food */}
            {formData.attending === 'yes' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h4 className="text-[10px] uppercase tracking-[0.3em] text-gold border-b border-gold/20 pb-3">2. Preferences</h4>
                <div className="flex flex-col gap-2">
                    <label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Select Events You'll Attend</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {eventList.map(ev => (
                        <button
                          key={ev}
                          type="button"
                          onClick={() => toggleEvent(ev)}
                          className={`py-3 border rounded-xl text-[10px] uppercase tracking-widest transition-all font-bold
                            ${formData.events.includes(ev) ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-white/40'}`}
                        >
                          {ev}
                        </button>
                      ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Dietary Requirements / Food Preferences</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Vegetarian', 'Vegan', 'Gluten-Free', 'No Restrictions'].map(diet => (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => setFormData({ ...formData, dietary_requirements: diet })}
                        className={`py-3 border rounded-xl text-[10px] uppercase tracking-widest transition-all font-bold
                          ${formData.dietary_requirements === diet ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-white/40 hover:border-gold/20'}`}
                      >
                        {diet}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-[8px] uppercase tracking-widest text-[#D4AF37]/40">Other Allergies or Custom Food Notes (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Peanut allergy, diabetic options, lacto-vegetarian..."
                      className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-text-primary outline-none focus:border-gold transition-colors placeholder-white/20"
                      value={['Vegetarian', 'Vegan', 'Gluten-Free', 'No Restrictions'].includes(formData.dietary_requirements) ? '' : formData.dietary_requirements}
                      onChange={e => setFormData({...formData, dietary_requirements: e.target.value})}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Transport */}
            {formData.attending === 'yes' && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="space-y-6"
               >
                 <h4 className="text-[10px] uppercase tracking-[0.3em] text-gold border-b border-gold/20 pb-3 flex items-center gap-2">
                   <Car size={16} /> 3. Travel & Pickup
                 </h4>
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Primary Mode of Travel</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Car', 'Bus', 'Train', 'Flight'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setFormData({...formData, transport_mode: mode as any})}
                          className={`py-3 border rounded-xl text-[10px] uppercase tracking-widest transition-all font-bold
                            ${formData.transport_mode === mode ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-white/40'}`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="flex items-center gap-4 bg-black/40 p-5 border border-white/5 rounded-2xl">
                    <input 
                      type="checkbox" 
                      id="cab-req"
                      className="accent-gold w-5 h-5 cursor-pointer"
                      checked={formData.need_cab}
                      onChange={e => setFormData({...formData, need_cab: e.target.checked})}
                    />
                    <label htmlFor="cab-req" className="text-sm text-white/80 font-light tracking-wide cursor-pointer">
                      We require a cab pickup from the airport/station.
                    </label>
                 </div>

                 {formData.need_cab && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="flex flex-col gap-2">
                          <label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Pickup Location Detail</label>
                          <input 
                            type="text" 
                            className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold transition-colors"
                            placeholder="e.g. Mumbai Airport Terminal 2"
                            value={formData.pickup_location}
                            onChange={e => setFormData({...formData, pickup_location: e.target.value})}
                          />
                       </div>
                       <div className="flex flex-col gap-2">
                          <label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Arrival Date & Time</label>
                          <input 
                            type="datetime-local" 
                            className="bg-black/40 border border-white/10 rounded-xl p-4 text-text-primary outline-none focus:border-gold transition-colors"
                            value={formData.arrival_time}
                            onChange={e => setFormData({...formData, arrival_time: e.target.value})}
                          />
                       </div>
                    </motion.div>
                 )}
               </motion.div>
            )}

            {/* Step 4: Document Verification Upload */}
            {formData.attending === 'yes' && (
              <DocumentUploadSection 
                existingDocuments={uploadedDocuments}
                onUploadComplete={handleDocumentsComplete}
                onDeleteDocument={handleDocumentDelete}
              />
            )}

            {/* Room Info */}
            <motion.div 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
               className="bg-gold/5 p-8 border border-white/5 rounded-2xl flex items-start gap-4 text-left"
            >
               <Hotel className="text-gold flex-shrink-0" size={24} />
               <div>
                  <h5 className="text-[10px] uppercase tracking-[0.2em] text-gold mb-1">Accommodation Status</h5>
                  <p className="text-sm text-text-secondary font-light">
                    {roomBooking?.room_number ? (
                      <span>Assigned Room: <strong className="text-gold">{roomBooking.room_number}</strong> ({roomBooking.hotel_name || 'The Grand Palace Resort'})</span>
                    ) : (
                      <span>Will be allotted before the function.</span>
                    )}
                    <br />
                    <span className="text-gold/60 text-xs italic">
                      <strong>Note:</strong> Room numbers will be allotted <strong>7–10 days before the function</strong>. Guests will receive their assigned room details before the event.
                    </span>
                  </p>
               </div>
            </motion.div>

            <div className="pt-10">
              <button
                disabled={loading || submitting}
                type="submit"
                className="btn-primary w-full py-5 text-[14px]"
              >
                {submitting ? 'Confirming Protocol...' : 'Confirm My Presence'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Map Layout Modal */}
      <VenueLayoutViewer isOpen={showMapModal} onClose={() => setShowMapModal(false)} />
    </div>
  );
}
