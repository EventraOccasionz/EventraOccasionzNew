import React, { useState, useEffect } from 'react';
import { Map, MapPin, Upload, X, Save, Compass, Loader2 } from 'lucide-react';
import { dataService } from '../../lib/dataService';

// Default layout map fallback
import defaultVenueLayoutImage from '../../assets/images/venue_layout_map_1780754497017.png';

interface VenueSettingsForm {
  id: string;
  venue_name: string;
  address: string;
  lat: number;
  lng: number;
  google_maps_url: string;
  interactive_map_url: string;
  zoom: number;
}

interface MapTabProps {
  showToast: (type: 'success' | 'error', message: string) => void;
  onRefreshAll?: () => void;
}

export default function MapTab({ showToast, onRefreshAll }: MapTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [form, setForm] = useState<VenueSettingsForm>({
    id: 'default',
    venue_name: '',
    address: '',
    lat: 30.6425,
    lng: 76.8283,
    google_maps_url: '',
    interactive_map_url: '',
    zoom: 15
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await dataService.getVenueSettings();
        if (settings) {
          setForm({
            id: settings.id || 'default',
            venue_name: settings.venue_name || '',
            address: settings.address || '',
            lat: Number(settings.lat ?? 30.6425),
            lng: Number(settings.lng ?? 76.8283),
            google_maps_url: settings.google_maps_url || '',
            interactive_map_url: settings.interactive_map_url || '',
            zoom: Number(settings.zoom ?? 15)
          });
        }
      } catch (err: any) {
        console.error('Failed fetching map settings:', err);
        showToast('error', 'Failed retrieving venue map setup.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: (name === 'lat' || name === 'lng' || name === 'zoom') ? Number(value) : value
    }));
  };

  const handleFileUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const base64Url = await dataService.uploadImage(file);
      setForm(prev => ({ ...prev, interactive_map_url: base64Url }));
      showToast('success', 'Venue layout graphic optimized and staging completed!');
    } catch (err: any) {
      console.error(err);
      showToast('error', err?.message || 'Error processing layout layout file upload.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.venue_name || !form.address) {
      showToast('error', 'Venue name and address parameters can never be declared blank.');
      return;
    }

    setSaving(true);
    try {
      await dataService.updateVenueSettings(form);
      showToast('success', 'Venue map architecture settings successfully updated in Firestore database!');
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Database synchronization failed. Please review administrative auth permissions.');
    } finally {
      setSaving(false);
    }
  };

  const clearCustomMap = () => {
    setForm(prev => ({ ...prev, interactive_map_url: '' }));
    showToast('success', 'Custom graphic removed. Reverted to default blueprint fallback.');
  };

  if (loading) {
    return (
      <div id="map-tab-loader" className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin text-gold" size={40} />
        <p className="text-xs text-text-secondary uppercase tracking-[0.2em] font-mono">Parsing spatial vectors...</p>
      </div>
    );
  }

  return (
    <div id="map-tab-setup-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Settings Form Column */}
      <div className="lg:col-span-7 bg-[#121212]/50 border border-white/5 rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Compass className="text-gold" size={24} />
          <div>
            <h3 className="font-serif text-xl text-cream">Venue Coordinates & Layout Map</h3>
            <p className="text-xs text-text-secondary">Setup physical coordinates and spatial navigation for Event passes and headers.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            
            {/* Venue Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">Venue Title / Name</label>
              <input
                required
                type="text"
                name="venue_name"
                value={form.venue_name}
                onChange={handleInputChange}
                className="bg-white/5 border border-gold/15 p-4 text-xs text-cream outline-none focus:border-gold transition-all rounded-lg"
                placeholder="e.g. Royal Palace Banquet & Lawns"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">Complete Mailing Address</label>
              <textarea
                required
                rows={3}
                name="address"
                value={form.address}
                onChange={handleInputChange}
                className="bg-white/5 border border-gold/15 p-4 text-xs text-cream outline-none focus:border-gold transition-all rounded-lg resize-none"
                placeholder="Complete street address, pin code, city, and state information..."
              />
            </div>

            {/* Coordinates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">Latitude Vector</label>
                <input
                  type="number"
                  step="any"
                  name="lat"
                  value={form.lat}
                  onChange={handleInputChange}
                  className="bg-white/5 border border-gold/15 p-4 text-xs text-cream outline-none focus:border-gold transition-all rounded-lg"
                  placeholder="30.6425"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">Longitude Vector</label>
                <input
                  type="number"
                  step="any"
                  name="lng"
                  value={form.lng}
                  onChange={handleInputChange}
                  className="bg-white/5 border border-gold/15 p-4 text-xs text-cream outline-none focus:border-gold transition-all rounded-lg"
                  placeholder="76.8283"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">Default Zoom Level</label>
                <input
                  type="number"
                  name="zoom"
                  min="1"
                  max="21"
                  value={form.zoom}
                  onChange={handleInputChange}
                  className="bg-white/5 border border-gold/15 p-4 text-xs text-cream outline-none focus:border-gold transition-all rounded-lg"
                  placeholder="15"
                />
              </div>
            </div>

            {/* External Google Maps URL */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">Google Maps Quick Share URL</label>
              <input
                type="url"
                name="google_maps_url"
                value={form.google_maps_url}
                onChange={handleInputChange}
                className="bg-white/5 border border-gold/15 p-4 text-xs text-cream outline-none focus:border-gold transition-all rounded-lg"
                placeholder="e.g. https://maps.google.com/?q=..."
              />
              <span className="text-[10px] text-text-secondary italic">Ensure you copy the share link or query query direct coordinates from G-Maps.</span>
            </div>

            {/* Visual Floor Layout Upload Area */}
            <div className="flex flex-col gap-2 pt-2">
              <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">Interactive Floor Layout Map Graphic</label>
              
              {form.interactive_map_url ? (
                <div className="relative border border-gold/20 rounded-lg p-3 bg-white/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={form.interactive_map_url}
                      alt="Uploaded floor layout"
                      className="w-12 h-12 object-cover rounded border border-white/10"
                    />
                    <div>
                      <span className="text-xs text-cream font-medium block">Custom Layout Configured</span>
                      <span className="text-[10px] text-green-400">Inline Database Storage (Active)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearCustomMap}
                    className="p-2 border border-red-500/20 text-red-400 bg-red-950/10 hover:bg-red-950/30 rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border border-dashed p-8 rounded-lg text-center flex flex-col items-center justify-center gap-3 transition-colors ${
                    dragActive 
                      ? 'border-gold bg-gold/10' 
                      : 'border-white/15 bg-white/[0.02] hover:border-gold/30 hover:bg-white/[0.04]'
                  }`}
                >
                  <input
                    type="file"
                    id="venue-layout-file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <div className="py-2 text-gold">
                      <Loader2 className="animate-spin text-gold mx-auto mb-2" size={24} />
                      <span className="text-xs font-mono">Uploading vector map assets...</span>
                    </div>
                  ) : (
                    <label htmlFor="venue-layout-file" className="cursor-pointer">
                      <Upload size={32} className="text-gold mx-auto mb-2" />
                      <span className="text-xs text-cream block font-medium">Drag layout file here or click to choose</span>
                      <span className="text-[10px] text-text-secondary block mt-1">PNG, JPG, or WEBP up to 5MB</span>
                    </label>
                  )}
                </div>
              )}
            </div>

          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 bg-gold text-dark text-xs uppercase tracking-widest font-bold flex items-center gap-2 rounded-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save Venue Geometry
            </button>
          </div>
        </form>
      </div>

      {/* Guest-Facing Mock Preview Column */}
      <div className="lg:col-span-5 bg-black/40 border border-white/5 rounded-xl p-6 sm:p-8 space-y-8 flex flex-col justify-between h-full">
        <div>
          <span className="text-[#D4AF37] uppercase tracking-[0.25em] text-[10px] block mb-2 font-mono">Live Widget Prototype</span>
          <h4 className="font-serif text-lg text-cream mb-4">Spatial Map Presentation</h4>
          <p className="text-xs text-text-secondary leading-relaxed mb-6">
            Below is how guest indicators and visual floor layout mapping render inside digital invitations and pass overlays.
          </p>

          <div className="space-y-6">
            {/* Direct Location Card Mock */}
            <div className="bg-[#121212] border border-white/5 p-5 rounded-lg">
              <div className="flex gap-4 items-start mb-4">
                <MapPin className="text-gold mt-1" size={20} />
                <div>
                  <h5 className="text-xs text-cream font-medium uppercase tracking-wider font-mono">Target Destination</h5>
                  <p className="text-sm font-serif text-gold mt-1">{form.venue_name || 'No Venue Configured'}</p>
                  <p className="text-[11px] text-text-secondary mt-1">{form.address || 'Address parameters has not been specified yet.'}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-3">
                <span className="text-text-secondary font-mono">Lat/Lng: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</span>
                {form.google_maps_url ? (
                  <a
                    href={form.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold hover:underline flex items-center gap-1 font-mono uppercase"
                  >
                    Test Navigate ↗
                  </a>
                ) : (
                  <span className="text-white/30 font-mono italic">No URL configured</span>
                )}
              </div>
            </div>

            {/* Layout Map Graphic Mock */}
            <div className="border border-white/5 bg-[#0a0a0a] rounded-lg p-4 overflow-hidden text-center relative">
              <span className="text-[10px] text-gold absolute top-2 right-2 border border-gold/20 bg-black/60 px-2 py-0.5 rounded uppercase font-mono">Floor Layout</span>
              <img
                src={form.interactive_map_url || defaultVenueLayoutImage}
                alt="Venue Blueprint Layout Preview"
                className="max-w-full h-44 object-contain mx-auto rounded mb-2 border border-white/5 shadow-inner"
              />
              <span className="text-[10px] text-text-secondary">Blueprint visual fallback enabled</span>
            </div>
          </div>
        </div>

        <div className="bg-gold/5 border border-gold/20 p-5 rounded-lg text-xs leading-relaxed text-[#D4AF37]/95 mt-6">
          <strong>Tip:</strong> After writing the new configurations on Firebase, the geographical maps links and custom responsive layouts will auto-populate on the event dashboard, passes, and contact directions section.
        </div>
      </div>

    </div>
  );
}
