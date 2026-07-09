import '../../styles/auth.css';
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import * as api from '../../api';
import { goTo, currentPath } from '../../router';

// Migrated from vanilla pages/password-reset.ts — two modes:
//  /forgot-password        → request a reset link
//  /reset-password/:token  → set a new password

function ForgotForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res: any = await api.requestPasswordReset(email.trim());
      setSuccess('Check your email for a reset link. (Dev mode: check console for token)');
      if (res?.token) console.log('DEV MODE — Reset token:', res.token);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">e-Tunisia</div>
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <label htmlFor="reset-email" className="auth-field-label">Email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true"><Mail /></span>
              <input
                type="email"
                id="reset-email"
                className="auth-input"
                placeholder="you@example.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="auth-btn primary" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
          <p className="auth-alt">
            Remember your password? <a href="#/login" className="auth-alt-link">Sign in</a>
          </p>
          <div className="auth-error" role="alert" aria-live="polite">{error}</div>
          {success && <div className="auth-success" role="status" aria-live="polite">{success}</div>}
        </form>
      </div>
    </div>
  );
}

function NewPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setSuccess('Password updated! Redirecting to login…');
      setTimeout(() => goTo('/login'), 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">e-Tunisia</div>
          <h1 className="auth-title">Create new password</h1>
          <p className="auth-subtitle">Enter a new password for your account.</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <label htmlFor="new-password" className="auth-field-label">New password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true"><Lock /></span>
              <input
                type={show ? 'text' : 'password'}
                id="new-password"
                className="auth-input"
                placeholder="Min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-input-toggle"
                aria-label={show ? 'Hide password' : 'Show password'}
                aria-pressed={show}
                onClick={() => setShow((s) => !s)}
              >
                {show ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-btn primary" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
          <div className="auth-error" role="alert" aria-live="polite">{error}</div>
          {success && <div className="auth-success" role="status" aria-live="polite">{success}</div>}
        </form>
      </div>
    </div>
  );
}

export default function PasswordResetPage() {
  const m = currentPath().match(/^\/reset-password\/([a-zA-Z0-9]+)/);
  return m ? <NewPasswordForm token={m[1]} /> : <ForgotForm />;
}
