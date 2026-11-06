-- ==============================================================================
-- RideLedger: Single User Personal App Migration
-- Disables RLS and removes auth.users foreign key constraints so that
-- Mobile and Desktop can read and write directly to Supabase without any login.
-- ==============================================================================

-- 1. Remove foreign key constraints to auth.users
ALTER TABLE public.vehicles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_user_id_fkey;

ALTER TABLE public.user_settings ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

ALTER TABLE public.odometer_entries ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.odometer_entries DROP CONSTRAINT IF EXISTS odometer_entries_user_id_fkey;

ALTER TABLE public.trips ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_user_id_fkey;

ALTER TABLE public.fuel_entries ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.fuel_entries DROP CONSTRAINT IF EXISTS fuel_entries_user_id_fkey;

ALTER TABLE public.mileage_cycles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.mileage_cycles DROP CONSTRAINT IF EXISTS mileage_cycles_user_id_fkey;

ALTER TABLE public.service_records ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.service_records DROP CONSTRAINT IF EXISTS service_records_user_id_fkey;

ALTER TABLE public.expenses ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;

ALTER TABLE public.reminders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_user_id_fkey;

-- 2. Disable Row Level Security so any device can read and write directly without login
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.odometer_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mileage_cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;

-- 3. Also grant full permissions to anon & authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
