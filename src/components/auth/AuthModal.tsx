import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
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
        else onClose();
      } else if (mode === 'signup') {
        const res = await signUp(email, password, fullName);
        if (res.error) setError(res.error);
        else {
          setSuccess('Account created successfully!');
          setTimeout(() => onClose(), 1000);
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
      description={
        isConfigured
          ? 'Sync your RideLedger vehicle records securely with Supabase.'
          : 'Local profile authentication for RideLedger.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <Input
            label="Full Name"
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

        <Button type="submit" variant="primary" size="md" isLoading={loading} className="w-full">
          {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
        </Button>

        <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-border-dark text-xs">
          {mode === 'signin' ? (
            <>
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-text-secondary-light hover:underline"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-forest font-semibold hover:underline"
              >
                Create Account
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="text-forest font-semibold hover:underline mx-auto"
            >
              Already have an account? Sign In
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};
