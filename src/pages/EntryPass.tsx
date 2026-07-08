import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { dataService } from '../lib/dataService';
import { Family } from '../types';
import { 
  CheckCircle2, Navigation, PartyPopper, Map, 
  Volume2, VolumeX, Heart, Calendar, MapPin, 
  Users, Key, AlertCircle, Sparkles, Mail, Compass,
  User, Check, Plus, Minus, HelpCircle, Utensils, Loader2
} from 'lucide-react';
import VenueLayoutViewer from '../components/layout/VenueLayoutViewer';

// High-fidelity romantic background instrumental
const BG_MUSIC_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';

export default function EntryPass() {
  const { slug } = useParams();
  const [family, setFamily] = useState<Family | null>(null);
  const [venueSettings, setVenueSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  // Audio Engine Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Invitation Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // RSVP Form State
  const [rsvpCompleted, setRsvpCompleted] = useState(false);
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [originalRsvpCreatedAt, setOriginalRsvpCreatedAt] = useState<string | null>(null);
  
  const [rsvpFormData, setRsvpFormData] = useState({
    guest_name: '',
    email: '',
    attending: 'yes',
    total_guests: 1,
    children_count: 0,
    events: ['Mehndi', 'Haldi', 'Wedding', 'Reception'] as string[],
    custom_notes: '',
    dietary_requirements: 'No Restrictions'
  });

  const eventList = ['Mehndi', 'Haldi', 'Wedding', 'Reception'];

  // Load datasets
  useEffect(() => {
    const fetchPassAndRsvp = async () => {
      if (!slug) return;
      try {
        const [data, settings] = await Promise.all([
          dataService.getFamilyBySlug(slug),
          dataService.getVenueSettings()
        ]);
        
        setFamily(data);
        setVenueSettings(settings);

        if (data) {
          // Prefill default name and capacity limit
          setRsvpFormData(prev => ({
            ...prev,
            guest_name: data.name || '',
            total_guests: data.max_guests || 1
          }));

          // Fetch existing RSVP for this family
          try {
            const rsvps = await dataService.getRSVPs();
            const existing = rsvps.find((r: any) => r.family_id === data.id);
            if (existing) {
              setOriginalRsvpCreatedAt(existing.created_at || null);
              setRsvpFormData({
                guest_name: existing.guest_name || data.name || '',
                email: existing.email || '',
                attending: existing.attending ? 'yes' : 'no',
                total_guests: existing.total_guests || 1,
                children_count: existing.children_count || 0,
                events: existing.events || ['Mehndi', 'Haldi', 'Wedding', 'Reception'],
                custom_notes: existing.custom_notes || '',
                dietary_requirements: existing.dietary_requirements || 'No Restrictions'
              });
              setRsvpCompleted(true);
            }
          } catch (rsvpErr) {
            console.error('Failed to load existing RSVP details:', rsvpErr);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPassAndRsvp();
  }, [slug]);

  // Audio setup disabled to avoid NotSupportedError
  useEffect(() => {
    // Audio feature disabled
  }, [isOpen]);

  // Handle music toggle
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Target Ceremony Countdown
  useEffect(() => {
    const targetDateStr = venueSettings?.wedding_date || '2026-05-18T18:00:00';
    const targetDate = new Date(targetDateStr);

    if (isNaN(targetDate.getTime())) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [venueSettings]);

  // Handle RSVP Submit
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || submittingRsvp) return;
    setSubmittingRsvp(true);

    const now = new Date().toISOString();
    const rsvpCreatedAt = originalRsvpCreatedAt || now;

    try {
      await dataService.submitRSVP({
        family_id: family.id,
        guest_name: rsvpFormData.guest_name,
        email: rsvpFormData.email,
        attending: rsvpFormData.attending === 'yes',
        total_guests: Number(rsvpFormData.total_guests),
        children_count: Number(rsvpFormData.children_count),
        events: rsvpFormData.events,
        custom_notes: rsvpFormData.custom_notes,
        dietary_requirements: rsvpFormData.dietary_requirements,
        created_at: rsvpCreatedAt
      });

      setOriginalRsvpCreatedAt(rsvpCreatedAt);
      setRsvpCompleted(true);
    } catch (err) {
      console.error(err);
      alert('Error submitting RSVP. Please try again.');
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const toggleRsvpEvent = (event: string) => {
    setRsvpFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF0F2] flex flex-col items-center justify-center text-[#ff6b8b]">
        <div className="w-14 h-14 border-4 border-[#ff6b8b] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#591a24] opacity-80 animate-pulse font-bold">Decrypting Beautiful Invitation...</span>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen bg-[#FFF0F2] flex flex-col items-center justify-center text-center p-6 text-[#591a24] bg-[radial-gradient(ellipse_at_center,rgba(255,107,139,0.1)_0%,rgba(255,240,242,1)_80%)]">
        <div className="w-16 h-16 rounded-full bg-red-100 border border-red-300 flex items-center justify-center mb-6 shadow-sm">
          <AlertCircle className="text-red-500" size={32} />
        </div>
        <h1 className="text-3xl font-serif text-[#591a24] mb-2 font-semibold">Invitation Pass Not Found</h1>
        <p className="text-black/50 text-sm max-w-sm mx-auto mb-8 leading-normal font-light">
          This digital passcode slug is either unassigned, suspended, or does not exist in our active wedding logs.
        </p>
        <Link to="/" className="px-6 py-2.5 bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] hover:brightness-105 text-white font-mono uppercase tracking-widest text-xs rounded-xl transition-all font-bold shadow-md">
          Return Home
        </Link>
      </div>
    );
  }

  const coupleOne = venueSettings?.couple_one_name || 'Nikhil';
  const coupleTwo = venueSettings?.couple_two_name || 'Simran';
  const marriageImage = venueSettings?.couple_image || 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80';
  const welcomeText = venueSettings?.welcome_msg || 'Your presence adds color to our laughter, warmth to our moments, and completes our joy. We eagerly look forward to starting this special chapter of our lives in your honored presence.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F6] via-[#FFF0F2] to-[#FFE3E8] text-[#591a24] overflow-x-hidden selection:bg-[#ffb3c1] selection:text-[#591a24]">
      
      {/* BACKGROUND FLOATING SPARKS / ROSES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[15%] left-[5%] w-[40vh] h-[40vh] bg-[#ffccd5]/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[25%] right-[5%] w-[45vh] h-[45vh] bg-[#ffe5ec]/40 rounded-full blur-[130px]" />
      </div>

      <AnimatePresence mode="wait">
        
        {/* PHASE 1: THE REGAL CLOSED DIGITAL ENVELOPE SHIELD */}
        {!isOpen ? (
          <motion.section 
            key="envelope"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.95 }}
            transition={{ duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#FFF0F2] via-[#ffe5ec] to-[#FFF5F6] p-6 text-center overflow-hidden"
          >
            {/* Elegant luxury rose borders and decorations */}
            <div className="absolute inset-4 sm:inset-8 border border-[#ff8e9e]/30 rounded pointer-events-none" />
            <div className="absolute inset-6 sm:inset-10 border border-[#ffb3c1]/15 rounded pointer-events-none" />
            
            {/* Corner Ornamental Graphics */}
            <div className="absolute top-10 left-10 w-8 h-8 border-t-2 border-l-2 border-[#ff8e9e]/40" />
            <div className="absolute top-10 right-10 w-8 h-8 border-t-2 border-r-2 border-[#ff8e9e]/40" />
            <div className="absolute bottom-10 left-10 w-8 h-8 border-b-2 border-l-2 border-[#ff8e9e]/40" />
            <div className="absolute bottom-10 right-10 w-8 h-8 border-b-2 border-r-2 border-[#ff8e9e]/40" />

            <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
              
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 1 }}
                className="w-16 h-16 rounded-full border border-[#ff8e9e]/40 flex items-center justify-center mb-8 bg-white/60 shadow-sm"
              >
                <Heart className="text-[#ff4d6d] fill-[#ff4d6d]/10 animate-pulse" size={24} />
              </motion.div>

              <span className="text-[#ff4d6d] tracking-[0.45em] text-[10px] uppercase block mb-4 font-mono font-bold">✦ The Sacred Union ✦</span>
              
              <h1 className="font-serif text-3xl sm:text-4xl text-[#591a24] tracking-wide mb-1 px-4 leading-normal font-bold">
                Wedding of {coupleOne} & {coupleTwo}
              </h1>
              
              <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-[#ff4d6d] to-transparent my-6" />

              <span className="text-black/40 text-[9px] tracking-widest uppercase font-mono block mb-1">
                Special Invitation Specially For
              </span>

              <motion.h2 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="font-serif text-3xl sm:text-5xl text-[#ff4d6d] italic font-extrabold my-3 px-2 leading-relaxed tracking-tight"
              >
                The {family.name}
              </motion.h2>

              <p className="text-[#591a24]/60 text-xs max-w-sm leading-relaxed mt-4 px-4 font-light italic">
                "We await your prestigious presence to bless us as we embark on this sacred journey of eternity."
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="mt-12 group relative px-8 py-4 bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] text-white font-sans text-[11px] font-bold uppercase tracking-[0.25em] rounded-xl shadow-[0_4px_25px_rgba(255,77,109,0.3)] transition-all overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                <span className="relative flex items-center justify-center gap-1.5">
                  ✦ Open Invitation ✦
                </span>
              </motion.button>
            </div>
          </motion.section>
        ) : (
          
          // PHASE 2: CINEMATIC DYNAMIC PINK WEDDING INVITATION
          <motion.div 
            key="invitation-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="relative z-10 max-w-5xl mx-auto px-4 py-8 sm:py-16 md:py-20"
          >
            
            {/* FIXED AUDIO CONTROLLERS */}
            <div className="fixed bottom-6 right-6 z-[1000] flex items-center gap-2 bg-white/90 border border-[#ffccd5] backdrop-blur-md px-3.5 py-2.5 rounded-full shadow-lg">
              <span className="text-[9px] font-mono tracking-widest text-[#ff4d6d] uppercase animate-pulse font-bold">Ambient Mode {isPlaying ? 'ON' : 'OFF'}</span>
              <button 
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] hover:brightness-110 text-white flex items-center justify-center transition-all"
                title={isPlaying ? 'Pause Instrumental Music' : 'Play Instrumental Music'}
              >
                {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>

            {/* HEADER CORONA DECORATION */}
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-[#ff4d6d] tracking-[0.45em] text-[10px] uppercase font-mono block mb-2 font-bold">✦ Wedding Celebration & Entry Pass ✦</span>
              <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#ff4d6d] to-transparent mx-auto" />
            </div>

            {/* CENTRAL GRID: WELCOME PORTRAIT & PASS ENTRY TICKET */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* CARD LEFT: SPECIFIC PERSONAL WELCOMING PORTRAIT CARD */}
              <div className="lg:col-span-7 bg-white/70 border border-[#ffccd5] rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl shadow-pink-950/5 backdrop-blur-md">
                
                {/* Background decorative flower decal */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,139,0.06)_0%,transparent_60%)] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  
                  {/* Portrait Couple Image Block */}
                  <div className="relative mb-6">
                    {/* Floating rings design decal */}
                    <div className="absolute -inset-3 border border-[#ff4d6d]/20 rounded-full animate-spin [animation-duration:50s] pointer-events-none" />
                    <div className="absolute -inset-1 border border-[#ff4d6d]/30 rounded-full pointer-events-none" />
                    
                    <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-full overflow-hidden border-4 border-white p-1.5 bg-white shadow-lg shrink-0">
                      <img 
                        src={marriageImage} 
                        alt="Wedding Couple Portrait" 
                        className="w-full h-full object-cover rounded-full" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="absolute bottom-1 right-3 bg-gradient-to-br from-[#ff4d6d] to-[#ff758f] text-white border-2 border-white shadow-md w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      <Heart size={14} className="fill-white" />
                    </div>
                  </div>

                  {/* Couple Names display heading */}
                  <div className="mb-4">
                    <span className="text-[#ff4d6d] text-[9px] uppercase tracking-widest font-mono font-bold">The Wedding Union of</span>
                    <h2 className="font-serif text-3xl sm:text-4xl text-[#591a24] font-extrabold mt-1 tracking-wide">
                      {coupleOne} <span className="font-sans text-xl text-[#ff4d6d] font-normal">&</span> {coupleTwo}
                    </h2>
                  </div>

                  <div className="w-12 h-[1px] bg-[#ff8e9e]/50 my-4" />

                  {/* Honored Guest Name designation */}
                  <span className="text-[9px] tracking-[0.3em] uppercase text-black/40 font-mono mb-1.5 block">Warmly Welcoming Our Guests</span>
                  <h3 className="font-serif text-2xl sm:text-4xl text-[#ff4d6d] italic font-bold mb-6">
                    The {family.name}
                  </h3>

                  {/* Custom welcome text from adminSettings */}
                  <div className="my-2 bg-[#FFFDFE]/60 border border-[#ffccd5]/50 p-5 rounded-2xl shadow-sm">
                    <p className="font-serif text-sm sm:text-base text-[#591a24] leading-relaxed max-w-xl mx-auto italic font-light">
                      "{welcomeText}"
                    </p>
                  </div>

                </div>
              </div>

              {/* CARD RIGHT: THE SCAN PRIORITY TICKET PASS (With Live scan entry QR) */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="bg-white/95 border-2 border-[#ffb3c1] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
                  {/* Decorative ticket perforations */}
                  <div className="absolute top-1/2 -left-3.5 w-7 h-7 rounded-full bg-[#FFF0F2] border-r-2 border-[#ffb3c1] z-10 transform -translate-y-1/2" />
                  <div className="absolute top-1/2 -right-3.5 w-7 h-7 rounded-full bg-[#FFF0F2] border-l-2 border-[#ffb3c1] z-10 transform -translate-y-1/2" />

                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#ff4d6d] via-[#ff758f] to-[#ff4d6d]" />
                  
                  <div className="w-14 h-14 bg-gradient-to-br from-[#ffb3c1]/10 to-[#ff758f]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#ffccd5]">
                    <CheckCircle2 className="text-[#ff4d6d]" size={28} />
                  </div>

                  <h3 className="text-center text-[10px] text-[#ff4d6d] uppercase tracking-[0.34em] font-mono mb-1 font-bold">Priority Guest Entry</h3>
                  <h2 className="text-center font-serif text-2xl text-[#591a24] font-bold mb-5">Admission Pass</h2>
                  
                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-[#FFFDFE] border border-[#ffccd5]/50 p-3 rounded-2xl text-center shadow-sm">
                      <span className="block text-[9px] text-black/40 uppercase tracking-widest mb-1 font-mono">Passcode ID</span>
                      <span className="font-mono text-[#ff4d6d] text-xs font-bold uppercase">{family.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="bg-[#FFFDFE] border border-[#ffccd5]/50 p-3 rounded-2xl text-center shadow-sm">
                      <span className="block text-[9px] text-black/40 uppercase tracking-widest mb-1 font-mono">Status</span>
                      <span className="font-mono text-green-600 text-xs font-bold uppercase flex items-center justify-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                        ACTIVE
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#FFF5F6] to-[#FFE3E8] border border-[#ffccd5] p-4 rounded-2xl flex items-center justify-start gap-4 mb-5 shadow-sm">
                    <Users className="text-[#ff4d6d] flex-shrink-0" size={20} />
                    <div className="text-left">
                      <span className="block text-[8px] uppercase tracking-widest text-[#591a24]/60 font-mono font-bold">Maximum Capacity</span>
                      <span className="text-xs font-semibold text-[#591a24] font-mono">Valid for up to {family.max_guests} Guests</span>
                    </div>
                  </div>

                  {/* Interactive QR Code Display */}
                  <div className="bg-[#FFFDFE] border border-[#ffccd5] p-5 rounded-2xl flex flex-col items-center justify-center shadow-sm mb-4">
                    <div className="p-2 border border-[#ffccd5] rounded-xl bg-white shadow-inner">
                      <QRCodeSVG 
                        value={`${window.location.origin}${window.location.pathname}#/pass/${family.slug}`}
                        size={128}
                        level="H"
                        fgColor="#591a24"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-[9px] text-[#ff4d6d] uppercase tracking-widest mt-3.5 font-bold font-mono">Present QR code for entry scanning</p>
                  </div>

                  <div className="pt-4 border-t border-[#ffccd5]/50 border-dashed flex flex-col gap-3">
                    <button 
                      onClick={() => setShowMapModal(true)}
                      className="flex items-center gap-2 text-[#ff4d6d] hover:text-white border border-[#ffccd5] hover:bg-gradient-to-r hover:from-[#ff4d6d] hover:to-[#ff758f] px-4 py-2.5 rounded-xl transition-all w-full justify-center bg-white text-xs tracking-wider uppercase font-mono font-bold shadow-sm"
                    >
                      <Map size={13} /> Interactive Venue Map
                    </button>

                    {venueSettings?.google_maps_url ? (
                      <a 
                        href={venueSettings.google_maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-white bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] hover:brightness-105 px-4 py-2.5 rounded-xl transition-all w-full justify-center text-xs tracking-wider uppercase font-mono font-bold shadow-md shadow-[#ff4d6d]/10"
                      >
                        <Navigation size={13} /> Open Google Maps
                      </a>
                    ) : (
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(venueSettings?.address || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-white bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] hover:brightness-105 px-4 py-2.5 rounded-xl transition-all w-full justify-center text-xs tracking-wider uppercase font-mono font-bold shadow-md"
                      >
                        <Navigation size={13} /> Open Google Maps
                      </a>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* SCROLL-DOWN LIVE COUNTDOWN TIMER BLOCK */}
            {venueSettings?.show_countdown !== false && (
              <div className="mt-12 bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] text-white rounded-3xl p-6 sm:p-8 text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,transparent_75%)]" />
                
                <span className="relative z-10 text-[10px] uppercase tracking-[0.35em] text-white/90 block mb-4 font-mono font-bold">
                  ✦ {venueSettings?.countdown_label || 'Ceremony Begins In'} ✦
                </span>
                
                <div className="relative z-10 flex justify-center gap-4 sm:gap-8 text-white">
                  
                  <div className="flex flex-col items-center bg-white/15 px-4 py-3 rounded-2xl min-w-[70px] backdrop-blur-sm border border-white/10">
                    <span className="text-3xl sm:text-4xl font-mono font-extrabold leading-none">{timeLeft.days}</span>
                    <span className="text-[9px] uppercase tracking-widest text-white/80 font-mono mt-2 font-bold">Days</span>
                  </div>
                  
                  <span className="text-2xl sm:text-3xl opacity-60 self-center font-bold">:</span>
                  
                  <div className="flex flex-col items-center bg-white/15 px-4 py-3 rounded-2xl min-w-[70px] backdrop-blur-sm border border-white/10">
                    <span className="text-3xl sm:text-4xl font-mono font-extrabold leading-none">{timeLeft.hours}</span>
                    <span className="text-[9px] uppercase tracking-widest text-white/80 font-mono mt-2 font-bold">Hours</span>
                  </div>

                  <span className="text-2xl sm:text-3xl opacity-60 self-center font-bold">:</span>

                  <div className="flex flex-col items-center bg-white/15 px-4 py-3 rounded-2xl min-w-[70px] backdrop-blur-sm border border-white/10">
                    <span className="text-3xl sm:text-4xl font-mono font-extrabold leading-none">{timeLeft.minutes}</span>
                    <span className="text-[9px] uppercase tracking-widest text-white/80 font-mono mt-2 font-bold">Mins</span>
                  </div>

                  <span className="text-2xl sm:text-3xl opacity-60 self-center font-bold">:</span>

                  <div className="flex flex-col items-center bg-white/15 px-4 py-3 rounded-2xl min-w-[70px] backdrop-blur-sm border border-white/10">
                    <span className="text-3xl sm:text-4xl font-mono font-extrabold leading-none">{timeLeft.seconds}</span>
                    <span className="text-[9px] uppercase tracking-widest text-white/80 font-mono mt-2 font-bold">Secs</span>
                  </div>

                </div>

                <p className="relative z-10 text-[11px] text-white/85 font-mono mt-4 font-bold tracking-wide">
                  {new Date(venueSettings?.wedding_date || '2026-05-18T18:00:00').toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {' '}
                  {new Date(venueSettings?.wedding_date || '2026-05-18T18:00:00').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}

            {/* INTEGRATED GUEST RSVP FORM CARD */}
            <div className="mt-12 bg-white/80 border border-[#ffccd5] rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#ff4d6d] to-[#ff758f]" />
              
              <div className="text-center mb-8">
                <Heart className="text-[#ff4d6d] mx-auto mb-3" size={24} />
                <h3 className="font-serif text-2xl sm:text-3xl text-[#591a24] font-extrabold">RSVP Registration</h3>
                <p className="text-[9px] uppercase tracking-widest text-[#ff4d6d] font-mono font-bold mt-1">Kindly lock your celebration booking parameters below</p>
              </div>

              {rsvpCompleted ? (
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto shadow-sm">
                    <Check className="text-green-500" size={28} />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl font-bold text-[#591a24]">RSVP Confirmed & Locked!</h4>
                    <p className="text-xs text-[#591a24]/60 mt-1 max-w-sm mx-auto leading-relaxed font-light">
                      Thank you! We have logged your response. Your preference parameters are fully synchronized with our grand hotel database records.
                    </p>
                  </div>

                  <div className="bg-[#FFFDFE] border border-[#ffccd5] p-6 rounded-2xl max-w-md mx-auto text-left space-y-3 shadow-sm text-xs">
                    <div className="flex justify-between items-center border-b border-[#ffccd5]/50 pb-2">
                      <span className="text-black/40 uppercase font-mono text-[9px] font-bold">Attendance:</span>
                      <span className={`font-bold uppercase ${rsvpFormData.attending === 'yes' ? 'text-green-600' : 'text-red-500'}`}>
                        {rsvpFormData.attending === 'yes' ? 'Attending ✓' : 'Declined ✗'}
                      </span>
                    </div>
                    {rsvpFormData.attending === 'yes' && (
                      <>
                        <div className="flex justify-between items-center border-b border-[#ffccd5]/50 pb-2">
                          <span className="text-black/40 uppercase font-mono text-[9px] font-bold">Guests Count:</span>
                          <span className="font-mono font-bold text-[#591a24]">Adults: {rsvpFormData.total_guests} / Kids: {rsvpFormData.children_count}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#ffccd5]/50 pb-2">
                          <span className="text-black/40 uppercase font-mono text-[9px] font-bold">Food Preference:</span>
                          <span className="font-mono font-bold text-green-700">{rsvpFormData.dietary_requirements}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-b border-[#ffccd5]/50 pb-2">
                          <span className="text-black/40 uppercase font-mono text-[9px] font-bold">Events Selected:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rsvpFormData.events.map(ev => (
                              <span key={ev} className="px-2 py-0.5 bg-[#ff4d6d]/10 border border-[#ff4d6d]/20 text-[#ff4d6d] rounded-md text-[9px] font-mono font-bold uppercase">{ev}</span>
                            ))}
                          </div>
                        </div>
                        {rsvpFormData.custom_notes && (
                          <div className="flex flex-col gap-1">
                            <span className="text-black/40 uppercase font-mono text-[9px] font-bold">Special Notes:</span>
                            <p className="italic text-[#591a24]/80 mt-0.5">"{rsvpFormData.custom_notes}"</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setRsvpCompleted(false)}
                    className="text-xs text-[#ff4d6d] hover:text-[#ff758f] font-mono uppercase tracking-widest font-bold underline"
                  >
                    Edit RSVP Parameters
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRsvpSubmit} className="space-y-6 max-w-2xl mx-auto">
                  
                  {/* Attendance Switch */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#ff4d6d] font-mono font-bold">Are you attending the festivities?</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setRsvpFormData({ ...rsvpFormData, attending: 'yes' })}
                        className={`py-3.5 border rounded-2xl text-xs uppercase tracking-widest transition-all font-mono font-extrabold shadow-sm
                          ${rsvpFormData.attending === 'yes' ? 'bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] text-white border-transparent' : 'bg-white border-[#ffccd5] text-[#591a24]/50 hover:border-[#ff8e9e]/30'}`}
                      >
                        Yes, I will attend
                      </button>
                      <button
                        type="button"
                        onClick={() => setRsvpFormData({ ...rsvpFormData, attending: 'no' })}
                        className={`py-3.5 border rounded-2xl text-xs uppercase tracking-widest transition-all font-mono font-extrabold shadow-sm
                          ${rsvpFormData.attending === 'no' ? 'bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] text-white border-transparent' : 'bg-white border-[#ffccd5] text-[#591a24]/50 hover:border-[#ff8e9e]/30'}`}
                      >
                        No, I cannot attend
                      </button>
                    </div>
                  </div>

                  {rsvpFormData.attending === 'yes' && (
                    <div className="space-y-5 animate-fadeIn">
                      
                      {/* Name and Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-[#ff4d6d] font-mono font-bold">Contact Person Name</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={14} />
                            <input
                              type="text"
                              required
                              value={rsvpFormData.guest_name}
                              onChange={e => setRsvpFormData({ ...rsvpFormData, guest_name: e.target.value })}
                              className="w-full bg-white border border-[#ffccd5] rounded-xl pl-10 pr-4 py-3 text-xs text-[#591a24] outline-none focus:border-[#ff4d6d] shadow-inner"
                              placeholder="Your full name"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-[#ff4d6d] font-mono font-bold">Email Address</label>
                          <input
                            type="email"
                            required
                            value={rsvpFormData.email}
                            onChange={e => setRsvpFormData({ ...rsvpFormData, email: e.target.value })}
                            className="w-full bg-white border border-[#ffccd5] rounded-xl px-4 py-3 text-xs text-[#591a24] outline-none focus:border-[#ff4d6d] shadow-inner"
                            placeholder="Your email for updates"
                          />
                        </div>
                      </div>

                      {/* Guest counters */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-[#FFFDFE] border border-[#ffccd5] p-4 rounded-2xl flex items-center justify-between shadow-sm">
                          <div>
                            <span className="block text-[9px] uppercase tracking-widest text-[#591a24]/60 font-mono font-bold">Adult Attendees</span>
                            <span className="text-[10px] text-black/40">Includes yourself (Max capacity: {family.max_guests})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setRsvpFormData(prev => ({ ...prev, total_guests: Math.max(1, prev.total_guests - 1) }))}
                              className="w-8 h-8 rounded-full border border-[#ffccd5] flex items-center justify-center text-[#ff4d6d] hover:bg-[#ffb3c1]/10 bg-white"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-mono text-sm font-bold min-w-[15px] text-center">{rsvpFormData.total_guests}</span>
                            <button
                              type="button"
                              onClick={() => setRsvpFormData(prev => ({ ...prev, total_guests: Math.min(family.max_guests || 1, prev.total_guests + 1) }))}
                              className="w-8 h-8 rounded-full border border-[#ffccd5] flex items-center justify-center text-[#ff4d6d] hover:bg-[#ffb3c1]/10 bg-white"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="bg-[#FFFDFE] border border-[#ffccd5] p-4 rounded-2xl flex items-center justify-between shadow-sm">
                          <div>
                            <span className="block text-[9px] uppercase tracking-widest text-[#591a24]/60 font-mono font-bold">Children Attendees</span>
                            <span className="text-[10px] text-black/40">Kids below 12 years of age</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setRsvpFormData(prev => ({ ...prev, children_count: Math.max(0, prev.children_count - 1) }))}
                              className="w-8 h-8 rounded-full border border-[#ffccd5] flex items-center justify-center text-[#ff4d6d] hover:bg-[#ffb3c1]/10 bg-white"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-mono text-sm font-bold min-w-[15px] text-center">{rsvpFormData.children_count}</span>
                            <button
                              type="button"
                              onClick={() => setRsvpFormData(prev => ({ ...prev, children_count: prev.children_count + 1 }))}
                              className="w-8 h-8 rounded-full border border-[#ffccd5] flex items-center justify-center text-[#ff4d6d] hover:bg-[#ffb3c1]/10 bg-white"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Multi-event Attendance selector */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-[#ff4d6d] font-mono font-bold">Which programs will you join?</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {eventList.map(ev => {
                            const active = rsvpFormData.events.includes(ev);
                            return (
                              <button
                                key={ev}
                                type="button"
                                onClick={() => toggleRsvpEvent(ev)}
                                className={`py-3.5 border rounded-2xl text-[10px] uppercase tracking-widest font-mono font-extrabold transition-all shadow-sm flex flex-col items-center justify-center gap-1
                                  ${active ? 'bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] text-white border-transparent' : 'bg-white border-[#ffccd5] text-[#591a24]/50 hover:border-[#ff8e9e]/30'}`}
                              >
                                {active && <Check size={12} />}
                                {ev}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dietary requirements selectors */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-[#ff4d6d] font-mono font-bold flex items-center gap-1">
                          <Utensils size={12} /> Food Preferences / Dietary Requirements
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {['Vegetarian', 'Vegan', 'Gluten-Free', 'No Restrictions'].map(diet => {
                            const active = rsvpFormData.dietary_requirements === diet;
                            return (
                              <button
                                key={diet}
                                type="button"
                                onClick={() => setRsvpFormData({ ...rsvpFormData, dietary_requirements: diet })}
                                className={`py-3.5 border rounded-2xl text-[10px] uppercase tracking-widest font-mono font-extrabold transition-all shadow-sm
                                  ${active ? 'bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] text-white border-transparent' : 'bg-white border-[#ffccd5] text-[#591a24]/50 hover:border-[#ff8e9e]/30'}`}
                              >
                                {diet}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Custom dietary notes / allergies input */}
                        <div className="flex flex-col gap-1.5 mt-2">
                          <span className="text-[9px] uppercase tracking-widest text-[#591a24]/50 font-mono font-bold">Other Food Allergies or Custom Food Notes</span>
                          <input
                            type="text"
                            placeholder="e.g. Peanut allergy, diabetic options, lacto-vegetarian..."
                            value={['Vegetarian', 'Vegan', 'Gluten-Free', 'No Restrictions'].includes(rsvpFormData.dietary_requirements) ? '' : rsvpFormData.dietary_requirements}
                            onChange={e => setRsvpFormData({ ...rsvpFormData, dietary_requirements: e.target.value })}
                            className="w-full bg-white border border-[#ffccd5] rounded-xl px-4 py-3 text-xs text-[#591a24] outline-none focus:border-[#ff4d6d] shadow-inner placeholder-black/20"
                          />
                        </div>
                      </div>

                      {/* Special messages / guest wishes */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-[#ff4d6d] font-mono font-bold">Guest notes / Warm Wishes</label>
                        <textarea
                          rows={2}
                          value={rsvpFormData.custom_notes}
                          onChange={e => setRsvpFormData({ ...rsvpFormData, custom_notes: e.target.value })}
                          className="w-full bg-white border border-[#ffccd5] rounded-xl px-4 py-3 text-xs text-[#591a24] outline-none focus:border-[#ff4d6d] shadow-inner resize-none placeholder-black/20"
                          placeholder="Leave a message for the beautiful couple (optional)..."
                        />
                      </div>

                    </div>
                  )}

                  {/* Submit buttons */}
                  <div className="pt-4 border-t border-[#ffccd5]/50">
                    <button
                      type="submit"
                      disabled={submittingRsvp}
                      className="w-full bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] hover:brightness-105 text-white py-4 px-6 rounded-2xl font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-[#ff4d6d]/15"
                    >
                      {submittingRsvp ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Logging Response to Wedding Cloud...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          ✦ Register My RSVP Reservation ✦
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}
            </div>

            {/* FULL LOGISTICAL TIMELINE OVERVIEW */}
            <div className="mt-12 bg-white/70 border border-[#ffccd5] rounded-3xl p-6 sm:p-10 shadow-xl backdrop-blur-md">
              
              <div className="text-center mb-10">
                <Heart className="text-[#ff4d6d] mx-auto mb-3" size={24} />
                <h3 className="font-serif text-2xl sm:text-3xl text-[#591a24] font-extrabold">Our Auspicious Itinerary</h3>
                <p className="text-[9px] uppercase tracking-widest text-[#ff4d6d] font-mono font-bold mt-1">Grand Festivities & Celebrations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Event 1 */}
                <div className="p-5 rounded-2xl bg-[#FFFDFE]/80 border border-[#ffccd5]/50 hover:border-[#ff4d6d]/30 transition-all text-center shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#ff4d6d]/10 flex items-center justify-center mx-auto mb-3.5 border border-[#ffb3c1]">
                    <Sparkles className="text-[#ff4d6d]" size={16} />
                  </div>
                  <h4 className="font-serif font-bold text-[#591a24] text-lg">Mehndi Ceremony</h4>
                  <p className="text-[10px] text-[#ff4d6d] font-mono font-bold mt-1 uppercase">May 16th • 4:00 PM</p>
                  <p className="text-xs text-[#591a24]/60 font-light mt-3 leading-relaxed">Let the fragrance of traditional henna write our eternal bond.</p>
                </div>

                {/* Event 2 */}
                <div className="p-5 rounded-2xl bg-[#FFFDFE]/80 border border-[#ffccd5]/50 hover:border-[#ff4d6d]/30 transition-all text-center shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#ff4d6d]/10 flex items-center justify-center mx-auto mb-3.5 border border-[#ffb3c1]">
                    <Sparkles className="text-[#ff4d6d] animate-pulse" size={16} />
                  </div>
                  <h4 className="font-serif font-bold text-[#591a24] text-lg">Haldi & Sangeet</h4>
                  <p className="text-[10px] text-[#ff4d6d] font-mono font-bold mt-1 uppercase">May 17th • 11:00 AM</p>
                  <p className="text-xs text-[#591a24]/60 font-light mt-3 leading-relaxed">Yellow powders and dancing rhythms to spark celebration cheer.</p>
                </div>

                {/* Event 3 */}
                <div className="p-5 rounded-2xl bg-white border-2 border-[#ffb3c1]/70 hover:border-[#ff4d6d]/50 transition-all text-center shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#ff4d6d] text-white text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-bl-lg font-mono">
                    Main
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#ff4d6d]/15 flex items-center justify-center mx-auto mb-3.5 border border-[#ff4d6d]/30 shadow-[0_0_15px_rgba(255,77,109,0.15)]">
                    <Heart className="text-[#ff4d6d] fill-[#ff4d6d]" size={16} />
                  </div>
                  <h4 className="font-serif font-extrabold text-[#ff4d6d] text-lg">Grand Wedding</h4>
                  <p className="text-[10px] text-[#ff4d6d] font-mono font-bold mt-1 uppercase">May 18th • 6:00 PM</p>
                  <p className="text-xs text-[#591a24] font-medium mt-3 leading-relaxed">The holy phere vows under the celestial canopy stargaze.</p>
                </div>

                {/* Event 4 */}
                <div className="p-5 rounded-2xl bg-[#FFFDFE]/80 border border-[#ffccd5]/50 hover:border-[#ff4d6d]/30 transition-all text-center shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#ff4d6d]/10 flex items-center justify-center mx-auto mb-3.5 border border-[#ffb3c1]">
                    <Sparkles className="text-[#ff4d6d]" size={16} />
                  </div>
                  <h4 className="font-serif font-bold text-[#591a24] text-lg">Reception Feast</h4>
                  <p className="text-[10px] text-[#ff4d6d] font-mono font-bold mt-1 uppercase">May 19th • 8:00 PM</p>
                  <p className="text-xs text-[#591a24]/60 font-light mt-3 leading-relaxed">Celebrate with culinary rich delights and toast to our future.</p>
                </div>

              </div>

              {/* FOOTER */}
              <div className="text-center pt-8 border-t border-[#ffccd5]/50 mt-10">
                <p className="text-xs text-[#591a24]/40 italic">Hosted with warm regards by the Bride & Groom Families</p>
              </div>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* MAP VIEWER LAYOUT MODAL */}
      <VenueLayoutViewer 
        isOpen={showMapModal} 
        onClose={() => setShowMapModal(false)} 
        customMapUrl={venueSettings?.interactive_map_url}
      />

    </div>
  );
}
