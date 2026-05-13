// ============================================
// AUTH PAGES — Tunisian cinematic aesthetic
// ============================================

import * as api from '../api';

export function renderLoginPage(): string {
  return renderAuthPage({
    mode: 'login',
    title: 'Ahlan wa Sahlan',
    subtitle: 'Welcome back. Your Tunisia adventure continues.',
    ctaText: 'Sign In',
    altText: "Don't have an account?",
    altLink: '#/register',
    altLabel: 'Create one',
  });
}

export function renderRegisterPage(): string {
  return renderAuthPage({
    mode: 'register',
    title: 'Join the Community',
    subtitle: 'Discover hidden Tunisia with locals who know every secret corner.',
    ctaText: 'Create Account',
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

function renderAuthPage(cfg: AuthConfig): string {
  const isRegister = cfg.mode === 'register';

  return `
    <div class="tn-auth-page page-enter">
      <div class="tn-auth-bg">
        <img src="/img/hero2.png" alt="Tunisia" class="tn-auth-bg-img" />
        <div class="tn-auth-bg-overlay"></div>
      </div>

      <div class="tn-auth-content">
        <a href="#/" class="tn-auth-logo">
          <img src="/icon.png" alt="e-Tunisia" />
          <span>e-Tunisia</span>
        </a>

        <div class="tn-auth-card">
          <div class="tn-auth-head">
            <h1>${cfg.title}</h1>
            <p>${cfg.subtitle}</p>
          </div>

          <div class="tn-auth-error" id="auth-error" style="display:none;"></div>

          <form class="tn-auth-form" id="${cfg.mode}-form">
            ${isRegister ? `
              <div class="tn-auth-field">
                <label for="fullname">Full Name</label>
                <input type="text" id="fullname" class="tn-auth-input" placeholder="Your name" required />
              </div>
            ` : ''}

            <div class="tn-auth-field">
              <label for="${isRegister ? 'reg-email' : 'email'}">Email</label>
              <input type="email" id="${isRegister ? 'reg-email' : 'email'}" class="tn-auth-input" placeholder="you@example.com" required />
            </div>

            ${isRegister ? `
              <div class="tn-auth-field">
                <label for="country">Country</label>
                <input type="text" id="country" class="tn-auth-input" placeholder="Where are you from?" />
              </div>
            ` : ''}

            <div class="tn-auth-field">
              <label for="${isRegister ? 'reg-password' : 'password'}">Password</label>
              <input type="password" id="${isRegister ? 'reg-password' : 'password'}" class="tn-auth-input" placeholder="${isRegister ? 'Create a password' : 'Your password'}" required />
            </div>

            ${!isRegister ? `
              <div class="tn-auth-row">
                <label class="tn-auth-check">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" class="tn-auth-link">Forgot password?</a>
              </div>
            ` : ''}

            <button type="submit" class="tn-auth-btn" id="${cfg.mode}-btn">
              ${cfg.ctaText}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </form>

          <div class="tn-auth-alt">
            ${cfg.altText} <a href="${cfg.altLink}" class="tn-auth-link-bold">${cfg.altLabel}</a>
          </div>
        </div>

        <p class="tn-auth-footer">
          By continuing, you agree to our Terms and support Tunisian local businesses.
        </p>
      </div>
    </div>
  `;
}

export function initAuthPage() {
  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  const registerForm = document.getElementById('register-form') as HTMLFormElement;
  const errorEl = document.getElementById('auth-error');

  function showError(msg: string) {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = 'Signing in...';

    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;

    try {
      const res = await api.login(email, password);
      if (res.accessToken) {
        localStorage.setItem('token', res.accessToken);
        location.hash = '#/';
      }
    } catch (err: any) {
      showError(err.message || 'Invalid email or password');
      btn.disabled = false;
      btn.innerHTML = `Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('register-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = 'Creating account...';

    const name = (document.getElementById('fullname') as HTMLInputElement).value.trim();
    const email = (document.getElementById('reg-email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('reg-password') as HTMLInputElement).value;
    const country = (document.getElementById('country') as HTMLInputElement).value.trim();

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      btn.disabled = false;
      btn.innerHTML = `Create Account <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      return;
    }

    try {
      const res = await api.register({ name, email, password, country });
      if (res.accessToken) {
        localStorage.setItem('token', res.accessToken);
        location.hash = '#/';
      }
    } catch (err: any) {
      showError(err.message || 'Registration failed. Please try again.');
      btn.disabled = false;
      btn.innerHTML = `Create Account <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    }
  });
}
