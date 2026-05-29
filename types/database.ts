export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: 'coach' | 'client' | 'admin'
  plan: 'trial' | 'starter' | 'growth' | 'pro' | 'scale' | 'elite' | 'unlimited' | 'standard'
  plan_status: 'active' | 'trial' | 'cancelled' | 'past_due'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  client_limit: number
  ai_exercises_used: number
  ai_programmes_used: number
  usage_reset_month: number
  usage_reset_year: number
  coaching_type: string | null
  last_visited_roadmap: string | null
  referral_code: string | null
  referral_count: number
  referred_by: string | null
  referral_discount_pending: boolean
  last_seen_at: string | null
  suspended: boolean
  brand_color_primary: string | null
  brand_color_accent: string | null
  brand_font: string | null
  brand_icon: string | null
  theme_mode: 'light' | 'dark' | 'auto' | null
  inactivity_threshold_days: number
  connect_account_id: string | null
  connect_charges_enabled: boolean
  connect_status: 'none' | 'pending' | 'active' | 'restricted'
  created_at: string
}

export type PaymentOffer = {
  id: string
  coach_id: string
  type: 'pack' | 'subscription'
  name: string
  price_cents: number
  currency: string
  sessions_count: number | null
  interval: string | null
  stripe_price_id: string | null
  is_active: boolean
  created_at: string
}

export type ClientEntitlement = {
  id: string
  client_id: string
  coach_id: string
  offer_id: string | null
  type: string
  status: 'active' | 'completed' | 'refunded' | 'canceled'
  sessions_remaining: number | null
  created_at: string
}

export type Transaction = {
  id: string
  coach_id: string
  client_id: string | null
  offer_id: string | null
  amount_cents: number
  fee_cents: number
  currency: string
  type: 'pack' | 'subscription' | 'manual'
  status: 'paid' | 'refunded' | 'failed'
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  created_at: string
  // join optionnel
  client?: { full_name: string } | null
}

export type AuditLog = {
  id: string
  admin_id: string
  action: string
  target_type: string | null
  target_id: string | null
  payload: Record<string, unknown> | null
  created_at: string
}

export type Notification = {
  id: string
  target: string
  message: string
  type: 'info' | 'success' | 'warning'
  expires_at: string | null
  created_at: string
}

export type EmailScheduled = {
  id: string
  subject: string
  body: string
  recipients: { type: string; value?: string }
  scheduled_at: string | null
  sent_at: string | null
  sent_count: number
  status: 'pending' | 'sent' | 'failed' | 'scheduled'
  created_by: string | null
  created_at: string
}

export type SupportTicket = {
  id: string
  coach_id: string
  subject: string
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  last_activity_at: string
  created_at: string
}

export type SupportMessage = {
  id: string
  ticket_id: string
  sender_role: 'coach' | 'admin'
  sender_id: string
  content: string
  created_at: string
}

export type RoadmapItem = {
  id: string
  type: 'coming_soon' | 'in_progress' | 'released'
  title: string
  description: string | null
  category: string | null
  released_at: string | null
  is_published: boolean
  vote_count: number
  created_at: string
}

export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'planned' | 'in_progress' | 'delivered'

export type Suggestion = {
  id: string
  coach_id: string
  title: string
  description: string | null
  status: SuggestionStatus
  vote_count: number
  dislike_count: number
  comment_count: number
  created_at: string
  // join optionnel
  coach?: { full_name: string | null } | null
}

export type SuggestionComment = {
  id: string
  suggestion_id: string
  coach_id: string
  content: string
  created_at: string
  // join optionnel
  coach?: { full_name: string | null } | null
}

export type VoteType = 'up' | 'down'

export type Vote = {
  id: string
  coach_id: string
  item_id: string | null
  suggestion_id: string | null
  vote_type: VoteType | null
  created_at: string
}

export type Client = {
  id: string
  coach_id: string
  full_name: string
  email: string
  magic_token: string
  token_expires_at: string
  invite_token: string | null
  invite_token_expires_at: string | null
  invite_token_used: boolean
  status: 'active' | 'inactive' | 'pending'
  last_checkin_at: string | null
  rest_days: number[]
  created_at: string
  // Onboarding fields
  birth_date: string | null
  gender: string | null
  height_cm: number | null
  weight_kg: number | null
  main_goal: string | null
  activity_level: string | null
  injuries: string | null
  dietary_habits: string | null
  avg_sleep_hours: number | null
  sport_performances: string | null
  daily_calories_estimated: number | null
  onboarding_completed_at: string | null
  parq_cardiac: boolean | null
  parq_injuries: boolean | null
  parq_medical: boolean | null
}

export type ClientReminder = {
  id: string
  client_id: string
  type: 'inactivity' | 'streak_fail' | 'daily'
  title: string
  message: string
  dismissed_at: string | null
  created_at: string
}

export type Objective = {
  id: string
  client_id: string
  coach_id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  target_date: string | null
  completed_at: string | null
  created_at: string
  type: 'series' | 'distance' | 'timer' | null
  series_count: number | null
  reps_count: number | null
  distance_km: number | null
  duration_seconds: number | null
}

export type ExerciseSession = {
  id: string
  client_id: string
  objective_id: string
  series_completed: number
  total_duration_seconds: number | null
  completed_at: string
  created_at: string
}

export type Session = {
  id: string
  client_id: string
  coach_id: string
  session_date: string
  session_time: string | null
  notes: string | null
  private_notes: string | null
  attendance: 'attended' | 'missed' | null
  created_at: string
}

export type Checkin = {
  id: string
  client_id: string
  week_number: number
  year: number
  q1_answer: string | null
  q2_answer: string | null
  q3_answer: string | null
  energy_score: number | null
  submitted_at: string
}

export type MetabolicConfig = {
  client_id: string
  calorie_goal: number
  weigh_in_day: number
  starting_weight: number | null
  updated_at: string
}

export type WeightEntry = {
  id: string
  client_id: string
  date: string
  weight_kg: number
  created_at: string
}

export type CalorieEntry = {
  id: string
  client_id: string
  date: string
  calories: number
  created_at: string
}

export type BodyMeasurement = {
  id: string
  client_id: string
  date: string
  neck_cm: number | null
  shoulders_cm: number | null
  chest_cm: number | null
  l_bicep_cm: number | null
  r_bicep_cm: number | null
  l_forearm_cm: number | null
  r_forearm_cm: number | null
  waist_cm: number | null
  hips_cm: number | null
  l_thigh_cm: number | null
  r_thigh_cm: number | null
  created_at: string
}

export type Testimonial = {
  id: string
  coach_id: string
  coach_name: string
  coaching_type: string | null
  content: string
  rating: number
  is_approved: boolean
  is_featured: boolean
  created_at: string
}

export type BilanSnapshot = {
  period_label: string
  period_weeks: number
  checkin_count: number
  checkin_rate_pct: number | null
  objectives_done: number
  objectives_total: number
  weight_start_kg: number | null
  weight_end_kg: number | null
  weight_delta_kg: number | null
  measurements_delta: Record<string, number | null> | null
  roi_weeks: number | null
  roi_monthly_price: number | null
  roi_total: number | null
  main_goal: string | null
  coach_note: string | null
}

export type Bilan = {
  id: string
  coach_id: string
  client_id: string
  content_snapshot: BilanSnapshot
  generated_at: string
  sent_at: string | null
  is_auto: boolean
  created_at: string
}

export type WorkoutDifficultyRating = {
  id: string
  client_id: string
  date: string
  score: number
  comment: string | null
  created_at: string
}

export type DailyCompletion = {
  id: string
  client_id: string
  objective_id: string
  completed_date: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          role?: 'coach' | 'client'
          plan?: 'trial' | 'starter' | 'standard'
          plan_status?: 'active' | 'cancelled' | 'past_due'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          client_limit?: number
          coaching_type?: string | null
          created_at?: string
        }
        Update: {
          full_name?: string | null
          email?: string | null
          role?: 'coach' | 'client'
          plan?: 'trial' | 'starter' | 'standard'
          plan_status?: 'active' | 'cancelled' | 'past_due'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          client_limit?: number
          coaching_type?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: Client
        Insert: {
          id?: string
          coach_id: string
          full_name: string
          email: string
          magic_token?: string
          token_expires_at?: string
          status?: 'active' | 'inactive'
          last_checkin_at?: string | null
          created_at?: string
        }
        Update: {
          full_name?: string
          email?: string
          status?: 'active' | 'inactive'
          last_checkin_at?: string | null
        }
        Relationships: []
      }
      objectives: {
        Row: Objective
        Insert: {
          id?: string
          client_id: string
          coach_id: string
          title: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          target_date?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          target_date?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: Session
        Insert: {
          id?: string
          client_id: string
          coach_id: string
          session_date: string
          notes?: string | null
          private_notes?: string | null
          created_at?: string
        }
        Update: {
          session_date?: string
          notes?: string | null
          private_notes?: string | null
        }
        Relationships: []
      }
      checkins: {
        Row: Checkin
        Insert: {
          id?: string
          client_id: string
          week_number: number
          year: number
          q1_answer?: string | null
          q2_answer?: string | null
          q3_answer?: string | null
          energy_score?: number | null
          submitted_at?: string
        }
        Update: {
          q1_answer?: string | null
          q2_answer?: string | null
          q3_answer?: string | null
          energy_score?: number | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
