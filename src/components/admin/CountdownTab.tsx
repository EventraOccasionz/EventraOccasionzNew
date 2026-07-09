import React, { useState, useEffect } from 'react';
import { Clock, Save, Calendar, Loader2, Sparkles, AlertCircle, Eye, EyeOff, Upload, Heart, FileText, User } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface CountdownTabProps {
  showToast: (type: 'success' | 'error', message: string) => void;
  onRefreshAll?: () => void;
  selectedEventId?: string | null;
  selectedEvent?: any;
}

export default function CountdownTab({ showToast, onRefreshAll, selectedEventId, selectedEvent }: CountdownTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Settings Form State
  const [weddingDate, setWeddingDate] = useState('2026-05-18T18:00:00');
  const [countdownLabel, setCountdownLabel] = useState('Ceremony Begins In');
  const [showCountdown, setShowCountdown] = useState(true);
  const [coupleOneName, setCoupleOneName] = useState('Nikhil');
  const [coupleTwoName, setCoupleTwoName] = useState('Simran');
  const [welcomeMsg, setWelcomeMsg] = useState('Your presence adds color to our laughter, warmth to our moments, and completes our joy. We eagerly look forward to starting this special chapter of our lives in your honored presence.');
  const [coupleImage, setCoupleImage] = useState('https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80');

  // Real-time Preview State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        if (selectedEventId) {
          let settings: any = null;
          if (dataService.isConfigured()) {
            try {
              const docSnap = await getDoc(doc(db, 'venue_settings', `countdown_${selectedEventId}`));
              if (docSnap.exists()) {
                settings = docSnap.data();
              }
            } catch (e) {
              console.warn('Error reading from Firestore venue_settings:', e);
            }
          } else {
            const cached = localStorage.getItem(`local_countdown_${selectedEventId}`);
            if (cached) {
              settings = JSON.parse(cached);
            }
          }

          if (settings) {
            if (settings.wedding_date) setWeddingDate(settings.wedding_date.substring(0, 16));
            if (settings.countdown_label) setCountdownLabel(settings.countdown_label);
            if (settings.show_countdown !== undefined) setShowCountdown(settings.show_countdown);
            if (settings.couple_one_name) setCoupleOneName(settings.couple_one_name);
            if (settings.couple_two_name) setCoupleTwoName(settings.couple_two_name);
            if (settings.welcome_msg) setWelcomeMsg(settings.welcome_msg);
            if (settings.couple_image) setCoupleImage(settings.couple_image);
          } else {
            // Pre-populate with Selected Event values
            if (selectedEvent) {
              setCoupleOneName(selectedEvent.groom || '');
              setCoupleTwoName(selectedEvent.bride || '');
              if (selectedEvent.date) {
                setWeddingDate(`${selectedEvent.date}T18:00:00`);
              }
              setCountdownLabel('Ceremony Begins In');
              setShowCountdown(true);
              setWelcomeMsg(`Your presence adds color to our laughter, warmth to our moments, and completes our joy. We eagerly look forward to starting this special chapter of our lives in your honored presence.`);
              setCoupleImage('https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80');
            }
          }
        } else {
          const settings = await dataService.getVenueSettings();
          if (settings) {
            if (settings.wedding_date) {
              setWeddingDate(settings.wedding_date.substring(0, 16));
            }
            if (settings.countdown_label) {
              setCountdownLabel(settings.countdown_label);
            }
            if (settings.show_countdown !== undefined) {
              setShowCountdown(settings.show_countdown);
            }
            if (settings.couple_one_name) {
              setCoupleOneName(settings.couple_one_name);
            }
            if (settings.couple_two_name) {
              setCoupleTwoName(settings.couple_two_name);
            }
            if (settings.welcome_msg) {
              setWelcomeMsg(settings.welcome_msg);
            }
            if (settings.couple_image) {
              setCoupleImage(settings.couple_image);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed fetching countdown settings:', err);
        showToast('error', 'Failed retrieving countdown settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showToast, selectedEventId, selectedEvent]);

  // Real-time Countdown Timer Preview Loop
  useEffect(() => {
    const targetDate = new Date(weddingDate);
    if (isNaN(targetDate.getTime())) return;

    const updateTimer = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [weddingDate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const publicUrl = await dataService.uploadImage(file);
      setCoupleImage(publicUrl);
      showToast('success', 'Couple portrait uploaded and optimized!');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed uploading couple portrait.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = {
        wedding_date: weddingDate,
        countdown_label: countdownLabel,
        show_countdown: showCountdown,
        couple_one_name: coupleOneName,
        couple_two_name: coupleTwoName,
        welcome_msg: welcomeMsg,
        couple_image: coupleImage,
        updated_at: new Date().toISOString()
      };

      if (selectedEventId) {
        if (dataService.isConfigured()) {
          await setDoc(doc(db, 'venue_settings', `countdown_${selectedEventId}`), updated, { merge: true });
        } else {
          localStorage.setItem(`local_countdown_${selectedEventId}`, JSON.stringify(updated));
        }
      } else {
        const currentSettings = await dataService.getVenueSettings();
        await dataService.updateVenueSettings({
          ...currentSettings,
          ...updated
        });
      }
      showToast('success', 'Wedding invitation settings saved successfully!');
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Failed to synchronize settings with database.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div id="countdown-tab-loader" className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin text-gold" size={40} />
        <p className="text-xs text-text-secondary uppercase tracking-[0.2em] font-mono">Loading calendar parameters...</p>
      </div>
    );
  }

  return (
    <div id="countdown-tab-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Editor Column */}
      <div className="lg:col-span-6 bg-[#121212]/50 border border-white/5 rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="text-[#ff6b8b]" size={24} />
          <div>
            <h3 className="font-serif text-xl text-cream">Invitation & Countdown Editor</h3>
            <p className="text-xs text-text-secondary">Configure the couple names, invitation portrait, welcome message, and countdown ticker.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          
          {/* Couple Names Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-widest text-[#ff6b8b] font-mono font-bold">Groom / Partner 1 Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                <input
                  type="text"
                  required
                  value={coupleOneName}
                  onChange={(e) => setCoupleOneName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs text-cream outline-none focus:border-[#ff6b8b] transition-colors"
                  placeholder="e.g. Nikhil"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-widest text-[#ff6b8b] font-mono font-bold">Bride / Partner 2 Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                <input
                  type="text"
                  required
                  value={coupleTwoName}
                  onChange={(e) => setCoupleTwoName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs text-cream outline-none focus:border-[#ff6b8b] transition-colors"
                  placeholder="e.g. Simran"
                />
              </div>
            </div>
          </div>

          {/* Welcome Greeting Message */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase tracking-widest text-[#ff6b8b] font-mono font-bold">General Welcome Message</label>
            <textarea
              required
              rows={3}
              value={welcomeMsg}
              onChange={(e) => setWelcomeMsg(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-[#ff6b8b] transition-colors resize-none leading-relaxed placeholder-white/20"
              placeholder="Enter a heartwarming greeting note for guests..."
            />
          </div>

          {/* Marriage Couple Image URL & Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase tracking-widest text-[#ff6b8b] font-mono font-bold">Marriage Couple Portrait</label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-3 w-16 h-16 rounded-xl border border-white/10 overflow-hidden bg-black/30 shrink-0">
                <img src={coupleImage} alt="Couple Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="sm:col-span-9 space-y-2">
                <input
                  type="text"
                  required
                  value={coupleImage}
                  onChange={(e) => setCoupleImage(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-cream outline-none focus:border-[#ff6b8b] transition-colors font-mono"
                  placeholder="Image URL"
                />
                <label className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#ff6b8b]/30 px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider font-bold cursor-pointer transition-all">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="animate-spin text-[#ff6b8b]" size={12} />
                      Optimizing Image...
                    </>
                  ) : (
                    <>
                      <Upload size={12} className="text-[#ff6b8b]" />
                      Upload Portrait File
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                </label>
              </div>
            </div>
          </div>

          {/* Event Start Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase tracking-widest text-[#ff6b8b] font-mono font-bold">Official Event Start Date & Time</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
              <input
                type="datetime-local"
                required
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-cream outline-none focus:border-[#ff6b8b] transition-colors"
              />
            </div>
          </div>

          {/* Countdown Title Label */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase tracking-widest text-[#ff6b8b] font-mono font-bold">Countdown Card Header</label>
            <input
              type="text"
              required
              placeholder="e.g. Ceremony Begins In, Our Wedding Starts In..."
              value={countdownLabel}
              onChange={(e) => setCountdownLabel(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-[#ff6b8b] transition-colors placeholder-white/20"
            />
          </div>

          {/* Show Countdown Toggle */}
          <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-cream uppercase tracking-wide">Display Countdown on Invitation</p>
              <p className="text-[9px] text-text-secondary mt-0.5">Toggle visibility of the timer on the guest landing pages.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCountdown(!showCountdown)}
              className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${
                showCountdown ? 'bg-[#ff6b8b] justify-end' : 'bg-white/10 justify-start'
              }`}
            >
              <span className={`w-4 h-4 rounded-full shadow-md transition-all ${showCountdown ? 'bg-black' : 'bg-white/50'}`} />
            </button>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#ff6b8b] hover:brightness-110 text-white py-3.5 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#ff6b8b]/10"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Synchronizing with Cloud...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Wedding Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Column */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-[#121212]/30 border border-white/5 rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-[#ff6b8b]" size={18} />
            <h4 className="font-serif text-sm text-cream">Real-time Invitation Preview (Pink Theme)</h4>
          </div>

          {/* Simulated Guest Pass Section - Pink Theme representation */}
          <div className="bg-[#fff0f3] border-2 border-[#ffb3c1] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl text-[#591a24]">
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffe5ec] rounded-full filter blur-xl opacity-80" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ffccd5] rounded-full filter blur-xl opacity-80" />
            
            <div className="relative z-10 space-y-6 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[8px] text-[#ff4d6d] uppercase tracking-[0.3em] font-mono font-bold">
                <span>✦</span>
                <span>Mobile Preview (Blush Rose Theme)</span>
                <span>✦</span>
              </div>

              {/* Couple Header */}
              <div className="space-y-1">
                <span className="text-[10px] tracking-[0.3em] uppercase text-[#ff4d6d] font-bold font-mono">The Union of</span>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#591a24] font-semibold tracking-wide">
                  {coupleOneName} <span className="font-sans text-xl text-[#ff4d6d] font-light">&</span> {coupleTwoName}
                </h3>
              </div>

              {/* Portrait Frame */}
              <div className="relative w-36 h-36 mx-auto">
                <div className="absolute -inset-2 border-2 border-dashed border-[#ff4d6d]/30 rounded-full animate-spin [animation-duration:50s]" />
                <div className="absolute -inset-0.5 border border-[#ff4d6d]/40 rounded-full" />
                <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-white p-1 bg-white shadow-md">
                  <img src={coupleImage} alt="Couple Portrait" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                </div>
              </div>

              {/* Message */}
              <div className="bg-white/75 border border-[#ffccd5] p-4 rounded-xl shadow-sm">
                <p className="font-serif text-xs italic text-[#591a24] leading-relaxed line-clamp-3">
                  "{welcomeMsg}"
                </p>
              </div>

              {/* Countdown Preview */}
              {showCountdown ? (
                <div className="bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] text-white rounded-2xl p-4 text-center shadow-md">
                  <span className="text-[8px] uppercase tracking-widest text-white/90 block mb-2 font-mono font-bold">
                    {countdownLabel || 'Ceremony Begins In'}
                  </span>
                  <div className="flex justify-center gap-3">
                    
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-mono font-bold leading-none">{timeLeft.days}</span>
                      <span className="text-[7px] uppercase tracking-wider text-white/80 font-mono mt-1 font-bold">Days</span>
                    </div>
                    
                    <span className="text-lg opacity-60 leading-none">:</span>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-mono font-bold leading-none">{timeLeft.hours}</span>
                      <span className="text-[7px] uppercase tracking-wider text-white/80 font-mono mt-1 font-bold">Hrs</span>
                    </div>

                    <span className="text-lg opacity-60 leading-none">:</span>

                    <div className="flex flex-col items-center">
                      <span className="text-xl font-mono font-bold leading-none">{timeLeft.minutes}</span>
                      <span className="text-[7px] uppercase tracking-wider text-white/80 font-mono mt-1 font-bold">Mins</span>
                    </div>

                    <span className="text-lg opacity-60 leading-none">:</span>

                    <div className="flex flex-col items-center">
                      <span className="text-xl font-mono font-bold leading-none">{timeLeft.seconds}</span>
                      <span className="text-[7px] uppercase tracking-wider text-white/80 font-mono mt-1 font-bold">Secs</span>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="bg-white/40 border border-[#ffccd5] border-dashed rounded-xl p-4 text-center">
                  <EyeOff className="mx-auto text-[#ff4d6d]/40 mb-1" size={16} />
                  <p className="text-[9px] text-[#ff4d6d]/60 uppercase tracking-widest font-mono font-bold">Countdown element hidden</p>
                </div>
              )}

              {/* Date */}
              <div className="text-[10px] text-[#ff4d6d]/80 font-mono font-bold tracking-wider">
                {new Date(weddingDate).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
