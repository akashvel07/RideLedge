-- ==============================================================================
-- RideLedger Schema & Security Migration
-- Tables: profiles, user_settings, vehicles, odometer_entries, trips,
--         fuel_entries, mileage_cycles, service_records, expenses, reminders
-- ==============================================================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'INR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  theme TEXT NOT NULL DEFAULT 'system',
  maintenance_allocation_enabled BOOLEAN NOT NULL DEFAULT true,
  maintenance_rate_per_km NUMERIC(6,2) NOT NULL DEFAULT 0.50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL DEFAULT 'TVS',
  model TEXT NOT NULL DEFAULT 'Jupiter 110',
  registration_number TEXT,
  purchase_date DATE,
  initial_odometer NUMERIC(10,1) NOT NULL DEFAULT 0.0,
  fuel_type TEXT NOT NULL DEFAULT 'petrol',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Odometer Entries
CREATE TABLE IF NOT EXISTS public.odometer_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  reading NUMERIC(10,1) NOT NULL CHECK (reading >= 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  source TEXT NOT NULL CHECK (source IN (
    'initial',
    'rapido_trip_start',
    'rapido_trip_end',
    'personal_trip_start',
    'personal_trip_end',
    'fuel',
    'service',
    'manual'
  )),
  source_record_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Trips
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('rapido', 'personal')),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
  start_odometer NUMERIC(10,1) NOT NULL CHECK (start_odometer >= 0),
  end_odometer NUMERIC(10,1) CHECK (end_odometer IS NULL OR end_odometer >= start_odometer),
  start_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  end_time TIMESTAMPTZ,
  fare_earnings NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (fare_earnings >= 0),
  tips NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (tips >= 0),
  earnings NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (earnings >= 0),
  ride_count INTEGER CHECK (ride_count IS NULL OR ride_count >= 0),
  purpose TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Partial unique index: Only one active trip per vehicle per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_trip_per_vehicle
  ON public.trips (user_id, vehicle_id)
  WHERE (status = 'active');

-- 6. Fuel Entries
CREATE TABLE IF NOT EXISTS public.fuel_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  odometer_entry_id UUID REFERENCES public.odometer_entries(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  odometer NUMERIC(10,1) NOT NULL CHECK (odometer >= 0),
  price_per_litre NUMERIC(10,3) NOT NULL CHECK (price_per_litre > 0),
  quantity_litres NUMERIC(10,3) NOT NULL CHECK (quantity_litres > 0),
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  fill_type TEXT NOT NULL CHECK (fill_type IN ('full', 'partial')),
  station_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Mileage Cycles
CREATE TABLE IF NOT EXISTS public.mileage_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  start_fuel_entry_id UUID NOT NULL REFERENCES public.fuel_entries(id) ON DELETE CASCADE,
  end_fuel_entry_id UUID NOT NULL REFERENCES public.fuel_entries(id) ON DELETE CASCADE,
  start_odometer NUMERIC(10,1) NOT NULL,
  end_odometer NUMERIC(10,1) NOT NULL,
  distance_km NUMERIC(10,2) NOT NULL CHECK (distance_km >= 0),
  fuel_consumed_litres NUMERIC(10,3) NOT NULL CHECK (fuel_consumed_litres > 0),
  mileage_kmpl NUMERIC(10,2) NOT NULL CHECK (mileage_kmpl > 0),
  status TEXT NOT NULL CHECK (status IN ('completed', 'invalid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_mileage_cycle_pair UNIQUE (start_fuel_entry_id, end_fuel_entry_id)
);

-- 8. Service Records
CREATE TABLE IF NOT EXISTS public.service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  odometer NUMERIC(10,1) NOT NULL CHECK (odometer >= 0),
  category TEXT NOT NULL,
  description TEXT,
  workshop_name TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  next_service_odometer NUMERIC(10,1) CHECK (next_service_odometer IS NULL OR next_service_odometer >= odometer),
  receipt_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  expense_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  odometer NUMERIC(10,1) CHECK (odometer IS NULL OR odometer >= 0),
  description TEXT,
  receipt_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  title TEXT NOT NULL,
  target_odometer NUMERIC(10,1) CHECK (target_odometer IS NULL OR target_odometer >= 0),
  target_date DATE,
  threshold_km INTEGER DEFAULT 200,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_odometer_vehicle_id ON public.odometer_entries(vehicle_id, reading DESC);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_time ON public.trips(vehicle_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_vehicle_time ON public.fuel_entries(vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_mileage_cycles_vehicle ON public.mileage_cycles(vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_records_vehicle ON public.service_records(vehicle_id, service_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_time ON public.expenses(vehicle_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle ON public.reminders(vehicle_id, is_completed);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odometer_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mileage_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Helper function to check vehicle ownership
CREATE OR REPLACE FUNCTION public.check_vehicle_owner(v_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.vehicles
    WHERE id = v_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can manage their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User Settings policies
CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vehicles policies
CREATE POLICY "Users can manage their own vehicles"
  ON public.vehicles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Odometer Entries policies
CREATE POLICY "Users can manage their own odometer entries"
  ON public.odometer_entries FOR ALL
  USING (auth.uid() = user_id AND check_vehicle_owner(vehicle_id))
  WITH CHECK (auth.uid() = user_id AND check_vehicle_owner(vehicle_id));

-- Trips policies
CREATE POLICY "Users can manage their own trips"
  ON public.trips FOR ALL
  USING (auth.uid() = user_id AND check_vehicle_owner(vehicle_id))
  WITH CHECK (auth.uid() = user_id AND check_vehicle_owner(vehicle_id));

-- Fuel Entries policies
CREATE POLICY "Users can manage their own fuel entries"
  ON public.fuel_entries FOR ALL
  USING (auth.uid() = user_id AND check_vehicle_owner(vehicle_id))
  WITH CHECK (auth.uid() = user_id AND check_vehicle_owner(vehicle_id));

-- Mileage Cycles policies
CREATE POLICY "Users can manage their own mileage cycles"
  ON public.mileage_cycles FOR ALL
  USING (auth.uid() = user_id AND check_vehicle_owner(vehicle_id))
  WITH CHECK (auth.uid() = user_id AND check_vehicle_owner(vehicle_id));

-- Service Records policies
CREATE POLICY "Users can manage their own service records"
  ON public.service_records FOR ALL
  USING (auth.uid() = user_id AND check_vehicle_owner(vehicle_id))
  WITH CHECK (auth.uid() = user_id AND check_vehicle_owner(vehicle_id));

-- Expenses policies
CREATE POLICY "Users can manage their own expenses"
  ON public.expenses FOR ALL
  USING (auth.uid() = user_id AND check_vehicle_owner(vehicle_id))
  WITH CHECK (auth.uid() = user_id AND check_vehicle_owner(vehicle_id));

-- Reminders policies
CREATE POLICY "Users can manage their own reminders"
  ON public.reminders FOR ALL
  USING (auth.uid() = user_id AND check_vehicle_owner(vehicle_id))
  WITH CHECK (auth.uid() = user_id AND check_vehicle_owner(vehicle_id));

-- Auto-create profile and settings on user sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
