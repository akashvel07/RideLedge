import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVehicle } from '@/context/VehicleContext';
import { formatCurrency, formatDistance } from '@/lib/utils/formatters';
import { CheckCircle2, TrendingUp, IndianRupee, Fuel, Sparkles } from 'lucide-react';

interface EndRapidoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EndRapidoModal: React.FC<EndRapidoModalProps> = ({ isOpen, onClose }) => {
  const { activeTrip, endRapidoTrip, fuelCostPerKm } = useVehicle();

  const [endOdo, setEndOdo] = useState<string>('');
  const [fareEarnings, setFareEarnings] = useState<string>('');
  const [tips, setTips] = useState<string>('0');
  const [rideCount, setRideCount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && activeTrip) {
      setEndOdo(activeTrip.start_odometer.toString());
      setFareEarnings('');
      setTips('0');
      setRideCount('');
      setNotes(activeTrip.notes || '');
      setError(null);
    }
  }, [isOpen, activeTrip]);

  if (!activeTrip) return null;

  const startOdoNum = activeTrip.start_odometer;
  const endOdoNum = parseFloat(endOdo) || startOdoNum;
  const distance = Math.max(0, endOdoNum - startOdoNum);

  const fareNum = parseFloat(fareEarnings) || 0;
  const tipsNum = parseFloat(tips) || 0;
  const totalEarnings = fareNum + tipsNum;

  const earningsPerKm = distance > 0 ? totalEarnings / distance : null;
  const estimatedFuelCost = fuelCostPerKm ? distance * fuelCostPerKm : null;
  const estimatedNetEarnings = estimatedFuelCost !== null ? totalEarnings - estimatedFuelCost : null;

  const handleEnd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endOdoNum < startOdoNum) {
      setError(`Ending odometer (${endOdoNum} km) cannot be less than start (${startOdoNum} km)`);
      return;
    }
    if (fareNum < 0 || tipsNum < 0) {
      setError('Earnings and tips cannot be negative');
      return;
    }

    setLoading(true);
    const res = await endRapidoTrip(
      activeTrip.id,
      endOdoNum,
      fareNum,
      tipsNum,
      rideCount ? parseInt(rideCount, 10) : undefined,
      notes
    );
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to complete trip');
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Rapido Session"
      description="Record final odometer and earnings (fares + tips) to calculate your true profit."
    >
      <form onSubmit={handleEnd} className="space-y-4">
        <Input
          label="Ending Odometer"
          type="number"
          step="0.1"
          required
          value={endOdo}
          onChange={(e) => setEndOdo(e.target.value)}
          suffixText="km"
          hint={`Started at: ${startOdoNum} km`}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fare Earnings"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            prefixText="₹"
            value={fareEarnings}
            onChange={(e) => setFareEarnings(e.target.value)}
          />

          <Input
            label="Customer Tips"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            prefixText="₹"
            value={tips}
            onChange={(e) => setTips(e.target.value)}
            hint="Added to earnings"
          />
        </div>

        <Input
          label="Total Rides Completed (Optional)"
          type="number"
          min="0"
          placeholder="e.g. 8"
          value={rideCount}
          onChange={(e) => setRideCount(e.target.value)}
        />

        <Input
          label="Notes (Optional)"
          type="text"
          placeholder="e.g. Good tips in evening, rain surge"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Live Calculation Preview Card */}
        <div className="p-3.5 rounded-xl bg-forest-light/60 dark:bg-forest-dark/20 border border-forest/20 space-y-2 text-xs">
          <div className="flex items-center justify-between font-medium">
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Total Distance:</span>
            <span className="font-bold text-text-primary-light dark:text-text-primary-dark">
              {formatDistance(distance, 1)}
            </span>
          </div>

          <div className="flex items-center justify-between font-medium">
            <span className="text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-forest" />
              Total Recorded Earnings:
            </span>
            <span className="font-extrabold text-forest dark:text-forest-light text-sm">
              {formatCurrency(totalEarnings)}
              {tipsNum > 0 && <span className="text-[10px] font-normal ml-1">(incl. {formatCurrency(tipsNum)} tips)</span>}
            </span>
          </div>

          {earningsPerKm !== null && (
            <div className="flex items-center justify-between font-medium pt-1 border-t border-forest/15">
              <span className="text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-forest" />
                Earnings per km:
              </span>
              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                {formatCurrency(earningsPerKm)} / km
              </span>
            </div>
          )}

          {estimatedFuelCost !== null && (
            <div className="flex items-center justify-between font-medium">
              <span className="text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-fuel" />
                Est. Fuel Cost:
              </span>
              <span className="font-semibold text-fuel">
                - {formatCurrency(estimatedFuelCost)}
              </span>
            </div>
          )}

          {estimatedNetEarnings !== null && (
            <div className="flex items-center justify-between font-semibold pt-1 border-t border-forest/20 text-forest dark:text-forest-light">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Est. Net Earnings:
              </span>
              <span className="text-sm font-black">
                {formatCurrency(estimatedNetEarnings)}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-semibold text-danger p-2 rounded-lg bg-danger/10 border border-danger/20">
            {error}
          </p>
        )}

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Complete Session
          </Button>
        </div>
      </form>
    </Modal>
  );
};

