import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Calendar, MapPin, Music, Heart, Check, 
  Car, Hotel, Map, Volume2, VolumeX, Phone, Download, 
  Clock, Users, Smartphone, FileText, Send, Share2, 
  CheckCircle2, AlertCircle, Sparkles, User, Info, ArrowLeft, ArrowRight, Lock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Family, RSVP, RoomBooking, TransportRequest } from '../../types';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { dataService } from '../../lib/dataService';

interface GuestDashboardProps {
  family: Family;
  roomBooking: RoomBooking | null;
  slug: string;
  onBackToRitual?: () => void;
  downloadItinerary: () => void;
}

export default function GuestDashboard({
  family,
  roomBooking,
  slug,
  onBackToRitual,
  downloadItinerary
}: GuestDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invitation' | 'rsvp'>('dashboard');
  
  // Real-time Event Notifications
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  // RSVP Form States
  const [rsvp, setRsvp] = useState<RSVP | null>(null);
  const [transport, setTransport] = useState<TransportRequest | null>(null);
  const [loadingRsvp, setLoadingRsvp] = useState(true);
  const [savingRsvp, setSavingRsvp] = useState(false);
  
  const [aadhaarFile, setAadhaarFile] = useState<string | null>(null);
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false);

  // RSVP input fields matching exact specifications
  const [formData, setFormData] = useState({
    family_name: family.name || '',
    primary_guest: '',
    mobile_number: '',
    adults_count: 1,
    children_count: 0,
    family_members: [] as string[],
    functions_attending: [] as string[],
    arrival_method: 'Car' as 'Flight' | 'Train' | 'Bus' | 'Car' | 'Other',
    pickup_required: false,
    pickup_location: '',
    arrival_date: '',
    arrival_time: '',
    flight_number: '',
    train_number: '',
    drop_required: false,
    drop_location: '',
    drop_date: '',
    drop_time: '',
    special_requests: ''
  });

  const availableFunctions = ['Haldi', 'Mehndi', 'Wedding', 'Reception'];

  // Real-time fetch of notifications & RSVP
  useEffect(() => {
    let unsubscribeNotifs: any = null;
    
    // 1. Fetch live notifications
    if (family.event_id && dataService.isConfigured()) {
      try {
        unsubscribeNotifs = onSnapshot(doc(db, 'venue_settings', `notifications_${family.event_id}`), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && Array.isArray(data.list)) {
              setAnnouncements(data.list);
            }
          }
          setLoadingAnnouncements(false);
        });
      } catch (e) {
        console.warn(e);
        setLoadingAnnouncements(false);
      }
    } else {
      // Local fallback
      const cached = localStorage.getItem(`local_notifications_${family.event_id || 'evt_001'}`);
      if (cached) {
        setAnnouncements(JSON.parse(cached));
      }
      setLoadingAnnouncements(false);
    }

    // 2. Fetch current RSVP details
    const loadRsvpDetails = async () => {
      try {
        const rsvpsList = await dataService.getRSVPs();
        const existingRSVP = rsvpsList.find(r => r.family_id === family.id);
        
        let existingTransport = null;
        try {
          const transportList = await dataService.getTransports();
          existingTransport = transportList.find(t => t.family_id === family.id);
        } catch (_) {}

        if (existingRSVP) {
          setRsvp(existingRSVP);
          if (existingTransport) {
            setTransport(existingTransport);
          }
          
          setFormData({
            family_name: existingRSVP.family_name || existingRSVP.guest_name || family.name,
            primary_guest: existingRSVP.primary_guest || existingRSVP.guest_name || '',
            mobile_number: existingRSVP.mobile_number || '',
            adults_count: existingRSVP.adults_count || existingRSVP.total_guests || 1,
            children_count: existingRSVP.children_count || 0,
            family_members: existingRSVP.family_members || [],
            functions_attending: existingRSVP.functions_attending || existingRSVP.events || [],
            arrival_method: existingRSVP.arrival_method || existingTransport?.mode || 'Car',
            pickup_required: existingRSVP.pickup_required || existingTransport?.need_cab || false,
            pickup_location: existingRSVP.pickup_location || existingTransport?.pickup_location || '',
            arrival_date: existingRSVP.arrival_date || '',
            arrival_time: existingRSVP.arrival_time || existingTransport?.arrival_time?.split('T')[1]?.substring(0,5) || '',
            flight_number: existingRSVP.flight_number || '',
            train_number: existingRSVP.train_number || '',
            drop_required: existingRSVP.drop_required || false,
            drop_location: existingRSVP.drop_location || '',
            drop_date: existingRSVP.drop_date || '',
            drop_time: existingRSVP.drop_time || '',
            special_requests: existingRSVP.special_requests || existingRSVP.custom_notes || ''
          });
          if (existingRSVP.aadhaar_url) {
            setAadhaarFile(existingRSVP.aadhaar_url);
          }
        } else {
          // Initialize defaults
          setFormData(prev => ({
            ...prev,
            primary_guest: family.name || '',
            family_members: Array.from({ length: Math.max(0, family.max_guests - 1) }, () => '')
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRsvp(false);
      }
    };

    loadRsvpDetails();

    return () => {
      if (unsubscribeNotifs) unsubscribeNotifs();
    };
  }, [family]);

  // Handle file uploads (Base64 conversion for manual + drag-and-drop)
  const handleAadhaarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload an image or PDF document.');
      return;
    }
    setUploadingAadhaar(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAadhaarFile(event.target.result as string);
      }
      setUploadingAadhaar(false);
    };
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      setUploadingAadhaar(false);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleFunction = (fnName: string) => {
    if (isRsvpLocked) return;
    setFormData(prev => ({
      ...prev,
      functions_attending: prev.functions_attending.includes(fnName)
        ? prev.functions_attending.filter(f => f !== fnName)
        : [...prev.functions_attending, fnName]
    }));
  };

  const handleSaveRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRsvpLocked) return;
    setSavingRsvp(true);

    try {
      const now = new Date().toISOString();
      const rsvpPayload: Partial<RSVP> = {
        family_id: family.id,
        event_id: family.event_id || 'evt_001',
        guest_name: formData.primary_guest,
        email: rsvp?.email || `${family.slug}@royalwedding.com`,
        attending: formData.functions_attending.length > 0,
        total_guests: formData.adults_count,
        children_count: formData.children_count,
        events: formData.functions_attending,
        custom_notes: formData.special_requests,
        
        // Premium fields
        family_name: formData.family_name,
        primary_guest: formData.primary_guest,
        mobile_number: formData.mobile_number,
        adults_count: formData.adults_count,
        family_members: formData.family_members.filter(Boolean),
        functions_attending: formData.functions_attending,
        arrival_method: formData.arrival_method,
        pickup_required: formData.pickup_required,
        pickup_location: formData.pickup_location,
        arrival_date: formData.arrival_date,
        arrival_time: formData.arrival_time,
        flight_number: formData.flight_number,
        train_number: formData.train_number,
        drop_required: formData.drop_required,
        drop_location: formData.drop_location,
        drop_date: formData.drop_date,
        drop_time: formData.drop_time,
        aadhaar_url: aadhaarFile || undefined,
        special_requests: formData.special_requests,
        updated_at: now
      };

      if (!rsvp) {
        rsvpPayload.created_at = now;
      }

      await dataService.submitRSVP(rsvpPayload as RSVP);

      // Save Transport Request
      const transportPayload: any = {
        family_id: family.id,
        event_id: family.event_id || 'evt_001',
        mode: formData.arrival_method,
        need_cab: formData.pickup_required,
        pickup_location: formData.pickup_location || 'Airport / Railway Station',
        arrival_time: formData.arrival_date && formData.arrival_time ? `${formData.arrival_date}T${formData.arrival_time}:00` : undefined,
        details: `Flight/Train: ${formData.flight_number || formData.train_number || 'N/A'}. drop requested: ${formData.drop_required ? 'Yes to ' + formData.drop_location : 'No'}`,
        updated_at: now
      };

      // Maintain Driver details if already published by Admin
      if (transport) {
        transportPayload.driver_name = transport.driver_name;
        transportPayload.vehicle_number = transport.vehicle_number;
        transportPayload.driver_contact = transport.driver_contact;
        transportPayload.pickup_time = transport.pickup_time;
      } else {
        transportPayload.created_at = now;
      }

      await dataService.submitTransport(transportPayload);

      // Reload live state
      const updatedRsvps = await dataService.getRSVPs();
      const updatedRsvp = updatedRsvps.find(r => r.family_id === family.id);
      setRsvp(updatedRsvp || null);

      const updatedTransports = await dataService.getTransports();
      const updatedTransport = updatedTransports.find(t => t.family_id === family.id);
      setTransport(updatedTransport || null);

      alert('Auspicious RSVP information updated successfully!');
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed saving RSVP. Please check inputs and try again.');
    } finally {
      setSavingRsvp(false);
    }
  };

  // Determine if editing is locked by admin
  const isRsvpLocked = !!(family.rsvp_locked || rsvp?.rsvp_locked);

  return (
    <div className="min-h-screen bg-[#070002] text-cream pb-24 relative overflow-hidden">
      {/* Decorative floral corners */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04)_0%,transparent_80%)] pointer-events-none z-0" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 relative z-10 pt-8">
        
        {/* Top Navbar */}
        <div className="flex justify-between items-center border-b border-gold/10 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full border border-gold/20 bg-gold/5 flex items-center justify-center">
              <Heart size={18} className="text-gold animate-pulse" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold/80 font-mono font-bold">Royal Invitation Guest Portal</p>
              <h4 className="font-serif text-lg text-cream tracking-tight">The {family.name} Hub</h4>
            </div>
          </div>

          <div className="flex gap-2">
            {activeTab !== 'dashboard' ? (
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white/5 border border-gold/20 text-gold text-xs rounded-xl hover:bg-gold/10 transition-all font-mono uppercase tracking-widest flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Back To Dashboard
              </button>
            ) : (
              onBackToRitual && (
                <button 
                  onClick={onBackToRitual}
                  className="px-4 py-2 bg-white/5 border border-gold/20 text-gold text-xs rounded-xl hover:bg-gold/10 transition-all font-mono uppercase tracking-widest flex items-center gap-1.5"
                >
                  View Royal Invitation Scroll <ArrowRight size={14} />
                </button>
              )
            )}
          </div>
        </div>

        {/* Dynamic Views */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Live Alerts / Broadcast Announcements (Only Event Specific) */}
              {announcements.length > 0 && (
                <div className="bg-gold/5 border border-gold/30 rounded-2xl p-5 relative overflow-hidden flex items-start gap-4 shadow-lg">
                  <div className="p-2.5 rounded-xl bg-gold/10 text-gold shrink-0 border border-gold/20 animate-bounce">
                    <Sparkles size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-gold font-mono font-bold">Latest Host Announcement</p>
                    <p className="text-sm text-cream/90 font-serif font-medium leading-relaxed">
                      "{announcements[0].message}"
                    </p>
                    <p className="text-[9px] text-text-secondary font-mono">
                      Published {new Date(announcements[0].timestamp).toLocaleDateString()} at {new Date(announcements[0].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              )}

              {/* Grid Layout: Main info and cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Left Column: QR Card and Quick Status */}
                <div className="md:col-span-1 space-y-6">
                  
                  {/* Digital Gate Ticket Card */}
                  <div className="bg-gradient-to-b from-[#220204] to-[#0a0001] border border-gold/30 rounded-2xl p-6 text-center space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                    
                    {family.guest_image ? (
                      <div className="w-20 h-20 rounded-full overflow-hidden border border-gold/40 mx-auto shadow-md">
                        <img src={family.guest_image} alt={family.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gold/5 border border-gold/20 flex items-center justify-center mx-auto">
                        <User className="text-gold" size={24} />
                      </div>
                    )}

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-gold font-mono font-bold">Digital Entrance Pass</span>
                      <h4 className="font-serif text-xl text-cream mt-1 font-semibold">{family.name}</h4>
                      <p className="text-[10px] text-text-secondary font-mono mt-1">Passcode: {family.access_code}</p>
                    </div>

                    <div className="bg-black/40 border border-white/5 p-4 rounded-xl inline-block">
                      <QRCodeSVG 
                        value={`${window.location.origin}${window.location.pathname}#/pass/${family.slug}`} 
                        size={140}
                        bgColor="transparent"
                        fgColor="#D4AF37"
                        id="guest-pass-qr"
                      />
                      <span className="block text-[8px] uppercase tracking-widest text-gold/60 mt-3 font-mono">Scan at Welcome Gates</span>
                    </div>

                    <div className="pt-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-mono font-bold border ${
                        rsvp ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {rsvp ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        RSVP Status: {rsvp ? 'Confirmed' : 'Pending Response'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Download Itinerary */}
                  <button 
                    onClick={downloadItinerary}
                    className="w-full py-3.5 bg-gold text-dark rounded-xl text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all font-mono font-bold flex items-center justify-center gap-2 shadow-lg shadow-gold/5"
                  >
                    <Download size={14} /> Download Royal Itinerary
                  </button>
                </div>

                {/* Right Column: Interactive cards grid */}
                <div className="md:col-span-2 space-y-6">
                  <h3 className="font-serif text-xl text-gold border-b border-white/5 pb-2">Your Majestic Wedding Cards</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* Invitation Scroll Card */}
                    <div 
                      onClick={onBackToRitual}
                      className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl hover:border-gold/40 transition-all duration-300 cursor-pointer group relative overflow-hidden shadow-md flex flex-col justify-between min-h-[170px]"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gold/5 rounded-full filter blur-xl group-hover:bg-gold/10 transition-colors" />
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-gold/5 border border-gold/10 text-gold flex items-center justify-center mb-4">
                          <Heart size={20} />
                        </div>
                        <h4 className="font-serif text-lg text-cream group-hover:text-gold transition-colors">The Royal Scroll</h4>
                        <p className="text-xs text-text-secondary mt-1">Read the beautiful wedding announcement scroll, couple story, and full protocol.</p>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-gold font-mono font-bold mt-4 flex items-center gap-1">
                        Unveil Scroll <ArrowRight size={10} />
                      </span>
                    </div>

                    {/* RSVP Management Card */}
                    <div 
                      onClick={() => setActiveTab('rsvp')}
                      className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl hover:border-gold/40 transition-all duration-300 cursor-pointer group relative overflow-hidden shadow-md flex flex-col justify-between min-h-[170px]"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gold/5 rounded-full filter blur-xl group-hover:bg-gold/10 transition-colors" />
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-gold/5 border border-gold/10 text-gold flex items-center justify-center mb-4">
                          <FileText size={20} />
                        </div>
                        <h4 className="font-serif text-lg text-cream group-hover:text-gold transition-colors">RSVP Registry</h4>
                        <p className="text-xs text-text-secondary mt-1">
                          {isRsvpLocked ? 'Your RSVP has been locked by the host.' : 'Update family members, flight details, and dietary options.'}
                        </p>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-gold font-mono font-bold mt-4 flex items-center gap-1">
                        {isRsvpLocked ? 'View RSVP' : 'Manage RSVP'} <ArrowRight size={10} />
                      </span>
                    </div>

                    {/* Hotel Card (Initially Locked / Auto Revealed) */}
                    <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl relative overflow-hidden shadow-md flex flex-col justify-between min-h-[170px]">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-gold/5 border border-gold/10 text-gold flex items-center justify-center mb-4">
                          <Hotel size={20} />
                        </div>
                        <h4 className="font-serif text-lg text-cream">Accommodations</h4>
                        
                        {roomBooking?.room_number ? (
                          <div className="mt-2 space-y-1 font-mono text-xs">
                            <p className="text-gold font-bold">Room Assigned!</p>
                            <p className="text-cream font-medium">Hotel: <span className="text-text-secondary">{roomBooking.hotel_name || 'The Luxury Resort'}</span></p>
                            <p className="text-cream font-medium">Room Number: <span className="text-text-secondary">{roomBooking.room_number}</span></p>
                            {roomBooking.floor && <p className="text-cream font-medium">Floor: <span className="text-text-secondary">{roomBooking.floor}</span></p>}
                          </div>
                        ) : (
                          <div className="mt-2 text-xs">
                            <p className="text-cream/90 font-medium">Hotel: <span className="text-text-secondary font-mono">{roomBooking?.hotel_name || 'Allocated Luxury Hotel'}</span></p>
                            <p className="text-amber-400 font-mono text-[11px] mt-1 italic">Room will be allotted before check-in.</p>
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] uppercase tracking-widest text-white/30 font-mono mt-4">
                        Status: {roomBooking?.status || 'Assigned'}
                      </span>
                    </div>

                    {/* Transport & Vehicle details (Initially locked / Auto Revealed) */}
                    <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl relative overflow-hidden shadow-md flex flex-col justify-between min-h-[170px]">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-gold/5 border border-gold/10 text-gold flex items-center justify-center mb-4">
                          <Car size={20} />
                        </div>
                        <h4 className="font-serif text-lg text-cream">Vehicle & Driver Details</h4>

                        {transport?.driver_name ? (
                          <div className="mt-2 space-y-1 font-mono text-xs">
                            <p className="text-gold font-bold">Driver Dispatched!</p>
                            <p className="text-cream">Name: <span className="text-text-secondary">{transport.driver_name}</span></p>
                            <p className="text-cream">Vehicle No: <span className="text-text-secondary">{transport.vehicle_number}</span></p>
                            {transport.pickup_time && <p className="text-cream">Pickup Time: <span className="text-text-secondary">{transport.pickup_time}</span></p>}
                            {transport.driver_contact && (
                              <div className="flex gap-2 mt-2">
                                <a href={`tel:${transport.driver_contact}`} className="text-[10px] text-gold border border-gold/25 px-2 py-1 rounded hover:bg-gold/10 flex items-center gap-1">
                                  <Phone size={10} /> Call Driver
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-text-secondary mt-1.5 italic font-mono leading-relaxed">
                            Vehicle details will be available 24 hours before your arrival.
                          </p>
                        )}
                      </div>
                      <span className="text-[8px] uppercase tracking-widest text-white/30 font-mono mt-4">
                        Transport Type: {formData.arrival_method}
                      </span>
                    </div>

                    {/* Schedule Card (Personalized Timeline) */}
                    <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl shadow-md flex flex-col justify-between min-h-[170px]">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-gold/5 border border-gold/10 text-gold flex items-center justify-center mb-4">
                          <Calendar size={20} />
                        </div>
                        <h4 className="font-serif text-lg text-cream">Personalized Schedule</h4>
                        
                        <div className="mt-2 text-xs space-y-1">
                          {formData.functions_attending.length === 0 ? (
                            <p className="text-text-secondary italic">Confirm RSVP to personalize timeline.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {formData.functions_attending.map(fn => (
                                <span key={fn} className="px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/10 text-[9px] font-mono">
                                  {fn}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[8px] uppercase tracking-widest text-white/30 font-mono mt-4">
                        Auspicious ceremonies timeline
                      </span>
                    </div>

                    {/* Contact Wedding Planner Card */}
                    <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl shadow-md flex flex-col justify-between min-h-[170px]">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-gold/5 border border-gold/10 text-gold flex items-center justify-center mb-4">
                          <Users size={20} />
                        </div>
                        <h4 className="font-serif text-lg text-cream">Contact Planners</h4>
                        
                        <div className="mt-2.5 space-y-2 text-xs font-mono">
                          <div>
                            <p className="text-gold uppercase text-[9px] font-bold">Hospitality Coordinator</p>
                            <p className="text-cream font-medium">+91 98765 43211</p>
                          </div>
                          <div>
                            <p className="text-gold uppercase text-[9px] font-bold">Travel desk</p>
                            <p className="text-cream font-medium">+91 98765 43210</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <a href="tel:+919876543211" className="text-[9px] text-gold border border-gold/25 px-2 py-1 rounded hover:bg-gold/5 flex items-center gap-1 font-mono uppercase font-bold">
                          Call
                        </a>
                        <a href="https://wa.me/919876543211" target="_blank" rel="noreferrer" className="text-[9px] text-green-400 border border-green-400/25 px-2 py-1 rounded hover:bg-green-400/5 flex items-center gap-1 font-mono uppercase font-bold">
                          WhatsApp
                        </a>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'rsvp' && (
            <motion.div
              key="rsvp-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-4xl mx-auto"
            >
              {/* RSVP Form Card */}
              <div className="bg-gradient-to-b from-[#1c0205] to-black border border-gold/25 p-8 rounded-2xl space-y-8 relative">
                
                <div className="flex justify-between items-start border-b border-gold/10 pb-4">
                  <div>
                    <span className="text-gold uppercase tracking-[0.2em] text-[10px] font-mono">RSVPs Protocol</span>
                    <h3 className="font-serif text-2xl text-cream mt-1">Response & Travel Registry</h3>
                    <p className="text-xs text-text-secondary">Please complete details for each family attendee.</p>
                  </div>
                  
                  {isRsvpLocked && (
                    <span className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] uppercase tracking-wider font-mono font-bold rounded-lg flex items-center gap-1">
                      <Lock size={12} /> Locked by Admin
                    </span>
                  )}
                </div>

                {loadingRsvp ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="animate-spin text-gold" size={32} />
                    <p className="text-xs text-text-secondary font-mono">Retrieving your responses...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveRsvp} className="space-y-8 text-xs">
                    
                    {/* Part 1: Basic Info */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold pb-1 border-b border-white/5">1. Primary Contact Info</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-text-secondary text-[10px] uppercase tracking-wide">Family Name</label>
                          <input 
                            disabled={isRsvpLocked}
                            required
                            type="text"
                            value={formData.family_name}
                            onChange={e => setFormData({ ...formData, family_name: e.target.value })}
                            className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-text-secondary text-[10px] uppercase tracking-wide">Primary Guest</label>
                          <input 
                            disabled={isRsvpLocked}
                            required
                            type="text"
                            value={formData.primary_guest}
                            onChange={e => setFormData({ ...formData, primary_guest: e.target.value })}
                            className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-text-secondary text-[10px] uppercase tracking-wide">Mobile Number</label>
                          <input 
                            disabled={isRsvpLocked}
                            required
                            type="tel"
                            placeholder="e.g. +91 98765 43210"
                            value={formData.mobile_number}
                            onChange={e => setFormData({ ...formData, mobile_number: e.target.value })}
                            className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Part 2: Family counts & members */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold pb-1 border-b border-white/5">2. Family Guests Count</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-text-secondary text-[10px] uppercase tracking-wide">Adults Count</label>
                          <input 
                            disabled={isRsvpLocked}
                            type="number"
                            min={1}
                            max={family.max_guests}
                            value={formData.adults_count}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setFormData(prev => {
                                const newMembers = [...prev.family_members];
                                while (newMembers.length < val - 1) newMembers.push('');
                                while (newMembers.length > val - 1) newMembers.pop();
                                return {
                                  ...prev,
                                  adults_count: val,
                                  family_members: newMembers
                                };
                              });
                            }}
                            className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-text-secondary text-[10px] uppercase tracking-wide">Children Count</label>
                          <input 
                            disabled={isRsvpLocked}
                            type="number"
                            min={0}
                            value={formData.children_count}
                            onChange={e => setFormData({ ...formData, children_count: Number(e.target.value) })}
                            className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Dynamic Family Member names */}
                      {formData.family_members.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <label className="text-text-secondary text-[10px] uppercase tracking-wide">Other Family Member Names</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {formData.family_members.map((member, idx) => (
                              <input 
                                key={idx}
                                disabled={isRsvpLocked}
                                type="text"
                                placeholder={`Family Member #${idx + 1}`}
                                value={member}
                                onChange={e => {
                                  const updated = [...formData.family_members];
                                  updated[idx] = e.target.value;
                                  setFormData({ ...formData, family_members: updated });
                                }}
                                className="w-full bg-black/40 border border-gold/15 rounded-xl p-3 text-cream focus:border-gold outline-none transition-colors"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Part 3: Functions */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold pb-1 border-b border-white/5">3. Auspicious Ceremonies Attending</h4>
                      <p className="text-[10px] text-text-secondary">Please pick the functions you will honor with your presence.</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {availableFunctions.map(fn => {
                          const isSelected = formData.functions_attending.includes(fn);
                          return (
                            <div 
                              key={fn}
                              onClick={() => handleToggleFunction(fn)}
                              className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-gold/10 border-gold text-gold shadow-md' 
                                  : 'bg-black/30 border-white/10 text-text-secondary hover:border-gold/30'
                              } ${isRsvpLocked ? 'pointer-events-none opacity-80' : ''}`}
                            >
                              <span className="font-serif font-bold text-sm block">{fn}</span>
                              <span className="text-[8px] font-mono mt-1 block">
                                {isSelected ? '✦ Attending' : 'Select'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Part 4: Arrival & Pickup */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold pb-1 border-b border-white/5">4. Arrival & Hospitality Logistics</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-text-secondary text-[10px] uppercase tracking-wide">Arrival Method</label>
                          <select 
                            disabled={isRsvpLocked}
                            value={formData.arrival_method}
                            onChange={e => setFormData({ ...formData, arrival_method: e.target.value as any })}
                            className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors"
                          >
                            <option value="Flight" className="bg-[#1c0205]">Flight</option>
                            <option value="Train" className="bg-[#1c0205]">Train</option>
                            <option value="Bus" className="bg-[#1c0205]">Bus</option>
                            <option value="Car" className="bg-[#1c0205]">Car</option>
                            <option value="Other" className="bg-[#1c0205]">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-text-secondary text-[10px] uppercase tracking-wide">Arrival Date</label>
                          <input 
                            disabled={isRsvpLocked}
                            type="date"
                            value={formData.arrival_date}
                            onChange={e => setFormData({ ...formData, arrival_date: e.target.value })}
                            className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-text-secondary text-[10px] uppercase tracking-wide">Arrival Time</label>
                          <input 
                            disabled={isRsvpLocked}
                            type="time"
                            value={formData.arrival_time}
                            onChange={e => setFormData({ ...formData, arrival_time: e.target.value })}
                            className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {formData.arrival_method === 'Flight' && (
                          <div>
                            <label className="text-text-secondary text-[10px] uppercase tracking-wide">Flight Number</label>
                            <input 
                              disabled={isRsvpLocked}
                              type="text"
                              placeholder="e.g. AI-101"
                              value={formData.flight_number}
                              onChange={e => setFormData({ ...formData, flight_number: e.target.value })}
                              className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors"
                            />
                          </div>
                        )}
                        {formData.arrival_method === 'Train' && (
                          <div>
                            <label className="text-text-secondary text-[10px] uppercase tracking-wide">Train Number / Name</label>
                            <input 
                              disabled={isRsvpLocked}
                              type="text"
                              placeholder="e.g. 12002 Shatabdi"
                              value={formData.train_number}
                              onChange={e => setFormData({ ...formData, train_number: e.target.value })}
                              className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors"
                            />
                          </div>
                        )}
                      </div>

                      {/* Pickup Switch */}
                      <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-cream">Request Palace Airport/Station Pickup?</p>
                            <p className="text-[10px] text-text-secondary mt-0.5">We will dispatch an event car to receive you.</p>
                          </div>
                          <input 
                            disabled={isRsvpLocked}
                            type="checkbox"
                            checked={formData.pickup_required}
                            onChange={e => setFormData({ ...formData, pickup_required: e.target.checked })}
                            className="accent-gold h-4 w-4 rounded cursor-pointer"
                          />
                        </div>

                        {formData.pickup_required && (
                          <div className="pt-2">
                            <label className="text-text-secondary text-[10px] uppercase tracking-wide">Pickup Location Address</label>
                            <input 
                              disabled={isRsvpLocked}
                              required
                              type="text"
                              placeholder="e.g. Delhi Terminal 3 Arrival Gate"
                              value={formData.pickup_location}
                              onChange={e => setFormData({ ...formData, pickup_location: e.target.value })}
                              className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors"
                            />
                          </div>
                        )}
                      </div>

                      {/* Drop Switch */}
                      <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-cream">Request Departure Drop Shuttle?</p>
                            <p className="text-[10px] text-text-secondary mt-0.5">Shuttle from hotel back to airport or station.</p>
                          </div>
                          <input 
                            disabled={isRsvpLocked}
                            type="checkbox"
                            checked={formData.drop_required}
                            onChange={e => setFormData({ ...formData, drop_required: e.target.checked })}
                            className="accent-gold h-4 w-4 rounded cursor-pointer"
                          />
                        </div>

                        {formData.drop_required && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div>
                              <label className="text-text-secondary text-[10px] uppercase tracking-wide">Drop Location Address</label>
                              <input 
                                disabled={isRsvpLocked}
                                required
                                type="text"
                                placeholder="e.g. Goa Airport Terminal"
                                value={formData.drop_location}
                                onChange={e => setFormData({ ...formData, drop_location: e.target.value })}
                                className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="text-text-secondary text-[10px] uppercase tracking-wide">Drop Date</label>
                              <input 
                                disabled={isRsvpLocked}
                                required
                                type="date"
                                value={formData.drop_date}
                                onChange={e => setFormData({ ...formData, drop_date: e.target.value })}
                                className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-text-secondary text-[10px] uppercase tracking-wide">Drop Time</label>
                              <input 
                                disabled={isRsvpLocked}
                                required
                                type="time"
                                value={formData.drop_time}
                                onChange={e => setFormData({ ...formData, drop_time: e.target.value })}
                                className="w-full bg-black/40 border border-gold/20 rounded-xl p-3 text-cream focus:border-gold outline-none mt-1 transition-colors font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Part 5: Aadhaar Upload */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold pb-1 border-b border-white/5">5. Identity Verification Upload</h4>
                      <p className="text-[10px] text-text-secondary">Please upload an Aadhaar card image or PDF for security check-in clearances.</p>
                      
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="bg-black/30 border border-dashed border-gold/25 p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-4 hover:bg-gold/[0.02] transition-colors cursor-pointer"
                      >
                        <input 
                          disabled={isRsvpLocked}
                          type="file"
                          id="aadhaar-upload-input"
                          accept="image/*,application/pdf"
                          onChange={handleAadhaarUpload}
                          className="hidden"
                        />
                        
                        <div className="w-12 h-12 rounded-full bg-gold/5 border border-gold/20 flex items-center justify-center text-gold">
                          <Share2 size={22} />
                        </div>
                        
                        <div>
                          <p className="font-bold text-cream">
                            {isRsvpLocked ? 'Aadhaar Uploaded' : 'Drag & Drop your Aadhaar card file here'}
                          </p>
                          <p className="text-[10px] text-text-secondary mt-1">Supports PNG, JPG, JPEG, and PDF files up to 5MB</p>
                        </div>

                        {!isRsvpLocked && (
                          <label 
                            htmlFor="aadhaar-upload-input"
                            className="px-4 py-2 bg-gold text-dark font-mono text-[10px] font-bold uppercase rounded-lg cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                          >
                            {uploadingAadhaar ? 'Processing File...' : 'Choose File'}
                          </label>
                        )}

                        {aadhaarFile && (
                          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-[10px] flex items-center gap-2 max-w-sm mx-auto">
                            <CheckCircle2 size={14} />
                            <span>Aadhaar document compiled successfully.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Part 6: Special Requests */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold pb-1 border-b border-white/5">6. Special Requests</h4>
                      <textarea 
                        disabled={isRsvpLocked}
                        rows={3}
                        placeholder="e.g. wheelchair assistance needed, infant seat requested, vegetarian dietary preferences..."
                        value={formData.special_requests}
                        onChange={e => setFormData({ ...formData, special_requests: e.target.value })}
                        className="w-full bg-black/40 border border-gold/20 rounded-xl p-4 text-cream focus:border-gold outline-none mt-1 transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    {/* Submission Buttons */}
                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setActiveTab('dashboard')}
                        className="flex-1 py-4 bg-white/5 border border-white/10 text-cream text-xs font-mono uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                      
                      {!isRsvpLocked && (
                        <button 
                          type="submit"
                          disabled={savingRsvp}
                          className="flex-1 py-4 bg-gold text-dark text-xs font-mono uppercase tracking-widest font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/10"
                        >
                          {savingRsvp ? (
                            <>
                              <Loader2 className="animate-spin" size={14} /> Saving Response...
                            </>
                          ) : (
                            <>
                              <Send size={14} /> Submit Auspicious Response
                            </>
                          )}
                        </button>
                      )}
                    </div>

                  </form>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
