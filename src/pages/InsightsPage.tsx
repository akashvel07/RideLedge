import React, { useState, useMemo } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import {
  formatCurrency,
  formatDistance,
  formatMileage,
  formatLitres,
} from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet,
  FileText,
  Sparkles,
  AlertCircle,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { jsPDF } from 'jspdf';
import { isThisWeek, isThisMonth, subMonths, isSameMonth, parseISO } from 'date-fns';

type PeriodType = 'week' | 'month' | 'last_month' | 'all';

export const InsightsPage: React.FC = () => {
  const {
    currentVehicle,
    currentOdometer,
    trips,
    fuelEntries,
    mileageResult,
    fuelCostPerKm,
    settings,
  } = useVehicle();

  const [period, setPeriod] = useState<PeriodType>('month');

  // Filter records based on selected period
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      if (t.status !== 'completed') return false;
      try {
        const d = parseISO(t.start_time);
        if (period === 'week') return isThisWeek(d, { weekStartsOn: 1 });
        if (period === 'month') return isThisMonth(d);
        if (period === 'last_month') return isSameMonth(d, subMonths(new Date(), 1));
        return true;
      } catch {
        return true;
      }
    });
  }, [trips, period]);

  const filteredFuel = useMemo(() => {
    return fuelEntries.filter((f) => {
      try {
        const d = parseISO(f.recorded_at);
        if (period === 'week') return isThisWeek(d, { weekStartsOn: 1 });
        if (period === 'month') return isThisMonth(d);
        if (period === 'last_month') return isSameMonth(d, subMonths(new Date(), 1));
        return true;
      } catch {
        return true;
      }
    });
  }, [fuelEntries, period]);

  // Aggregate distance
  const rapidoTrips = filteredTrips.filter((t) => t.trip_type === 'rapido');
  const personalTrips = filteredTrips.filter((t) => t.trip_type === 'personal');

  const rapidoDistance = rapidoTrips.reduce(
    (sum, t) => sum + ((t.end_odometer ?? t.start_odometer) - t.start_odometer),
    0
  );
  const personalDistance = personalTrips.reduce(
    (sum, t) => sum + ((t.end_odometer ?? t.start_odometer) - t.start_odometer),
    0
  );
  const totalDistance = rapidoDistance + personalDistance;

  const rapidoPercent = totalDistance > 0 ? (rapidoDistance / totalDistance) * 100 : 0;
  const personalPercent = totalDistance > 0 ? (personalDistance / totalDistance) * 100 : 0;

  // Rapido Profitability Metrics
  const rapidoEarnings = rapidoTrips.reduce((sum, t) => sum + t.earnings, 0);
  const rapidoFares = rapidoTrips.reduce((sum, t) => sum + t.fare_earnings, 0);
  const rapidoTips = rapidoTrips.reduce((sum, t) => sum + t.tips, 0);

  let rapidoDurationMinutes = 0;
  for (const t of rapidoTrips) {
    if (t.start_time && t.end_time) {
      rapidoDurationMinutes += (new Date(t.end_time).getTime() - new Date(t.start_time).getTime()) / (1000 * 60);
    }
  }
  const workingHours = rapidoDurationMinutes / 60;

  const earningsPerKm = rapidoDistance > 0 ? rapidoEarnings / rapidoDistance : null;
  const earningsPerHour = workingHours > 0 ? rapidoEarnings / workingHours : null;

  const estimatedFuelCost = fuelCostPerKm ? rapidoDistance * fuelCostPerKm : null;
  const maintenanceAllocation = rapidoDistance * (settings?.maintenance_rate_per_km ?? 0.5);

  const estimatedNetEarnings =
    estimatedFuelCost !== null
      ? rapidoEarnings - estimatedFuelCost - (settings?.maintenance_allocation_enabled ? maintenanceAllocation : 0)
      : null;

  const profitMargin =
    estimatedNetEarnings !== null && rapidoEarnings > 0
      ? (estimatedNetEarnings / rapidoEarnings) * 100
      : null;

  // Donut chart data for usage
  const usageChartData = [
    { name: 'Rapido (Business)', value: Number(rapidoDistance.toFixed(1)), color: '#176B45' },
    { name: 'Personal', value: Number(personalDistance.toFixed(1)), color: '#3478D4' },
  ].filter((d) => d.value > 0);

  // Fuel analytics
  const totalFuelLitres = filteredFuel.reduce((sum, f) => sum + f.quantity_litres, 0);
  const totalFuelSpend = filteredFuel.reduce((sum, f) => sum + f.total_amount, 0);

  // -------------------------------------------------------------
  // REPORT EXPORTERS (CSV & PDF)
  // -------------------------------------------------------------

  const exportCSV = () => {
    let csv = 'RideLedger Export Report\n';
    csv += `Vehicle: ${currentVehicle?.manufacturer} ${currentVehicle?.model}\n`;
    csv += `Period: ${period.toUpperCase()}\n`;
    csv += `Generated At: ${new Date().toISOString()}\n\n`;

    csv += '--- TRIPS ---\n';
    csv += 'Date,Type,Start Odo,End Odo,Distance (km),Fares (INR),Tips (INR),Total Earnings (INR),Ride Count,Purpose\n';
    filteredTrips.forEach((t) => {
      const d = (t.end_odometer ?? t.start_odometer) - t.start_odometer;
      csv += `"${t.start_time}","${t.trip_type}",${t.start_odometer},${t.end_odometer ?? ''},${d.toFixed(1)},${t.fare_earnings},${t.tips},${t.earnings},${t.ride_count ?? ''},"${t.purpose ?? ''}"\n`;
    });

    csv += '\n--- FUEL ENTRIES ---\n';
    csv += 'Date,Odometer,Litres,Price/L,Total (INR),Fill Type,Station\n';
    filteredFuel.forEach((f) => {
      csv += `"${f.recorded_at}",${f.odometer},${f.quantity_litres},${f.price_per_litre},${f.total_amount},"${f.fill_type}","${f.station_name ?? ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rideledger_${period}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFillColor(23, 107, 69); // Forest green
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('RideLedger Vehicle & Profit Report', 14, 18);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.text(`Vehicle: ${currentVehicle?.manufacturer || 'TVS'} ${currentVehicle?.model || 'Jupiter 110'}`, 14, 40);
    doc.text(`Current Odometer: ${formatDistance(currentOdometer, 1)}`, 14, 46);
    doc.text(`Reporting Period: ${period.toUpperCase()}`, 14, 52);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 58);

    doc.setFontSize(14);
    doc.setTextColor(23, 107, 69);
    doc.text('1. Distance & Usage Summary', 14, 70);

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`• Total Distance: ${formatDistance(totalDistance, 1)}`, 20, 78);
    doc.text(`• Rapido Business: ${formatDistance(rapidoDistance, 1)} (${rapidoPercent.toFixed(1)}%)`, 20, 84);
    doc.text(`• Personal Scooting: ${formatDistance(personalDistance, 1)} (${personalPercent.toFixed(1)}%)`, 20, 90);

    doc.setFontSize(14);
    doc.setTextColor(23, 107, 69);
    doc.text('2. Rapido Business Profitability', 14, 105);

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`• Total Rapido Earnings: ${formatCurrency(rapidoEarnings)}`, 20, 113);
    doc.text(`  - Base Fares: ${formatCurrency(rapidoFares)} | Tips: ${formatCurrency(rapidoTips)}`, 20, 119);
    doc.text(`• Working Hours: ${workingHours.toFixed(1)} hrs`, 20, 125);
    doc.text(`• Earnings Rate: ${earningsPerKm ? `${formatCurrency(earningsPerKm)}/km` : 'N/A'} | ${earningsPerHour ? `${formatCurrency(earningsPerHour)}/hr` : 'N/A'}`, 20, 131);
    doc.text(`• Estimated Petrol Cost: ${estimatedFuelCost ? formatCurrency(estimatedFuelCost) : 'Insufficient Data'}`, 20, 137);
    doc.text(`• Maintenance Allocation: ${formatCurrency(maintenanceAllocation)} (@ ₹0.50/km)`, 20, 143);
    doc.text(`• ESTIMATED NET PROFIT: ${estimatedNetEarnings ? formatCurrency(estimatedNetEarnings) : 'N/A'} (${profitMargin ? `${profitMargin.toFixed(1)}% margin` : ''})`, 20, 151);

    doc.setFontSize(14);
    doc.setTextColor(23, 107, 69);
    doc.text('3. Fuel & Measured Mileage', 14, 165);

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`• Measured Mileage (Full-to-Full): ${formatMileage(mileageResult.overallAverageKmpl)}`, 20, 173);
    doc.text(`• Fuel Purchased in Period: ${formatLitres(totalFuelLitres)} (${formatCurrency(totalFuelSpend)})`, 20, 179);
    doc.text(`• Fuel Cost per km: ${fuelCostPerKm ? `${formatCurrency(fuelCostPerKm)}/km` : 'N/A'}`, 20, 185);

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Notice: Estimates are calculated based on measured mileage cycles and standard wear allocations.', 14, 280);

    doc.save(`RideLedger_Report_${period}_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Insights & Financial Analytics
          </h2>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Real usage distribution, measured mileage trends, and Rapido net profitability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={exportCSV} variant="outline" size="sm" className="gap-1.5 text-xs">
            <FileSpreadsheet className="w-4 h-4 text-forest" />
            CSV Export
          </Button>
          <Button onClick={exportPDF} variant="primary" size="sm" className="gap-1.5 text-xs shadow-sm">
            <FileText className="w-4 h-4" />
            Monthly PDF Report
          </Button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark w-fit">
        {[
          { id: 'week', label: 'This Week' },
          { id: 'month', label: 'This Month' },
          { id: 'last_month', label: 'Last Month' },
          { id: 'all', label: 'All Time' },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id as PeriodType)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === p.id
                ? 'bg-forest text-white shadow-sm'
                : 'text-text-secondary-light hover:text-text-primary-light'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 1. DISTANCE & USAGE DISTRIBUTION (DONUT CHART) */}
      <div className="p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-forest" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
              Usage Distribution (Rapido vs Personal)
            </h3>
          </div>
          <span className="text-xs font-extrabold text-text-primary-light dark:text-text-primary-dark">
            Total: {formatDistance(totalDistance, 1)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-4">
          {/* Donut Chart */}
          <div className="h-44 flex items-center justify-center">
            {usageChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usageChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {usageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} km`, 'Distance']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-text-secondary-light">No trips recorded in this period</p>
            )}
          </div>

          {/* Breakdown Stats */}
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-forest-light/60 dark:bg-forest-dark/20 border border-forest/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-forest" />
                <div>
                  <span className="font-bold text-forest dark:text-forest-light block">Rapido Shift Distance</span>
                  <span className="text-[11px] text-text-secondary-light">{rapidoTrips.length} session(s)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-sm text-forest dark:text-forest-light">
                  {formatDistance(rapidoDistance, 1)}
                </span>
                <span className="text-[10px] text-text-secondary-light block">
                  ({rapidoPercent.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-personal-light/60 dark:bg-personal-dark/20 border border-personal/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-personal" />
                <div>
                  <span className="font-bold text-personal block">Personal Distance</span>
                  <span className="text-[11px] text-text-secondary-light">{personalTrips.length} trip(s)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-sm text-personal">
                  {formatDistance(personalDistance, 1)}
                </span>
                <span className="text-[10px] text-text-secondary-light block">
                  ({personalPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RAPIDO PROFITABILITY ENGINE */}
      <div className="p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-forest/20 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-forest" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest dark:text-forest-light">
              Rapido Profitability Engine
            </h3>
          </div>
          {profitMargin !== null && (
            <Badge variant="forest" size="md">
              {profitMargin.toFixed(1)}% Profit Margin
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
            <span className="text-text-secondary-light block">Total Rapido Earnings</span>
            <span className="text-lg font-black text-forest dark:text-forest-light">
              {formatCurrency(rapidoEarnings)}
            </span>
            <span className="text-[10px] text-text-secondary-light block">
              ₹{rapidoFares.toFixed(2)} fares + ₹{rapidoTips.toFixed(2)} tips
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
            <span className="text-text-secondary-light block">Working Hours</span>
            <span className="text-lg font-black text-text-primary-light dark:text-text-primary-dark">
              {workingHours.toFixed(1)} hrs
            </span>
            <span className="text-[10px] text-text-secondary-light block">
              {earningsPerHour ? `${formatCurrency(earningsPerHour)}/hr` : '--'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
            <span className="text-text-secondary-light block">Est. Petrol Cost</span>
            <span className="text-lg font-black text-fuel">
              {estimatedFuelCost ? `- ${formatCurrency(estimatedFuelCost)}` : 'Insufficient data'}
            </span>
            <span className="text-[10px] text-text-secondary-light block">
              ({rapidoDistance.toFixed(1)} km ÷ {mileageResult.overallAverageKmpl || '--'} km/l)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-forest-light/80 dark:bg-forest-dark/30 border border-forest/30">
            <span className="text-forest dark:text-forest-light block font-semibold">Est. Net Profit</span>
            <span className="text-xl font-black text-forest dark:text-forest-light">
              {estimatedNetEarnings ? formatCurrency(estimatedNetEarnings) : formatCurrency(rapidoEarnings)}
            </span>
            <span className="text-[10px] text-forest/80 block">
              After fuel & maintenance
            </span>
          </div>
        </div>

        {estimatedFuelCost === null && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30 text-warning text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Net profit estimation requires at least one completed full-tank mileage cycle. Complete your next full tank fill to unlock exact cost deductions.
            </span>
          </div>
        )}
      </div>

      {/* 3. FUEL & EXPENSE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-xs space-y-2">
          <h4 className="font-bold text-text-primary-light dark:text-text-primary-dark uppercase tracking-wider text-[11px]">
            Fuel Overview
          </h4>
          <div className="flex justify-between py-1 border-b border-border-light dark:border-border-dark">
            <span className="text-text-secondary-light">Petrol Purchased:</span>
            <span className="font-bold">{formatLitres(totalFuelLitres)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border-light dark:border-border-dark">
            <span className="text-text-secondary-light">Total Fuel Spent:</span>
            <span className="font-bold text-fuel">{formatCurrency(totalFuelSpend)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-secondary-light">Measured Mileage:</span>
            <span className="font-extrabold text-forest">{formatMileage(mileageResult.overallAverageKmpl)}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-xs space-y-2">
          <h4 className="font-bold text-text-primary-light dark:text-text-primary-dark uppercase tracking-wider text-[11px]">
            Maintenance Allocation
          </h4>
          <div className="flex justify-between py-1 border-b border-border-light dark:border-border-dark">
            <span className="text-text-secondary-light">Scooter Allocation Rate:</span>
            <span className="font-bold">₹0.50 / km</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border-light dark:border-border-dark">
            <span className="text-text-secondary-light">Rapido Wear Deduction:</span>
            <span className="font-bold text-danger">- {formatCurrency(maintenanceAllocation)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-secondary-light">Allocation Status:</span>
            <span className="font-bold text-forest">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
