import React, { useState } from 'react';
import { Family } from '../../types';
import { Trash2, QrCode, X, Printer, Edit2, Upload, Loader2, Image as ImageIcon, Save, Check, Type, FileText, Download, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { dataService } from '../../lib/dataService';

interface FamiliesTabProps {
  filteredFamilies: Family[];
  handleDeleteFamily: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

export default function FamiliesTab({
  filteredFamilies,
  handleDeleteFamily,
  onRefresh
}: FamiliesTabProps) {
  const [qrFamily, setQrFamily] = useState<Family | null>(null);
  const [editFamily, setEditFamily] = useState<Family | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (slug: string, id: string) => {
    const fullLink = `${window.location.origin}${window.location.pathname}#/invite/${slug}`;
    navigator.clipboard.writeText(fullLink)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
  };
  
  // Edit Form States
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    max_guests: 5,
    custom_title: '',
    custom_greeting: '',
    guest_image: ''
  });

  const handlePrint = () => {
    window.print();
  };

  const startEdit = (family: Family) => {
    setEditFamily(family);
    setEditForm({
      name: family.name || '',
      max_guests: family.max_guests ?? 5,
      custom_title: family.custom_title || '',
      custom_greeting: family.custom_greeting || '',
      guest_image: family.guest_image || ''
    });
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const b64 = await dataService.uploadImage(file);
      setEditForm(prev => ({ ...prev, guest_image: b64 }));
    } catch (err) {
      console.error('Image optimization failed:', err);
      alert('Error compressing and staging guest photo. Please try a smaller image file.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
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
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFamily) return;
    setSaving(true);
    try {
      await dataService.updateFamily(editFamily.id, {
        name: editForm.name,
        max_guests: Number(editForm.max_guests),
        custom_title: editForm.custom_title,
        custom_greeting: editForm.custom_greeting,
        guest_image: editForm.guest_image
      });
      setEditFamily(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Fail editing family profile:', err);
      alert('Failed synchronizing edits. Please check database configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <table id="admin-families-table" className="w-full border-collapse min-w-[800px]">
        <thead className="text-[0.6rem] text-gold uppercase tracking-[0.2em] border-b border-gold/10">
          <tr>
            <th className="text-left py-4 px-4">Family / Group Name</th>
            <th className="text-left py-4 px-4">Custom Subtitle</th>
            <th className="text-left py-4 px-4">Destination Slug</th>
            <th className="text-left py-4 px-4">Access Code</th>
            <th className="text-center py-4 px-4 font-mono">Photo Attached</th>
            <th className="text-center py-4 px-4 font-mono">Capacity</th>
            <th className="text-right py-4 px-4">Action</th>
          </tr>
        </thead>
        <tbody className="text-xs text-text-secondary">
          {filteredFamilies.map((f) => (
            <tr key={f.id} className="border-b border-white/5 hover:bg-white/[0.02]">
              <td className="py-4 px-4 text-text-primary">
                <div className="font-serif text-lg">{f.name}</div>
              </td>
              <td className="py-4 px-4 text-xs italic text-gold/80 max-w-[180px] truncate">
                {f.custom_title || <span className="opacity-30">— Default —</span>}
              </td>
              <td className="py-4 px-4 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span>/invite/{f.slug}</span>
                  <button
                    onClick={() => handleCopyLink(f.slug, f.id)}
                    className="p-1 text-text-secondary hover:text-gold transition-colors hover:bg-white/5 rounded"
                    title="Copy Full Invite Link"
                  >
                    {copiedId === f.id ? (
                      <span className="text-[9px] text-green-400 font-sans font-bold flex items-center gap-0.5">
                        <Check size={11} /> Copied!
                      </span>
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </td>
              <td className="py-4 px-4 text-gold tracking-widest font-bold text-sm">{f.access_code}</td>
              <td className="py-4 px-4 text-center">
                {f.guest_image ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-950/40 border border-green-500/20 text-green-400 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Yes
                  </div>
                ) : (
                  <span className="text-white/30 text-[10px]">—</span>
                )}
              </td>
              <td className="py-4 px-4 text-center text-cream font-bold">{f.max_guests}</td>
              <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                <button 
                  onClick={() => handleCopyLink(f.slug, f.id)}
                  className="p-1.5 text-text-secondary hover:text-gold transition-colors hover:bg-white/5 rounded"
                  title="Copy Full Invite Link"
                >
                  {copiedId === f.id ? (
                    <Check size={15} className="text-green-400" />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
                <button 
                  onClick={() => startEdit(f)}
                  className="p-1.5 text-text-secondary hover:text-gold transition-colors hover:bg-white/5 rounded"
                  title="Edit Card Customizations"
                >
                  <Edit2 size={15} />
                </button>
                <button 
                  onClick={() => setQrFamily(f)}
                  className="p-1.5 text-text-secondary hover:text-gold transition-colors hover:bg-white/5 rounded"
                  title="Generate QR Code"
                >
                  <QrCode size={15} />
                </button>
                <button 
                  onClick={() => handleDeleteFamily(f.id)}
                  className="p-1.5 text-text-secondary hover:text-red-400 transition-colors hover:bg-white/5 rounded"
                  title="Delete Invitation Passcode Group"
                >
                  <Trash2 size={15} />
                </button></td>
            </tr>
          ))}
          {filteredFamilies.length === 0 && (
            <tr>
              <td colSpan={7} className="py-20 text-center text-text-secondary uppercase tracking-widest opacity-40">
                No passcode rosters exist.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* QR PRINT DIALOG */}
      {qrFamily && (
        <div id="print-pass-area" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:bg-white print:p-0">
          <div className="bg-dark border border-white/10 rounded-xl w-full max-w-sm p-8 relative print:border-none print:shadow-none print:w-full print:max-w-none print:flex print:flex-col print:items-center print:justify-center">
            <button 
              onClick={() => setQrFamily(null)}
              className="absolute top-4 right-4 text-text-secondary hover:text-cream print:hidden"
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <h2 className="text-xl font-serif text-cream mb-1 print:text-black">{qrFamily.name}</h2>
              <p className="text-[10px] uppercase tracking-widest text-gold mb-6 print:text-black">Priority Entry Pass</p>
              
              <div className="bg-white p-4 rounded-xl mb-6">
                <QRCodeSVG 
                  value={`${window.location.origin}${window.location.pathname}#/pass/${qrFamily.slug}`}
                  size={200}
                  level="H"
                />
              </div>

              <div className="space-y-1 mb-6 text-text-secondary print:text-black">
                <p className="text-xs">Capacity: <span className="text-cream print:text-black font-bold">{qrFamily.max_guests} Guests</span></p>
                <p className="text-xs">Access Code: <span className="font-mono text-gold print:text-black font-bold">{qrFamily.access_code}</span></p>
              </div>

              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 bg-gold text-black text-[10px] uppercase tracking-widest font-bold rounded hover:bg-cream transition-colors print:hidden"
              >
                <Printer size={14} />
                Print Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARD/INVITATION EDIT MODAL & CUSTOMIZER */}
      {editFamily && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#121212] border border-gold/30 rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 my-8 max-h-[90vh] overflow-y-auto shadow-[0_0_80px_rgba(201,168,76,0.15)]">
            
            {/* Close Button */}
            <button 
              onClick={() => setEditFamily(null)} 
              className="absolute top-4 right-4 text-white/40 hover:text-gold transition-colors z-10"
            >
              <X size={24} />
            </button>

            {/* Left Column: Editor Parameters */}
            <form onSubmit={handleSaveEdit} className="md:col-span-7 space-y-6">
              <div>
                <h3 className="font-serif text-2xl text-cream">Customize Invitation Greeting</h3>
                <p className="text-[10px] uppercase tracking-wider text-gold font-mono mt-1">Personalize the visual assets for "{editFamily.name}"</p>
              </div>

              <div className="space-y-4">
                
                {/* Guest Custom Group Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold font-mono flex items-center gap-1.5">
                    <Type size={12} /> Family/Group Name
                  </label>
                  <input
                    required
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-white/5 border border-white/10 p-3 rounded-lg text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>

                {/* Subtitle / Personal relation designation */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold font-mono flex items-center gap-1.5">
                    <Type size={12} /> Personal Relationship Title / Subtitle
                  </label>
                  <input
                    type="text"
                    value={editForm.custom_title}
                    placeholder="e.g. Our Honored Chacha & Chachi / Beloved School Friends"
                    onChange={(e) => setEditForm({ ...editForm, custom_title: e.target.value })}
                    className="bg-white/5 border border-white/10 p-3 rounded-lg text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                  <span className="text-[9px] text-text-secondary italic">Appears elegantly below the family greeting heading on their splash invite page.</span>
                </div>

                {/* Allowed Capacity limit */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold font-mono">Allowed Family Attendance Capacity</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={editForm.max_guests}
                    onChange={(e) => setEditForm({ ...editForm, max_guests: Math.max(1, Number(e.target.value)) })}
                    className="bg-white/5 border border-white/10 p-3 rounded-lg text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                </div>

                {/* Personalized heartwarming message */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold font-mono flex items-center gap-1.5">
                    <FileText size={12} /> Personalized Welcoming Greeting Message
                  </label>
                  <textarea
                    rows={4}
                    value={editForm.custom_greeting}
                    placeholder="Provide a bespoke welcoming note from the bride & groom specifically for this family. e.g. 'We would be absolutely overjoyed to have your prestigious family accompany us on our auspicious wedding day...'"
                    onChange={(e) => setEditForm({ ...editForm, custom_greeting: e.target.value })}
                    className="bg-white/5 border border-white/10 p-3 rounded-lg text-xs text-cream outline-none focus:border-gold transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* File Upload Zone for Photo */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gold font-mono flex items-center gap-1.5">
                    <ImageIcon size={12} /> Honored Guest Photograph / Custom Graphics
                  </label>
                  
                  {editForm.guest_image ? (
                    <div className="relative border border-gold/20 rounded-lg p-3 bg-white/5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={editForm.guest_image}
                          alt="Uploaded guest profile photo"
                          className="w-12 h-12 object-cover rounded border border-white/10"
                        />
                        <div>
                          <span className="text-xs text-cream font-medium block">Custom Photo Attached</span>
                          <span className="text-[9px] text-[#D4AF37]/80">Optimized image compressed online</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, guest_image: '' }))}
                        className="py-1 px-2.5 border border-red-500/20 text-red-400 bg-red-950/10 hover:bg-red-950/30 rounded text-[10px] font-mono transition-colors"
                      >
                        REMOVE
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border border-dashed p-6 rounded-lg text-center flex flex-col items-center justify-center gap-2 transition-colors ${
                        dragActive 
                          ? 'border-gold bg-gold/10' 
                          : 'border-white/15 bg-white/[0.02] hover:border-gold/30 hover:bg-white/[0.04]'
                      }`}
                    >
                      <input
                        type="file"
                        id="guest-photo-file-upload"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {uploadingImage ? (
                        <div className="py-2 text-gold">
                          <Loader2 className="animate-spin text-gold mx-auto mb-1" size={20} />
                          <span className="text-[10px] font-mono">Optimizing snapshot file...</span>
                        </div>
                      ) : (
                        <label htmlFor="guest-photo-file-upload" className="cursor-pointer w-full">
                          <Upload size={24} className="text-gold mx-auto mb-1.5" />
                          <span className="text-xs text-cream block font-medium">Stash custom photo here</span>
                          <span className="text-[9px] text-text-secondary block mt-0.5">Drag photo or click to browse (Compacted dynamically)</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>

              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditFamily(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-cream text-[10px] uppercase tracking-widest rounded-lg font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gold text-dark text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  Save Card Customizations
                </button>
              </div>
            </form>

            {/* Right Column: Dynamic Pass Invitation Card Live Preview (Bespoke Luxury Elegant Card Theme Mockups) */}
            <div className="md:col-span-5 flex flex-col justify-between bg-black/40 border border-white/5 rounded-xl p-5 sm:p-6 text-center shadow-inner relative">
              <span className="absolute top-3 left-3 text-[8px] bg-gold/10 border border-gold/30 text-gold font-mono uppercase tracking-widest px-2 py-0.5 rounded">
                Royal Invitation Mockup
              </span>

              {/* Parallax / Wedding Styled Aesthetic Mock Template wrapper */}
              <div className="my-auto py-6 space-y-6 flex flex-col items-center">
                
                {/* Visual Image frame if configured */}
                <div className="relative">
                  {editForm.guest_image ? (
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-gold/60 mx-auto bg-dark p-1">
                      <img 
                        src={editForm.guest_image} 
                        alt="Honoring Guest Profile" 
                        className="w-full h-full object-cover rounded-full" 
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-dashed border-gold/30 flex flex-col items-center justify-center mx-auto bg-white/[0.01]">
                      <ImageIcon className="text-gold/40" size={28} />
                      <span className="text-[8px] text-text-secondary uppercase tracking-widest mt-2 font-mono">No Image Uploaded</span>
                    </div>
                  )}
                  {/* Luxury golden dots badge */}
                  <div className="absolute -bottom-1 -right-1 bg-gold text-dark w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-serif border border-black shadow">
                    ✦
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[#D4AF37] tracking-[0.4em] text-[8px] uppercase font-mono block">✦ EXCLUSIVE CARDS ✦</span>
                  <h4 className="font-serif text-xl text-cream tracking-tight max-w-[200px] mx-auto truncate">
                    Welcoming the <br />
                    <span className="text-gold italic font-bold">{editForm.name || "Gupta Family"}</span>
                  </h4>
                  
                  {editForm.custom_title ? (
                    <p className="text-[10px] text-gold/90 font-serif tracking-wider font-light italic max-w-[220px] mx-auto break-words">
                      "{editForm.custom_title}"
                    </p>
                  ) : (
                    <p className="text-[9px] text-[#D4AF37]/35 tracking-wider italic font-light">
                      "— Default Greeting Slate —"
                    </p>
                  )}
                </div>

                <div className="w-8 h-[1px] bg-gold/50 mx-auto" />

                {editForm.custom_greeting ? (
                  <p className="text-[11px] text-text-secondary leading-relaxed max-w-[240px] italic font-light font-mono px-4 border-l border-r border-gold/15">
                    "{editForm.custom_greeting}"
                  </p>
                ) : (
                  <p className="text-[10px] text-white/30 max-w-[220px] leading-relaxed italic px-2">
                    Default generic wedding reception greeting card template will be presented as fallback.
                  </p>
                )}
              </div>

              {/* Uploaded Documents Verification Panel for Admins */}
              {editFamily.documents && editFamily.documents.length > 0 && (
                <div className="text-left mt-4 border-t border-white/10 pt-4 space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60 font-mono block">
                    Verification Documents ({editFamily.documents.length})
                  </span>
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                    {editFamily.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between gap-2 p-2 bg-white/5 border border-white/5 rounded-lg text-xs">
                        <span className="truncate text-white/80 flex items-center gap-1.5 max-w-[80%]" title={doc.name}>
                          <FileText size={12} className="text-gold flex-shrink-0" />
                          {doc.name}
                        </span>
                        <a 
                          href={doc.url} 
                          download={doc.name} 
                          className="p-1 hover:bg-white/10 rounded text-gold transition-colors flex items-center justify-center"
                          title="Download Document"
                        >
                          <Download size={12} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informative Help tip */}
              <div className="p-3 bg-gold/5 border border-gold/20 text-[9px] text-[#D4AF37] rounded-lg leading-relaxed text-left mt-4">
                <strong>Aesthetic Design Pattern:</strong> This preview mimics how the guest dashboard welcomes guests when their unique URL is rendered or QR codes are decrypted.
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
