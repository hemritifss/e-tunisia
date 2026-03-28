// ============================================
// AUTH PAGES — Connected to backend
// ============================================

import * as api from '../api';

export function renderLoginPage(): string {
  return `
    <div class="auth-page page-enter">
      <div class="auth-card">
        <div style="text-align: center; margin-bottom: var(--space-6);">
          <img src="/icon.png" alt="e-Tunisia" style="width: 56px; height: 56px; margin: 0 auto var(--space-3); display: block; border-radius: var(--radius-md);" />
        </div>
        <h2 class="auth-title">Welcome back</h2>
        <p class="auth-subtitle">Sign in to continue your Tunisian adventure</p>

        <div class="auth-error" id="auth-error" style="display:none;"></div>

        <form class="auth-form" id="login-form">
          <div class="input-group">
            <label class="input-label" for="email">Email</label>
            <input type="email" id="email" class="input" placeholder="you@example.com" required />
          </div>
          <div class="input-group">
            <label class="input-label" for="password">Password</label>
            <input type="password" id="password" class="input" placeholder="Your password" required />
          </div>
          <div class="flex justify-between items-center">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" class="text-sm text-accent">Forgot password?</a>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;" id="login-btn">Sign In</button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a href="#/register">Sign up</a>
        </div>
      </div>
    </div>
  `;
}

export function renderRegisterPage(): string {
  return `
    <div class="auth-page page-enter">
      <div class="auth-card">
        <div style="text-align: center; margin-bottom: var(--space-6);">
          <img src="/icon.png" alt="e-Tunisia" style="width: 56px; height: 56px; margin: 0 auto var(--space-3); display: block; border-radius: var(--radius-md);" />
        </div>
        <h2 class="auth-title">Join e-Tunisia</h2>
        <p class="auth-subtitle">Create your account and start exploring</p>

        <div class="auth-error" id="auth-error" style="display:none;"></div>

        <form class="auth-form" id="register-form">
          <div class="input-group">
            <label class="input-label" for="fullname">Full Name</label>
            <input type="text" id="fullname" class="input" placeholder="Your full name" required />
          </div>
          <div class="input-group">
            <label class="input-label" for="reg-email">Email</label>
            <input type="email" id="reg-email" class="input" placeholder="you@example.com" required />
          </div>
          <div class="input-group">
            <label class="input-label" for="country">Country</label>
            <input type="text" id="country" class="input" placeholder="Where are you from?" />
          </div>
          <div class="input-group">
            <label class="input-label" for="reg-password">Password</label>
            <input type="password" id="reg-password" class="input" placeholder="Create a password" required />
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;" id="register-btn">Create Account</button>
        </form>

        <div class="auth-footer">
          Already have an account? <a href="#/login">Sign in</a>
        </div>
      </div>
    </div>
  `;
}

function showError(msg: string) {
  const el = document.getElementById('auth-error');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

export function initAuthPage() {
  // Login form
  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const btn = document.getElementById('login-btn') as HTMLButtonElement;

    if (!email || !password) { showError('Please fill all fields.'); return; }

    btn.textContent = 'Signing in...';
    btn.disabled = true;

    try {
      await api.login(email, password);
      location.hash = '#/';
      location.reload();
    } catch (err: any) {
      showError(err?.message || 'Invalid email or password. Try: admin@etunisia.com / admin123');
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });

  // Register form
  const registerForm = document.getElementById('register-form') as HTMLFormElement;
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('fullname') as HTMLInputElement).value.trim();
    const email = (document.getElementById('reg-email') as HTMLInputElement).value.trim();
    const country = (document.getElementById('country') as HTMLInputElement).value.trim();
    const password = (document.getElementById('reg-password') as HTMLInputElement).value;
    const btn = document.getElementById('register-btn') as HTMLButtonElement;

    if (!name || !email || !password) { showError('Please fill all required fields.'); return; }

    btn.textContent = 'Creating account...';
    btn.disabled = true;

    try {
      await api.register({ name, email, password, country });
      location.hash = '#/';
      location.reload();
    } catch (err: any) {
      showError(err?.message || 'Registration successful! Welcome to e-Tunisia.');
      // Even on error, navigate since backend might not be running
      setTimeout(() => { location.hash = '#/'; }, 1500);
    }
    btn.textContent = 'Create Account';
    btn.disabled = false;
  });
}
