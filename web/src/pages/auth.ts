// ============================================
// AUTH PAGES — Login / Register
// Cinematic background + token-driven card chrome.
// Per design-system/pages/auth.md.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

export function renderLoginPage(): string {
  return renderAuthPage({
    mode: 'login',
    title: 'Ahlan wa sahlan',
    subtitle: 'Welcome back. Your Tunisia adventure continues.',
    ctaText: 'Sign in',
    altText: "Don't have an account?",
    altLink: '#/register',
    altLabel: 'Create one',
  });
}

export function renderRegisterPage(): string {
  return renderAuthPage({
    mode: 'register',
    title: 'Join the community',
    subtitle: 'Discover hidden Tunisia with locals who know every secret corner.',
    ctaText: 'Create account',
    altText: 'Already a member?',
    altLink: '#/login',
    altLabel: 'Sign in',
  });
}

interface AuthConfig {
  mode: 'login' | 'register';
  title: string;
  subtitle: string;
  ctaText: string;
  altText: string;
  altLink: string;
  altLabel: string;
}

function field(opts: {
  id: string;
  label: string;
  icon: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  autocomplete?: string;
  helper?: string;
  passwordToggle?: boolean;
}): string {
  return `
    <div class="auth-field">
      <label for="${opts.id}" class="auth-field-label">${opts.label}</label>
      <div class="auth-input-wrap">
        <span class="auth-input-icon" aria-hidden="true"><i class="lucide-${opts.icon}"></i></span>
        <input
          type="${opts.type}"
          id="${opts.id}"
          class="auth-input"
          placeholder="${opts.placeholder || ''}"
          ${opts.required ? 'required' : ''}
          ${opts.autocomplete ? `autocomplete="${opts.autocomplete}"` : ''}
        />
        ${opts.passwordToggle ? `
          <button type="button" class="auth-input-toggle" data-toggle="${opts.id}" aria-label="Show password" aria-pressed="false">
            <i class="lucide-eye"></i>
          </button>
        ` : ''}
      </div>
      ${opts.helper ? `<span class="auth-input-helper">${opts.helper}</span>` : ''}
    </div>
  `;
}

function renderAuthPage(cfg: AuthConfig): string {
  const isRegister = cfg.mode === 'register';

  return `
    <div class="auth-page page-enter" data-mode="${cfg.mode}">
      <div class="auth-bg" aria-hidden="true">
        <img src="/img/hero2.png" alt="" class="auth-bg-img" />
        <div class="auth-bg-overlay"></div>
        <div class="auth-bg-orbs">
          <span class="auth-bg-orb"></span>
          <span class="auth-bg-orb"></span>
        </div>
      </div>

      <main class="auth-content">
        <a href="#/" class="auth-logo">
          <img src="/icon.png" alt="" />
          <span>e-Tunisia</span>
        </a>

        <section class="auth-card">
          <header class="auth-head">
            <span class="auth-eyebrow">
              <i class="lucide-${isRegister ? 'user-plus' : 'log-in'}"></i>
              ${isRegister ? 'Create account' : 'Welcome back'}
            </span>
            <h1>${cfg.title}</h1>
            <p>${cfg.subtitle}</p>
          </header>

          <div class="auth-error" id="auth-error" role="alert" hidden>
            <span class="auth-error-icon" aria-hidden="true"><i class="lucide-alert-circle"></i></span>
            <span class="auth-error-text" id="auth-error-text"></span>
          </div>

          <div class="auth-social">
            <div class="g_id_signin" data-type="standard" data-shape="rectangular" data-theme="outline" data-text="${isRegister ? 'signup_with' : 'signin_with'}" data-size="large" data-width="100%"></div>
          </div>
          <div class="auth-divider"><span>or</span></div>

          <form class="auth-form" id="${cfg.mode}-form" novalidate>
            ${isRegister ? field({
              id: 'fullname',
              label: 'Full name',
              icon: 'user',
              type: 'text',
              placeholder: 'Your name',
              required: true,
              autocomplete: 'name',
            }) : ''}

            ${field({
              id: isRegister ? 'reg-email' : 'email',
              label: 'Email',
              icon: 'mail',
              type: 'email',
              placeholder: 'you@example.com',
              required: true,
              autocomplete: isRegister ? 'email' : 'username',
            })}

            ${isRegister ? field({
              id: 'country',
              label: 'Country',
              icon: 'globe-2',
              type: 'text',
              placeholder: 'Where are you from?',
              autocomplete: 'country-name',
            }) : ''}

            ${field({
              id: isRegister ? 'reg-password' : 'password',
              label: 'Password',
              icon: 'lock',
              type: 'password',
              placeholder: isRegister ? 'Create a password' : 'Your password',
              required: true,
              autocomplete: isRegister ? 'new-password' : 'current-password',
              passwordToggle: true,
              helper: isRegister ? 'At least 6 characters.' : undefined,
            })}

            ${isRegister ? `
              <div class="auth-strength" id="auth-strength" data-tier="empty">
                <div class="auth-strength-bar"><span class="auth-strength-fill"></span></div>
                <span class="auth-strength-label">Password strength</span>
              </div>
            ` : ''}

            ${!isRegister ? `
              <div class="auth-row">
                <label class="auth-check">
                  <input type="checkbox" />
                  <span class="auth-check-box" aria-hidden="true"><i class="lucide-check"></i></span>
                  <span>Remember me</span>
                </label>
                <a href="#/forgot-password" class="auth-link">Forgot password?</a>
              </div>
            ` : ''}

            <button type="submit" class="auth-submit" id="${cfg.mode}-btn">
              <span class="auth-submit-label">${cfg.ctaText}</span>
              <i class="lucide-arrow-right auth-submit-icon"></i>
            </button>
          </form>

          <div class="auth-alt">
            ${cfg.altText}
            <a href="${cfg.altLink}" class="auth-link-bold">${cfg.altLabel}</a>
          </div>
        </section>

        <p class="auth-footer">
          By continuing, you agree to our <a href="#/about" class="auth-link">terms</a> and support Tunisian local businesses.
        </p>
      </main>
    </div>
  `;
}

function setupPasswordToggle(root: ParentNode) {
  root.querySelectorAll<HTMLButtonElement>('.auth-input-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.toggle || '';
      const input = document.getElementById(targetId) as HTMLInputElement | null;
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.setAttribute('aria-pressed', String(!showing));
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      btn.innerHTML = `<i class="lucide-${showing ? 'eye' : 'eye-off'}"></i>`;
      replaceIcons(btn);
    });
  });
}

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
  empty:  'Password strength',
  weak:   'Weak',
  fair:   'Fair',
  good:   'Good',
  strong: 'Strong',
};

function wireStrengthMeter() {
  const meter = document.getElementById('auth-strength');
  const input = document.getElementById('reg-password') as HTMLInputElement | null;
  if (!meter || !input) return;
  const label = meter.querySelector<HTMLSpanElement>('.auth-strength-label');
  input.addEventListener('input', () => {
    const tier = passwordStrengthTier(input.value);
    meter.dataset.tier = tier;
    if (label) label.textContent = STRENGTH_LABEL[tier];
  });
}

export function initAuthPage() {
  const root = document.getElementById('page-content') || document;
  replaceIcons(root as HTMLElement);
  setupPasswordToggle(root);
  wireStrengthMeter();

  // Google OAuth
  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (googleClientId && googleClientId !== 'your-google-client-id.apps.googleusercontent.com') {
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        (window as any).google?.accounts?.id?.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        (window as any).google?.accounts?.id?.renderButton(
          document.querySelector('.g_id_signin'),
          { theme: 'outline', size: 'large', width: '100%', text: 'continue_with' },
        );
      };
      document.head.appendChild(script);
    }
  }

  (window as any).handleGoogleCredentialResponse = async (response: any) => {
    try {
      const res = await api.googleLogin(response.credential);
      if (res.accessToken) {
        localStorage.setItem('etunisia_token', res.accessToken);
        location.hash = '#/';
      }
    } catch (err: any) {
      const errorTextEl = document.getElementById('auth-error-text');
      const errorEl = document.getElementById('auth-error');
      if (errorTextEl && errorEl) {
        errorTextEl.textContent = err?.message || 'Google sign-in failed.';
        errorEl.hidden = false;
      }
    }
  };

  const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
  const registerForm = document.getElementById('register-form') as HTMLFormElement | null;
  const errorEl = document.getElementById('auth-error');
  const errorTextEl = document.getElementById('auth-error-text');

  function showError(msg: string) {
    if (!errorEl || !errorTextEl) return;
    errorTextEl.textContent = msg;
    errorEl.hidden = false;
  }
  function clearError() {
    if (!errorEl) return;
    errorEl.hidden = true;
  }

  function setBusy(btn: HTMLButtonElement, busyLabel: string) {
    btn.disabled = true;
    btn.classList.add('is-busy');
    const label = btn.querySelector<HTMLSpanElement>('.auth-submit-label');
    if (label) label.textContent = busyLabel;
  }
  function setIdle(btn: HTMLButtonElement, idleLabel: string) {
    btn.disabled = false;
    btn.classList.remove('is-busy');
    const label = btn.querySelector<HTMLSpanElement>('.auth-submit-label');
    if (label) label.textContent = idleLabel;
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const btn = document.getElementById('login-btn') as HTMLButtonElement;
    setBusy(btn, 'Signing in…');

    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;

    try {
      const res = await api.login(email, password);
      if ((res as any).accessToken) {
        localStorage.setItem('etunisia_token', (res as any).accessToken);
        import('../push-notifications').then((m) => m.initPushNotifications()).catch(() => {});
        location.hash = '#/';
      }
    } catch (err: any) {
      showError(err?.message || 'Invalid email or password.');
      setIdle(btn, 'Sign in');
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const btn = document.getElementById('register-btn') as HTMLButtonElement;
    setBusy(btn, 'Creating account…');

    const name = (document.getElementById('fullname') as HTMLInputElement).value.trim();
    const email = (document.getElementById('reg-email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('reg-password') as HTMLInputElement).value;
    const country = (document.getElementById('country') as HTMLInputElement).value.trim();

    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      setIdle(btn, 'Create account');
      (document.getElementById('reg-password') as HTMLInputElement | null)?.focus();
      return;
    }

    // Pick up a referral handle from the link (#/register?ref=<handle>).
    const refQs = location.hash.includes('?') ? location.hash.split('?')[1] : '';
    const ref = new URLSearchParams(refQs).get('ref') || undefined;

    try {
      const res = await api.register({ name, email, password, country, ref });
      if ((res as any).accessToken) {
        localStorage.setItem('etunisia_token', (res as any).accessToken);
        location.hash = '#/onboarding';
      }
    } catch (err: any) {
      showError(err?.message || 'Registration failed. Please try again.');
      setIdle(btn, 'Create account');
    }
  });
}
