import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { dataService } from '../lib/dataService';
import { Family, RSVP, UploadedDocument, RoomBooking } from '../types';
import { 
  Loader2, Calendar, MapPin, Music, Heart, ChevronDown, Check, 
  Car, Hotel, Languages, Map, Image as ImageIcon, Volume2, VolumeX, 
  Phone, Download, Clock, Star, Users, ArrowRight, ArrowLeft
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import DocumentUploadSection from '../components/rsvp/DocumentUploadSection';
import VenueLayoutViewer from '../components/layout/VenueLayoutViewer';
import ScratchCard from '../components/rsvp/ScratchCard';
import GuestDashboard from '../components/dashboard/GuestDashboard';

// Real-time Synthesized Indian Tanpura Drone using Web Audio API
class TanpuraDrone {
  private ctx: AudioContext | null = null;
  private oscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private masterGain: GainNode | null = null;

  start() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.06, this.ctx.currentTime); // Gentle background volume
      this.masterGain.connect(this.ctx.destination);

      // Traditional Indian C-Tanpura tuning: Sa - Pa - Sa - Sa
      const frequencies = [130.81, 196.00, 261.63, 261.63 * 1.004];

      frequencies.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Strum-like string harmonics
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 1.4, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        this.oscillators.push({ osc, gain });

        // Staggered plucking swell loop simulation
        this.pluckSwell(gain, idx * 1.4);
      });
    } catch (e) {
      console.warn("Failed to initialize Tanpura Drone synthesizer:", e);
    }
  }

  private pluckSwell(gainNode: GainNode, delay: number) {
    if (!this.ctx) return;
    const interval = 5.5;
    const cycle = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      gainNode.gain.setValueAtTime(0.001, t);
      gainNode.gain.exponentialRampToValueAtTime(0.04, t + 0.4);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 4.2);
    };

    setTimeout(() => {
      cycle();
      setInterval(cycle, interval * 1000);
    }, delay * 1000);
  }

  stop() {
    this.oscillators.forEach(o => {
      try { o.osc.stop(); } catch(_) {}
    });
    this.oscillators = [];
    if (this.ctx) {
      try { this.ctx.close(); } catch(_) {}
    }
  }

  setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(vol * 0.06, this.ctx.currentTime);
    }
  }
}

// Synthesizes a resonant bronze temple bell strike
function playTempleBell() {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const baseFreq = 280;
    const partials = [1, 1.2, 1.5, 2, 2.5, 3, 3.5];

    partials.forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq * ratio, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * ratio * 0.98, now + 3);

      const vol = 0.38 / (i + 1);
      const decay = 4.5 / (i * 0.4 + 1);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay);
    });
  } catch (e) {
    console.warn("Failed to play temple bell sound:", e);
  }
}

// Custom decorative SVG corners and dividers
function OrnateCorner({ className }: { className?: string }) {
  return (
    <svg className={`w-12 h-12 text-gold/30 ${className}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M 10 10 L 90 10 M 10 10 L 10 90" strokeWidth="2" />
      <path d="M 15 15 C 30 15, 35 30, 35 45 C 35 60, 20 70, 15 85" />
      <path d="M 15 15 C 15 30, 30 35, 45 35 C 60 35, 70 20, 85 15" />
      <circle cx="20" cy="20" r="2.5" fill="currentColor" />
    </svg>
  );
}

function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-8 select-none">
      <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-gold/40" />
      <svg className="w-6 h-6 text-gold/60" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M 50 10 L 85 50 L 50 90 L 15 50 Z" />
        <circle cx="50" cy="50" r="4" fill="currentColor" />
      </svg>
      <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-gold/40" />
    </div>
  );
}

// Floating gold dust stardust
function FloatingParticles() {
  const particles = Array.from({ length: 20 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((_, i) => {
        const size = Math.random() * 2.5 + 1.5;
        const delay = Math.random() * 7;
        const duration = Math.random() * 10 + 10;
        const left = Math.random() * 100;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-t from-amber-400 to-yellow-100 opacity-35 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              bottom: '-10px',
            }}
            animate={{
              y: ['-105vh', '5vh'],
              x: [0, Math.sin(i) * 35, 0],
              opacity: [0, 0.5, 0.3, 0],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}

// Live Countdown Timer
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) return;
      
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-3 max-w-md mx-auto py-4">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Minutes', value: timeLeft.minutes },
        { label: 'Seconds', value: timeLeft.seconds }
      ].map((item, idx) => (
        <div key={idx} className="bg-gradient-to-b from-[#2a0408] to-[#120002] border border-gold/25 rounded-lg p-3 text-center shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <span className="font-serif text-2xl sm:text-3xl text-gold font-bold block">{String(item.value).padStart(2, '0')}</span>
          <span className="text-[8px] uppercase tracking-widest text-[#FDFBF7]/60 mt-0.5 block">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function InvitePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [viewDashboard, setViewDashboard] = useState(true);

  // Cinematic opening steps
  const [entryStep, setEntryStep] = useState<'access' | 'welcome' | 'diya' | 'envelope' | 'scratch' | 'unveiled'>('access');
  const [isDiyaLit, setIsDiyaLit] = useState(false);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);

  // Custom passcode verified error
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');

  // Audio system state
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tanpuraRef = useRef<TanpuraDrone | null>(null);

  // Dynamic Event settings from config or defaults
  const [currentEvent, setCurrentEvent] = useState<any | null>(null);

  // RSVP Form States
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
      // Fetch family database configurations first so we can greet them by name personalized!
      const data = await dataService.getFamilyBySlug(slug || '');

      if (!data) {
        navigate('/');
        return;
      }

      setFamily(data);
      if (data.documents) {
        setUploadedDocuments(data.documents);
      }

      // Check if they already possess credentials in this session
      const auth = sessionStorage.getItem(`access_${slug}`);
      if (auth) {
        setIsAuthorized(true);
        if (sessionStorage.getItem(`unveiled_${slug}`) === 'true') {
          setEntryStep('unveiled');
          // Automatically start background elements if they prefer
          setIsMuted(false);
        } else {
          setEntryStep('welcome');
        }
      } else {
        setIsAuthorized(false);
        setEntryStep('access');
      }

      // Load Room Details
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

      // Load custom events config
      try {
        if (dataService.isConfigured()) {
          const eventsDoc = await getDoc(doc(db, 'venue_settings', 'events_config'));
          if (eventsDoc.exists()) {
            const d = eventsDoc.data();
            if (d && Array.isArray(d.events)) {
              const matched = d.events.find((e: any) => e.id === data.event_id || e.status === 'Active');
              if (matched) {
                setCurrentEvent(matched);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed loading events in invite page:', err);
      }

      setLoading(false);
    };

    checkAccess();
  }, [slug, navigate]);

  // Clean audio context on unmount
  useEffect(() => {
    return () => {
      if (tanpuraRef.current) {
        tanpuraRef.current.stop();
      }
    };
  }, []);

  const handleStartMusic = () => {
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.play().catch(err => console.log("Audio autoplay blocked:", err));
    }
    if (!tanpuraRef.current) {
      tanpuraRef.current = new TanpuraDrone();
      tanpuraRef.current.start();
    } else {
      tanpuraRef.current.setVolume(1);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      if (!nextMuted) {
        audioRef.current.play().catch(e => console.log(e));
      } else {
        audioRef.current.pause();
      }
    }
    if (tanpuraRef.current) {
      tanpuraRef.current.setVolume(nextMuted ? 0 : 1);
    }
  };

  // Verify access code internally inside the luxury theme
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!family) return;
    if (enteredCode.trim().toUpperCase() === family.access_code.toUpperCase()) {
      sessionStorage.setItem(`access_${slug}`, 'true');
      setIsAuthorized(true);
      setEntryStep('welcome');
    } else {
      setCodeError('The sacred passcode entered is invalid. Please try again.');
    }
  };

  // Triggers the beautiful light diya ritual
  const handleLightDiya = () => {
    if (isDiyaLit) return;
    setIsDiyaLit(true);
    playTempleBell();
    handleStartMusic(); // Start background drones on interaction
    
    setTimeout(() => {
      setEntryStep('envelope');
    }, 1800);
  };

  // Open envelope
  const handleBreakSeal = () => {
    if (isEnvelopeOpen) return;
    setIsEnvelopeOpen(true);
    
    setTimeout(() => {
      setEntryStep('scratch');
    }, 1500);
  };

  // Complete scratching to unlock the entire scroll
  const handleScratchComplete = () => {
    sessionStorage.setItem(`unveiled_${slug}`, 'true');
    setEntryStep('unveiled');
  };

  // RSVP submits (Intact database logic)
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
      
      // Scroll to top of RSVP area on confirmation
      document.getElementById('rsvp-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert('Error submitting RSVP response. Please verify details and try again.');
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

  const downloadItinerary = () => {
    const content = `
============================================================
              THE ROYAL INDIAN CELEBRATIONS
                    PRIYA & RAHUL
============================================================

Greetings Honored Member of the ${family?.name || 'Guest Family'}!

Below is the personalized sacred timeline & location directory
compiled for your reference.

------------------------------------------------------------
                      AUSPICIOUS EVENTS
------------------------------------------------------------
* CEREMONY: Haldi Ritual
  Date: Monday, May 17, 2026 | 10:00 AM
  Vibe: A beautiful morning splash of turmeric, songs, & laughter.
  Venue: Golden Terraces, Grand Palace Venue

* CEREMONY: Sangeet & Henna Evening
  Date: Monday, May 17, 2026 | 05:00 PM
  Vibe: High-energy dancing, gorgeous mehndi designs, & feast.
  Venue: Royal Ballroom, Grand Palace Venue

* CEREMONY: Mandap Vows & Wedding
  Date: Tuesday, May 18, 2026 | 04:00 PM
  Vibe: Auspicious rituals, sacred Pheras, and varmala.
  Venue: Shahi Palace Lawns

* CEREMONY: Grand Reception banquet
  Date: Tuesday, May 18, 2026 | 08:00 PM
  Vibe: Royal toast, grand dinner reception, and blessings.
  Venue: Palace Gardens

------------------------------------------------------------
                       CONCIERGE & HELPLINE
------------------------------------------------------------
Should you have any inquiries regarding pickup scheduling or rooms:
* Logistics Coordinator: +91 98765 43210
* Hospitality Desk: +91 98765 43211

We look forward to hosting you in royal splendor.
============================================================
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Royal_Wedding_Itinerary_${family?.slug || 'Invite'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !family) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1c0205] text-gold">
        <Loader2 className="animate-spin mb-4 text-gold" size={44} strokeWidth={1.5} />
        <span className="text-xs uppercase tracking-[0.25em] text-gold/60">Preparing Royal Invitation...</span>
      </div>
    );
  }

  if (!family) return null;

  const defaultEvent = {
    bride: 'Priya',
    groom: 'Rahul',
    date: '2026-10-15',
    venue: 'Umaid Bhawan Palace, Jodhpur',
    name: 'Royal Rajput Wedding'
  };

  const eventDetails = currentEvent || defaultEvent;

  return (
    <div className="bg-[#120002] min-h-screen text-[#FDFBF7] font-sans antialiased overflow-x-hidden selection:bg-gold selection:text-black">
      {/* Background Audio Player */}
      <audio 
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" 
        loop
        className="hidden"
      />

      {/* Floating global music controller */}
      {entryStep === 'unveiled' && (
        <button
          onClick={toggleMute}
          className="fixed bottom-6 right-6 z-50 p-3.5 bg-gradient-to-tr from-[#3a060e] to-black border border-gold/40 text-gold rounded-full shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:scale-105 active:scale-95 transition-all"
          title={isMuted ? 'Unmute Instrumental Music' : 'Mute Music'}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 className="animate-pulse" size={20} />}
        </button>
      )}

      {/* CINEMATIC OPENING EXPERIENCE FLOW */}
      <AnimatePresence mode="wait">
        
        {/* Step 1: ACCESS CODE GATE */}
        {entryStep === 'access' && (
          <motion.div
            key="step-access"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-6 relative bg-[radial-gradient(ellipse_at_center,#2d0206_0%,#090001_80%)]"
          >
            <FloatingParticles />
            
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-[#1d0104]/90 border border-gold/30 rounded-2xl p-8 md:p-12 text-center shadow-[0_0_50px_rgba(29,1,4,0.8)] overflow-hidden"
            >
              <OrnateCorner className="absolute top-2 left-2" />
              <OrnateCorner className="absolute top-2 right-2 rotate-90" />
              <OrnateCorner className="absolute bottom-2 left-2 -rotate-90" />
              <OrnateCorner className="absolute bottom-2 right-2 rotate-180" />

              <div className="mb-8">
                <div className="w-16 h-16 mx-auto mb-4 border border-gold/30 rounded-full flex items-center justify-center bg-black/40">
                  <Heart className="text-gold animate-pulse" size={24} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-gold/80 block mb-1">Royal Alliance</span>
                <h2 className="font-serif text-3xl text-cream tracking-tight mb-2">The Invitation</h2>
                <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6" />
                <p className="text-[11px] text-text-secondary uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
                  Welcoming the <br />
                  <span className="text-gold font-bold font-serif text-sm tracking-wide lowercase italic block mt-1 first-letter:uppercase">
                    {family.name}
                  </span>
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-6 relative z-10">
                <div className="flex flex-col gap-2">
                  <input
                    required
                    type="text"
                    value={enteredCode}
                    onChange={(e) => {
                      setEnteredCode(e.target.value);
                      setCodeError('');
                    }}
                    className="bg-black/60 border border-gold/25 rounded-xl p-4 text-center text-xl tracking-[0.45em] text-gold outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all uppercase placeholder-gold/20"
                    placeholder="PASSCODE"
                  />
                  {codeError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-[10px] text-center mt-1 uppercase tracking-widest"
                    >
                      {codeError}
                    </motion.p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-[#b58925] via-[#f7e693] to-[#b58925] text-black font-semibold uppercase tracking-[0.2em] text-xs rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Reveal Invitation
                </button>
              </form>

              <p className="mt-8 text-[9px] text-[#FDFBF7]/40 uppercase tracking-[0.15em] max-w-xs mx-auto">
                Please enter your private wedding access passcode to initiate the ritual.
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: LUXURY WELCOME SCREEN */}
        {entryStep === 'welcome' && (
          <motion.div
            key="step-welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-6 relative bg-[radial-gradient(ellipse_at_center,#240205_0%,#050001_85%)]"
          >
            <FloatingParticles />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative w-full max-w-xl bg-gradient-to-b from-[#250307] to-[#0d0002] border border-gold/30 rounded-2xl p-10 md:p-14 text-center shadow-[0_0_60px_rgba(212,175,55,0.1)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04)_0%,transparent_70%)] pointer-events-none" />
              <OrnateCorner className="absolute top-3 left-3 text-gold/45" />
              <OrnateCorner className="absolute top-3 right-3 rotate-90 text-gold/45" />
              <OrnateCorner className="absolute bottom-3 left-3 -rotate-90 text-gold/45" />
              <OrnateCorner className="absolute bottom-3 right-3 rotate-180 text-gold/45" />

              {family.guest_image ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-gold/50 mx-auto mb-6 p-1 bg-black/40 shadow-[0_0_25px_rgba(212,175,55,0.15)]"
                >
                  <img 
                    src={family.guest_image} 
                    alt={family.name} 
                    className="w-full h-full object-cover rounded-full" 
                  />
                </motion.div>
              ) : (
                <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-gold/30 flex items-center justify-center bg-black/30">
                  <Users className="text-gold" size={24} />
                </div>
              )}

              {family.custom_title && (
                <span className="text-gold tracking-[0.25em] text-[10px] sm:text-xs uppercase mb-3 block font-mono">
                  ✦ &nbsp; {family.custom_title} &nbsp; ✦
                </span>
              )}

              <h1 className="font-serif text-3xl sm:text-5xl text-cream tracking-tight mb-4 text-balance">
                Welcoming The <br />
                <span className="text-gold italic font-bold block mt-1 first-letter:uppercase">{family.name}</span>
              </h1>
              
              <div className="w-16 h-[1px] bg-gold/50 mx-auto mb-6" />
              
              <p className="text-text-secondary uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed text-[10px] sm:text-xs text-cream/80 mb-10">
                {family.custom_greeting || "We are highly honored to invite you to celebrate the majestic union of our children."}
              </p>

              <button
                onClick={() => setEntryStep('diya')}
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-gold/50 text-gold uppercase tracking-[0.25em] text-[10px] sm:text-xs rounded-xl hover:bg-gold/10 active:scale-[0.98] transition-all font-bold shadow-[0_0_15px_rgba(212,175,55,0.05)]"
              >
                Enter the Palace <ArrowRight size={14} />
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Step 3: INTERACTIVE DIGITAL DIYA */}
        {entryStep === 'diya' && (
          <motion.div
            key="step-diya"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-black"
          >
            <div className="absolute inset-0 bg-[#0c0001] opacity-90" />
            <FloatingParticles />

            <div className="relative z-10 text-center max-w-md">
              <span className="text-gold tracking-[0.35em] text-[9px] uppercase block mb-2">Sacred Lighting Ritual</span>
              <h3 className="font-serif text-2xl text-cream tracking-tight mb-8">Ignite the Auspicious Flame</h3>
              
              {/* Dynamic Animated Diya Frame */}
              <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                {/* Golden glowing circle backdrop */}
                <AnimatePresence>
                  {isDiyaLit && (
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.22)_0%,transparent_65%)]"
                    />
                  )}
                </AnimatePresence>

                {/* The Diya Component */}
                <div 
                  onClick={handleLightDiya}
                  className={`cursor-pointer transform hover:scale-105 transition-transform duration-300 ${isDiyaLit ? 'pointer-events-none' : ''}`}
                >
                  <svg className="w-48 h-48 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]" viewBox="0 0 200 200" fill="none">
                    {/* Intricate base mandala plate */}
                    <circle cx="100" cy="115" r="45" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" className="animate-spin" style={{ animationDuration: '40s' }} />
                    <circle cx="100" cy="115" r="35" fill="none" stroke="#D4AF37" strokeWidth="0.7" opacity="0.4" />
                    
                    {/* The Brass Diya Pot body */}
                    <path d="M 50 100 C 50 140, 150 140, 150 100 C 150 90, 140 85, 100 105 C 60 85, 50 90, 50 100 Z" fill="url(#brassGrad)" stroke="#B38728" strokeWidth="1.5" />
                    {/* Oil puddle */}
                    <ellipse cx="100" cy="103" rx="35" ry="10" fill="#a16207" opacity="0.8" />
                    
                    {/* Cotton Wick */}
                    <path d="M 100 105 C 100 95, 96 86, 96 75 C 96 66, 100 64, 100 64 C 100 64, 104 66, 104 75 C 104 86, 100 95, 100 105 Z" fill="#E5E7EB" />
                    {/* Wick burnt tip */}
                    <circle cx="100" cy="65" r="2.5" fill="#1F2937" />

                    {/* Gradient Defs */}
                    <defs>
                      <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#AA771C" />
                        <stop offset="25%" stopColor="#FBF5B7" />
                        <stop offset="50%" stopColor="#DAA520" />
                        <stop offset="75%" stopColor="#FBF5B7" />
                        <stop offset="100%" stopColor="#AA771C" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Animated Layered Flame */}
                  <AnimatePresence>
                    {isDiyaLit && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ 
                          opacity: [0.9, 1, 0.9],
                          scale: [1, 1.15, 1],
                          y: [0, -2, 0]
                        }}
                        transition={{ 
                          opacity: { duration: 0.2 },
                          scale: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
                          y: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
                        }}
                        className="absolute top-[35px] left-[90px] w-5 h-16 origin-bottom z-10 pointer-events-none"
                      >
                        {/* Outer Flame Glow */}
                        <div className="absolute inset-x-0 bottom-0 top-1 rounded-full bg-gradient-to-t from-red-600 via-amber-500 to-yellow-200 opacity-60 blur-[3px]" />
                        {/* Inner Core Flame */}
                        <div className="absolute inset-x-1 bottom-1 top-4 rounded-full bg-gradient-to-t from-amber-500 via-yellow-200 to-white opacity-95" />
                        {/* Shimmer particles rising */}
                        <motion.div 
                          animate={{ y: [-15, -45], opacity: [0.8, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="absolute left-2 w-1 h-1 rounded-full bg-yellow-200"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <p className="mt-8 text-cream/70 text-xs tracking-wide font-serif h-8">
                {isDiyaLit ? (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gold tracking-widest uppercase">
                    Auspicious energy activated ✦
                  </motion.span>
                ) : (
                  <span className="animate-pulse">Tap the wick to ignite the sacred Diya</span>
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 4: LUXURY ENVELOPE OPENING */}
        {entryStep === 'envelope' && (
          <motion.div
            key="step-envelope"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#090001]"
          >
            <FloatingParticles />
            
            <div className="relative z-10 text-center max-w-lg w-full">
              <span className="text-gold tracking-[0.35em] text-[9px] uppercase block mb-1">Palace Courier</span>
              <h3 className="font-serif text-2xl text-cream tracking-tight mb-10">Break the Golden Wax Seal</h3>

              <div className="relative w-full max-w-sm h-64 mx-auto bg-gradient-to-b from-[#2b0306] to-[#120002] border border-gold/30 rounded-xl shadow-2xl flex flex-col items-center justify-center overflow-hidden">
                <OrnateCorner className="absolute top-2 left-2 text-gold/25" />
                <OrnateCorner className="absolute top-2 right-2 rotate-90 text-gold/25" />
                <OrnateCorner className="absolute bottom-2 left-2 -rotate-90 text-gold/25" />
                <OrnateCorner className="absolute bottom-2 right-2 rotate-180 text-gold/25" />

                {/* Animated Envelope Flap (Using Framer Motion heights) */}
                <motion.div 
                  animate={isEnvelopeOpen ? { height: 0, opacity: 0 } : { height: '50%' }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  className="absolute top-0 inset-x-0 bg-[#3a060e] border-b border-gold/25 origin-top z-20 flex flex-col items-center justify-end pb-3"
                >
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                </motion.div>

                {/* Wax Seal Toggle */}
                <motion.div
                  onClick={handleBreakSeal}
                  animate={isEnvelopeOpen ? { scale: 0, opacity: 0 } : { scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="absolute z-30 cursor-pointer w-16 h-16 rounded-full bg-gradient-to-r from-[#b38728] via-[#f7e693] to-[#aa771c] shadow-[0_4px_15px_rgba(212,175,55,0.4)] flex items-center justify-center border border-gold/60"
                >
                  <span className="font-serif font-bold text-[#1c0205] text-[15px] select-none">SHUBH</span>
                </motion.div>

                {/* Revealed Invitation scroll preview sliding out */}
                <AnimatePresence>
                  {isEnvelopeOpen && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                      className="absolute inset-6 bg-[#fcf9f2] text-black border border-gold/40 rounded shadow-inner p-4 text-center flex flex-col justify-center items-center z-10"
                    >
                      <span className="font-serif text-[#1c0205] text-[10px] tracking-widest uppercase mb-1">ROYAL ALLIANCE SCROLL</span>
                      <div className="w-10 h-[1px] bg-gold/50 mb-2" />
                      <p className="text-[11px] font-serif text-[#3a060e] italic">"Two souls, one sacred path. We request your presence to sanctify this beautiful knot of love."</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="absolute bottom-3 text-cream/50 text-[10px] tracking-widest uppercase">
                  {isEnvelopeOpen ? 'Seal broken. Opening...' : 'Tap the seal to break'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: AUSPICIOUS DATE SCRATCH CARD */}
        {entryStep === 'scratch' && (
          <motion.div
            key="step-scratch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-black"
          >
            <FloatingParticles />
            
            <div className="relative z-10 text-center max-w-sm w-full">
              <span className="text-gold tracking-[0.35em] text-[9px] uppercase block mb-1">Sacred Muhurat Reveal</span>
              <h3 className="font-serif text-2xl text-cream tracking-tight mb-2">Unveil the Wedding Date</h3>
              <p className="text-[10px] text-cream/60 tracking-widest uppercase mb-8">Swipe or scratch with your finger/mouse</p>

              <ScratchCard 
                dateText={`Tuesday, ${new Date(eventDetails.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                onComplete={handleScratchComplete}
              />
            </div>
          </motion.div>
        )}

        {/* Step 6: MAIN LUXURY DIGITAL WEDDING INVITATION SCROLL / DASHBOARD */}
        {entryStep === 'unveiled' && (
          viewDashboard ? (
            <GuestDashboard
              family={family}
              roomBooking={roomBooking}
              slug={slug || ''}
              onBackToRitual={() => setViewDashboard(false)}
              downloadItinerary={downloadItinerary}
            />
          ) : (
            <motion.div
              key="step-unveiled"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              {/* Floating Back Button */}
              <div className="fixed top-6 left-6 z-50">
                <button
                  onClick={() => setViewDashboard(true)}
                  className="px-4 py-2.5 bg-black/80 backdrop-blur border border-gold/30 text-gold text-xs rounded-xl hover:bg-gold hover:text-dark transition-all font-mono uppercase tracking-widest flex items-center gap-1.5 shadow-2xl"
                >
                  <ArrowLeft size={14} /> Back to Guest Dashboard
                </button>
              </div>
            {/* Cinematic background layers */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.12)_0%,transparent_75%)] pointer-events-none" />
              <FloatingParticles />
            </div>

            {/* UNVEILED HEADER / HOME SCENE */}
            <section className="min-h-screen relative flex items-center justify-center overflow-hidden py-16 px-6">
              
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
                {/* Background Rotating Mandala */}
                <svg className="w-[85vw] h-[85vw] sm:w-[500px] sm:h-[500px] text-gold animate-spin" style={{ animationDuration: '70s' }} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
                  <circle cx="50" cy="50" r="45" strokeDasharray="2,2" />
                  <circle cx="50" cy="50" r="35" />
                  <polygon points="50,15 60,35 85,50 60,65 50,85 40,65 15,50 40,35" />
                  <polygon points="50,25 57,43 75,50 57,57 50,75 43,57 25,50 43,43" />
                  <circle cx="50" cy="50" r="5" fill="currentColor" />
                </svg>
              </div>

              <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
                
                {/* Personalized custom relationship title */}
                {family.custom_title && (
                  <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-gold tracking-[0.35em] text-[10px] sm:text-xs uppercase mb-3 block font-mono bg-gold/5 px-4 py-1.5 border border-gold/15 rounded-full"
                  >
                    ✦ &nbsp; {family.custom_title} &nbsp; ✦
                  </motion.span>
                )}

                <motion.h2
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.2 }}
                  className="font-serif text-3xl sm:text-5xl md:text-8xl text-cream tracking-tight mb-2 uppercase"
                >
                  Welcoming <br />
                  <span className="text-gold italic font-bold block mt-1 first-letter:uppercase">{family.name}</span>
                </motion.h2>

                <SectionDivider />

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="text-text-secondary uppercase tracking-[0.25em] max-w-xl mx-auto leading-relaxed text-[11px] sm:text-xs text-cream/70 px-4"
                >
                  {family.custom_greeting || "Your presence will beautifully amplify our hearts and double our joys. We cordially request you to grace us with your auspicious company."}
                </motion.p>

                {family.guest_image && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-2 border-gold/50 mt-10 p-1.5 bg-black/50 shadow-[0_0_40px_rgba(212,175,55,0.2)]"
                  >
                    <img 
                      src={family.guest_image} 
                      alt={family.name} 
                      className="w-full h-full object-cover rounded-full" 
                    />
                  </motion.div>
                )}

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-16"
                >
                  <ChevronDown className="text-gold mx-auto cursor-pointer" size={28} onClick={() => {
                    document.getElementById('couple-section')?.scrollIntoView({ behavior: 'smooth' });
                  }} />
                </motion.div>
              </div>
            </section>

            {/* THE BRIDE & GROOM INTRO SECTION */}
            <section id="couple-section" className="py-24 px-6 relative bg-gradient-to-b from-transparent to-[#1a0104]">
              <div className="max-w-4xl mx-auto text-center">
                <span className="text-gold tracking-[0.4em] text-[10px] uppercase block mb-2">Sacred Alliance</span>
                <h2 className="font-serif text-3xl sm:text-5xl text-cream tracking-tight mb-4">The Happy Couple</h2>
                <div className="w-12 h-[1px] bg-gold mx-auto mb-10" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-2xl mx-auto items-center mt-12">
                  
                  {/* Groom Card */}
                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="bg-black/40 border border-gold/25 rounded-2xl p-8 text-center relative overflow-hidden"
                  >
                    <OrnateCorner className="absolute top-2 left-2 text-gold/20" />
                    <OrnateCorner className="absolute bottom-2 right-2 rotate-180 text-gold/20" />
                    
                    <span className="text-xs tracking-[0.3em] text-gold uppercase mb-1 block">The Groom</span>
                    <h3 className="font-serif text-3xl text-cream font-bold mb-3">{eventDetails.groom}</h3>
                    <div className="w-8 h-[1px] bg-gold/50 mx-auto mb-4" />
                    <p className="text-xs text-cream/70 leading-relaxed font-light italic">
                      "A gentle soul guided by honor, humor, and a warm heart, eager to build a lifetime of memories."
                    </p>
                  </motion.div>

                  {/* Bride Card */}
                  <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="bg-black/40 border border-gold/25 rounded-2xl p-8 text-center relative overflow-hidden"
                  >
                    <OrnateCorner className="absolute top-2 right-2 rotate-90 text-gold/20" />
                    <OrnateCorner className="absolute bottom-2 left-2 -rotate-90 text-gold/20" />
                    
                    <span className="text-xs tracking-[0.3em] text-gold uppercase mb-1 block">The Bride</span>
                    <h3 className="font-serif text-3xl text-cream font-bold mb-3">{eventDetails.bride}</h3>
                    <div className="w-8 h-[1px] bg-gold/50 mx-auto mb-4" />
                    <p className="text-xs text-cream/70 leading-relaxed font-light italic">
                      "A compassionate spirit reflecting elegance, beautiful dreams, and a warmth that lights up any space."
                    </p>
                  </motion.div>

                </div>

                <div className="mt-16 bg-gold/5 p-8 border border-gold/20 rounded-xl max-w-xl mx-auto">
                  <span className="text-[10px] tracking-widest uppercase text-gold/80 block mb-2">Sacred Blessings From</span>
                  <p className="text-sm font-serif text-cream italic mb-4">"Proud Parents & Families"</p>
                  <div className="grid grid-cols-2 gap-6 text-xs text-left max-w-sm mx-auto border-t border-gold/10 pt-4">
                    <div>
                      <p className="text-gold uppercase tracking-wider font-semibold mb-1">Groom's Parents</p>
                      <p className="text-cream/90">Smt. & Shri. Vijay Verma</p>
                    </div>
                    <div>
                      <p className="text-gold uppercase tracking-wider font-semibold mb-1">Bride's Parents</p>
                      <p className="text-cream/90">Smt. & Shri. Ramesh Sharma</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* THE WEDDING LOVE STORY SECTION */}
            <section className="py-24 px-6 relative bg-[#130002] border-y border-gold/10">
              <div className="max-w-4xl mx-auto text-center">
                <span className="text-gold tracking-[0.4em] text-[10px] uppercase block mb-2">The Journey</span>
                <h2 className="font-serif text-3xl sm:text-5xl text-cream tracking-tight mb-4">Our Love Story</h2>
                <div className="w-12 h-[1px] bg-gold mx-auto mb-10" />

                <div className="relative max-w-2xl mx-auto border border-gold/20 bg-gradient-to-b from-[#200206] to-black rounded-2xl p-8 md:p-12 shadow-lg">
                  <OrnateCorner className="absolute top-2 left-2 text-gold/20" />
                  <OrnateCorner className="absolute top-2 right-2 rotate-90 text-gold/20" />
                  <OrnateCorner className="absolute bottom-2 left-2 -rotate-90 text-gold/20" />
                  <OrnateCorner className="absolute bottom-2 right-2 rotate-180 text-gold/20" />

                  <p className="text-sm text-cream/85 leading-relaxed font-light italic mb-6">
                    "In the tapestry of fate, our threads were destined to align. From our very first glance to quiet shared cups of cardamom tea, we found in each other a home, an adventure, and an eternal friendship."
                  </p>
                  <p className="text-sm text-cream/85 leading-relaxed font-light italic">
                    "With the blessings of our elders and the endless support of our companions, we are ready to take our sacred circles around the holy fire to unite our paths forever."
                  </p>
                </div>
              </div>
            </section>

            {/* THE SACRED TIMELINE (MULTIPLE DAYS CELEBRATION) */}
            <section className="py-24 px-6 relative bg-gradient-to-b from-[#130002] to-black">
              <div className="max-w-4xl mx-auto text-center">
                <span className="text-gold tracking-[0.4em] text-[10px] uppercase block mb-2">Sacred Protocol</span>
                <h2 className="font-serif text-3xl sm:text-5xl text-cream tracking-tight mb-4">Wedding Timeline</h2>
                <div className="w-12 h-[1px] bg-gold mx-auto mb-16" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left max-w-6xl mx-auto">
                  
                  {/* Haldi */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white/5 border border-gold/25 rounded-xl p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-amber-400/10 rounded-bl-full flex items-center justify-center border-l border-b border-amber-400/20" />
                    <span className="text-gold font-mono text-[10px] tracking-widest block mb-2">DAY 01 - MORNING</span>
                    <h3 className="font-serif text-xl text-cream font-bold mb-2">Haldi Ceremony</h3>
                    <p className="text-xs text-gold/80 mb-4 flex items-center gap-1.5"><Clock size={12} /> 10:00 AM onwards</p>
                    <p className="text-xs text-cream/70 leading-relaxed font-light">
                      A splash of sunny yellow turmeric paste, laughter, and high-spirited folk songs to kickstart our union.
                    </p>
                  </motion.div>

                  {/* Sangeet */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 border border-gold/25 rounded-xl p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/10 rounded-bl-full flex items-center justify-center border-l border-b border-rose-500/20" />
                    <span className="text-gold font-mono text-[10px] tracking-widest block mb-2">DAY 01 - EVENING</span>
                    <h3 className="font-serif text-xl text-cream font-bold mb-2">Mehndi & Sangeet</h3>
                    <p className="text-xs text-gold/80 mb-4 flex items-center gap-1.5"><Clock size={12} /> 05:00 PM onwards</p>
                    <p className="text-xs text-cream/70 leading-relaxed font-light">
                      Intricate henna artwork on hands paired with high-energy musical steps, dynamic family dances, and a rich feast.
                    </p>
                  </motion.div>

                  {/* Wedding */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-gold/25 rounded-xl p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-600/10 rounded-bl-full flex items-center justify-center border-l border-b border-yellow-600/20" />
                    <span className="text-gold font-mono text-[10px] tracking-widest block mb-2">DAY 02 - AFTERNOON</span>
                    <h3 className="font-serif text-xl text-cream font-bold mb-2">The Wedding</h3>
                    <p className="text-xs text-gold/80 mb-4 flex items-center gap-1.5"><Clock size={12} /> 04:00 PM onwards</p>
                    <p className="text-xs text-cream/70 leading-relaxed font-light">
                      Sacred circles around the holy fire (Pheras), Vedic hymns, and exchange of vows under the grand royal canopy.
                    </p>
                  </motion.div>

                  {/* Reception */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 border border-gold/25 rounded-xl p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-red-800/10 rounded-bl-full flex items-center justify-center border-l border-b border-red-800/20" />
                    <span className="text-gold font-mono text-[10px] tracking-widest block mb-2">DAY 02 - EVENING</span>
                    <h3 className="font-serif text-xl text-cream font-bold mb-2">Grand Reception</h3>
                    <p className="text-xs text-gold/80 mb-4 flex items-center gap-1.5"><Clock size={12} /> 08:00 PM onwards</p>
                    <p className="text-xs text-cream/70 leading-relaxed font-light">
                      A majestic royal feast, classical instrumental recital, and reception dinner to bless the newlywed couple.
                    </p>
                  </motion.div>

                </div>

                <div className="mt-12">
                  <button 
                    onClick={downloadItinerary}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-gold/40 text-gold rounded-lg text-xs uppercase tracking-widest hover:bg-gold/10 transition-colors font-semibold"
                  >
                    <Download size={14} /> Download Royal Itinerary File
                  </button>
                </div>
              </div>
            </section>

            {/* THE MAJESTIC VENUE DETAILS & LIVE COUNTDOWN */}
            <section className="py-24 px-6 relative bg-gradient-to-b from-black via-[#160103] to-black">
              <div className="max-w-4xl mx-auto text-center">
                <span className="text-gold tracking-[0.4em] text-[10px] uppercase block mb-2">Auspicious Rendezvous</span>
                <h2 className="font-serif text-3xl sm:text-5xl text-cream tracking-tight mb-4">Location & Countdown</h2>
                <div className="w-12 h-[1px] bg-gold mx-auto mb-16" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch max-w-4xl mx-auto text-left mb-16">
                  
                  {/* Venue Address */}
                  <div className="bg-white/5 border border-gold/20 p-8 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20 mb-6">
                        <MapPin className="text-gold" size={24} />
                      </div>
                      <h3 className="font-serif text-2xl text-cream mb-2">{eventDetails.venue}</h3>
                      <p className="text-xs text-cream/70 leading-relaxed font-light mb-6">
                        Palace Road, Near Royal Archway, Event City - 400001 <br />
                        Valet services are stationed at the main Palace gate for priority arrivals.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventDetails.venue)}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] text-gold border border-gold/30 rounded hover:bg-gold/10 uppercase tracking-widest font-semibold"
                      >
                        <MapPin size={12} /> Google Maps
                      </a>
                      <button 
                        onClick={() => setShowMapModal(true)} 
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] bg-gold text-black rounded hover:brightness-110 uppercase tracking-widest font-bold"
                      >
                        <Map size={12} /> Venue Layout
                      </button>
                    </div>
                  </div>

                  {/* Countdown Block */}
                  <div className="bg-white/5 border border-gold/20 p-8 rounded-2xl flex flex-col justify-center text-center">
                    <span className="text-gold tracking-[0.3em] text-[9px] uppercase block mb-1">Auspicious Countdown</span>
                    <h4 className="font-serif text-xl text-cream mb-4">Auspicious Hours Remaining</h4>
                    
                    <CountdownTimer targetDate={eventDetails.date} />

                    <p className="text-[10px] text-cream/50 uppercase tracking-wider mt-4">
                      ✦ October 15, 2026 ✦
                    </p>
                  </div>

                </div>
              </div>
            </section>

            {/* THE ACCOMMODATION / HOTEL ROOM CARD (IF ALLOTTED) */}
            <section className="py-12 px-6 relative bg-black">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white/5 border border-gold/25 p-8 rounded-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.08),transparent)] pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10 text-left">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20 flex-shrink-0">
                        <Hotel className="text-gold" size={24} />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl text-cream mb-1">Room Allotment Status</h3>
                        <p className="text-md font-mono text-gold font-semibold tracking-wide">
                          {roomBooking?.room_number ? (
                            <span>Room {roomBooking.room_number} <span className="text-xs text-text-secondary font-sans font-normal">({roomBooking.hotel_name || 'The Grand Palace Resort'})</span></span>
                          ) : (
                            "To be Assigned"
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gold/5 border border-gold/20 rounded-xl p-5 max-w-md">
                      <p className="text-xs text-cream/60 leading-relaxed">
                        <strong className="text-gold font-semibold">Note:</strong> Room numbers will be locked and shared <strong className="text-gold">7–10 days before the wedding</strong>. Hosts will assist with priority bag checks upon arrival.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* ROYAL CONCIERGE ASSISTANCE INFO */}
            <section className="py-16 px-6 relative bg-gradient-to-b from-black to-[#130002]">
              <div className="max-w-4xl mx-auto text-center">
                <span className="text-gold tracking-[0.3em] text-[9px] uppercase block mb-1 font-mono">Assistance Desk</span>
                <h3 className="font-serif text-xl text-cream mb-6">Our Royal Concierge Coordinators</h3>
                <div className="w-8 h-[1px] bg-gold/50 mx-auto mb-8" />

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-left text-xs">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-lg">
                    <p className="text-gold font-semibold uppercase tracking-wider mb-1">Hospitality Desk</p>
                    <p className="text-cream/90 flex items-center gap-1"><Phone size={11} /> +91 98765 43211</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-4 rounded-lg">
                    <p className="text-gold font-semibold uppercase tracking-wider mb-1">Travel Coordination</p>
                    <p className="text-cream/90 flex items-center gap-1"><Phone size={11} /> +91 98765 43210</p>
                  </div>
                </div>
              </div>
            </section>

            {/* PRESERVED RSVP PROTOCOL TRIGGER DRAWER */}
            <section id="rsvp-section" className="py-20 px-6 max-w-4xl mx-auto relative z-10">
              <div className="text-center mb-12">
                <span className="text-gold tracking-[0.4em] text-[10px] uppercase block mb-2">Ceremonial Registry</span>
                <h2 className="font-serif text-3xl sm:text-5xl text-cream tracking-tight mb-4">Response Protocol</h2>
                <div className="w-12 h-[1px] bg-gold mx-auto mb-4" />
                <p className="text-xs text-cream/60 max-w-md mx-auto">Please confirm your family schedule to enable catering and pickup protocols.</p>
              </div>

              {rsvpCompleted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-b from-[#2b0306] to-black border border-gold/35 rounded-2xl p-10 text-center shadow-lg"
                >
                  <div className="w-16 h-16 bg-gold/15 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="text-gold" size={32} />
                  </div>
                  <h3 className="font-serif text-2xl text-cream font-bold mb-2">RSVP Confirmed</h3>
                  <p className="text-xs text-cream/70 mb-8 italic">"We look forward to hosting you, {family.name}, in majestic fashion!"</p>
                  
                  <div className="flex flex-col items-center gap-4 p-6 border border-gold/15 bg-black/50 rounded-xl max-w-sm mx-auto mb-8">
                     <p className="text-[9px] uppercase tracking-[0.25em] text-gold">Digital Passcode Entry Ticket</p>
                     <QRCodeSVG 
                       value={`${window.location.origin}${window.location.pathname}#/pass/${family.slug}`} 
                       size={150}
                       bgColor="transparent"
                       fgColor="#D4AF37"
                     />
                     <p className="text-[8px] text-gold/60 uppercase tracking-widest mt-2">Scan code at VIP counter</p>
                  </div>

                  <button
                    onClick={() => setRsvpCompleted(false)}
                    className="px-5 py-2.5 border border-gold/40 text-gold hover:bg-gold/10 text-[10px] uppercase tracking-widest transition-colors font-bold rounded-lg"
                  >
                    Modify Response Details
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-10 bg-gradient-to-b from-[#220205] to-black border border-gold/25 p-6 md:p-10 rounded-2xl">
                  
                  {/* Attendance Section */}
                  <div className="space-y-5">
                    <h4 className="text-[10px] uppercase tracking-[0.25em] text-gold border-b border-gold/15 pb-2">1. Attendance Confirmation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase tracking-wider text-[#D4AF37]/75 font-semibold">Primary Contact Name</label>
                        <input 
                          required 
                          type="text" 
                          className="bg-black/50 border border-gold/20 rounded-xl p-3.5 text-xs text-[#FDFBF7] outline-none focus:border-gold transition-colors"
                          value={formData.guest_name}
                          onChange={e => setFormData({...formData, guest_name: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase tracking-wider text-[#D4AF37]/75 font-semibold">Catering Email Address</label>
                        <input 
                          required 
                          type="email" 
                          className="bg-black/50 border border-gold/20 rounded-xl p-3.5 text-xs text-[#FDFBF7] outline-none focus:border-gold transition-colors"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] uppercase tracking-wider text-[#D4AF37]/75 font-semibold">Are you attending the celebrations?</label>
                      <div className="flex gap-4">
                        {['yes', 'no'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFormData({...formData, attending: opt})}
                            className={`flex-1 py-3 border rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                              ${formData.attending === opt ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-white/40 hover:border-gold/30'}`}
                          >
                            {opt === 'yes' ? 'YES, GRACE EVENT' : 'NO, DECLINE'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.attending === 'yes' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-2 gap-4 pt-2"
                      >
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase tracking-wider text-[#D4AF37]/75">Total Adults</label>
                          <select 
                            className="bg-black/50 border border-gold/20 rounded-xl p-3.5 text-xs text-[#FDFBF7] outline-none focus:border-gold appearance-none cursor-pointer"
                            value={formData.total_guests}
                            onChange={e => setFormData({...formData, total_guests: parseInt(e.target.value)})}
                          >
                            {[1,2,3,4,5,6].map(n => <option key={n} value={n} className="bg-[#121212] text-white">{n}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase tracking-wider text-[#D4AF37]/75">Children (Under 12)</label>
                          <select 
                            className="bg-black/50 border border-gold/20 rounded-xl p-3.5 text-xs text-[#FDFBF7] outline-none focus:border-gold appearance-none cursor-pointer"
                            value={formData.children_count}
                            onChange={e => setFormData({...formData, children_count: parseInt(e.target.value)})}
                          >
                            {[0,1,2,3,4].map(n => <option key={n} value={n} className="bg-[#121212] text-white">{n}</option>)}
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Preferences Section */}
                  {formData.attending === 'yes' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-5"
                    >
                      <h4 className="text-[10px] uppercase tracking-[0.25em] text-gold border-b border-gold/15 pb-2">2. Ceremony Registration</h4>
                      <div className="flex flex-col gap-2">
                          <label className="text-[9px] uppercase tracking-wider text-[#D4AF37]/75">Select Ceremonies You Will Grace</label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {eventList.map(ev => (
                              <button
                                key={ev}
                                type="button"
                                onClick={() => toggleEvent(ev)}
                                className={`py-2.5 border rounded-xl text-[10px] uppercase tracking-widest transition-all font-bold
                                  ${formData.events.includes(ev) ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-white/40'}`}
                              >
                                {ev}
                              </button>
                            ))}
                          </div>
                      </div>

                      <div className="flex flex-col gap-2.5 pt-2">
                        <label className="text-[9px] uppercase tracking-wider text-[#D4AF37]/75">Catering Dietary Protocol</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['Vegetarian', 'Vegan', 'Gluten-Free', 'No Restrictions'].map(diet => (
                            <button
                              key={diet}
                              type="button"
                              onClick={() => setFormData({ ...formData, dietary_requirements: diet })}
                              className={`py-2.5 border rounded-xl text-[9px] uppercase tracking-widest transition-all font-bold
                                ${formData.dietary_requirements === diet ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-white/40 hover:border-gold/20'}`}
                            >
                              {diet}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-col gap-1.5 mt-2">
                          <label className="text-[8px] uppercase tracking-wider text-gold/50">Other Food Allergy/Medical Notes (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Peanut allergy, dairy free options..."
                            className="bg-black/50 border border-gold/20 rounded-xl p-3 text-xs text-[#FDFBF7] outline-none focus:border-gold transition-colors placeholder-white/20"
                            value={['Vegetarian', 'Vegan', 'Gluten-Free', 'No Restrictions'].includes(formData.dietary_requirements) ? '' : formData.dietary_requirements}
                            onChange={e => setFormData({...formData, dietary_requirements: e.target.value})}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Travel & Cab Service */}
                  {formData.attending === 'yes' && (
                     <motion.div 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="space-y-5"
                     >
                       <h4 className="text-[10px] uppercase tracking-[0.25em] text-gold border-b border-gold/15 pb-2 flex items-center gap-2">
                         <Car size={13} /> 3. Travel Registry
                       </h4>
                       <div className="flex flex-col gap-2">
                          <label className="text-[9px] uppercase tracking-wider text-[#D4AF37]/75">Travel Mode</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                            {['Car', 'Bus', 'Train', 'Flight'].map(mode => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setFormData({...formData, transport_mode: mode as any})}
                                className={`py-2.5 border rounded-xl text-[10px] uppercase tracking-widest transition-all font-bold
                                  ${formData.transport_mode === mode ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-white/40'}`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                       </div>

                       <div className="flex items-center gap-3 bg-black/40 p-4 border border-gold/15 rounded-xl">
                          <input 
                            type="checkbox" 
                            id="cab-req-luxury"
                            className="accent-gold w-4.5 h-4.5 cursor-pointer"
                            checked={formData.need_cab}
                            onChange={e => setFormData({...formData, need_cab: e.target.checked})}
                          />
                          <label htmlFor="cab-req-luxury" className="text-xs text-cream/80 cursor-pointer select-none">
                            We request a shuttle/cab pickup at our terminal of arrival.
                          </label>
                       </div>

                       {formData.need_cab && (
                          <motion.div 
                            initial={{ opacity: 0, y: 8 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                             <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] uppercase tracking-wider text-[#D4AF37]/75">Pickup Station/Airport Name</label>
                                <input 
                                  type="text" 
                                  className="bg-black/50 border border-gold/20 rounded-xl p-3 text-xs text-white outline-none focus:border-gold transition-colors"
                                  placeholder="e.g. Jodhpur Terminal 1"
                                  value={formData.pickup_location}
                                  onChange={e => setFormData({...formData, pickup_location: e.target.value})}
                                />
                             </div>
                             <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] uppercase tracking-wider text-[#D4AF37]/75">Arrival Stamp Time</label>
                                <input 
                                  type="datetime-local" 
                                  className="bg-black/50 border border-gold/20 rounded-xl p-3 text-xs text-white outline-none focus:border-gold transition-colors"
                                  value={formData.arrival_time}
                                  onChange={e => setFormData({...formData, arrival_time: e.target.value})}
                                />
                             </div>
                          </motion.div>
                       )}
                     </motion.div>
                  )}

                  {/* Document uploads */}
                  {formData.attending === 'yes' && (
                    <div className="border-t border-gold/15 pt-6">
                      <DocumentUploadSection 
                        existingDocuments={uploadedDocuments}
                        onUploadComplete={handleDocumentsComplete}
                        onDeleteDocument={handleDocumentDelete}
                      />
                    </div>
                  )}

                  <div className="pt-6">
                    <button
                      disabled={loading || submitting}
                      type="submit"
                      className="w-full py-4.5 bg-gradient-to-r from-[#b58925] via-[#f7e693] to-[#b58925] text-black font-semibold uppercase tracking-[0.2em] text-xs rounded-xl shadow-[0_4px_15px_rgba(212,175,55,0.15)] hover:brightness-105 active:scale-[0.98] transition-all"
                    >
                      {submitting ? 'Registering Schedule...' : 'Seal My Response'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </motion.div>
          )
        )}

      </AnimatePresence>

      {/* Map Layout Modal */}
      <VenueLayoutViewer isOpen={showMapModal} onClose={() => setShowMapModal(false)} />
    </div>
  );
}
