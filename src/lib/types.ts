export interface Apiary {
  id: string;
  user_id: string;
  name: string;
  location: string;
  coordinates?: { x: number; y: number };
  created_at: string;
}

export interface Hive {
  id: string;
  apiary_id: string;
  name: string;
  established_date: string;
  queen_source?: string;
  queen_introduced?: string;
  hive_type: string;
  status: 'active' | 'inactive' | 'dead' | 'sold';
  created_at: string;
}

export interface Inspection {
  id: string;
  hive_id: string;
  inspection_date: string;
  health_status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  population_strength?: number;
  observations?: string;
  weather_conditions?: any;
  queen_seen: boolean;
  brood_pattern?: string;
  created_at: string;
}

export interface Harvest {
  id: string;
  hive_id: string;
  harvest_date: string;
  honey_amount: number;
  honey_type?: string;
  quality_notes?: string;
  created_at: string;
}

export interface Treatment {
  id: string;
  hive_id: string;
  application_date: string;
  treatment_type: string;
  dosage?: string;
  followup_date?: string;
  completed: boolean;
  created_at: string;
}
