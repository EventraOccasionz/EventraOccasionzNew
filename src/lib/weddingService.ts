import { WeddingPlanningData, BudgetEstimate } from '../types';

export function calculateBudgetEstimate(data: WeddingPlanningData): BudgetEstimate {
  // Base cost per guest in INR
  let basePerGuest = 1500; // Simple
  
  if (data.style === 'Premium') basePerGuest = 3500;
  if (data.style === 'Luxury') basePerGuest = 7500;
  if (data.style === 'Royal') basePerGuest = 15000;
  if (data.style === 'Destination Wedding') basePerGuest = 25000;

  const guestsMatch = data.guestCount.match(/(\d+)/);
  const guestCount = guestsMatch ? parseInt(guestsMatch[0]) : 100;
  
  const functionsCount = parseInt(data.functions) || 1;
  
  // Base cost calculation
  let baseTotal = basePerGuest * guestCount * (1 + (functionsCount - 1) * 0.4);
  
  // Service additions
  const serviceMultipliers: Record<string, number> = {
    'Venue': 1.2,
    'Decoration': 1.15,
    'Catering': 1.3,
    'Photography': 1.1,
    'Videography': 1.1,
    'DJ': 1.05,
    'Live Band': 1.1,
    'Celebrity Artist': 1.5,
    'Complete Wedding Management': 1.1,
  };

  data.services.forEach(service => {
    if (serviceMultipliers[service]) {
      baseTotal *= serviceMultipliers[service];
    } else {
      baseTotal += 50000; // Small fixed cost for others
    }
  });

  // Hotel additions
  if (data.hotelRequirement === 'Yes' && data.hotelDetails) {
    let roomRate = 5000;
    if (data.style === 'Luxury' || data.style === 'Royal') roomRate = 12000;
    baseTotal += data.hotelDetails.rooms * roomRate * data.hotelDetails.nights;
  }

  // Adjust for city (Tier 1 vs others)
  const tier1Cities = ['Delhi', 'Mumbai', 'Goa', 'Jaipur', 'Udaipur'];
  if (tier1Cities.includes(data.city)) {
    baseTotal *= 1.25;
  }

  // Final Range (+/- 15%)
  return {
    min: Math.round((baseTotal * 0.85) / 100000) * 100000,
    max: Math.round((baseTotal * 1.15) / 100000) * 100000,
    currency: '₹'
  };
}

export function formatPrice(price: number): string {
  if (price >= 10000000) {
    return `${(price / 10000000).toFixed(1)} Crore`;
  } else if (price >= 100000) {
    return `${(price / 100000).toFixed(1)} Lakh`;
  }
  return price.toLocaleString('en-IN');
}
