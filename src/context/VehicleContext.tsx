import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
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
import {
  fetchUserVehicles,
  createVehicleRecord,
  updateVehicleRecord,
  fetchTrips,
  createTripRecord,
  updateTripRecord,
  deleteTripRecord,
  fetchFuelEntries,
  createFuelEntryRecord,
  deleteFuelEntryRecord,
  fetchServiceRecords,
  createServiceRecord,
  deleteServiceRecord,
  fetchExpenses,
  createExpenseRecord,
  deleteExpenseRecord,
  fetchReminders,
  createReminderRecord,
  toggleReminderRecord,
  deleteReminderRecord,
  fetchUserSettings,
  saveUserSettings,
  fetchOdometerEntries,
} from '@/lib/supabase/queries';
import { calculateMileageCycles, MileageCalculationResult, calculateFuelCostPerKm } from '@/lib/calculations/mileage';
import { aggregateTrips, AggregatedTripsSummary } from '@/lib/calculations/trips';
import { calculateFuelSummary, MonthlyFuelSummary } from '@/lib/calculations/fuel';
import { calculateServiceStatus, ServiceStatusResult } from '@/lib/calculations/service';
import { aggregateAllExpenses, CategoryExpense } from '@/lib/calculations/expenses';
import { calculateProfitability, ProfitabilityResult } from '@/lib/calculations/profitability';
import { generateUUID } from '@/lib/utils/uuid';
import { isSameDay, parseISO } from 'date-fns';

interface VehicleContextType {
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  setCurrentVehicle: (vehicle: Vehicle) => void;
  loading: boolean;
  needsOnboarding: boolean;
  settings: UserSettings | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;

  // Core calculated metrics
  currentOdometer: number;
  activeTrip: Trip | null;
  mileageResult: MileageCalculationResult;
  fuelSummary: MonthlyFuelSummary;
  tripsSummary: AggregatedTripsSummary;
  todayTripsSummary: AggregatedTripsSummary;
  serviceStatus: ServiceStatusResult;
  expensesSummary: { totalExpense: number; categories: CategoryExpense[] };
  profitability: ProfitabilityResult;
  fuelCostPerKm: number | null;

  // Raw lists
  trips: Trip[];
  fuelEntries: FuelEntry[];
  serviceRecords: ServiceRecord[];
  expenses: Expense[];
  reminders: Reminder[];
  odometerEntries: OdometerEntry[];

  // Action methods
  refreshAllData: () => Promise<void>;
  createVehicle: (data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => Promise<Vehicle>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  startRapidoTrip: (startOdo: number, notes?: string) => Promise<{ success: boolean; error?: string }>;
  endRapidoTrip: (
    tripId: string,
    endOdo: number,
    fareEarnings: number,
    tips: number,
    rideCount?: number,
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  addPersonalTrip: (
    startOdo: number,
    endOdo: number,
    purpose: string,
    notes?: string,
    date?: string
  ) => Promise<{ success: boolean; error?: string }>;
  addFuel: (
    odometer: number,
    pricePerLitre: number,
    quantityLitres: number,
    totalAmount: number,
    fillType: 'full' | 'partial',
    stationName?: string,
    notes?: string,
    dateTime?: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteFuel: (id: string) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addService: (data: Omit<ServiceRecord, 'id' | 'user_id' | 'vehicle_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addExpense: (data: Omit<Expense, 'id' | 'user_id' | 'vehicle_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addReminder: (data: Omit<Reminder, 'id' | 'user_id' | 'vehicle_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  toggleReminder: (id: string, completed: boolean) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [odometerEntries, setOdometerEntries] = useState<OdometerEntry[]>([]);

  // 1. Load Vehicles & Settings
  const loadVehicles = useCallback(async () => {
    if (!user) {
      setVehicles([]);
      setCurrentVehicle(null);
      setLoading(false);
      return;
    }

    try {
      const userSettings = await fetchUserSettings(user.id);
      setSettings(userSettings);

      const userVehicles = await fetchUserVehicles(user.id);
      setVehicles(userVehicles);

      if (userVehicles.length > 0) {
        // Select first vehicle by default
        setCurrentVehicle((prev) => prev || userVehicles[0]);
      } else {
        setCurrentVehicle(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 2. Load all records for current vehicle
  const refreshAllData = useCallback(async () => {
    if (!currentVehicle || !user) return;

    const [t, f, s, e, r, o] = await Promise.all([
      fetchTrips(currentVehicle.id),
      fetchFuelEntries(currentVehicle.id),
      fetchServiceRecords(currentVehicle.id),
      fetchExpenses(currentVehicle.id),
      fetchReminders(currentVehicle.id),
      fetchOdometerEntries(currentVehicle.id),
    ]);

    setTrips(t);
    setFuelEntries(f);
    setServiceRecords(s);
    setExpenses(e);
    setReminders(r);
    setOdometerEntries(o);
  }, [currentVehicle, user]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    if (currentVehicle) {
      refreshAllData();
    }
  }, [currentVehicle, refreshAllData]);

  // Calculate Current Odometer
  const currentOdometer = useMemo(() => {
    if (!currentVehicle) return 0;
    if (odometerEntries.length > 0) {
      return Math.max(currentVehicle.initial_odometer, ...odometerEntries.map((o) => o.reading));
    }
    return currentVehicle.initial_odometer;
  }, [currentVehicle, odometerEntries]);

  // Active Trip
  const activeTrip = useMemo(() => {
    return trips.find((t) => t.status === 'active') || null;
  }, [trips]);

  // Mileage Cycles and Measurement
  const mileageResult = useMemo(() => {
    if (!user || !currentVehicle) {
      return {
        cycles: [],
        latestCycle: null,
        overallAverageKmpl: null,
        bestKmpl: null,
        worstKmpl: null,
        measurementStatus: 'no_measurement_yet' as const,
        pendingCycle: null,
      };
    }
    return calculateMileageCycles(fuelEntries, user.id, currentVehicle.id);
  }, [fuelEntries, user, currentVehicle]);

  // Fuel Summary
  const fuelSummary = useMemo(() => {
    return calculateFuelSummary(fuelEntries);
  }, [fuelEntries]);

  // Trips Summary (All Time)
  const tripsSummary = useMemo(() => {
    return aggregateTrips(trips);
  }, [trips]);

  // Today's Trips Summary
  const todayTripsSummary = useMemo(() => {
    const today = new Date();
    const todayTrips = trips.filter((t) => {
      try {
        return isSameDay(parseISO(t.start_time), today);
      } catch {
        return false;
      }
    });
    return aggregateTrips(todayTrips);
  }, [trips]);

  // Service Status
  const serviceStatus = useMemo(() => {
    return calculateServiceStatus(currentOdometer, serviceRecords, reminders, 200);
  }, [currentOdometer, serviceRecords, reminders]);

  // Expenses Summary
  const expensesSummary = useMemo(() => {
    return aggregateAllExpenses(fuelEntries, serviceRecords, expenses);
  }, [fuelEntries, serviceRecords, expenses]);

  // Fuel Cost per Km
  const fuelCostPerKm = useMemo(() => {
    const latestPrice = fuelEntries.length > 0 ? fuelEntries[0].price_per_litre : fuelSummary.averagePricePerLitre;
    return calculateFuelCostPerKm(mileageResult.overallAverageKmpl, latestPrice);
  }, [mileageResult.overallAverageKmpl, fuelEntries, fuelSummary.averagePricePerLitre]);

  // Rapido Profitability (All time or general)
  const profitability = useMemo(() => {
    const latestPrice = fuelEntries.length > 0 ? fuelEntries[0].price_per_litre : fuelSummary.averagePricePerLitre;
    const workingHours = tripsSummary.rapido.totalDurationMinutes / 60;

    return calculateProfitability({
      rapidoDistanceKm: tripsSummary.rapido.totalDistanceKm,
      rapidoEarnings: tripsSummary.rapido.totalEarnings,
      rapidoFareEarnings: tripsSummary.rapido.totalFareEarnings,
      rapidoTips: tripsSummary.rapido.totalTips,
      rapidoWorkingHours: workingHours,
      measuredMileageKmpl: mileageResult.overallAverageKmpl,
      fuelPricePerLitre: latestPrice,
      maintenanceAllocationEnabled: settings?.maintenance_allocation_enabled ?? true,
      maintenanceRatePerKm: settings?.maintenance_rate_per_km ?? 0.5,
    });
  }, [tripsSummary, mileageResult.overallAverageKmpl, fuelEntries, fuelSummary.averagePricePerLitre, settings]);

  // -------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user || !settings) return;
    const updated = { ...settings, ...newSettings, updated_at: new Date().toISOString() };
    setSettings(updated);
    await saveUserSettings(updated);
  };

  const createVehicle = async (data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');
    const newVehicle: Vehicle = {
      ...data,
      id: generateUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const created = await createVehicleRecord(newVehicle);
    setVehicles((prev) => [...prev, created]);
    setCurrentVehicle(created);
    await refreshAllData();
    return created;
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    await updateVehicleRecord(id, updates);
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    if (currentVehicle?.id === id) {
      setCurrentVehicle((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const startRapidoTrip = async (startOdo: number, notes?: string) => {
    if (!user || !currentVehicle) return { success: false, error: 'Vehicle not selected' };
    if (activeTrip) return { success: false, error: 'Another trip is already active. Please end it first.' };

    if (startOdo < currentOdometer) {
      return {
        success: false,
        error: `Starting odometer (${startOdo} km) cannot be less than current odometer (${currentOdometer} km)`,
      };
    }

    const newTrip: Trip = {
      id: generateUUID(),
      user_id: user.id,
      vehicle_id: currentVehicle.id,
      trip_type: 'rapido',
      status: 'active',
      start_odometer: startOdo,
      end_odometer: null,
      start_time: new Date().toISOString(),
      end_time: null,
      fare_earnings: 0,
      tips: 0,
      earnings: 0,
      ride_count: null,
      purpose: 'Rapido session',
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await createTripRecord(newTrip);
    await refreshAllData();
    return { success: true };
  };

  const endRapidoTrip = async (
    tripId: string,
    endOdo: number,
    fareEarnings: number,
    tips: number,
    rideCount?: number,
    notes?: string
  ) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return { success: false, error: 'Trip not found' };

    if (endOdo < trip.start_odometer) {
      return {
        success: false,
        error: `Ending odometer (${endOdo} km) cannot be less than starting odometer (${trip.start_odometer} km)`,
      };
    }

    if (fareEarnings < 0 || tips < 0) {
      return { success: false, error: 'Earnings and tips cannot be negative' };
    }

    const totalEarnings = Number((fareEarnings + tips).toFixed(2));

    await updateTripRecord(tripId, {
      status: 'completed',
      end_odometer: endOdo,
      end_time: new Date().toISOString(),
      fare_earnings: fareEarnings,
      tips: tips,
      earnings: totalEarnings,
      ride_count: rideCount || null,
      notes: notes !== undefined ? notes : trip.notes,
    });

    await refreshAllData();
    return { success: true };
  };

  const addPersonalTrip = async (
    startOdo: number,
    endOdo: number,
    purpose: string,
    notes?: string,
    date?: string
  ) => {
    if (!user || !currentVehicle) return { success: false, error: 'Vehicle not selected' };

    if (endOdo < startOdo) {
      return {
        success: false,
        error: `Ending odometer (${endOdo} km) cannot be less than starting odometer (${startOdo} km)`,
      };
    }

    const now = date ? new Date(date).toISOString() : new Date().toISOString();

    const trip: Trip = {
      id: generateUUID(),
      user_id: user.id,
      vehicle_id: currentVehicle.id,
      trip_type: 'personal',
      status: 'completed',
      start_odometer: startOdo,
      end_odometer: endOdo,
      start_time: now,
      end_time: now,
      fare_earnings: 0,
      tips: 0,
      earnings: 0,
      ride_count: null,
      purpose: purpose || 'Personal',
      notes: notes || null,
      created_at: now,
      updated_at: now,
    };

    await createTripRecord(trip);
    await updateTripRecord(trip.id, { end_odometer: endOdo, end_time: now });
    await refreshAllData();
    return { success: true };
  };

  const addFuel = async (
    odometer: number,
    pricePerLitre: number,
    quantityLitres: number,
    totalAmount: number,
    fillType: 'full' | 'partial',
    stationName?: string,
    notes?: string,
    dateTime?: string
  ) => {
    if (!user || !currentVehicle) return { success: false, error: 'Vehicle not selected' };

    if (odometer < currentOdometer) {
      return {
        success: false,
        error: `Fuel odometer (${odometer} km) is lower than current odometer (${currentOdometer} km)`,
      };
    }

    const recordedAt = dateTime ? new Date(dateTime).toISOString() : new Date().toISOString();

    const entry: FuelEntry = {
      id: generateUUID(),
      user_id: user.id,
      vehicle_id: currentVehicle.id,
      odometer_entry_id: null,
      recorded_at: recordedAt,
      odometer,
      price_per_litre: pricePerLitre,
      quantity_litres: quantityLitres,
      total_amount: totalAmount,
      fill_type: fillType,
      station_name: stationName || null,
      notes: notes || null,
      created_at: recordedAt,
      updated_at: recordedAt,
    };

    await createFuelEntryRecord(entry);
    await refreshAllData();
    return { success: true };
  };

  const deleteFuel = async (id: string) => {
    if (!currentVehicle || !user) return;
    await deleteFuelEntryRecord(id, currentVehicle.id, user.id);
    await refreshAllData();
  };

  const deleteTrip = async (id: string) => {
    await deleteTripRecord(id);
    await refreshAllData();
  };

  const addService = async (data: Omit<ServiceRecord, 'id' | 'user_id' | 'vehicle_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !currentVehicle) return;
    const record: ServiceRecord = {
      ...data,
      id: generateUUID(),
      user_id: user.id,
      vehicle_id: currentVehicle.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await createServiceRecord(record);
    await refreshAllData();
  };

  const deleteService = async (id: string) => {
    await deleteServiceRecord(id);
    await refreshAllData();
  };

  const addExpense = async (data: Omit<Expense, 'id' | 'user_id' | 'vehicle_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !currentVehicle) return;
    const exp: Expense = {
      ...data,
      id: generateUUID(),
      user_id: user.id,
      vehicle_id: currentVehicle.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await createExpenseRecord(exp);
    await refreshAllData();
  };

  const deleteExpense = async (id: string) => {
    await deleteExpenseRecord(id);
    await refreshAllData();
  };

  const addReminder = async (data: Omit<Reminder, 'id' | 'user_id' | 'vehicle_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !currentVehicle) return;
    const rem: Reminder = {
      ...data,
      id: generateUUID(),
      user_id: user.id,
      vehicle_id: currentVehicle.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await createReminderRecord(rem);
    await refreshAllData();
  };

  const toggleReminder = async (id: string, completed: boolean) => {
    await toggleReminderRecord(id, completed);
    await refreshAllData();
  };

  const deleteReminder = async (id: string) => {
    await deleteReminderRecord(id);
    await refreshAllData();
  };

  const needsOnboarding = vehicles.length === 0 && !loading;

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        currentVehicle,
        setCurrentVehicle,
        loading,
        needsOnboarding,
        settings,
        updateSettings,

        currentOdometer,
        activeTrip,
        mileageResult,
        fuelSummary,
        tripsSummary,
        todayTripsSummary,
        serviceStatus,
        expensesSummary,
        profitability,
        fuelCostPerKm,

        trips,
        fuelEntries,
        serviceRecords,
        expenses,
        reminders,
        odometerEntries,

        refreshAllData,
        createVehicle,
        updateVehicle,
        startRapidoTrip,
        endRapidoTrip,
        addPersonalTrip,
        addFuel,
        deleteFuel,
        deleteTrip,
        addService,
        deleteService,
        addExpense,
        deleteExpense,
        addReminder,
        toggleReminder,
        deleteReminder,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export function useVehicle() {
  const context = useContext(VehicleContext);
  if (!context) throw new Error('useVehicle must be used within VehicleProvider');
  return context;
}
