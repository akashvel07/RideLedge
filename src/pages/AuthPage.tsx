import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Cloud, Wifi, CheckCircle2 } from 'lucide-react';

interface AuthPageProps {
  onContinueOffline?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onContinueOffline }) => {
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signup');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) setError(res.error);
      } else if (mode === 'signup') {
        const res = await signUp(email, password, fullName);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccess('Account created! Logging you in...');
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(email);
        if (res.error) setError(res.error);
        else setSuccess('Password reset link sent to your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-background-light dark:bg-background-dark animate-in fade-in">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-forest mx-auto flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-forest/20">
            RL
          </div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary-light dark:text-text-primary-dark">
            RideLedger
          </h1>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
            Your bike. Your fuel. Your actual earnings.
          </p>
        </div>

        {/* Cloud Sync Benefit Notice */}
        <div className="p-3.5 rounded-xl bg-forest-light/60 dark:bg-forest-dark/20 border border-forest/20 flex items-center gap-3 text-xs">
          <Cloud className="w-5 h-5 text-forest shrink-0" />
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            <strong className="text-forest dark:text-forest-light">Multi-Device Cloud Sync:</strong> Sign in with the same email on mobile & desktop to share all your vehicle records.
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm space-y-5">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-surface-light dark:bg-surface-dark text-forest shadow-sm'
                  : 'text-text-secondary-light hover:text-text-primary-light'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-surface-light dark:bg-surface-dark text-forest shadow-sm'
                  : 'text-text-secondary-light hover:text-text-primary-light'
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Your Name"
                type="text"
                required
                placeholder="e.g. Akash Vel"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            )}

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="rider@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {mode !== 'forgot' && (
              <Input
                label="Password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}

            {error && (
              <p className="text-xs font-semibold text-danger p-2.5 rounded-lg bg-danger/10 border border-danger/20">
                {error}
              </p>
            )}

            {success && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-forest/10 border border-forest/20 text-forest text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full">
              {mode === 'signup' ? 'Create Account & Connect' : mode === 'signin' ? 'Sign In to My Account' : 'Send Reset Link'}
            </Button>
          </form>

          {mode === 'signin' && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-xs text-text-secondary-light hover:underline"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>

        {/* Offline Option */}
        {onContinueOffline && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onContinueOffline}
              className="text-xs font-semibold text-text-secondary-light hover:text-text-primary-light underline flex items-center justify-center gap-1.5 mx-auto"
            >
              <Wifi className="w-3.5 h-3.5" />
              Continue in Offline/Guest Mode (Saved on this device only)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
