import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Gift, Sparkles, TrendingDown, Calendar, Users, Camera, Palette, Zap } from 'lucide-react';
import { BudgetEstimate, PlannerRecommendation, WeddingPlanningData } from '../../types';
import { formatPrice } from '../../lib/weddingService';
import { GlassCard } from '../layout/GlassCard';

interface ResultDisplayProps {
  data: WeddingPlanningData;
  estimate: BudgetEstimate;
  recommendations: PlannerRecommendation[];
  onFinish: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, estimate, recommendations, onFinish }) => {
  const getIcon = (cat: string) => {
    switch (cat) {
      case 'Tip': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'Idea': return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'Saving': return <TrendingDown className="w-5 h-5 text-green-400" />;
      case 'Upgrade': return <TrendingUp className="w-5 h-5 text-gold-400" />;
      case 'Season': return <Calendar className="w-5 h-5 text-blue-400" />;
      default: return <Gift className="w-5 h-5 text-gold-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto border border-gold-500/30"
        >
          <CheckCircle2 className="w-10 h-10 text-gold-400" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Your Wedding Plan is Ready</h1>
        <p className="text-gray-400 max-w-2xl mx-auto italic">
          We've curated a high-level estimate and expert recommendations based on your unique profile.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <GlassCard gold className="md:col-span-2 text-center flex flex-col justify-center py-12">
          <p className="text-gold-400 uppercase tracking-widest text-sm font-semibold mb-2">Estimated Budget Range</p>
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
            {estimate.currency}{formatPrice(estimate.min)} – {formatPrice(estimate.max)}
          </h2>
          <div className="max-w-md mx-auto text-sm text-gray-400 leading-relaxed px-4">
            <p>
              This is an estimated planning budget. Actual pricing depends on venue availability, 
              final customization, and seasonal demand.
            </p>
          </div>
        </GlassCard>

        <GlassCard className="space-y-6">
          <h3 className="text-xl font-serif font-bold text-gold-300 flex items-center gap-2">
            <Users className="w-5 h-5" /> Summary
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Event Type</span>
              <span className="text-white font-medium">{data.eventType}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Location</span>
              <span className="text-white font-medium">{data.city}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Guest Count</span>
              <span className="text-white font-medium">{data.guestCount}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Wedding Style</span>
              <span className="text-white font-medium">{data.style}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="space-y-8">
        <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-gold-500" /> AI Recommendations
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {recommendations.map((rec, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GlassCard className="h-full hover:border-gold-500/30 transition-colors group">
                <div className="flex gap-4">
                  <div className="mt-1">{getIcon(rec.category)}</div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-gold-100 group-hover:text-gold-300 transition-colors">{rec.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{rec.content}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="pt-8">
        <GlassCard gold className="bg-gradient-to-br from-gold-950/40 to-transparent border-gold-500/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-white">Want an accurate quotation?</h3>
              <p className="text-gray-400">Connect with our luxury planners for a personalized final breakdown.</p>
            </div>
            <button
              onClick={onFinish}
              className="btn-gold flex items-center gap-2 whitespace-nowrap"
            >
              Book Free Consultation
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const TrendingUp = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);
