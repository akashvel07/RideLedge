import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVehicle } from '@/context/VehicleContext';
import { ServiceCategory } from '@/types/database';
import { Wrench } from 'lucide-react';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: ServiceCategory[] = [
  'Engine oil',
  'General servicing',
  'Brakes',
  'Tyres',
  'Air filter',
  'Battery',
  'Electrical',
  'Other repairs',
];

export const AddServiceModal: React.FC<AddServiceModalProps> = ({ isOpen, onClose }) => {
  const { currentOdometer, addService } = useVehicle();

  const [serviceDate, setServiceDate] = useState<string>('');
  const [odometer, setOdometer] = useState<string>('');
  const [category, setCategory] = useState<ServiceCategory>('Engine oil');
  const [description, setDescription] = useState<string>('');
  const [workshopName, setWorkshopName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [nextOdo, setNextOdo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const todayStr = new Date().toISOString().split('T')[0];
      setServiceDate(todayStr);
      setOdometer(currentOdometer.toString());
      setCategory('Engine oil');
      setDescription('');
      setWorkshopName('');
      setAmount('');
      // Standard recommended oil change interval: ~3000 km
      setNextOdo((currentOdometer + 3000).toString());
      setNotes('');
      setError(null);
    }
  }, [isOpen, currentOdometer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const odoNum = parseFloat(odometer);
    const amountNum = parseFloat(amount);
    const nextOdoNum = nextOdo ? parseFloat(nextOdo) : null;

    if (isNaN(odoNum) || odoNum < 0) {
      setError('Please enter a valid odometer reading');
      return;
    }
    if (isNaN(amountNum) || amountNum < 0) {
      setError('Please enter a valid service amount');
      return;
    }
    if (nextOdoNum !== null && nextOdoNum <= odoNum) {
      setError('Next service odometer target must be greater than current service odometer');
      return;
    }

    setLoading(true);
    await addService({
      service_date: serviceDate,
      odometer: odoNum,
      category,
      description: description || null,
      workshop_name: workshopName || null,
      amount: amountNum,
      next_service_odometer: nextOdoNum,
      receipt_path: null,
      notes: notes || null,
    });
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Service Record"
      description="Record vehicle maintenance, oil replacement, or repairs."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Service Date"
            type="date"
            required
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
          />

          <Input
            label="Odometer"
            type="number"
            step="0.1"
            required
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            suffixText="km"
          />
        </div>

        {/* Category Grid */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
            Service Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-center ${
                  category === cat
                    ? 'bg-forest text-white font-semibold shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Total Amount Paid"
            type="number"
            step="0.01"
            required
            prefixText="₹"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Input
            label="Workshop / Mechanic"
            type="text"
            placeholder="e.g. TVS Authorized / Local"
            value={workshopName}
            onChange={(e) => setWorkshopName(e.target.value)}
          />
        </div>

        <Input
          label="Next Service Target Odometer"
          type="number"
          step="0.1"
          placeholder="e.g. 15000"
          suffixText="km"
          value={nextOdo}
          onChange={(e) => setNextOdo(e.target.value)}
          hint="RideLedger will alert you when you approach this reading"
        />

        <Input
          label="Description / Parts Changed (Optional)"
          type="text"
          placeholder="e.g. Motul 10W-30 engine oil + front brake pads"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
          <Button type="submit" variant="primary" isLoading={loading} className="gap-2">
            <Wrench className="w-4 h-4" />
            Save Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
