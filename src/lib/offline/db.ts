import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Vehicle,
  Trip,
  FuelEntry,
  ServiceRecord,
  Expense,
  Reminder,
  UserSettings,
  SyncQueueItem,
  MileageCycle,
  OdometerEntry,
} from '@/types/database';

interface RideLedgerDB extends DBSchema {
  vehicles: {
    key: string;
    value: Vehicle;
    indexes: { 'by-user': string };
  };
  trips: {
    key: string;
    value: Trip;
    indexes: { 'by-vehicle': string; 'by-status': string };
  };
  fuel_entries: {
    key: string;
    value: FuelEntry;
    indexes: { 'by-vehicle': string; 'by-date': string };
  };
  mileage_cycles: {
    key: string;
    value: MileageCycle;
    indexes: { 'by-vehicle': string };
  };
  service_records: {
    key: string;
    value: ServiceRecord;
    indexes: { 'by-vehicle': string };
  };
  expenses: {
    key: string;
    value: Expense;
    indexes: { 'by-vehicle': string };
  };
  reminders: {
    key: string;
    value: Reminder;
    indexes: { 'by-vehicle': string };
  };
  odometer_entries: {
    key: string;
    value: OdometerEntry;
    indexes: { 'by-vehicle': string };
  };
  user_settings: {
    key: string;
    value: UserSettings;
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-created': string };
  };
}

let dbPromise: Promise<IDBPDatabase<RideLedgerDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RideLedgerDB>('rideledger-offline-db', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const vehicleStore = db.createObjectStore('vehicles', { keyPath: 'id' });
          vehicleStore.createIndex('by-user', 'user_id');

          const tripStore = db.createObjectStore('trips', { keyPath: 'id' });
          tripStore.createIndex('by-vehicle', 'vehicle_id');
          tripStore.createIndex('by-status', 'status');

          const fuelStore = db.createObjectStore('fuel_entries', { keyPath: 'id' });
          fuelStore.createIndex('by-vehicle', 'vehicle_id');
          fuelStore.createIndex('by-date', 'recorded_at');

          const cycleStore = db.createObjectStore('mileage_cycles', { keyPath: 'id' });
          cycleStore.createIndex('by-vehicle', 'vehicle_id');

          const serviceStore = db.createObjectStore('service_records', { keyPath: 'id' });
          serviceStore.createIndex('by-vehicle', 'vehicle_id');

          const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expenseStore.createIndex('by-vehicle', 'vehicle_id');

          const reminderStore = db.createObjectStore('reminders', { keyPath: 'id' });
          reminderStore.createIndex('by-vehicle', 'vehicle_id');

          const odoStore = db.createObjectStore('odometer_entries', { keyPath: 'id' });
          odoStore.createIndex('by-vehicle', 'vehicle_id');

          db.createObjectStore('user_settings', { keyPath: 'user_id' });

          const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          queueStore.createIndex('by-created', 'created_at');
        }
      },
    });
  }
  return dbPromise;
}
