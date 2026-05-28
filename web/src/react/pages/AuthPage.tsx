import React, { useEffect, useState } from 'react';
import { User, Mail, Globe2, Lock, Eye, EyeOff, AlertCircle, Check, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import * as api from '../../api';
import { goTo, currentRoute } from '../../router';

// Migrated from vanilla pages/auth.ts — login + register (dual mode) + Google OAuth.

type Mode = 'login' | 'register';

function passwordStrengthTier(pw: string): 'empty' | 'weak' | 'fair' | 'good' | 'strong' {
  if (!pw) return 'empty';
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score >= 4) return 'strong';
  if (score === 3) return 'good';
  if (score === 2) return 'fair';
  return 'weak';
}

const STRENGTH_LABEL: Record<string, string> = {
  empty: 'Password strength', weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong',
};

export default function AuthPage() {
  const mode: Mode = currentRoute().startsWith('/register') ? 'register' : 'login';
  const isRegister = mode === 'register';

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Google OAuth: load the GSI script, init, render the button, wire the global callback.
  useEffect(() => {
    (window as any).handleGoogleCredentialResponse = async (response: any) => {
      try {
        const res = await api.googleLogin(response.credential);
        if (res.accessToken) {
          localStorage.setItem('etunisia_token', res.accessToken);
          goTo('/');
        }
      } catch (err: any) {
        setError(err?.message || 'Google sign-in failed.');
      }
    };

    const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId === 'your-google-client-id.apps.googleusercontent.com') return;

    const setup = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({
        client_id: googleClientId,
        callback: (window as any).handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      const el = document.querySelector('.g_id_signin');
      if (el) g.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: '100%', text: 'continue_with' });
    };

    if ((window as any).google?.accounts?.id) {
      setup();
    } else if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = setup;
      document.head.appendChild(script);
    }
  }, [mode]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res: any = await api.login(email.trim(), password);
      if (res.accessToken) {
        localStorage.setItem('etunisia_token', res.accessToken);
        import('../../push-notifications').then((m) => m.initPushNotifications()).catch(() => {});
        goTo('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
      setBusy(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    const refQs = currentRoute().includes('?') ? currentRoute().split('?')[1] : '';
    const ref = new URLSearchParams(refQs).get('ref') || undefined;
    try {
      const res: any = await api.register({ name: fullname.trim(), email: email.trim(), password, country: country.trim(), ref });
      if (res.accessToken) {
        localStorage.setItem('etunisia_token', res.accessToken);
        goTo('/onboarding');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
      setBusy(false);
    }
  };

  const tier = passwordStrengthTier(password);
  const cfg = isRegister
    ? { title: 'Join the community', subtitle: 'Discover hidden Tunisia with locals who know every secret corner.', cta: 'Create account', busyLabel: 'Creating account…', altText: 'Already a member?', altLink: '#/login', altLabel: 'Sign in', eyebrow: 'Create account' }
    : { title: 'Ahlan wa sahlan', subtitle: 'Welcome back. Your Tunisia adventure continues.', cta: 'Sign in', busyLabel: 'Signing in…', altText: "Don't have an account?", altLink: '#/register', altLabel: 'Create one', eyebrow: 'Welcome back' };

  return (
    <div className="auth-page page-enter" data-mode={mode}>
      <div className="auth-bg" aria-hidden="true">
        <img src="/img/hero2.png" alt="" className="auth-bg-img" />
        <div className="auth-bg-overlay" />
        <div className="auth-bg-orbs"><span className="auth-bg-orb" /><span className="auth-bg-orb" /></div>
      </div>

      <main className="auth-content">
        <a href="#/" className="auth-logo">
          <img src="/icon.png" alt="" />
          <span>e-Tunisia</span>
        </a>

        <section className="auth-card">
          <header className="auth-head">
            <span className="auth-eyebrow">{isRegister ? <UserPlus /> : <LogIn />} {cfg.eyebrow}</span>
            <h1>{cfg.title}</h1>
            <p>{cfg.subtitle}</p>
          </header>

          {error && (
            <div className="auth-error" role="alert">
              <span className="auth-error-icon" aria-hidden="true"><AlertCircle /></span>
              <span className="auth-error-text">{error}</span>
            </div>
          )}

          <div className="auth-social">
            <div className="g_id_signin" data-type="standard" data-shape="rectangular" data-theme="outline" data-text={isRegister ? 'signup_with' : 'signin_with'} data-size="large" data-width="100%" />
          </div>
          <div className="auth-divider"><span>or</span></div>

          <form className="auth-form" onSubmit={isRegister ? onRegister : onLogin} noValidate>
            {isRegister && (
              <div className="auth-field">
                <label htmlFor="fullname" className="auth-field-label">Full name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true"><User /></span>
                  <input type="text" id="fullname" className="auth-input" placeholder="Your name" required autoComplete="name" value={fullname} onChange={(e) => setFullname(e.target.value)} />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor={isRegister ? 'reg-email' : 'email'} className="auth-field-label">Email</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true"><Mail /></span>
                <input type="email" id={isRegister ? 'reg-email' : 'email'} className="auth-input" placeholder="you@example.com" required autoComplete={isRegister ? 'email' : 'username'} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            {isRegister && (
              <div className="auth-field">
                <label htmlFor="country" className="auth-field-label">Country</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true"><Globe2 /></span>
                  <input type="text" id="country" className="auth-input" placeholder="Where are you from?" autoComplete="country-name" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor={isRegister ? 'reg-password' : 'password'} className="auth-field-label">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true"><Lock /></span>
                <input
                  type={showPw ? 'text' : 'password'}
                  id={isRegister ? 'reg-password' : 'password'}
                  className="auth-input"
                  placeholder={isRegister ? 'Create a password' : 'Your password'}
                  required
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="auth-input-toggle" aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw} onClick={() => setShowPw((s) => !s)}>
                  {showPw ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {isRegister && <span className="auth-input-helper">At least 6 characters.</span>}
            </div>

            {isRegister && (
              <div className="auth-strength" data-tier={tier}>
                <div className="auth-strength-bar"><span className="auth-strength-fill" /></div>
                <span className="auth-strength-label">{STRENGTH_LABEL[tier]}</span>
              </div>
            )}

            {!isRegister && (
              <div className="auth-row">
                <label className="auth-check">
                  <input type="checkbox" />
                  <span className="auth-check-box" aria-hidden="true"><Check /></span>
                  <span>Remember me</span>
                </label>
                <a href="#/forgot-password" className="auth-link">Forgot password?</a>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={busy}>
              <span className="auth-submit-label">{busy ? cfg.busyLabel : cfg.cta}</span>
              <ArrowRight className="auth-submit-icon" />
            </button>
          </form>

          <div className="auth-alt">
            {cfg.altText} <a href={cfg.altLink} className="auth-link-bold">{cfg.altLabel}</a>
          </div>
        </section>

        <p className="auth-footer">
          By continuing, you agree to our <a href="#/about" className="auth-link">terms</a> and support Tunisian local businesses.
        </p>
      </main>
    </div>
  );
}
