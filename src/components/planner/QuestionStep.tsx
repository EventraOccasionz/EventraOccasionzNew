import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { GlassCard } from '../layout/GlassCard';

interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface QuestionStepProps {
  question: string;
  options?: Option[];
  type: 'radio' | 'checkbox' | 'input' | 'select' | 'hotel' | 'date';
  value: any;
  onChange: (value: any) => void;
  onNext: () => void;
  onBack?: () => void;
  isFirst?: boolean;
  placeholder?: string;
}

export const QuestionStep: React.FC<QuestionStepProps> = ({
  question,
  options,
  type,
  value,
  onChange,
  onNext,
  onBack,
  isFirst,
  placeholder
}) => {
  const handleRadioChange = (val: string) => {
    onChange(val);
    // Auto-next for radio if it's not multi-select
    if (type === 'radio') {
      setTimeout(onNext, 400);
    }
  };

  const handleCheckboxChange = (val: string) => {
    const current = Array.isArray(value) ? value : [];
    if (current.includes(val)) {
      onChange(current.filter(item => item !== val));
    } else {
      onChange([...current, val]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <h2 className="text-3xl md:text-4xl font-serif font-bold mb-10 text-center text-white">
        {question}
      </h2>

      <div className="grid gap-4 mb-12">
        {type === 'radio' && options?.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleRadioChange(opt.value)}
            className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 text-left
              ${value === opt.value 
                ? 'bg-gold-500/20 border-gold-500 text-gold-100 shadow-lg shadow-gold-900/10' 
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'}`}
          >
            <span className="text-lg font-medium">{opt.label}</span>
            {value === opt.value && <Check className="w-5 h-5 text-gold-400" />}
          </button>
        ))}

        {type === 'checkbox' && options?.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleCheckboxChange(opt.value)}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left
              ${value?.includes(opt.value)
                ? 'bg-gold-500/10 border-gold-500/50 text-gold-100'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
          >
            <span className="text-base font-medium">{opt.label}</span>
            <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors
              ${value?.includes(opt.value) ? 'bg-gold-500 border-gold-500' : 'border-white/20'}`}>
              {value?.includes(opt.value) && <Check className="w-4 h-4 text-black" />}
            </div>
          </button>
        ))}

        {type === 'input' && (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xl text-white focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all"
            autoFocus
          />
        )}

        {type === 'date' && (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xl text-white focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all"
          />
        )}

        {type === 'hotel' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 ml-2">Rooms Required</label>
                <input
                  type="number"
                  value={value?.rooms || ''}
                  onChange={(e) => onChange({ ...value, rooms: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-gold-500/50"
                  placeholder="e.g. 50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 ml-2">Number of Nights</label>
                <input
                  type="number"
                  value={value?.nights || ''}
                  onChange={(e) => onChange({ ...value, nights: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-gold-500/50"
                  placeholder="e.g. 2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400 ml-2">Room Category</label>
              <div className="grid grid-cols-3 gap-2">
                {['Standard', 'Deluxe', 'Suite'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => onChange({ ...value, category: cat })}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all
                      ${value?.category === cat ? 'bg-gold-500/20 border-gold-500 text-gold-200' : 'bg-white/5 border-white/10 text-gray-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        {!isFirst ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        ) : <div />}

        {type !== 'radio' && (
          <button
            onClick={onNext}
            disabled={type === 'input' && !value}
            className="btn-gold flex items-center gap-2"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
