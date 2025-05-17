export interface UserMetrics {
  id: string;
  profile_id: string;
  profile_completion: number;
  productivity_score: number;
  client_feedback: number;
  time_saved: number;
  ai_interactions: number;
  networking_score: number;
  compliance_score: number;
  billing_efficiency: number;
  workflow_efficiency: number;
  learning_progress: number;
  created_at: string;
  updated_at: string;
}

export interface UserMetricsInput {
  profile_id: string;
  profile_completion?: number;
  productivity_score?: number;
  client_feedback?: number;
  time_saved?: number;
  ai_interactions?: number;
  networking_score?: number;
  compliance_score?: number;
  billing_efficiency?: number;
  workflow_efficiency?: number;
  learning_progress?: number;
} 