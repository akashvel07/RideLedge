import { Trip } from '@/types/database';

export interface TripMetrics {
  distanceKm: number;
  durationMinutes: number;
  totalEarnings: number;
  earningsPerKm: number | null;
  earningsPerHour: number | null;
}

/**
 * Calculates metrics for an individual trip
 */
export function calculateTripMetrics(trip: Partial<Trip>): TripMetrics {
  const startOdo = trip.start_odometer ?? 0;
  const endOdo = trip.end_odometer ?? startOdo;
  const distanceKm = Number(Math.max(0, endOdo - startOdo).toFixed(1));

  let durationMinutes = 0;
  if (trip.start_time && trip.end_time) {
    const start = new Date(trip.start_time).getTime();
    const end = new Date(trip.end_time).getTime();
    durationMinutes = Math.max(0, Math.round((end - start) / (1000 * 60)));
  }

  const fareEarnings = Number(trip.fare_earnings ?? 0);
  const tips = Number(trip.tips ?? 0);
  const totalEarnings = Number((trip.earnings ?? (fareEarnings + tips)).toFixed(2));

  let earningsPerKm: number | null = null;
  if (distanceKm > 0) {
    earningsPerKm = Number((totalEarnings / distanceKm).toFixed(2));
  }

  let earningsPerHour: number | null = null;
  if (durationMinutes > 0) {
    earningsPerHour = Number(((totalEarnings / durationMinutes) * 60).toFixed(2));
  }

  return {
    distanceKm,
    durationMinutes,
    totalEarnings,
    earningsPerKm,
    earningsPerHour,
  };
}

export interface AggregatedTripsSummary {
  rapido: {
    totalDistanceKm: number;
    totalEarnings: number;
    totalFareEarnings: number;
    totalTips: number;
    totalDurationMinutes: number;
    tripCount: number;
    totalRides: number;
    earningsPerKm: number | null;
    earningsPerHour: number | null;
  };
  personal: {
    totalDistanceKm: number;
    tripCount: number;
  };
  totalDistanceKm: number;
}

/**
 * Aggregates a list of trips into Rapido vs Personal statistics
 */
export function aggregateTrips(trips: Trip[]): AggregatedTripsSummary {
  const completedTrips = trips.filter((t) => t.status === 'completed');

  const rapidoTrips = completedTrips.filter((t) => t.trip_type === 'rapido');
  const personalTrips = completedTrips.filter((t) => t.trip_type === 'personal');

  let rapidoDist = 0;
  let rapidoEarnings = 0;
  let rapidoFares = 0;
  let rapidoTips = 0;
  let rapidoDuration = 0;
  let rapidoRides = 0;

  for (const t of rapidoTrips) {
    const metrics = calculateTripMetrics(t);
    rapidoDist += metrics.distanceKm;
    rapidoEarnings += metrics.totalEarnings;
    rapidoFares += t.fare_earnings ?? 0;
    rapidoTips += t.tips ?? 0;
    rapidoDuration += metrics.durationMinutes;
    rapidoRides += t.ride_count ?? 0;
  }

  let personalDist = 0;
  for (const t of personalTrips) {
    const metrics = calculateTripMetrics(t);
    personalDist += metrics.distanceKm;
  }

  const rapidoEarningsPerKm = rapidoDist > 0 ? Number((rapidoEarnings / rapidoDist).toFixed(2)) : null;
  const rapidoEarningsPerHour =
    rapidoDuration > 0 ? Number(((rapidoEarnings / rapidoDuration) * 60).toFixed(2)) : null;

  return {
    rapido: {
      totalDistanceKm: Number(rapidoDist.toFixed(1)),
      totalEarnings: Number(rapidoEarnings.toFixed(2)),
      totalFareEarnings: Number(rapidoFares.toFixed(2)),
      totalTips: Number(rapidoTips.toFixed(2)),
      totalDurationMinutes: rapidoDuration,
      tripCount: rapidoTrips.length,
      totalRides: rapidoRides,
      earningsPerKm: rapidoEarningsPerKm,
      earningsPerHour: rapidoEarningsPerHour,
    },
    personal: {
      totalDistanceKm: Number(personalDist.toFixed(1)),
      tripCount: personalTrips.length,
    },
    totalDistanceKm: Number((rapidoDist + personalDist).toFixed(1)),
  };
}

