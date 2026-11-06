import { getDB } from '../offline/db';
import { supabase, isSupabaseConfigured } from './client';
import { addToSyncQueue } from '../offline/sync';
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

// -------------------------------------------------------------
// 1. VEHICLES
// -------------------------------------------------------------

export async function fetchUserVehicles(userId: string): Promise<Vehicle[]> {
  const db = await getDB();
  const localVehicles = await db.getAllFromIndex('vehicles', 'by-user', userId);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        // Cache to local DB
        for (const v of data) {
          await db.put('vehicles', v);
        }
        return data as Vehicle[];
      }
    } catch {
      // Return cached
    }
  }

  return localVehicles;
}

export async function createVehicleRecord(vehicle: Vehicle): Promise<Vehicle> {
  const db = await getDB();
  await db.put('vehicles', vehicle);

  // Also create initial odometer entry
  const initialOdo: OdometerEntry = {
    id: `odo_init_${vehicle.id}`,
    user_id: vehicle.user_id,
    vehicle_id: vehicle.id,
    reading: vehicle.initial_odometer,
    recorded_at: vehicle.created_at,
    source: 'initial',
    source_record_id: vehicle.id,
    notes: 'Initial vehicle setup odometer',
    created_at: vehicle.created_at,
    updated_at: vehicle.created_at,
  };
  await db.put('odometer_entries', initialOdo);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      const { error: vError } = await supabase.from('vehicles').insert(vehicle);
      if (vError) throw vError;
      await supabase.from('odometer_entries').insert(initialOdo);
    } catch {
      await addToSyncQueue({ table: 'vehicles', operation: 'INSERT', record: vehicle });
      await addToSyncQueue({ table: 'odometer_entries', operation: 'INSERT', record: initialOdo });
    }
  } else {
    await addToSyncQueue({ table: 'vehicles', operation: 'INSERT', record: vehicle });
    await addToSyncQueue({ table: 'odometer_entries', operation: 'INSERT', record: initialOdo });
  }

  return vehicle;
}

export async function updateVehicleRecord(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('vehicles', vehicleId);
  if (!existing) return;

  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
  await db.put('vehicles', updated);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('vehicles').update(updates).eq('id', vehicleId);
    } catch {
      await addToSyncQueue({ table: 'vehicles', operation: 'UPDATE', record: updated });
    }
  } else {
    await addToSyncQueue({ table: 'vehicles', operation: 'UPDATE', record: updated });
  }
}

// -------------------------------------------------------------
// 2. ODOMETER
// -------------------------------------------------------------

export async function fetchOdometerEntries(vehicleId: string): Promise<OdometerEntry[]> {
  const db = await getDB();
  const local = await db.getAllFromIndex('odometer_entries', 'by-vehicle', vehicleId);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('odometer_entries')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('reading', { ascending: false });

      if (!error && data) {
        for (const item of data) {
          await db.put('odometer_entries', item);
        }
        return data as OdometerEntry[];
      }
    } catch {}
  }

  return local.sort((a, b) => b.reading - a.reading);
}

export async function getLatestOdometerReading(vehicleId: string, initialDefault = 0): Promise<number> {
  const entries = await fetchOdometerEntries(vehicleId);
  if (entries.length > 0) {
    return Math.max(...entries.map((e) => e.reading));
  }
  return initialDefault;
}

export async function recordOdometerReading(entry: OdometerEntry): Promise<void> {
  const db = await getDB();
  await db.put('odometer_entries', entry);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('odometer_entries').insert(entry);
    } catch {
      await addToSyncQueue({ table: 'odometer_entries', operation: 'INSERT', record: entry });
    }
  } else {
    await addToSyncQueue({ table: 'odometer_entries', operation: 'INSERT', record: entry });
  }
}

// -------------------------------------------------------------
// 3. TRIPS (RAPIDO & PERSONAL)
// -------------------------------------------------------------

export async function fetchTrips(vehicleId: string): Promise<Trip[]> {
  const db = await getDB();
  const local = await db.getAllFromIndex('trips', 'by-vehicle', vehicleId);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('start_time', { ascending: false });

      if (!error && data) {
        for (const t of data) {
          await db.put('trips', t);
        }
        return data as Trip[];
      }
    } catch {}
  }

  return local.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
}

export async function fetchActiveTrip(vehicleId: string): Promise<Trip | null> {
  const trips = await fetchTrips(vehicleId);
  return trips.find((t) => t.status === 'active') ?? null;
}

export async function createTripRecord(trip: Trip): Promise<Trip> {
  const db = await getDB();
  await db.put('trips', trip);

  // Record starting odometer entry
  const odoEntry: OdometerEntry = {
    id: `odo_trip_start_${trip.id}`,
    user_id: trip.user_id,
    vehicle_id: trip.vehicle_id,
    reading: trip.start_odometer,
    recorded_at: trip.start_time,
    source: trip.trip_type === 'rapido' ? 'rapido_trip_start' : 'personal_trip_start',
    source_record_id: trip.id,
    notes: `${trip.trip_type === 'rapido' ? 'Rapido session' : 'Personal trip'} start`,
    created_at: trip.created_at,
    updated_at: trip.created_at,
  };
  await recordOdometerReading(odoEntry);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('trips').insert(trip);
    } catch {
      await addToSyncQueue({ table: 'trips', operation: 'INSERT', record: trip });
    }
  } else {
    await addToSyncQueue({ table: 'trips', operation: 'INSERT', record: trip });
  }

  return trip;
}

export async function updateTripRecord(tripId: string, updates: Partial<Trip>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('trips', tripId);
  if (!existing) return;

  const updated: Trip = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // If ending odometer is provided, also record odometer entry
  if (updates.end_odometer !== undefined && updates.end_odometer !== null) {
    const odoEntry: OdometerEntry = {
      id: `odo_trip_end_${tripId}`,
      user_id: existing.user_id,
      vehicle_id: existing.vehicle_id,
      reading: updates.end_odometer,
      recorded_at: updates.end_time || new Date().toISOString(),
      source: existing.trip_type === 'rapido' ? 'rapido_trip_end' : 'personal_trip_end',
      source_record_id: tripId,
      notes: `${existing.trip_type === 'rapido' ? 'Rapido session' : 'Personal trip'} end`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await recordOdometerReading(odoEntry);
  }

  await db.put('trips', updated);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('trips').update(updates).eq('id', tripId);
    } catch {
      await addToSyncQueue({ table: 'trips', operation: 'UPDATE', record: updated });
    }
  } else {
    await addToSyncQueue({ table: 'trips', operation: 'UPDATE', record: updated });
  }
}

export async function deleteTripRecord(tripId: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('trips', tripId);
  await db.delete('trips', tripId);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('trips').delete().eq('id', tripId);
    } catch {
      if (existing) {
        await addToSyncQueue({ table: 'trips', operation: 'DELETE', record: existing });
      }
    }
  }
}

// -------------------------------------------------------------
// 4. FUEL ENTRIES & MILEAGE CYCLES
// -------------------------------------------------------------

export async function fetchFuelEntries(vehicleId: string): Promise<FuelEntry[]> {
  const db = await getDB();
  const local = await db.getAllFromIndex('fuel_entries', 'by-vehicle', vehicleId);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('fuel_entries')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('recorded_at', { ascending: false });

      if (!error && data) {
        for (const item of data) {
          await db.put('fuel_entries', item);
        }
        return data as FuelEntry[];
      }
    } catch {}
  }

  return local.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
}

export async function createFuelEntryRecord(entry: FuelEntry): Promise<FuelEntry> {
  const db = await getDB();
  await db.put('fuel_entries', entry);

  // Record odometer entry
  const odoEntry: OdometerEntry = {
    id: `odo_fuel_${entry.id}`,
    user_id: entry.user_id,
    vehicle_id: entry.vehicle_id,
    reading: entry.odometer,
    recorded_at: entry.recorded_at,
    source: 'fuel',
    source_record_id: entry.id,
    notes: `Fuel refill: ${entry.quantity_litres}L (${entry.fill_type})`,
    created_at: entry.created_at,
    updated_at: entry.created_at,
  };
  await recordOdometerReading(odoEntry);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('fuel_entries').insert(entry);
    } catch {
      await addToSyncQueue({ table: 'fuel_entries', operation: 'INSERT', record: entry });
    }
  } else {
    await addToSyncQueue({ table: 'fuel_entries', operation: 'INSERT', record: entry });
  }

  // Recalculate and persist mileage cycles
  const allFuel = await fetchFuelEntries(entry.vehicle_id);
  const calculation = calculateMileageCycles(allFuel, entry.user_id, entry.vehicle_id);
  for (const cycle of calculation.cycles) {
    await db.put('mileage_cycles', cycle);
  }

  return entry;
}

export async function deleteFuelEntryRecord(id: string, vehicleId: string, userId: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('fuel_entries', id);
  await db.delete('fuel_entries', id);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('fuel_entries').delete().eq('id', id);
    } catch {
      if (existing) {
        await addToSyncQueue({ table: 'fuel_entries', operation: 'DELETE', record: existing });
      }
    }
  }

  // Recalculate mileage cycles after deletion
  const remainingFuel = await fetchFuelEntries(vehicleId);
  const calculation = calculateMileageCycles(remainingFuel, userId, vehicleId);
  // Clear old cycles and store recomputed
  const oldCycles = await db.getAllFromIndex('mileage_cycles', 'by-vehicle', vehicleId);
  for (const c of oldCycles) {
    await db.delete('mileage_cycles', c.id);
  }
  for (const c of calculation.cycles) {
    await db.put('mileage_cycles', c);
  }
}

// -------------------------------------------------------------
// 5. SERVICE RECORDS
// -------------------------------------------------------------

export async function fetchServiceRecords(vehicleId: string): Promise<ServiceRecord[]> {
  const db = await getDB();
  const local = await db.getAllFromIndex('service_records', 'by-vehicle', vehicleId);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('service_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('service_date', { ascending: false });

      if (!error && data) {
        for (const item of data) {
          await db.put('service_records', item);
        }
        return data as ServiceRecord[];
      }
    } catch {}
  }

  return local.sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());
}

export async function createServiceRecord(record: ServiceRecord): Promise<ServiceRecord> {
  const db = await getDB();
  await db.put('service_records', record);

  // Record odometer entry
  const odoEntry: OdometerEntry = {
    id: `odo_srv_${record.id}`,
    user_id: record.user_id,
    vehicle_id: record.vehicle_id,
    reading: record.odometer,
    recorded_at: `${record.service_date}T12:00:00Z`,
    source: 'service',
    source_record_id: record.id,
    notes: `Service: ${record.category}`,
    created_at: record.created_at,
    updated_at: record.created_at,
  };
  await recordOdometerReading(odoEntry);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('service_records').insert(record);
    } catch {
      await addToSyncQueue({ table: 'service_records', operation: 'INSERT', record: record });
    }
  } else {
    await addToSyncQueue({ table: 'service_records', operation: 'INSERT', record: record });
  }

  return record;
}

export async function deleteServiceRecord(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('service_records', id);
  await db.delete('service_records', id);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('service_records').delete().eq('id', id);
    } catch {
      if (existing) {
        await addToSyncQueue({ table: 'service_records', operation: 'DELETE', record: existing });
      }
    }
  }
}

// -------------------------------------------------------------
// 6. EXPENSES
// -------------------------------------------------------------

export async function fetchExpenses(vehicleId: string): Promise<Expense[]> {
  const db = await getDB();
  const local = await db.getAllFromIndex('expenses', 'by-vehicle', vehicleId);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('expense_date', { ascending: false });

      if (!error && data) {
        for (const item of data) {
          await db.put('expenses', item);
        }
        return data as Expense[];
      }
    } catch {}
  }

  return local.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
}

export async function createExpenseRecord(expense: Expense): Promise<Expense> {
  const db = await getDB();
  await db.put('expenses', expense);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('expenses').insert(expense);
    } catch {
      await addToSyncQueue({ table: 'expenses', operation: 'INSERT', record: expense });
    }
  } else {
    await addToSyncQueue({ table: 'expenses', operation: 'INSERT', record: expense });
  }

  return expense;
}

export async function deleteExpenseRecord(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('expenses', id);
  await db.delete('expenses', id);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('expenses').delete().eq('id', id);
    } catch {
      if (existing) {
        await addToSyncQueue({ table: 'expenses', operation: 'DELETE', record: existing });
      }
    }
  }
}

// -------------------------------------------------------------
// 7. REMINDERS
// -------------------------------------------------------------

export async function fetchReminders(vehicleId: string): Promise<Reminder[]> {
  const db = await getDB();
  const local = await db.getAllFromIndex('reminders', 'by-vehicle', vehicleId);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        for (const item of data) {
          await db.put('reminders', item);
        }
        return data as Reminder[];
      }
    } catch {}
  }

  return local;
}

export async function createReminderRecord(reminder: Reminder): Promise<Reminder> {
  const db = await getDB();
  await db.put('reminders', reminder);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('reminders').insert(reminder);
    } catch {
      await addToSyncQueue({ table: 'reminders', operation: 'INSERT', record: reminder });
    }
  } else {
    await addToSyncQueue({ table: 'reminders', operation: 'INSERT', record: reminder });
  }

  return reminder;
}

export async function toggleReminderRecord(id: string, isCompleted: boolean): Promise<void> {
  const db = await getDB();
  const existing = await db.get('reminders', id);
  if (!existing) return;

  const updated: Reminder = {
    ...existing,
    is_completed: isCompleted,
    updated_at: new Date().toISOString(),
  };
  await db.put('reminders', updated);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('reminders').update({ is_completed: isCompleted }).eq('id', id);
    } catch {
      await addToSyncQueue({ table: 'reminders', operation: 'UPDATE', record: updated });
    }
  } else {
    await addToSyncQueue({ table: 'reminders', operation: 'UPDATE', record: updated });
  }
}

export async function deleteReminderRecord(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('reminders', id);
  await db.delete('reminders', id);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('reminders').delete().eq('id', id);
    } catch {
      if (existing) {
        await addToSyncQueue({ table: 'reminders', operation: 'DELETE', record: existing });
      }
    }
  }
}

// -------------------------------------------------------------
// 8. USER SETTINGS
// -------------------------------------------------------------

export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  const db = await getDB();
  const local = await db.get('user_settings', userId);

  if (local) return local;

  const defaultSettings: UserSettings = {
    user_id: userId,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    theme: 'system',
    maintenance_allocation_enabled: true,
    maintenance_rate_per_km: 0.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.put('user_settings', defaultSettings);
  return defaultSettings;
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put('user_settings', settings);

  if (isSupabaseConfigured && supabase && navigator.onLine) {
    try {
      await supabase.from('user_settings').upsert(settings);
    } catch {
      await addToSyncQueue({ table: 'user_settings', operation: 'UPDATE', record: settings });
    }
  } else {
    await addToSyncQueue({ table: 'user_settings', operation: 'UPDATE', record: settings });
  }
}

