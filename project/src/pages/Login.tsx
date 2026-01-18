import { useState, FormEvent } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { navigate } from '../utils/router';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  if (user) {
    navigate('/app');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 fade-in">
          <h1 className="text-3xl font-medium text-[var(--text-primary)] mb-2">Welcome back</h1>
          <p className="text-[var(--text-secondary)]">Sign in to your Unspendify account</p>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-lg border border-soft p-8 shadow-soft fade-in fade-in-delay-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg-tertiary)] border border-soft rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:glow-focus transition-all duration-320"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={18} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg-tertiary)] border border-soft rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:glow-focus transition-all duration-320"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="rounded border-soft bg-[var(--bg-tertiary)] text-[var(--accent)] focus:ring-[var(--accent)] transition-all duration-300" />
                <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors duration-300">Remember me</span>
              </label>
              <a href="/reset-password" className="text-[var(--text-primary)] hover:text-[var(--accent)] font-medium transition-colors duration-300">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--accent)] text-[var(--text-primary)] rounded-lg font-medium glow-subtle hover:glow-hover hover:brightness-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <a href="/signup" className="text-[var(--text-primary)] font-medium hover:text-[var(--accent)] transition-colors duration-300">
              Sign up
            </a>
          </div>
        </div>

        <div className="mt-6 text-center fade-in fade-in-delay-2">
          <a href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
