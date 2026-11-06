import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVehicle } from '@/context/VehicleContext';
import { validateFuelEntryMath } from '@/lib/calculations/fuel';
import { Fuel, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AddFuelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFuelModal: React.FC<AddFuelModalProps> = ({ isOpen, onClose }) => {
  const { currentOdometer, fuelEntries, addFuel } = useVehicle();

  // Suggest last known fuel price or default ~ ₹102.50
  const defaultPrice = fuelEntries.length > 0 ? fuelEntries[0].price_per_litre.toString() : '102.50';

  const [odometer, setOdometer] = useState<string>('');
  const [pricePerLitre, setPricePerLitre] = useState<string>(defaultPrice);
  const [quantityLitres, setQuantityLitres] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [fillType, setFillType] = useState<'full' | 'partial'>('full');
  const [stationName, setStationName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setOdometer(currentOdometer.toString());
      setPricePerLitre(defaultPrice);
      setQuantityLitres('');
      setTotalAmount('');
      setFillType('full');
      setStationName('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, currentOdometer, defaultPrice]);

  // When quantity or price changes, auto-calculate total amount
  const handlePriceChange = (val: string) => {
    setPricePerLitre(val);
    const p = parseFloat(val);
    const q = parseFloat(quantityLitres);
    if (!isNaN(p) && !isNaN(q) && q > 0) {
      setTotalAmount((p * q).toFixed(2));
    }
  };

  const handleQuantityChange = (val: string) => {
    setQuantityLitres(val);
    const q = parseFloat(val);
    const p = parseFloat(pricePerLitre);
    if (!isNaN(p) && !isNaN(q) && p > 0) {
      setTotalAmount((p * q).toFixed(2));
    }
  };

  const odoNum = parseFloat(odometer) || 0;
  const priceNum = parseFloat(pricePerLitre) || 0;
  const qtyNum = parseFloat(quantityLitres) || 0;
  const amountNum = parseFloat(totalAmount) || 0;

  const mathCheck = validateFuelEntryMath(priceNum, qtyNum, amountNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (odoNum < currentOdometer) {
      setError(`Odometer reading (${odoNum} km) cannot be less than current (${currentOdometer} km)`);
      return;
    }
    if (priceNum <= 0) {
      setError('Price per litre must be greater than zero');
      return;
    }
    if (qtyNum <= 0) {
      setError('Litres filled must be greater than zero');
      return;
    }
    if (amountNum <= 0) {
      setError('Total amount must be greater than zero');
      return;
    }

    setLoading(true);
    const res = await addFuel(
      odoNum,
      priceNum,
      qtyNum,
      amountNum,
      fillType,
      stationName,
      notes
    );
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to record fuel entry');
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Fuel Entry"
      description="Record petrol refill to track expenses and calculate real mileage."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fill Type Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
            Refill Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFillType('full')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                fillType === 'full'
                  ? 'bg-fuel text-white border-fuel shadow-sm'
                  : 'bg-black/5 dark:bg-white/5 border-border-light dark:border-border-dark text-text-secondary-light'
              }`}
            >
              <Fuel className="w-4 h-4" />
              Full Tank (Auto-calcs Mileage)
            </button>
            <button
              type="button"
              onClick={() => setFillType('partial')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                fillType === 'partial'
                  ? 'bg-fuel text-white border-fuel shadow-sm'
                  : 'bg-black/5 dark:bg-white/5 border-border-light dark:border-border-dark text-text-secondary-light'
              }`}
            >
              Partial Refill
            </button>
          </div>
          <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-1">
            {fillType === 'full'
              ? '★ A full tank completes the cycle from your previous full fill to calculate actual km/l.'
              : 'Partial refills accumulate fuel and will be counted when you next fill a full tank.'}
          </p>
        </div>

        <Input
          label="Current Odometer"
          type="number"
          step="0.1"
          required
          value={odometer}
          onChange={(e) => setOdometer(e.target.value)}
          suffixText="km"
          hint={`Latest recorded reading: ${currentOdometer} km`}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Petrol Price / Litre"
            type="number"
            step="0.01"
            required
            prefixText="₹"
            value={pricePerLitre}
            onChange={(e) => handlePriceChange(e.target.value)}
          />

          <Input
            label="Quantity Filled"
            type="number"
            step="0.001"
            required
            suffixText="L"
            value={quantityLitres}
            onChange={(e) => handleQuantityChange(e.target.value)}
          />
        </div>

        <Input
          label="Total Paid Amount"
          type="number"
          step="0.01"
          required
          prefixText="₹"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          hint="Edit if petrol pump rounded off amount on receipt"
        />

        {mathCheck.hasDiscrepancy && qtyNum > 0 && priceNum > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Price × Litres is ₹{mathCheck.calculatedAmount}. Difference of ₹{mathCheck.difference} recorded as pump adjustment.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fuel Station (Optional)"
            type="text"
            placeholder="e.g. IndianOil / HP"
            value={stationName}
            onChange={(e) => setStationName(e.target.value)}
          />

          <Input
            label="Notes (Optional)"
            type="text"
            placeholder="e.g. Regular petrol"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
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
          <Button type="submit" variant="fuel" isLoading={loading} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Save Fuel Entry
          </Button>
        </div>
      </form>
    </Modal>
  );
};
