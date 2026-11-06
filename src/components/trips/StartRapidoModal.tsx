import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVehicle } from '@/context/VehicleContext';
import { AlertCircle, Play } from 'lucide-react';

interface StartRapidoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StartRapidoModal: React.FC<StartRapidoModalProps> = ({ isOpen, onClose }) => {
  const { currentOdometer, startRapidoTrip } = useVehicle();
  const [startOdo, setStartOdo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStartOdo(currentOdometer.toString());
      setNotes('');
      setError(null);
      setWarning(null);
    }
  }, [isOpen, currentOdometer]);

  const handleOdoChange = (val: string) => {
    setStartOdo(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (num < currentOdometer) {
        setError(`Cannot be less than latest valid reading (${currentOdometer} km)`);
        setWarning(null);
      } else {
        setError(null);
        if (num > currentOdometer + 150) {
          setWarning(`Reading is ${Math.round(num - currentOdometer)} km higher than previous. Please verify.`);
        } else {
          setWarning(null);
        }
      }
    }
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(startOdo);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid odometer reading');
      return;
    }

    if (num < currentOdometer) {
      setError(`Starting odometer cannot be less than current odometer (${currentOdometer} km)`);
      return;
    }

    setLoading(true);
    const res = await startRapidoTrip(num, notes);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to start trip');
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start Rapido Session"
      description="Begin tracking distance and earnings for your bike taxi shift."
    >
      <form onSubmit={handleStart} className="space-y-4">
        <Input
          label="Starting Odometer"
          type="number"
          step="0.1"
          required
          value={startOdo}
          onChange={(e) => handleOdoChange(e.target.value)}
          suffixText="km"
          error={error || undefined}
          hint={`Latest recorded reading: ${currentOdometer} km`}
        />

        {warning && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        <Input
          label="Session Notes (Optional)"
          type="text"
          placeholder="e.g. Morning rush hour / Peak demand shift"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} className="gap-2">
            <Play className="w-4 h-4 fill-current" />
            Start Session
          </Button>
        </div>
      </form>
    </Modal>
  );
};
