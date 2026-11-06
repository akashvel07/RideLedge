import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVehicle } from '@/context/VehicleContext';
import { ShieldCheck, Gauge, Fuel, Wrench, ArrowRight, Check } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { createVehicle, addFuel, addReminder } = useVehicle();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Vehicle data
  const [name, setName] = useState<string>('My Jupiter');
  const [manufacturer, setManufacturer] = useState<string>('TVS');
  const [model, setModel] = useState<string>('Jupiter 110');
  const [registration, setRegistration] = useState<string>('');
  const [initialOdo, setInitialOdo] = useState<string>('10000');

  // Fuel setup
  const [isFullTankNow, setIsFullTankNow] = useState<boolean>(true);
  const [fuelPrice, setFuelPrice] = useState<string>('102.50');
  const [fuelQuantity, setFuelQuantity] = useState<string>('5.0');
  const [totalAmount, setTotalAmount] = useState<string>('512.50');

  // Service setup
  const [nextServiceOdo, setNextServiceOdo] = useState<string>('13000');

  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    const odoNum = parseFloat(initialOdo);
    if (isNaN(odoNum) || odoNum < 0) {
      setError('Please enter a valid initial odometer reading');
      return;
    }

    setLoading(true);
    try {
      // 1. Create vehicle
      await createVehicle({
        name: name || 'TVS Jupiter 110',
        manufacturer: manufacturer || 'TVS',
        model: model || 'Jupiter 110',
        registration_number: registration || null,
        purchase_date: null,
        initial_odometer: odoNum,
        fuel_type: 'petrol',
        user_id: '',
      });

      // 2. If filled full tank now, record initial reference
      if (isFullTankNow) {
        const priceNum = parseFloat(fuelPrice) || 102.5;
        const qtyNum = parseFloat(fuelQuantity) || 5.0;
        const amtNum = parseFloat(totalAmount) || priceNum * qtyNum;

        await addFuel(
          odoNum,
          priceNum,
          qtyNum,
          amtNum,
          'full',
          'Petrol Pump',
          'Initial full-tank calibration fill'
        );
      }

      // 3. If service target provided, record reminder
      if (nextServiceOdo) {
        const nextOdoNum = parseFloat(nextServiceOdo);
        if (nextOdoNum > odoNum) {
          await addReminder({
            reminder_type: 'service',
            title: 'First Service / Oil Change',
            target_odometer: nextOdoNum,
            target_date: null,
            threshold_km: 200,
            is_completed: false,
          });
        }
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Welcome to RideLedger"
      description="Step-by-step setup for your TVS Jupiter 110 scooter"
    >
      <div className="space-y-5">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-forest text-white ring-4 ring-forest/20'
                    : step > s
                    ? 'bg-forest-light dark:bg-forest-dark text-forest dark:text-forest-light'
                    : 'bg-black/5 dark:bg-white/5 text-text-secondary-light'
                }`}
              >
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 sm:w-16 h-0.5 mx-1.5 ${
                    step > s ? 'bg-forest' : 'bg-border-light dark:bg-border-dark'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1: WELCOME & VEHICLE DETAILS */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-xl bg-forest-light/60 dark:bg-forest-dark/20 border border-forest/20 text-xs space-y-1">
              <h4 className="font-bold text-forest dark:text-forest-light text-sm">
                Your bike. Your fuel. Your actual earnings.
              </h4>
              <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                RideLedger tracks real-world mileage using full-tank cycles, separates personal trips from Rapido shifts, and calculates your true net profit after petrol and maintenance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Manufacturer"
                type="text"
                required
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
              />
              <Input
                label="Model"
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>

            <Input
              label="Scooter Nickname"
              type="text"
              placeholder="e.g. TVS Jupiter 110"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Registration Number (Optional)"
              type="text"
              placeholder="e.g. KA-01-AB-1234 / TN-09-XX-9999"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
            />

            <div className="pt-2 flex justify-end">
              <Button type="button" onClick={() => setStep(2)} className="gap-2">
                Next: Odometer
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: INITIAL ODOMETER */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark">
              <Gauge className="w-6 h-6 text-forest shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-text-primary-light dark:text-text-primary-dark">
                  Enter Current Odometer Reading
                </p>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  Look at your scooter speedometer display and enter the reading.
                </p>
              </div>
            </div>

            <Input
              label="Current Odometer Reading"
              type="number"
              step="0.1"
              required
              suffixText="km"
              value={initialOdo}
              onChange={(e) => setInitialOdo(e.target.value)}
              hint="All subsequent trips and fuel fills will build from this baseline"
            />

            <div className="pt-2 flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" onClick={() => setStep(3)} className="gap-2">
                Next: Mileage Calibration
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: FULL TANK MILEAGE SETUP */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-3.5 rounded-xl bg-fuel-light/60 dark:bg-fuel-dark/20 border border-fuel/20 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-fuel-dark dark:text-fuel">
                <Fuel className="w-4 h-4" />
                <span>How Full-Tank-to-Full-Tank Mileage Works</span>
              </div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                When you fill a full tank, it sets a reference point. Any partial refills afterwards accumulate fuel. When you fill full tank again, distance divided by all fuel added gives your true, real-world km/l.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-2">
                Is your petrol tank filled full right now?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullTankNow(true)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    isFullTankNow
                      ? 'bg-fuel text-white border-fuel shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 border-border-light text-text-secondary-light'
                  }`}
                >
                  Yes, Just Filled Full Tank
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullTankNow(false)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    !isFullTankNow
                      ? 'bg-fuel text-white border-fuel shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 border-border-light text-text-secondary-light'
                  }`}
                >
                  No, I will fill later
                </button>
              </div>
            </div>

            {isFullTankNow && (
              <div className="p-3 rounded-xl border border-fuel/20 bg-surface-light dark:bg-surface-dark space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Price / L"
                    type="number"
                    step="0.01"
                    prefixText="₹"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(e.target.value)}
                  />
                  <Input
                    label="Quantity"
                    type="number"
                    step="0.01"
                    suffixText="L"
                    value={fuelQuantity}
                    onChange={(e) => setFuelQuantity(e.target.value)}
                  />
                </div>
                <Input
                  label="Total Amount"
                  type="number"
                  step="0.01"
                  prefixText="₹"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>
            )}

            <div className="pt-2 flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="button" onClick={() => setStep(4)} className="gap-2">
                Next: Service Target
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: SERVICE SETUP & FINISH */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-forest-light/60 dark:bg-forest-dark/20 border border-forest/20">
              <Wrench className="w-6 h-6 text-forest shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-text-primary-light dark:text-text-primary-dark">
                  Service & Maintenance Target
                </p>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  Set your upcoming service target (standard TVS interval is every 3,000 km).
                </p>
              </div>
            </div>

            <Input
              label="Next Service Target Odometer"
              type="number"
              step="0.1"
              suffixText="km"
              value={nextServiceOdo}
              onChange={(e) => setNextServiceOdo(e.target.value)}
              hint="RideLedger will display a live countdown on your dashboard"
            />

            {error && (
              <p className="text-xs font-semibold text-danger p-2 rounded-lg bg-danger/10 border border-danger/20">
                {error}
              </p>
            )}

            <div className="pt-2 flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep(3)} disabled={loading}>
                Back
              </Button>
              <Button type="button" variant="primary" isLoading={loading} onClick={handleFinish} className="gap-2">
                <ShieldCheck className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
