import React from 'react';
import { FileText, Clock, Briefcase, Image, CheckCircle, Users } from 'lucide-react';

interface AnalyticsPanelProps {
  stats: {
    totalFamilies: number;
    totalGuestsConfirmed: number;
    totalInquiries: number;
    pendingInquiries: number;
    totalServices: number;
    galleryItems: number;
  };
}

export default function AnalyticsPanel({ stats }: AnalyticsPanelProps) {
  // Calculated percentages safely
  const responseRatio = stats.totalFamilies > 0 ? Math.min(100, Math.round((stats.totalGuestsConfirmed / (stats.totalFamilies * 4)) * 100)) : 0;
  const inquiryPipelineRatio = stats.totalInquiries > 0 ? Math.round(((stats.totalInquiries - stats.pendingInquiries) / stats.totalInquiries) * 100) : 0;

  return (
    <div id="admin-analytics-panel" className="space-y-8 mb-12">
      {/* 1. Bento Card Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-black/20 p-6 rounded-2xl border border-white/5 group hover:border-gold/20 transition-all">
          <div className="text-gold mb-4 p-3 bg-white/5 rounded-xl w-fit transition-transform group-hover:scale-110">
            <FileText size={20} />
          </div>
          <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Total Inquiries</p>
          <p className="font-serif text-3xl text-cream">{stats.totalInquiries}</p>
          <p className="text-[10px] mt-1 text-gold/60">{stats.pendingInquiries} pending follow-ups</p>
        </div>

        <div className="bg-black/20 p-6 rounded-2xl border border-white/5 group hover:border-gold/20 transition-all">
          <div className="text-amber-500 mb-4 p-3 bg-white/5 rounded-xl w-fit transition-transform group-hover:scale-110">
            <Clock size={20} />
          </div>
          <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Action Queries</p>
          <p className="font-serif text-3xl text-cream">{stats.pendingInquiries}</p>
          <p className="text-[10px] mt-1 text-amber-500/60">{100 - inquiryPipelineRatio}% queue latency</p>
        </div>

        <div className="bg-black/20 p-6 rounded-2xl border border-white/5 group hover:border-gold/20 transition-all">
          <div className="text-green-400 mb-4 p-3 bg-white/5 rounded-xl w-fit transition-transform group-hover:scale-110">
            <Briefcase size={20} />
          </div>
          <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Active Catalogues</p>
          <p className="font-serif text-3xl text-cream">{stats.totalServices}</p>
          <p className="text-[10px] mt-1 text-green-400/60">Visible services list</p>
        </div>

        <div className="bg-black/20 p-6 rounded-2xl border border-white/5 group hover:border-gold/20 transition-all">
          <div className="text-blue-400 mb-4 p-3 bg-white/5 rounded-xl w-fit transition-transform group-hover:scale-110">
            <Image size={20} />
          </div>
          <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Media Portfolio</p>
          <p className="font-serif text-3xl text-cream">{stats.galleryItems}</p>
          <p className="text-[10px] mt-1 text-blue-400/60">Showcase assets stored</p>
        </div>
      </div>

      {/* 2. Visual Graphs and Key Performance Metric bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reservation quota fill meter */}
        <div className="bg-[#121212] border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h5 className="font-serif text-lg text-cream italic flex items-center gap-2">
              <Users className="text-gold" size={16} /> Guest Attendance Target
            </h5>
            <span className="text-[10px] text-gold tracking-wider uppercase font-semibold">Live Ratio</span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-serif text-cream">{stats.totalGuestsConfirmed}</p>
                <p className="text-[10px] text-text-secondary uppercase">Confirmed VIP Attendants</p>
              </div>
              <p className="text-gold font-mono text-sm font-semibold">{responseRatio}% capacity filled</p>
            </div>

            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gold h-full rounded-full transition-all duration-1000"
                style={{ width: `${responseRatio}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-text-secondary/60">
              <span>0 guests</span>
              <span>Theoretical venue limit (~{(stats.totalFamilies * 4) || 12} guests)</span>
            </div>
          </div>
        </div>

        {/* Dynamic inquiry tracker */}
        <div className="bg-[#121212] border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h5 className="font-serif text-lg text-cream italic flex items-center gap-2">
              <CheckCircle className="text-gold" size={16} /> Inquiry Funnel Conversion
            </h5>
            <span className="text-[10px] text-[#D4AF37] tracking-wider uppercase font-semibold">Triage rate</span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-serif text-cream">{stats.totalInquiries - stats.pendingInquiries}</p>
                <p className="text-[10px] text-text-secondary uppercase">Addressed & Managed</p>
              </div>
              <p className="text-green-400 font-mono text-sm font-semibold">{inquiryPipelineRatio}% resolved</p>
            </div>

            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-green-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${inquiryPipelineRatio}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-text-secondary/60">
              <span>{stats.pendingInquiries} awaiting feedback</span>
              <span>{stats.totalInquiries} total requests received</span>
            </div>
          </div>
        </div>

        {/* Modern Vector-SVG spark charts for aesthetic balance */}
        <div className="bg-[#121212] border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <h5 className="font-serif text-lg text-cream italic">Quarterly Engagement Trend</h5>
            <span className="text-[9px] font-mono text-white/30 lowercase">samples</span>
          </div>

          <div className="flex-grow flex items-center justify-center p-3">
            {/* SVG line graph */}
            <svg viewBox="0 0 100 35" className="w-full h-24 overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Fill path */}
              <path 
                d="M0 35 L0 18 L15 12 L30 25 L45 8 L60 22 L75 14 L90 28 L100 5 L100 35 Z" 
                fill="url(#chartGradient)"
              />
              {/* Stroke line path */}
              <path 
                d="M0 18 L15 12 L30 25 L45 8 L60 22 L75 14 L90 28 L100 5" 
                fill="none" 
                stroke="#D4AF37" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Reference indicator coordinates dots */}
              <circle cx="45" cy="8" r="1.5" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1" />
              <circle cx="100" cy="5" r="1.5" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1" />
            </svg>
          </div>

          <div className="flex justify-between text-[10px] text-text-secondary/50 font-mono mt-2">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr (Current)</span>
          </div>
        </div>

      </div>
    </div>
  );
}
