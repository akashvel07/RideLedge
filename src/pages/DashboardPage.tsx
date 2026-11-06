import React from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { formatCurrency, formatDistance, formatMileage, formatDate, formatDateTime } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstallPromptBanner } from '@/components/common/InstallPromptBanner';
import {
  Play,
  Square,
  Fuel,
  UserCheck,
  Receipt,
  TrendingUp,
  Wrench,
  AlertCircle,
  ArrowRight,
  IndianRupee,
} from 'lucide-react';

interface DashboardPageProps {
  onStartRapido: () => void;
  onEndRapido: () => void;
  onAddFuel: () => void;
  onAddPersonalTrip: () => void;
  onAddExpense: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onStartRapido,
  onEndRapido,
  onAddFuel,
  onAddPersonalTrip,
  onAddExpense,
  onNavigateTab,
}) => {
  const {
    activeTrip,
    mileageResult,
    todayTripsSummary,
    serviceStatus,
    fuelCostPerKm,
    trips,
    fuelEntries,
    serviceRecords,
    expenses,
  } = useVehicle();

  // Combine latest 5 activities for recent activity list
  const recentActivities = React.useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      type: 'rapido' | 'personal' | 'fuel' | 'service' | 'expense';
      title: string;
      subtitle: string;
      amount?: string;
    }> = [];

    trips.slice(0, 5).forEach((t) => {
      if (t.status === 'completed') {
        const dist = (t.end_odometer ?? t.start_odometer) - t.start_odometer;
        if (t.trip_type === 'rapido') {
          list.push({
            id: t.id,
            date: t.end_time || t.start_time,
            type: 'rapido',
            title: `Rapido Session (${formatDistance(dist, 1)})`,
            subtitle: `${t.ride_count ? `${t.ride_count} rides • ` : ''}${formatCurrency(t.earnings)} earned`,
            amount: `+${formatCurrency(t.earnings)}`,
          });
        } else {
          list.push({
            id: t.id,
            date: t.start_time,
            type: 'personal',
            title: `Personal: ${t.purpose || 'Trip'}`,
            subtitle: `${formatDistance(dist, 1)} driven`,
          });
        }
      }
    });

    fuelEntries.slice(0, 4).forEach((f) => {
      list.push({
        id: f.id,
        date: f.recorded_at,
        type: 'fuel',
        title: `Petrol Refill (${f.fill_type === 'full' ? 'Full Tank' : 'Partial'})`,
        subtitle: `${f.quantity_litres} L @ ${formatCurrency(f.price_per_litre)}/L`,
        amount: `-${formatCurrency(f.total_amount)}`,
      });
    });

    serviceRecords.slice(0, 3).forEach((s) => {
      list.push({
        id: s.id,
        date: `${s.service_date}T12:00:00Z`,
        type: 'service',
        title: `Service: ${s.category}`,
        subtitle: `${s.workshop_name || 'Workshop'} @ ${formatDistance(s.odometer, 1)}`,
        amount: `-${formatCurrency(s.amount)}`,
      });
    });

    expenses.slice(0, 3).forEach((e) => {
      list.push({
        id: e.id,
        date: e.expense_date,
        type: 'expense',
        title: `Expense: ${e.category}`,
        subtitle: e.description || 'Vehicle expense',
        amount: `-${formatCurrency(e.amount)}`,
      });
    });

    return list
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [trips, fuelEntries, serviceRecords, expenses]);

  return (
    <div className="space-y-5 pb-8 animate-in fade-in">
      {/* 0. PWA INSTALL BANNER */}
      <InstallPromptBanner />

      {/* 1. ACTIVE RAPIDO SESSION BANNER */}
      {activeTrip && (
        <div className="p-4 rounded-2xl bg-forest text-white shadow-lg shadow-forest/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Play className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Shift Active
                </span>
                <span className="text-xs text-white/80">
                  Started at {formatDateTime(activeTrip.start_time)}
                </span>
              </div>
              <p className="text-sm font-bold mt-0.5">
                Starting Odometer: {formatDistance(activeTrip.start_odometer, 1)}
              </p>
            </div>
          </div>
          <Button
            onClick={onEndRapido}
            variant="secondary"
            size="md"
            className="w-full sm:w-auto bg-white text-forest hover:bg-white/90 font-bold gap-2"
          >
            <Square className="w-4 h-4 fill-current" />
            End Session & Record Earnings
          </Button>
        </div>
      )}

      {/* 2. MAIN MILEAGE CARD */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                Real-World Mileage
              </span>
              {mileageResult.measurementStatus === 'measured' ? (
                <Badge variant="forest" size="sm">
                  Measured (Full-to-Full)
                </Badge>
              ) : mileageResult.measurementStatus === 'awaiting_next_full_tank' ? (
                <Badge variant="warning" size="sm">
                  Awaiting Next Full Tank
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  No Measurement Yet
                </Badge>
              )}
            </div>

            {/* Prominent KMPL Metric */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-forest dark:text-forest-light">
                {mileageResult.latestCycle
                  ? mileageResult.latestCycle.mileage_kmpl.toFixed(1)
                  : '--'}
              </span>
              <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                km/l
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('fuel')}
            className="p-2 rounded-xl bg-forest-light/60 dark:bg-forest-dark/20 text-forest dark:text-forest-light hover:bg-forest-light transition-colors"
            title="View Fuel & Mileage Cycles"
          >
            <Fuel className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-metrics: Cost per km, Date, Cycles */}
        {mileageResult.latestCycle ? (
          <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-text-secondary-light dark:text-text-secondary-dark block">
                Fuel Cost / km
              </span>
              <span className="font-bold text-text-primary-light dark:text-text-primary-dark text-sm">
                {fuelCostPerKm ? `${formatCurrency(fuelCostPerKm)} / km` : 'Calculating...'}
              </span>
            </div>
            <div>
              <span className="text-text-secondary-light dark:text-text-secondary-dark block">
                Last Measurement
              </span>
              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                {formatDate(mileageResult.latestCycle.created_at)}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-text-secondary-light dark:text-text-secondary-dark block">
                Overall Average
              </span>
              <span className="font-bold text-forest text-sm">
                {formatMileage(mileageResult.overallAverageKmpl)}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
            {mileageResult.measurementStatus === 'awaiting_next_full_tank' ? (
              <p className="flex items-center gap-1.5 text-warning font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Initial full tank recorded! Next full tank will complete your cycle.
                {mileageResult.pendingCycle && mileageResult.pendingCycle.accumulatedLitres > 0 && (
                  <span> ({mileageResult.pendingCycle.accumulatedLitres} L partials added)</span>
                )}
              </p>
            ) : (
              <p>
                Your mileage will appear after completing your first full-tank measurement cycle.
              </p>
            )}
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddFuel}
                className="text-xs gap-1.5 text-fuel border-fuel/30 hover:bg-fuel-light"
              >
                <Fuel className="w-3.5 h-3.5" />
                Record Full Tank Now
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 3. TODAY'S ACTIVITY (TWO SEPARATE CARDS: RAPIDO & PERSONAL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RAPIDO CARD */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-forest/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-forest" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-forest dark:text-forest-light">
                Today's Rapido Shift
              </h3>
            </div>
            <Badge variant="forest" size="sm">
              {todayTripsSummary.rapido.tripCount} session{todayTripsSummary.rapido.tripCount === 1 ? '' : 's'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3.5">
            <div>
              <span className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                Distance
              </span>
              <p className="text-xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                {formatDistance(todayTripsSummary.rapido.totalDistanceKm, 1)}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                Earnings (Fares + Tips)
              </span>
              <p className="text-xl font-extrabold text-forest dark:text-forest-light">
                {formatCurrency(todayTripsSummary.rapido.totalEarnings)}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                Working Time
              </span>
              <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                {(todayTripsSummary.rapido.totalDurationMinutes / 60).toFixed(1)} hrs
              </p>
            </div>
            <div>
              <span className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                Rate / km
              </span>
              <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                {todayTripsSummary.rapido.earningsPerKm
                  ? `${formatCurrency(todayTripsSummary.rapido.earningsPerKm)} / km`
                  : '--'}
              </p>
            </div>
          </div>
        </div>

        {/* PERSONAL CARD */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-personal/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-personal" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-personal">
                Today's Personal Trips
              </h3>
            </div>
            <Badge variant="personal" size="sm">
              {todayTripsSummary.personal.tripCount} trip{todayTripsSummary.personal.tripCount === 1 ? '' : 's'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3.5">
            <div>
              <span className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                Distance
              </span>
              <p className="text-xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                {formatDistance(todayTripsSummary.personal.totalDistanceKm, 1)}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                Trip Count
              </span>
              <p className="text-xl font-extrabold text-personal">
                {todayTripsSummary.personal.tripCount}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                Personal mileage is never included in business profit calculations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. QUICK ACTIONS */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-2.5 px-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Start / End Rapido - Most prominent */}
          {activeTrip ? (
            <Button
              onClick={onEndRapido}
              variant="danger"
              size="lg"
              className="w-full flex-col h-20 rounded-xl gap-1 text-xs font-bold"
            >
              <Square className="w-5 h-5 fill-current" />
              End Rapido
            </Button>
          ) : (
            <Button
              onClick={onStartRapido}
              variant="primary"
              size="lg"
              className="w-full flex-col h-20 rounded-xl gap-1 text-xs font-bold shadow-md shadow-forest/20"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Rapido
            </Button>
          )}

          <Button
            onClick={onAddFuel}
            variant="fuel"
            size="lg"
            className="w-full flex-col h-20 rounded-xl gap-1 text-xs font-bold shadow-md shadow-fuel/20"
          >
            <Fuel className="w-5 h-5" />
            Add Fuel
          </Button>

          <Button
            onClick={onAddPersonalTrip}
            variant="personal"
            size="lg"
            className="w-full flex-col h-20 rounded-xl gap-1 text-xs font-bold shadow-md shadow-personal/20"
          >
            <UserCheck className="w-5 h-5" />
            Personal Trip
          </Button>

          <Button
            onClick={onAddExpense}
            variant="outline"
            size="lg"
            className="w-full flex-col h-20 rounded-xl gap-1 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Receipt className="w-5 h-5 text-text-secondary-light" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* 5. TODAY'S FINANCIAL SUMMARY */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-forest" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
              Financial Breakdown (Today)
            </h3>
          </div>
          <span className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
            Recorded vs Estimates
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark block">
              Recorded Earnings
            </span>
            <span className="text-base font-extrabold text-forest dark:text-forest-light">
              {formatCurrency(todayTripsSummary.rapido.totalEarnings)}
            </span>
            <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark block">
              (Fares + Tips)
            </span>
          </div>

          <div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark block">
              Est. Petrol Cost
            </span>
            <span className="text-base font-extrabold text-fuel">
              {fuelCostPerKm && todayTripsSummary.rapido.totalDistanceKm > 0
                ? `- ${formatCurrency(todayTripsSummary.rapido.totalDistanceKm * fuelCostPerKm)}`
                : 'Insufficient data'}
            </span>
            <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark block">
              (km ÷ km/l × price)
            </span>
          </div>

          <div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark block">
              Maintenance Allocation
            </span>
            <span className="text-base font-bold text-text-secondary-light dark:text-text-secondary-dark">
              {todayTripsSummary.rapido.totalDistanceKm > 0
                ? `- ${formatCurrency(todayTripsSummary.rapido.totalDistanceKm * 0.5)}`
                : '₹0.00'}
            </span>
            <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark block">
              (@ ₹0.50 / km)
            </span>
          </div>

          <div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark block">
              Est. Net Earnings
            </span>
            <span className="text-lg font-black text-forest dark:text-forest-light">
              {fuelCostPerKm && todayTripsSummary.rapido.totalDistanceKm > 0
                ? formatCurrency(
                  todayTripsSummary.rapido.totalEarnings -
                  todayTripsSummary.rapido.totalDistanceKm * fuelCostPerKm -
                  todayTripsSummary.rapido.totalDistanceKm * 0.5
                )
                : todayTripsSummary.rapido.totalEarnings > 0
                  ? formatCurrency(todayTripsSummary.rapido.totalEarnings)
                  : '₹0.00'}
            </span>
            <span className="text-[10px] text-forest/70 block">
              Estimated Net
            </span>
          </div>
        </div>
      </div>

      {/* 6. SERVICE REMINDER CARD */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-warning" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
              Service Countdown
            </h3>
          </div>
          <Badge
            variant={
              serviceStatus.status === 'overdue'
                ? 'danger'
                : serviceStatus.status === 'due_soon'
                  ? 'warning'
                  : 'forest'
            }
            size="sm"
          >
            {serviceStatus.statusLabel}
          </Badge>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark block">
              Remaining Distance to Service
            </span>
            <span className="text-2xl font-black text-text-primary-light dark:text-text-primary-dark">
              {serviceStatus.remainingKm !== null
                ? formatDistance(serviceStatus.remainingKm, 1)
                : 'No Target Set'}
            </span>
          </div>

          <Button
            onClick={() => onNavigateTab('service')}
            variant="outline"
            size="sm"
            className="text-xs gap-1"
          >
            View Service
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 7. RECENT ACTIVITY LIST */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
            Recent Activity
          </h3>
          <button
            onClick={() => onNavigateTab('trips')}
            className="text-xs font-semibold text-forest dark:text-forest-light hover:underline"
          >
            View All
          </button>
        </div>

        {recentActivities.length > 0 ? (
          <div className="divide-y divide-border-light dark:divide-border-dark mt-1">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${act.type === 'rapido'
                        ? 'bg-forest/10 text-forest'
                        : act.type === 'personal'
                          ? 'bg-personal/10 text-personal'
                          : act.type === 'fuel'
                            ? 'bg-fuel/15 text-fuel-dark'
                            : act.type === 'service'
                              ? 'bg-warning/15 text-warning'
                              : 'bg-black/5 text-text-secondary-light'
                      }`}
                  >
                    {act.type === 'rapido' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : act.type === 'personal' ? (
                      <UserCheck className="w-4 h-4" />
                    ) : act.type === 'fuel' ? (
                      <Fuel className="w-4 h-4" />
                    ) : act.type === 'service' ? (
                      <Wrench className="w-4 h-4" />
                    ) : (
                      <Receipt className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-text-primary-light dark:text-text-primary-dark">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                      {act.subtitle} • {formatDateTime(act.date)}
                    </p>
                  </div>
                </div>

                {act.amount && (
                  <span
                    className={`font-bold ${act.amount.startsWith('+') ? 'text-forest' : 'text-text-secondary-light'
                      }`}
                  >
                    {act.amount}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center py-6">
            No activity recorded yet. Start a Rapido session or record your first fuel refill!
          </p>
        )}
      </div>
    </div>
  );
};
