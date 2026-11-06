import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVehicle } from '@/context/VehicleContext';
import { Receipt } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXPENSE_CATEGORIES = [
  'Parking',
  'Toll',
  'Puncture / Tyre repair',
  'Bike wash & cleaning',
  'Helmet & riding gear',
  'Accessories & phone mount',
  'Fines / Challan',
  'Other',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
  const { currentOdometer, addExpense } = useVehicle();

  const [category, setCategory] = useState<string>('Parking');
  const [amount, setAmount] = useState<string>('');
  const [odometer, setOdometer] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCategory('Parking');
      setAmount('');
      setOdometer(currentOdometer ? currentOdometer.toString() : '');
      setDescription('');
      setError(null);
    }
  }, [isOpen, currentOdometer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    await addExpense({
      expense_date: new Date().toISOString(),
      category,
      amount: amountNum,
      odometer: odometer ? parseFloat(odometer) : null,
      description: description || null,
      receipt_path: null,
    });
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Vehicle Expense"
      description="Record miscellaneous expenses like parking, tolls, wash, or gear."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
            Category
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
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
            label="Amount Paid"
            type="number"
            step="0.01"
            required
            prefixText="₹"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Input
            label="Odometer (Optional)"
            type="number"
            step="0.1"
            suffixText="km"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
          />
        </div>

        <Input
          label="Description / Purpose (Optional)"
          type="text"
          placeholder="e.g. Metro station parking during shift"
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
            <Receipt className="w-4 h-4" />
            Save Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
};
