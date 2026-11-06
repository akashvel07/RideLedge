import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVehicle } from '@/context/VehicleContext';
import { CheckCircle2 } from 'lucide-react';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({ isOpen, onClose }) => {
  const { currentOdometer, addReminder } = useVehicle();

  const [reminderType, setReminderType] = useState<'service' | 'insurance' | 'puc' | 'registration' | 'other'>('service');
  const [title, setTitle] = useState<string>('');
  const [targetOdo, setTargetOdo] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [thresholdKm, setThresholdKm] = useState<string>('200');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setReminderType('service');
      setTitle('Engine Oil & Filter Change');
      setTargetOdo((currentOdometer + 3000).toString());
      setTargetDate('');
      setThresholdKm('200');
    }
  }, [isOpen, currentOdometer]);

  const handleTypeSelect = (type: typeof reminderType) => {
    setReminderType(type);
    if (type === 'service') {
      setTitle('Engine Oil & General Service');
      setTargetOdo((currentOdometer + 3000).toString());
      setTargetDate('');
    } else if (type === 'puc') {
      setTitle('Pollution Under Control (PUC) Certificate');
      setTargetOdo('');
    } else if (type === 'insurance') {
      setTitle('Two-Wheeler Insurance Policy Renewal');
      setTargetOdo('');
    } else if (type === 'registration') {
      setTitle('Vehicle Registration Renewal');
      setTargetOdo('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await addReminder({
      reminder_type: reminderType,
      title: title || 'Service Reminder',
      target_odometer: targetOdo ? parseFloat(targetOdo) : null,
      target_date: targetDate || null,
      threshold_km: thresholdKm ? parseInt(thresholdKm, 10) : 200,
      is_completed: false,
    });

    setLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Reminder"
      description="Set alerts for upcoming servicing, oil changes, insurance, or PUC."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type pills */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
            Reminder Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'service', label: 'Service' },
              { id: 'puc', label: 'PUC' },
              { id: 'insurance', label: 'Insurance' },
              { id: 'registration', label: 'Registration' },
              { id: 'other', label: 'Other' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeSelect(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  reminderType === t.id
                    ? 'bg-forest text-white font-semibold shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Target Odometer"
            type="number"
            step="0.1"
            placeholder="e.g. 15000"
            suffixText="km"
            value={targetOdo}
            onChange={(e) => setTargetOdo(e.target.value)}
          />

          <Input
            label="Target Expiry Date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>

        {targetOdo && (
          <Input
            label="Alert Threshold"
            type="number"
            suffixText="km ahead"
            value={thresholdKm}
            onChange={(e) => setThresholdKm(e.target.value)}
            hint="Notify me when vehicle is within this distance of target"
          />
        )}

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Set Reminder
          </Button>
        </div>
      </form>
    </Modal>
  );
};
