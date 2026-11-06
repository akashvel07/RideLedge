import { supabase, isSupabaseConfigured } from './client';
import {
  Vehicle,
  Trip,
  FuelEntry,
  ServiceRecord,
  Expense,
  Reminder,
  UserSettings,
  OdometerEntry,
} from '@/types/database';
import { calculateMileageCycles } from '../calculations/mileage';
import { generateUUID } from '../utils/uuid';

// Single owner ID for personal vehicle tracker
export const SINGLE_USER_ID = '4301fe1d-88cc-4782-8aa9-2a334637dd7e';

// -------------------------------------------------------------
// 1. VEHICLES
// -------------------------------------------------------------

export async function fetchUserVehicles(_userId?: string): Promise<Vehicle[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching vehicles from Supabase:', error);
        return [];
      }
      return (data || []) as Vehicle[];
    } catch (err) {
      console.error('Network error fetching vehicles:', err);
      return [];
    }
  }
  return [];
}

export async function createVehicleRecord(vehicle: Vehicle): Promise<Vehicle> {
  const newVehicle: Vehicle = {
    ...vehicle,
    id: vehicle.id || generateUUID(),
    user_id: SINGLE_USER_ID,
  };

  if (isSupabaseConfigured && supabase) {
    const { error: vError } = await supabase.from('vehicles').insert(newVehicle);
    if (vError) {
      console.error('Error creating vehicle in Supabase:', vError);
      throw new Error(vError.message);
    }

    // Also insert initial odometer entry into Supabase
    const initialOdo: OdometerEntry = {
      id: generateUUID(),
      user_id: SINGLE_USER_ID,
      vehicle_id: newVehicle.id,
      reading: newVehicle.initial_odometer,
      recorded_at: newVehicle.created_at,
      source: 'initial',
      source_record_id: newVehicle.id,
      notes: 'Initial vehicle setup odometer',
      created_at: newVehicle.created_at,
      updated_at: newVehicle.created_at,
    };
    const { error: oError } = await supabase.from('odometer_entries').insert(initialOdo);
    if (oError) {
      console.error('Error inserting initial odometer:', oError);
    }
  }

  return newVehicle;
}

export async function updateVehicleRecord(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('vehicles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', vehicleId);

    if (error) {
      console.error('Error updating vehicle in Supabase:', error);
      throw new Error(error.message);
    }
  }
}

// -------------------------------------------------------------
// 2. ODOMETER
// -------------------------------------------------------------

export async function fetchOdometerEntries(vehicleId: string): Promise<OdometerEntry[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('odometer_entries')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('reading', { ascending: false });

      if (!error && data) {
        return data as OdometerEntry[];
      }
    } catch (err) {
      console.error('Error fetching odometer entries:', err);
    }
  }
  return [];
}

export async function recordOdometerReading(entry: OdometerEntry): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const newEntry = {
      ...entry,
      id: entry.id || generateUUID(),
      user_id: SINGLE_USER_ID,
    };
    const { error } = await supabase.from('odometer_entries').insert(newEntry);
    if (error) {
      console.error('Error inserting odometer reading in Supabase:', error);
    }
  }
}

// -------------------------------------------------------------
// 3. TRIPS (RAPIDO & PERSONAL)
// -------------------------------------------------------------

export async function fetchTrips(vehicleId: string): Promise<Trip[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('start_time', { ascending: false });

      if (!error && data) {
        return data as Trip[];
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
    }
  }
  return [];
}

export async function createTripRecord(trip: Trip): Promise<Trip> {
  const newTrip: Trip = {
    ...trip,
    id: trip.id || generateUUID(),
    user_id: SINGLE_USER_ID,
  };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('trips').insert(newTrip);
    if (error) {
      console.error('Error creating trip in Supabase:', error);
      throw new Error(error.message);
    }

    // Record starting odometer entry
    const odoEntry: OdometerEntry = {
      id: generateUUID(),
      user_id: SINGLE_USER_ID,
      vehicle_id: trip.vehicle_id,
      reading: trip.start_odometer,
      recorded_at: trip.start_time,
      source: trip.trip_type === 'rapido' ? 'rapido_trip_start' : 'personal_trip_start',
      source_record_id: newTrip.id,
      notes: `${trip.trip_type === 'rapido' ? 'Rapido session' : 'Personal trip'} start`,
      created_at: trip.created_at,
      updated_at: trip.created_at,
    };
    await recordOdometerReading(odoEntry);
  }

  return newTrip;
}

export async function updateTripRecord(tripId: string, updates: Partial<Trip>): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('trips')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', tripId);

    if (error) {
      console.error('Error updating trip in Supabase:', error);
      throw new Error(error.message);
    }

    if (updates.end_odometer !== undefined && updates.end_odometer !== null) {
      const { data: tripData } = await supabase.from('trips').select('*').eq('id', tripId).single();
      if (tripData) {
        const odoEntry: OdometerEntry = {
          id: generateUUID(),
          user_id: SINGLE_USER_ID,
          vehicle_id: tripData.vehicle_id,
          reading: updates.end_odometer,
          recorded_at: updates.end_time || new Date().toISOString(),
          source: tripData.trip_type === 'rapido' ? 'rapido_trip_end' : 'personal_trip_end',
          source_record_id: tripId,
          notes: `${tripData.trip_type === 'rapido' ? 'Rapido session' : 'Personal trip'} end`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await recordOdometerReading(odoEntry);
      }
    }
  }
}

export async function deleteTripRecord(tripId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('trips').delete().eq('id', tripId);
    if (error) {
      console.error('Error deleting trip in Supabase:', error);
    }
  }
}

// -------------------------------------------------------------
// 4. FUEL ENTRIES & MILEAGE CYCLES
// -------------------------------------------------------------

export async function fetchFuelEntries(vehicleId: string): Promise<FuelEntry[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fuel_entries')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('recorded_at', { ascending: false });

      if (!error && data) {
        return data as FuelEntry[];
      }
    } catch (err) {
      console.error('Error fetching fuel entries:', err);
    }
  }
  return [];
}

export async function createFuelEntryRecord(entry: FuelEntry): Promise<FuelEntry> {
  const newEntry: FuelEntry = {
    ...entry,
    id: entry.id || generateUUID(),
    user_id: SINGLE_USER_ID,
  };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('fuel_entries').insert(newEntry);
    if (error) {
      console.error('Error creating fuel entry in Supabase:', error);
      throw new Error(error.message);
    }

    // Record odometer entry
    const odoEntry: OdometerEntry = {
      id: generateUUID(),
      user_id: SINGLE_USER_ID,
      vehicle_id: entry.vehicle_id,
      reading: entry.odometer,
      recorded_at: entry.recorded_at,
      source: 'fuel',
      source_record_id: newEntry.id,
      notes: `Fuel refill: ${entry.quantity_litres}L (${entry.fill_type})`,
      created_at: entry.created_at,
      updated_at: entry.created_at,
    };
    await recordOdometerReading(odoEntry);

    // Recompute mileage cycles
    const allFuel = await fetchFuelEntries(entry.vehicle_id);
    const calculation = calculateMileageCycles(allFuel, SINGLE_USER_ID, entry.vehicle_id);
    for (const cycle of calculation.cycles) {
      await supabase.from('mileage_cycles').upsert(cycle);
    }
  }

  return newEntry;
}

export async function deleteFuelEntryRecord(id: string, vehicleId: string, _userId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('fuel_entries').delete().eq('id', id);
    if (error) console.error('Error deleting fuel entry:', error);

    const remainingFuel = await fetchFuelEntries(vehicleId);
    const calculation = calculateMileageCycles(remainingFuel, SINGLE_USER_ID, vehicleId);
    await supabase.from('mileage_cycles').delete().eq('vehicle_id', vehicleId);
    for (const c of calculation.cycles) {
      await supabase.from('mileage_cycles').insert(c);
    }
  }
}

// -------------------------------------------------------------
// 5. SERVICE RECORDS
// -------------------------------------------------------------

export async function fetchServiceRecords(vehicleId: string): Promise<ServiceRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('service_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('service_date', { ascending: false });

      if (!error && data) {
        return data as ServiceRecord[];
      }
    } catch (err) {
      console.error('Error fetching service records:', err);
    }
  }
  return [];
}

export async function createServiceRecord(record: ServiceRecord): Promise<ServiceRecord> {
  const newRecord: ServiceRecord = {
    ...record,
    id: record.id || generateUUID(),
    user_id: SINGLE_USER_ID,
  };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('service_records').insert(newRecord);
    if (error) {
      console.error('Error creating service record:', error);
      throw new Error(error.message);
    }

    const odoEntry: OdometerEntry = {
      id: generateUUID(),
      user_id: SINGLE_USER_ID,
      vehicle_id: record.vehicle_id,
      reading: record.odometer,
      recorded_at: `${record.service_date}T12:00:00Z`,
      source: 'service',
      source_record_id: newRecord.id,
      notes: `Service: ${record.category}`,
      created_at: record.created_at,
      updated_at: record.created_at,
    };
    await recordOdometerReading(odoEntry);
  }

  return newRecord;
}

export async function deleteServiceRecord(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('service_records').delete().eq('id', id);
    if (error) console.error('Error deleting service record:', error);
  }
}

// -------------------------------------------------------------
// 6. EXPENSES
// -------------------------------------------------------------

export async function fetchExpenses(vehicleId: string): Promise<Expense[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('expense_date', { ascending: false });

      if (!error && data) {
        return data as Expense[];
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  }
  return [];
}

export async function createExpenseRecord(expense: Expense): Promise<Expense> {
  const newExpense: Expense = {
    ...expense,
    id: expense.id || generateUUID(),
    user_id: SINGLE_USER_ID,
  };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('expenses').insert(newExpense);
    if (error) {
      console.error('Error inserting expense:', error);
      throw new Error(error.message);
    }
  }

  return newExpense;
}

export async function deleteExpenseRecord(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) console.error('Error deleting expense:', error);
  }
}

// -------------------------------------------------------------
// 7. REMINDERS
// -------------------------------------------------------------

export async function fetchReminders(vehicleId: string): Promise<Reminder[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Reminder[];
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
    }
  }
  return [];
}

export async function createReminderRecord(reminder: Reminder): Promise<Reminder> {
  const newReminder: Reminder = {
    ...reminder,
    id: reminder.id || generateUUID(),
    user_id: SINGLE_USER_ID,
  };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('reminders').insert(newReminder);
    if (error) {
      console.error('Error inserting reminder:', error);
      throw new Error(error.message);
    }
  }

  return newReminder;
}

export async function toggleReminderRecord(id: string, isCompleted: boolean): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('reminders')
      .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) console.error('Error toggling reminder:', error);
  }
}

export async function deleteReminderRecord(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) console.error('Error deleting reminder:', error);
  }
}

// -------------------------------------------------------------
// 8. USER SETTINGS
// -------------------------------------------------------------

export async function fetchUserSettings(_userId?: string): Promise<UserSettings> {
  const defaultSettings: UserSettings = {
    user_id: SINGLE_USER_ID,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    theme: 'system',
    maintenance_allocation_enabled: true,
    maintenance_rate_per_km: 0.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as UserSettings;
      }
    } catch (err) {
      console.error('Error fetching user settings:', err);
    }
  }

  return defaultSettings;
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('user_settings')
      .upsert({ ...settings, user_id: SINGLE_USER_ID });

    if (error) {
      console.error('Error saving user settings:', error);
    }
  }
}
