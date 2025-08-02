export interface VitalityStatus {
  status: 'Blue' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  points: number;
  points_this_year: number;
  health_assessments: string[];
  exercise_tracking: string;
  gym_membership: boolean;
  healthyfood_activated: boolean;
  weekly_exercise_goals: number;
  exercise_frequency: number;
}

export interface BankStatus {
  suite: 'Gold' | 'Platinum' | 'Black';
  vitality_money_status: 'Blue' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  discovery_miles: number;
  monthly_spending: number;
  credit_usage: 'Low' | 'Moderate' | 'High';
  savings_balance: number;
}

export interface HealthMetrics {
  bmi: number;
  blood_pressure: string;
  cholesterol?: string;
  glucose?: string;
  smoking_status: 'Non-smoker' | 'Smoker';
  diet_type: string;
}

export interface SpendingProfile {
  groceries: {
    primary_partner: 'Checkers' | 'Pick n Pay' | 'Woolworths';
    monthly_amount: number;
    secondary_partner?: 'Checkers' | 'Pick n Pay' | 'Woolworths';
    secondary_amount?: number;
  };
  healthcare: {
    partner: string;
    monthly_amount: number;
  };
}

export interface UserProfile {
  // Personal Information
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  city: string;
  occupation: string;
  student?: {
    is_student: boolean;
    university?: string;
    course?: string;
  };
  income: number;

  // Discovery Products
  products: {
    health: {
      active: boolean;
      plan: string;
    };
    bank: BankStatus;
    vitality: VitalityStatus;
    life: {
      active: boolean;
      cover_amount: number;
    };
    insure?: {
      active: boolean;
      plan: string;
      vehicles: number;
    };
  };

  // Health & Lifestyle
  health: HealthMetrics;
  spending: SpendingProfile;

  // Goals & Preferences
  financial_goals: string[];
  challenges: string[];
  preferences: {
    interaction_mode: 'Digital' | 'Branch' | 'Both';
    features: string[];
    shopping_preferences: string[];
  };
} 