import React, { useState, useMemo } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { formatCurrency, formatDistance, formatDateTime } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  MapPin,
  Play,
  Square,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';

interface TripsPageProps {
  onStartRapido: () => void;
  onEndRapido: () => void;
  onAddPersonalTrip: () => void;
}

export const TripsPage: React.FC<TripsPageProps> = ({
  onStartRapido,
  onEndRapido,
  onAddPersonalTrip,
}) => {
  const { trips, activeTrip, deleteTrip } = useVehicle();

  const [typeFilter, setTypeFilter] = useState<'all' | 'rapido' | 'personal'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      // Status filter: do not show active trip in completed history
      if (t.status === 'active') return false;

      // Type filter
      if (typeFilter !== 'all' && t.trip_type !== typeFilter) return false;

      // Date filter
      if (dateFilter !== 'all') {
        try {
          const tripDate = parseISO(t.start_time);
          if (dateFilter === 'today' && !isToday(tripDate)) return false;
          if (dateFilter === 'week' && !isThisWeek(tripDate, { weekStartsOn: 1 })) return false;
          if (dateFilter === 'month' && !isThisMonth(tripDate)) return false;
        } catch {
          return true;
        }
      }

      return true;
    });
  }, [trips, typeFilter, dateFilter]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this trip record? This will recalculate dependent analytics.')) {
      await deleteTrip(id);
    }
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Trip Management
          </h2>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Track business Rapido sessions and personal scooting separately.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTrip ? (
            <Button onClick={onEndRapido} variant="danger" size="md" className="gap-1.5 font-bold">
              <Square className="w-4 h-4 fill-current" />
              End Rapido Session
            </Button>
          ) : (
            <Button onClick={onStartRapido} variant="primary" size="md" className="gap-1.5 shadow-sm">
              <Play className="w-4 h-4 fill-current" />
              Start Rapido
            </Button>
          )}

          <Button onClick={onAddPersonalTrip} variant="personal" size="md" className="gap-1.5 shadow-sm">
            <UserCheck className="w-4 h-4" />
            Personal Trip
          </Button>
        </div>
      </div>

      {/* Active Trip Banner if currently running */}
      {activeTrip && (
        <div className="p-4 rounded-2xl bg-forest-light/80 dark:bg-forest-dark/30 border border-forest/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-forest animate-ping" />
              <span className="text-xs font-bold text-forest dark:text-forest-light uppercase tracking-wider">
                Rapido Shift Currently Active
              </span>
            </div>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Started at {formatDateTime(activeTrip.start_time)} • Start Odometer:{' '}
              <strong className="text-text-primary-light dark:text-text-primary-dark">
                {formatDistance(activeTrip.start_odometer, 1)}
              </strong>
            </p>
          </div>
          <Button onClick={onEndRapido} variant="primary" size="sm">
            End Shift
          </Button>
        </div>
      )}

      {/* Filter Tabs & Date Segments */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
        {/* Type selector */}
        <div className="flex items-center gap-1">
          {[
            { id: 'all', label: 'All Trips' },
            { id: 'rapido', label: 'Rapido' },
            { id: 'personal', label: 'Personal' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === tab.id
                  ? 'bg-forest text-white shadow-sm'
                  : 'text-text-secondary-light hover:text-text-primary-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date selector */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setDateFilter(d.id as any)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                dateFilter === d.id
                  ? 'bg-black/10 dark:bg-white/10 text-text-primary-light dark:text-text-primary-dark font-bold'
                  : 'text-text-secondary-light hover:text-text-primary-light'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trips History List */}
      {filteredTrips.length > 0 ? (
        <div className="space-y-3">
          {filteredTrips.map((trip) => {
            const distance = (trip.end_odometer ?? trip.start_odometer) - trip.start_odometer;
            const isRapido = trip.trip_type === 'rapido';

            return (
              <div
                key={trip.id}
                className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm hover:border-forest/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={isRapido ? 'forest' : 'personal'} size="sm">
                      {isRapido ? 'Rapido' : 'Personal'}
                    </Badge>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {formatDateTime(trip.start_time)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(trip.id)}
                    className="p-1 rounded text-text-secondary-light hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark block">
                      Distance
                    </span>
                    <span className="text-sm font-extrabold text-text-primary-light dark:text-text-primary-dark">
                      {formatDistance(distance, 1)}
                    </span>
                  </div>

                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark block">
                      Odometer Span
                    </span>
                    <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                      {trip.start_odometer} → {trip.end_odometer ?? trip.start_odometer} km
                    </span>
                  </div>

                  {isRapido ? (
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark block">
                        Earnings (Fares + Tips)
                      </span>
                      <span className="text-sm font-black text-forest dark:text-forest-light">
                        {formatCurrency(trip.earnings)}
                      </span>
                      {trip.tips > 0 && (
                        <span className="text-[10px] text-text-secondary-light block">
                          (₹{trip.fare_earnings} fare + ₹{trip.tips} tips)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark block">
                        Purpose
                      </span>
                      <span className="font-semibold text-personal">
                        {trip.purpose || 'Personal'}
                      </span>
                    </div>
                  )}

                  {isRapido && distance > 0 && (
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark block">
                        Earnings / km
                      </span>
                      <span className="font-bold text-text-primary-light dark:text-text-primary-dark">
                        {formatCurrency(trip.earnings / distance)} / km
                      </span>
                    </div>
                  )}
                </div>

                {trip.notes && (
                  <p className="mt-2.5 pt-2 border-t border-border-light dark:border-border-dark text-[11px] text-text-secondary-light dark:text-text-secondary-dark italic">
                    "{trip.notes}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No Trips Found"
          description="You haven't recorded any trips matching this filter yet."
          actionLabel="Start a Rapido Shift"
          onAction={onStartRapido}
          variant="forest"
        />
      )}
    </div>
  );
};
