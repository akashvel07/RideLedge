import React, { useState, useMemo } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import {
  formatCurrency,
  formatMileage,
  formatLitres,
  formatDate,
  formatDateTime,
} from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Fuel,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { isThisWeek, isThisMonth, parseISO } from 'date-fns';

interface FuelPageProps {
  onAddFuel: () => void;
}

export const FuelPage: React.FC<FuelPageProps> = ({ onAddFuel }) => {
  const { fuelEntries, mileageResult, fuelSummary, deleteFuel } = useVehicle();

  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');

  const filteredEntries = useMemo(() => {
    return fuelEntries.filter((f) => {
      if (dateFilter === 'week') {
        try {
          return isThisWeek(parseISO(f.recorded_at), { weekStartsOn: 1 });
        } catch {
          return true;
        }
      }
      if (dateFilter === 'month') {
        try {
          return isThisMonth(parseISO(f.recorded_at));
        } catch {
          return true;
        }
      }
      return true;
    });
  }, [fuelEntries, dateFilter]);

  // Chart data from completed mileage cycles
  const chartData = useMemo(() => {
    return mileageResult.cycles
      .filter((c) => c.status === 'completed')
      .map((c) => ({
        date: formatDate(c.created_at, 'dd MMM'),
        mileage: c.mileage_kmpl,
        distance: c.distance_km,
      }));
  }, [mileageResult.cycles]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this fuel entry? All mileage cycles will be automatically recalculated.')) {
      await deleteFuel(id);
    }
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in">
      {/* Header & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Fuel & Mileage Engine
          </h2>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Calibrated with full-tank-to-full-tank real-world measurement.
          </p>
        </div>

        <Button onClick={onAddFuel} variant="fuel" size="md" className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Add Fuel Entry
        </Button>
      </div>

      {/* Top 4 Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
          <span className="text-[11px] font-semibold text-text-secondary-light dark:text-text-secondary-dark block">
            Latest Mileage
          </span>
          <span className="text-2xl font-black text-forest dark:text-forest-light">
            {formatMileage(mileageResult.latestCycle?.mileage_kmpl)}
          </span>
          <span className="text-[10px] text-text-secondary-light block mt-0.5">
            Full-to-full verified
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
          <span className="text-[11px] font-semibold text-text-secondary-light dark:text-text-secondary-dark block">
            Overall Average
          </span>
          <span className="text-2xl font-black text-text-primary-light dark:text-text-primary-dark">
            {formatMileage(mileageResult.overallAverageKmpl)}
          </span>
          <span className="text-[10px] text-text-secondary-light block mt-0.5">
            Weighted across all cycles
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
          <span className="text-[11px] font-semibold text-text-secondary-light dark:text-text-secondary-dark block">
            Total Fuel Purchased
          </span>
          <span className="text-2xl font-black text-fuel">
            {formatLitres(fuelSummary.totalLitres)}
          </span>
          <span className="text-[10px] text-text-secondary-light block mt-0.5">
            Across {fuelSummary.fillCount} fills
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
          <span className="text-[11px] font-semibold text-text-secondary-light dark:text-text-secondary-dark block">
            Avg Petrol Price
          </span>
          <span className="text-2xl font-black text-text-primary-light dark:text-text-primary-dark">
            {fuelSummary.averagePricePerLitre ? formatCurrency(fuelSummary.averagePricePerLitre) : '--'}
          </span>
          <span className="text-[10px] text-text-secondary-light block mt-0.5">
            per litre
          </span>
        </div>
      </div>

      {/* Measurement Status Banner */}
      <div className="p-4 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              mileageResult.measurementStatus === 'measured'
                ? 'bg-forest/10 text-forest'
                : mileageResult.measurementStatus === 'awaiting_next_full_tank'
                ? 'bg-warning/15 text-warning'
                : 'bg-black/5 text-text-secondary-light'
            }`}
          >
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-text-primary-light dark:text-text-primary-dark">
              {mileageResult.measurementStatus === 'measured'
                ? 'Active Full-to-Full Mileage Engine'
                : mileageResult.measurementStatus === 'awaiting_next_full_tank'
                ? 'Cycle In Progress – Waiting for Next Full Tank'
                : 'Waiting for First Full-Tank Reference'}
            </p>
            <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
              {mileageResult.measurementStatus === 'measured'
                ? `${mileageResult.cycles.filter((c) => c.status === 'completed').length} verified cycle(s) recorded.`
                : mileageResult.measurementStatus === 'awaiting_next_full_tank'
                ? `Initial full tank baseline established. ${mileageResult.pendingCycle?.accumulatedLitres || 0} L partials added since.`
                : 'Fill a full tank and check "Full Tank" in the form to establish your measurement baseline.'}
            </p>
          </div>
        </div>

        {mileageResult.bestKmpl && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-text-secondary-light block">Best Cycle</span>
              <span className="font-extrabold text-forest">{formatMileage(mileageResult.bestKmpl)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-text-secondary-light block">Lowest Cycle</span>
              <span className="font-extrabold text-text-secondary-light">{formatMileage(mileageResult.worstKmpl)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Mileage Trend Chart */}
      {chartData.length > 1 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-4">
            Measured Mileage Trend (km/l)
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} km/l`, 'Mileage']}
                  contentStyle={{
                    backgroundColor: 'rgba(25, 35, 29, 0.95)',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mileage"
                  stroke="#176B45"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#176B45' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Fuel Entries History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
            Fuel History & Refills
          </h3>

          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  dateFilter === f.id
                    ? 'bg-black/10 dark:bg-white/10 text-text-primary-light dark:text-text-primary-dark font-bold'
                    : 'text-text-secondary-light hover:text-text-primary-light'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredEntries.length > 0 ? (
          <div className="space-y-2.5">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-between text-xs hover:border-fuel/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      entry.fill_type === 'full'
                        ? 'bg-fuel text-white font-bold'
                        : 'bg-fuel/15 text-fuel-dark'
                    }`}
                  >
                    <Fuel className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary-light dark:text-text-primary-dark text-sm">
                        {formatLitres(entry.quantity_litres)}
                      </span>
                      <Badge variant={entry.fill_type === 'full' ? 'fuel' : 'neutral'} size="sm">
                        {entry.fill_type === 'full' ? 'Full Tank' : 'Partial'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                      {formatDateTime(entry.recorded_at)} • @ {formatCurrency(entry.price_per_litre)}/L • Odo: {entry.odometer} km
                      {entry.station_name ? ` • ${entry.station_name}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark block">
                      {formatCurrency(entry.total_amount)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1 text-text-secondary-light hover:text-danger hover:bg-danger/10 rounded transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Fuel}
            title="No Fuel Entries"
            description="Start recording fuel fills to calculate exact TVS Jupiter mileage."
            actionLabel="Add First Fuel Refill"
            onAction={onAddFuel}
            variant="fuel"
          />
        )}
      </div>
    </div>
  );
};
