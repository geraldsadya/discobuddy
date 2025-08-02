import { UserProfile } from './types/user-profile';

// In a real app, this would come from a database or auth token
// For demo, we'll use environment variables or hardcoded data
export async function getUserProfile(userId: string): Promise<UserProfile> {
  // Demo profile for Gerald
  return {
    name: "Gerald",
    age: 23,
    gender: "Male",
    city: "Cape Town",
    occupation: "Junior Software Developer",
    student: {
      is_student: true,
      university: "UCT",
      course: "Computer Science"
    },
    income: 350000,

    products: {
      health: {
        active: true,
        plan: "KeyCare Plus"
      },
      bank: {
        suite: "Gold",
        vitality_money_status: "Blue",
        discovery_miles: 2500,
        monthly_spending: 8000,
        credit_usage: "Moderate",
        savings_balance: 15000
      },
      vitality: {
        status: "Bronze",
        points: 7500,
        points_this_year: 7500,
        health_assessments: ["Vitality Age"],
        exercise_tracking: "Basic smartphone",
        gym_membership: false,
        healthyfood_activated: true,
        weekly_exercise_goals: 3,
        exercise_frequency: 2
      },
      life: {
        active: true,
        cover_amount: 500000
      },
      insure: {
        active: true,
        plan: "Essential",
        vehicles: 1
      }
    },

    health: {
      bmi: 24.5,
      blood_pressure: "Normal",
      smoking_status: "Non-smoker",
      diet_type: "Mixed, some healthy choices"
    },

    spending: {
      groceries: {
        primary_partner: "Checkers",
        monthly_amount: 2200,
        secondary_partner: "Pick n Pay",
        secondary_amount: 800
      },
      healthcare: {
        partner: "Clicks",
        monthly_amount: 400
      }
    },

    financial_goals: [
      "Building emergency fund",
      "Saving for car upgrade",
      "Planning to buy property in 3-5 years",
      "Interested in investment opportunities"
    ],

    challenges: [
      "Limited time for exercise due to work",
      "Want to improve Vitality status for better rewards",
      "Looking to maximize Discovery Miles earning",
      "Considering gym membership but concerned about cost",
      "Want to optimize banking benefits"
    ],

    preferences: {
      interaction_mode: "Digital",
      features: [
        "Digital/online interactions",
        "Convenience and time-saving features",
        "Technology and apps"
      ],
      shopping_preferences: [
        "Budget-conscious",
        "Willing to invest in health",
        "Prefers Checkers over Woolworths"
      ]
    }
  };
}

// Helper to extract relevant profile info for specific questions
export function getProfileContextForQuestion(profile: UserProfile, question: string): string {
  const q = question.toLowerCase();
  
  // Build relevant context based on question topic
  if (q.includes('gym') || q.includes('exercise') || q.includes('fitness')) {
    return `You are a ${profile.age} year old ${profile.student?.is_student ? 'student at ' + profile.student.university : ''}, 
    currently ${profile.products.vitality.gym_membership ? 'with' : 'without'} a gym membership. 
    Your Vitality status is ${profile.products.vitality.status} and you exercise ${profile.products.vitality.exercise_frequency} times per week.`;
  }

  if (q.includes('groceries') || q.includes('food') || q.includes('healthyfood')) {
    return `You spend R${profile.spending.groceries.monthly_amount} at ${profile.spending.groceries.primary_partner} 
    and R${profile.spending.groceries.secondary_amount} at ${profile.spending.groceries.secondary_partner} monthly. 
    Your Vitality Money status is ${profile.products.bank.vitality_money_status}.`;
  }

  // Default context
  return `You are a ${profile.age} year old ${profile.occupation} in ${profile.city}, 
  with Vitality ${profile.products.vitality.status} status and a ${profile.products.bank.suite} banking suite.`;
} 