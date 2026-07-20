import '../../styles/auth.css';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { User, Mail, Globe2, Lock, Eye, EyeOff, AlertCircle, ArrowRight, UserPlus, LogIn, MapPin, Sparkles } from 'lucide-react';
import * as api from '../../api';
import { goTo, currentRoute, replace } from '../../router';
import { track } from '../../analytics';
import { getStoredRef, clearStoredRef } from '../../referral';

// Split-screen auth: imagery/welcome panel + form, with an animated side-switch
// between Sign in and Sign up (in-place, no full reload). Migrated from auth.ts.

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
  const [mode, setMode] = useState<Mode>(currentRoute().startsWith('/register') ? 'register' : 'login');
  const isRegister = mode === 'register';
  const reduce = useReducedMotion();

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Switch mode in place + keep the URL in sync for deep-linking (no full reload).
  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setError('');
    setMode(next);
    replace(next === 'register' ? '/register' : '/login');
  };

  // Keep in sync if the route changes externally (e.g. back button).
  useEffect(() => {
    const m: Mode = currentRoute().startsWith('/register') ? 'register' : 'login';
    setMode(m);
  }, []);

  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  const googleEnabled = !!googleClientId && googleClientId !== 'your-google-client-id.apps.googleusercontent.com';

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
    if (!googleEnabled) return;
    const setup = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({ client_id: googleClientId, callback: (window as any).handleGoogleCredentialResponse, auto_select: false, cancel_on_tap_outside: true });
      const el = document.querySelector('.g_id_signin');
      if (el) g.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: '100%', text: 'continue_with' });
    };
    if ((window as any).google?.accounts?.id) setup();
    else if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true; script.defer = true; script.onload = setup;
      document.head.appendChild(script);
    }
  }, [mode, googleEnabled, googleClientId]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
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
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setBusy(true);
    const refQs = currentRoute().includes('?') ? currentRoute().split('?')[1] : '';
    // Prefer the ref in the URL; fall back to one stashed from an earlier referral
    // link (e.g. a shared passport card the visitor opened before signing up).
    const ref = (new URLSearchParams(refQs).get('ref') || getStoredRef()) || undefined;
    try {
      const res: any = await api.register({ name: fullname.trim(), email: email.trim(), password, country: country.trim(), ref });
      if (res.accessToken) {
        localStorage.setItem('etunisia_token', res.accessToken);
        clearStoredRef();
        track('signup', { referred: !!ref });
        goTo('/onboarding');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
      setBusy(false);
    }
  };

  const tier = passwordStrengthTier(password);
  const cfg = isRegister
    ? { title: 'Join the community', subtitle: 'Discover hidden Tunisia with locals who know every secret corner.', cta: 'Create account', busyLabel: 'Creating account…', altText: 'Already a member?', altLabel: 'Sign in', altMode: 'login' as Mode, eyebrow: 'Create account' }
    : { title: 'Ahlan wa sahlan', subtitle: 'Welcome back. Your Tunisia adventure continues.', cta: 'Sign in', busyLabel: 'Signing in…', altText: "Don't have an account?", altLabel: 'Create one', altMode: 'register' as Mode, eyebrow: 'Sign in' };

  const layoutTransition = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 260, damping: 30 };

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

        <section className="auth-split" data-mode={mode}>
          {/* Imagery / welcome panel — slides to the opposite side on toggle */}
          <motion.aside className="auth-visual" layout transition={layoutTransition}>
            <div className="auth-visual-media" aria-hidden="true">
              <img src={isRegister ? '/img/hero3.png' : '/img/hero1.png'} alt="" />
              <div className="auth-visual-scrim" />
            </div>
            <div className="auth-visual-body">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.28 }}
                >
                  <span className="auth-visual-eyebrow"><Sparkles /> {isRegister ? 'Start exploring' : 'Welcome back'}</span>
                  <h2 className="auth-visual-title">{isRegister ? 'Your Tunisia, unlocked.' : 'The real Tunisia is waiting.'}</h2>
                  <p className="auth-visual-text">{isRegister ? 'Join 12,400+ travelers and locals sharing the places guidebooks miss.' : 'Pick up right where you left off — your saved places, trips, and people.'}</p>
                </motion.div>
              </AnimatePresence>
              <div className="auth-visual-switch">
                <span>{cfg.altText}</span>
                <button type="button" className="auth-visual-switch-btn" onClick={() => switchMode(cfg.altMode)}>{cfg.altLabel}</button>
              </div>
              <div className="auth-visual-meta"><MapPin /> 24 governorates · 2,500+ hidden places</div>
            </div>
          </motion.aside>

          {/* Form panel */}
          <motion.div className="auth-formside" layout transition={layoutTransition}>
            <div className="auth-card">
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

              {googleEnabled && (
                <>
                  <div className="auth-social">
                    <div className="g_id_signin" data-type="standard" data-shape="rectangular" data-theme="outline" data-text={isRegister ? 'signup_with' : 'signin_with'} data-size="large" data-width="100%" />
                  </div>
                  <div className="auth-divider"><span>or</span></div>
                </>
              )}

              <AnimatePresence mode="wait" initial={false}>
                <motion.form
                  key={mode}
                  className="auth-form"
                  onSubmit={isRegister ? onRegister : onLogin}
                  noValidate
                  initial={reduce ? false : { opacity: 0, x: isRegister ? 24 : -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: isRegister ? -24 : 24 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
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
                      <input type="email" id={isRegister ? 'reg-email' : 'email'} className="auth-input" placeholder="you@example.com" required autoComplete={isRegister ? 'email' : 'username'} spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} />
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
                      {/* "Remember me" was a checkbox wired to nothing — sessions
                          already persist. A control that does nothing erodes trust. */}
                      <a href="#/forgot-password" className="auth-link" style={{ marginLeft: 'auto' }}>Forgot password?</a>
                    </div>
                  )}

                  <button type="submit" className="auth-submit" disabled={busy}>
                    <span className="auth-submit-label">{busy ? cfg.busyLabel : cfg.cta}</span>
                    <ArrowRight className="auth-submit-icon" />
                  </button>
                </motion.form>
              </AnimatePresence>

              <div className="auth-alt">
                {cfg.altText} <button type="button" className="auth-link-bold" onClick={() => switchMode(cfg.altMode)}>{cfg.altLabel}</button>
              </div>
            </div>
          </motion.div>
        </section>

        <p className="auth-footer">
          By continuing, you agree to our <a href="#/about" className="auth-link">terms</a> and support Tunisian local businesses.
        </p>
      </main>
    </div>
  );
}
