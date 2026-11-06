import React, { useState } from 'react';
import { usePWA } from '@/context/PWAContext';
import { Smartphone, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const InstallPromptBanner: React.FC = () => {
  const { isInstallable, isStandalone, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  if (isStandalone || !isInstallable || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    await promptInstall();
    setIsInstalling(false);
  };

  return (
    <div className="relative p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-forest to-forest-dark text-white shadow-md shadow-forest/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="text-xs font-bold tracking-tight uppercase text-white/90">
            Install RideLedger PWA
          </h4>
          <p className="text-xs text-white/80">
            Install on your home screen for full-screen view and quick access during rides.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <Button
          onClick={handleInstall}
          isLoading={isInstalling}
          variant="secondary"
          size="sm"
          className="bg-white text-forest hover:bg-white/90 font-bold gap-1.5 text-xs shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Install App
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

