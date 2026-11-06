import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SyncProvider } from './context/SyncContext';
import { PWAProvider } from './context/PWAContext';
import { VehicleProvider, useVehicle } from './context/VehicleContext';
import { Header } from './components/common/Header';
import { BottomNav, NavTab } from './components/common/BottomNav';
import { Sidebar } from './components/common/Sidebar';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { TripsPage } from './pages/TripsPage';
import { FuelPage } from './pages/FuelPage';
import { ServicePage } from './pages/ServicePage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';

// Modals
import { StartRapidoModal } from './components/trips/StartRapidoModal';
import { EndRapidoModal } from './components/trips/EndRapidoModal';
import { PersonalTripModal } from './components/trips/PersonalTripModal';
import { AddFuelModal } from './components/fuel/AddFuelModal';
import { AddServiceModal } from './components/service/AddServiceModal';
import { AddReminderModal } from './components/service/AddReminderModal';
import { AddExpenseModal } from './components/insights/AddExpenseModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { AuthModal } from './components/auth/AuthModal';

const MainAppContent: React.FC = () => {
  const { user, enableGuestMode } = useAuth();
  const { needsOnboarding, loading } = useVehicle();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Modal open states
  const [startRapidoOpen, setStartRapidoOpen] = useState<boolean>(false);
  const [endRapidoOpen, setEndRapidoOpen] = useState<boolean>(false);
  const [personalTripOpen, setPersonalTripOpen] = useState<boolean>(false);
  const [addFuelOpen, setAddFuelOpen] = useState<boolean>(false);
  const [addServiceOpen, setAddServiceOpen] = useState<boolean>(false);
  const [addReminderOpen, setAddReminderOpen] = useState<boolean>(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark">
        <div className="w-12 h-12 rounded-2xl bg-forest flex items-center justify-center text-white font-black text-xl animate-pulse shadow-xl shadow-forest/20">
          RL
        </div>
        <p className="mt-4 text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark tracking-wide uppercase">
          Loading RideLedger...
        </p>
      </div>
    );
  }

  // If user is not authenticated, prompt to Sign Up / Sign In
  if (!user) {
    return <AuthPage onContinueOffline={enableGuestMode} />;
  }

  return (
    <div className="min-h-screen flex bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">
      {/* Desktop Sidebar */}
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <Header
          onOpenSettings={() => setCurrentTab('settings')}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        {/* Content Container */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-24 md:pb-12">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onStartRapido={() => setStartRapidoOpen(true)}
              onEndRapido={() => setEndRapidoOpen(true)}
              onAddFuel={() => setAddFuelOpen(true)}
              onAddPersonalTrip={() => setPersonalTripOpen(true)}
              onAddExpense={() => setAddExpenseOpen(true)}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'trips' && (
            <TripsPage
              onStartRapido={() => setStartRapidoOpen(true)}
              onEndRapido={() => setEndRapidoOpen(true)}
              onAddPersonalTrip={() => setPersonalTripOpen(true)}
            />
          )}

          {currentTab === 'fuel' && <FuelPage onAddFuel={() => setAddFuelOpen(true)} />}

          {currentTab === 'service' && (
            <ServicePage
              onAddService={() => setAddServiceOpen(true)}
              onAddReminder={() => setAddReminderOpen(true)}
            />
          )}

          {currentTab === 'insights' && <InsightsPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
      </div>

      {/* Global Modals */}
      <StartRapidoModal isOpen={startRapidoOpen} onClose={() => setStartRapidoOpen(false)} />
      <EndRapidoModal isOpen={endRapidoOpen} onClose={() => setEndRapidoOpen(false)} />
      <PersonalTripModal isOpen={personalTripOpen} onClose={() => setPersonalTripOpen(false)} />
      <AddFuelModal isOpen={addFuelOpen} onClose={() => setAddFuelOpen(false)} />
      <AddServiceModal isOpen={addServiceOpen} onClose={() => setAddServiceOpen(false)} />
      <AddReminderModal isOpen={addReminderOpen} onClose={() => setAddReminderOpen(false)} />
      <AddExpenseModal isOpen={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Onboarding Wizard when vehicle list is empty */}
      <OnboardingModal isOpen={needsOnboarding} onComplete={() => {}} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SyncProvider>
          <PWAProvider>
            <VehicleProvider>
              <MainAppContent />
            </VehicleProvider>
          </PWAProvider>
        </SyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

