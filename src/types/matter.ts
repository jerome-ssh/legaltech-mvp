export interface MatterBilling {
  id: string;
  matter_id: string;
  billing_method: string;
  payment_pattern?: {
    id: string;
    value: string;
    label: string;
  } | null;
  currency?: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  } | null;
  currency_id?: string | null;
  payment_medium_id: string | null;
  payment_medium?: {
    id: string;
    value: string;
    label: string;
    icon: string;
  } | null;
  rate_value: number;
  terms_details: {
    standard: string;
    custom?: string;
  };
  billing_frequency: string | null;
  features: {
    automated_time_capture: boolean;
    blockchain_invoicing: boolean;
    send_invoice_on_approval: boolean;
  };
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';
export type TaskStage = 'Intake' | 'Planning' | 'Active Work' | 'Closure';

export interface MatterTask {
  id: string;
  matter_id: string;
  label: string;
  stage: TaskStage;
  weight: number;
  status: TaskStatus;
  due_date?: string;
  assigned_to?: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface MatterTaskHistory {
  id: string;
  task_id: string;
  status: TaskStatus;
  changed_by: string;
  changed_at: string;
  notes?: string;
}

export interface MatterProgress {
  overall: number;
  by_stage: Record<string, number>;
  completed_tasks: number;
  total_tasks: number;
  completed_weight: number;
  total_weight: number;
  activity_trend?: Array<{ week: string; completed: number; total: number; aiHealth: number }>;
  aiHealth?: number;
  matterHealth?: number;
  predictedBilling?: number;
  riskLevel?: string;
  clientSatisfaction?: number;
}

export interface Matter {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string;
  client_name?: string;
  client_avatar_url?: string;
  assigned_to_name?: string;
  tags?: string[];
  progress: MatterProgress;
  deadline?: string;
  jurisdiction?: string;
  matter_type?: string;
  matter_sub_type?: string;
  estimated_value?: number;
}

export interface Task {
  id: string;
  matter_id: string;
  label: string;
  stage: string;
  weight: number;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
} 