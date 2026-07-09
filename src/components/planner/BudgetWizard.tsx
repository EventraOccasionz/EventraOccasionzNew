import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeddingPlanningData, BudgetEstimate, PlannerRecommendation } from '../../types';
import { QuestionStep } from './QuestionStep';
import { ThinkingAnimation } from './ThinkingAnimation';
import { ResultDisplay } from './ResultDisplay';
import { LeadForm } from './LeadForm';
import { calculateBudgetEstimate } from '../../lib/weddingService';

const initialData: WeddingPlanningData = {
  eventType: 'Wedding',
  city: '',
  style: 'Premium',
  guestCount: '100-200',
  functions: '3',
  services: ['Venue', 'Decoration', 'Catering'],
  hotelRequirement: 'Not Sure',
  cateringPreference: 'Veg + Non Veg',
  decorationPreference: 'Premium',
  photographyPreference: 'Premium',
  timeline: 'Within 6 Months'
};

export const BudgetWizard: React.FC = () => {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState<WeddingPlanningData>(initialData);
  const [estimate, setEstimate] = React.useState<BudgetEstimate | null>(null);
  const [recommendations, setRecommendations] = React.useState<PlannerRecommendation[]>([]);

  const handleNext = () => {
    if (step === 11) {
      processResults();
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => Math.max(0, prev - 1));

  React.useEffect(() => {
    if (step === 7 && data.hotelRequirement !== 'Yes') {
      setStep(8);
    }
  }, [step, data.hotelRequirement]);

  const processResults = async () => {
    // 1. Calculate Local Estimate
    const est = calculateBudgetEstimate(data);
    setEstimate(est);

    // 2. Fetch AI Recommendations from Server
    try {
      const response = await fetch('/api/planner/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingData: data })
      });
      const recs = await response.json();
      setRecommendations(recs);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }

    // Artificial delay for better UX
    setTimeout(() => {
      setStep(13);
    }, 5000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10">
      {step < 12 && (
        <div className="mb-12">
          <div className="flex justify-between text-xs text-gold-500 font-bold uppercase tracking-widest mb-2">
            <span>Progress</span>
            <span>{Math.round((step / 11) * 100)}%</span>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(step / 11) * 100}%` }}
              className="h-full bg-gradient-to-r from-gold-600 to-gold-400 shadow-[0_0_10px_rgba(255,180,41,0.3)]"
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 0 && (
          <QuestionStep
            key="eventType"
            isFirst
            question="What type of event are you planning?"
            type="radio"
            value={data.eventType}
            options={[
              { label: 'Wedding', value: 'Wedding' },
              { label: 'Engagement', value: 'Engagement' },
              { label: 'Reception', value: 'Reception' },
              { label: 'Haldi', value: 'Haldi' },
              { label: 'Mehendi', value: 'Mehendi' },
              { label: 'Sangeet', value: 'Sangeet' },
              { label: 'Birthday', value: 'Birthday' },
              { label: 'Corporate Event', value: 'Corporate Event' },
              { label: 'Other', value: 'Other' },
            ]}
            onChange={(val) => setData({ ...data, eventType: val })}
            onNext={handleNext}
          />
        )}

        {step === 1 && (
          <QuestionStep
            key="city"
            question="In which city is the event planned?"
            type="input"
            placeholder="e.g. Chandigarh, Goa, Jaipur..."
            value={data.city}
            onChange={(val) => setData({ ...data, city: val })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 2 && (
          <QuestionStep
            key="style"
            question="Choose your desired wedding style"
            type="radio"
            value={data.style}
            options={[
              { label: 'Simple & Elegant', value: 'Simple' },
              { label: 'Premium Experience', value: 'Premium' },
              { label: 'Luxury Grandeur', value: 'Luxury' },
              { label: 'Royal Majesty', value: 'Royal' },
              { label: 'Destination Dream', value: 'Destination Wedding' },
            ]}
            onChange={(val) => setData({ ...data, style: val as any })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 3 && (
          <QuestionStep
            key="guestCount"
            question="Estimated guest count?"
            type="radio"
            value={data.guestCount}
            options={[
              { label: '1–50 Guests', value: '1-50' },
              { label: '50–100 Guests', value: '50-100' },
              { label: '100–200 Guests', value: '100-200' },
              { label: '200–300 Guests', value: '200-300' },
              { label: '300–500 Guests', value: '300-500' },
              { label: '500+ Guests', value: '500+' },
            ]}
            onChange={(val) => setData({ ...data, guestCount: val })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 4 && (
          <QuestionStep
            key="functions"
            question="Number of functions to organize?"
            type="radio"
            value={data.functions}
            options={[
              { label: '1 Function', value: '1' },
              { label: '2 Functions', value: '2' },
              { label: '3 Functions', value: '3' },
              { label: '4 Functions', value: '4' },
              { label: '5+ Functions', value: '5+' },
            ]}
            onChange={(val) => setData({ ...data, functions: val })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 5 && (
          <QuestionStep
            key="services"
            question="Which services do you require?"
            type="checkbox"
            value={data.services}
            options={[
              { label: 'Venue Booking', value: 'Venue' },
              { label: 'Theme Decoration', value: 'Decoration' },
              { label: 'Full Catering', value: 'Catering' },
              { label: 'Photography & Cinematic Video', value: 'Photography' },
              { label: 'DJ & Sound System', value: 'DJ' },
              { label: 'Celebrity Performance', value: 'Celebrity Artist' },
              { label: 'Wedding Website & RSVP', value: 'Wedding Website' },
              { label: 'Complete Management', value: 'Complete Wedding Management' },
            ]}
            onChange={(val) => setData({ ...data, services: val })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 6 && (
          <QuestionStep
            key="hotel"
            question="Do you require hotel accommodation?"
            type="radio"
            value={data.hotelRequirement}
            options={[
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
              { label: 'Not Sure', value: 'Not Sure' },
            ]}
            onChange={(val) => setData({ ...data, hotelRequirement: val as any })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 7 && data.hotelRequirement === 'Yes' && (
          <QuestionStep
            key="hotelDetails"
            question="Accommodation details"
            type="hotel"
            value={data.hotelDetails || { rooms: 0, nights: 0, category: 'Deluxe' }}
            onChange={(val) => setData({ ...data, hotelDetails: val })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 7 && data.hotelRequirement !== 'Yes' && (
          <div key="skip-hotel" />
        )}

        {step === 8 && (
          <QuestionStep
            key="catering"
            question="Catering preference?"
            type="radio"
            value={data.cateringPreference}
            options={[
              { label: 'Pure Vegetarian', value: 'Veg' },
              { label: 'Veg + Non-Veg', value: 'Veg + Non Veg' },
              { label: 'No Catering Needed', value: 'No Catering' },
            ]}
            onChange={(val) => setData({ ...data, cateringPreference: val })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 9 && (
          <QuestionStep
            key="decoration"
            question="Decoration style?"
            type="radio"
            value={data.decorationPreference}
            options={[
              { label: 'Classic Elegance', value: 'Classic' },
              { label: 'Premium Theme', value: 'Premium' },
              { label: 'Luxury Extravaganza', value: 'Luxury' },
              { label: 'Royal Heritage', value: 'Royal Theme' },
              { label: 'Customized Vision', value: 'Customized Theme' },
            ]}
            onChange={(val) => setData({ ...data, decorationPreference: val })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 10 && (
          <QuestionStep
            key="photography"
            question="Photography package?"
            type="radio"
            value={data.photographyPreference}
            options={[
              { label: 'Essential Coverage', value: 'Basic' },
              { label: 'Premium Cinematic', value: 'Premium' },
              { label: 'High-End Luxury', value: 'Luxury' },
              { label: 'Elite (Drone + Live)', value: 'Drone Included' },
            ]}
            onChange={(val) => setData({ ...data, photographyPreference: val })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 11 && (
          <QuestionStep
            key="timeline"
            question="When are you planning the event?"
            type="radio"
            value={data.timeline}
            options={[
              { label: 'Specific Date', value: 'Date' },
              { label: 'Flexible Date', value: 'Flexible Date' },
              { label: 'Within 3 Months', value: 'Within 3 Months' },
              { label: 'Within 6 Months', value: 'Within 6 Months' },
              { label: 'After 6 Months', value: 'After 6 Months' },
            ]}
            onChange={(val) => setData({ ...data, timeline: val })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 12 && (
          <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ThinkingAnimation />
          </motion.div>
        )}

        {step === 13 && estimate && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ResultDisplay
              data={data}
              estimate={estimate}
              recommendations={recommendations}
              onFinish={() => setStep(14)}
            />
          </motion.div>
        )}

        {step === 14 && (
          <motion.div key="lead" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LeadForm weddingData={data} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
