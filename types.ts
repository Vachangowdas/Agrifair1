
export interface User {
  id: string;
  username: string;
  mobile: string;
}

export interface Complaint {
  id: string;
  userId: string;
  traderName: string;
  issue: string;
  date: string;
  status: 'Pending' | 'Resolved';
}

export interface CropInput {
  cropName: string;
  quantity: number; // in kg or quintal
  unit: string;
  quality: 'Low' | 'Medium' | 'High' | 'Premium';
  region: string;
  // Detailed Cost Breakdown
  seedCost: number;
  fertilizerCost: number;
  labourCost: number;
  maintenanceCost: number;
  otherCost: number; // Transport, etc.
  marketRate: number; // Current market offering
}

export interface PriceResult {
  fairPrice: number;
  marketComparison: number; // Percentage difference
  explanation: string;
  breakdown: {
    baseCost: number;
    profitMargin: number;
    riskPremium: number;
  };
  recommendation: string;
}

export enum SupportedLanguage {
  EN = 'en',
  HI = 'hi', // Hindi
  KN = 'kn', // Kannada
}

export type TranslationKey = 
  | 'nav_home'
  | 'nav_calculator'
  | 'nav_complaints'
  | 'nav_login'
  | 'nav_logout'
  | 'hero_title'
  | 'hero_subtitle'
  | 'hero_cta'
  | 'auth_login_title'
  | 'auth_signup_title'
  | 'auth_username'
  | 'auth_mobile'
  | 'auth_otp'
  | 'auth_get_otp'
  | 'auth_verify'
  | 'auth_switch_signup'
  | 'auth_switch_login'
  | 'calc_title'
  | 'calc_crop_name'
  | 'calc_quantity'
  | 'calc_quality'
  | 'calc_region'
  | 'calc_cost_seeds'
  | 'calc_cost_fertilizer'
  | 'calc_cost_labour'
  | 'calc_cost_maint'
  | 'calc_cost_other'
  | 'calc_total_cost_label'
  | 'calc_market_rate'
  | 'calc_button'
  | 'comp_title'
  | 'comp_trader'
  | 'comp_issue'
  | 'comp_submit'
  | 'comp_history';
