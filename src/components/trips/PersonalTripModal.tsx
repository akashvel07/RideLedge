import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVehicle } from '@/context/VehicleContext';
import { formatDistance } from '@/lib/utils/formatters';
import { UserCheck } from 'lucide-react';

interface PersonalTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PURPOSES = ['Home', 'Shopping', 'Family', 'Work', 'Other'] as const;

export const PersonalTripModal: React.FC<PersonalTripModalProps> = ({ isOpen, onClose }) => {
  const { currentOdometer, addPersonalTrip } = useVehicle();

  const [startOdo, setStartOdo] = useState<string>('');
  const [endOdo, setEndOdo] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('Home');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStartOdo(currentOdometer.toString());
      setEndOdo(currentOdometer.toString());
      setPurpose('Home');
      setNotes('');
      setError(null);
    }
  }, [isOpen, currentOdometer]);

  const startNum = parseFloat(startOdo) || 0;
  const endNum = parseFloat(endOdo) || 0;
  const distance = Math.max(0, endNum - startNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endNum < startNum) {
      setError(`Ending odometer (${endNum} km) cannot be less than starting (${startNum} km)`);
      return;
    }

    setLoading(true);
    const res = await addPersonalTrip(startNum, endNum, purpose, notes);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to save personal trip');
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Personal Trip"
      description="Track personal scooting distance separate from your Rapido business."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Odometer"
            type="number"
            step="0.1"
            required
            value={startOdo}
            onChange={(e) => setStartOdo(e.target.value)}
            suffixText="km"
          />

          <Input
            label="End Odometer"
            type="number"
            step="0.1"
            required
            value={endOdo}
            onChange={(e) => setEndOdo(e.target.value)}
            suffixText="km"
          />
        </div>

        {/* Calculated Distance */}
        <div className="p-3 rounded-lg bg-personal-light/60 dark:bg-personal-dark/20 border border-personal/20 flex items-center justify-between text-xs">
          <span className="text-text-secondary-light dark:text-text-secondary-dark font-medium">
            Trip Distance:
          </span>
          <span className="font-bold text-personal text-sm">{formatDistance(distance, 1)}</span>
        </div>

        {/* Purpose Segmented Control */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
            Purpose
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PURPOSES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPurpose(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  purpose === p
                    ? 'bg-personal text-white font-semibold shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Notes (Optional)"
          type="text"
          placeholder="e.g. Grocery run to market"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && (
          <p className="text-xs font-semibold text-danger p-2 rounded-lg bg-danger/10 border border-danger/20">
            {error}
          </p>
        )}

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="personal" isLoading={loading} className="gap-2">
            <UserCheck className="w-4 h-4" />
            Save Personal Trip
          </Button>
        </div>
      </form>
    </Modal>
  );
};

