export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SourceType =
  | 'initial'
  | 'rapido_trip_start'
  | 'rapido_trip_end'
  | 'personal_trip_start'
  | 'personal_trip_end'
  | 'fuel'
  | 'service'
  | 'manual';

export type TripType = 'rapido' | 'personal';
export type TripStatus = 'active' | 'completed' | 'cancelled';
export type FillType = 'full' | 'partial';
export type CycleStatus = 'completed' | 'invalid';

export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  currency: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  maintenance_allocation_enabled: boolean;
  maintenance_rate_per_km: number; // e.g. ₹0.50 / km
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  name: string;
  manufacturer: string;
  model: string;
  registration_number: string | null;
  purchase_date: string | null;
  initial_odometer: number;
  fuel_type: string;
  created_at: string;
  updated_at: string;
}

export interface OdometerEntry {
  id: string;
  user_id: string;
  vehicle_id: string;
  reading: number;
  recorded_at: string;
  source: SourceType;
  source_record_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  vehicle_id: string;
  trip_type: TripType;
  status: TripStatus;
  start_odometer: number;
  end_odometer: number | null;
  start_time: string;
  end_time: string | null;
  fare_earnings: number;
  tips: number;
  earnings: number; // fare_earnings + tips
  ride_count: number | null;
  purpose: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FuelEntry {
  id: string;
  user_id: string;
  vehicle_id: string;
  odometer_entry_id: string | null;
  recorded_at: string;
  odometer: number;
  price_per_litre: number;
  quantity_litres: number;
  total_amount: number;
  fill_type: FillType;
  station_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MileageCycle {
  id: string;
  user_id: string;
  vehicle_id: string;
  start_fuel_entry_id: string;
  end_fuel_entry_id: string;
  start_odometer: number;
  end_odometer: number;
  distance_km: number;
  fuel_consumed_litres: number;
  mileage_kmpl: number;
  status: CycleStatus;
  created_at: string;
  updated_at: string;
}

export interface ServiceRecord {
  id: string;
  user_id: string;
  vehicle_id: string;
  service_date: string;
  odometer: number;
  category: ServiceCategory;
  description: string | null;
  workshop_name: string | null;
  amount: number;
  next_service_odometer: number | null;
  receipt_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ServiceCategory =
  | 'Engine oil'
  | 'Air filter'
  | 'Brakes'
  | 'Tyres'
  | 'Battery'
  | 'General servicing'
  | 'Electrical'
  | 'Other repairs';

export interface Expense {
  id: string;
  user_id: string;
  vehicle_id: string;
  expense_date: string;
  category: string;
  amount: number;
  odometer: number | null;
  description: string | null;
  receipt_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  vehicle_id: string;
  reminder_type: 'service' | 'insurance' | 'puc' | 'registration' | 'other';
  title: string;
  target_odometer: number | null;
  target_date: string | null;
  threshold_km: number | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyncQueueItem {
  id: string; // queue item id
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record: any;
  created_at: string;
  retry_count: number;
  error?: string;
}

