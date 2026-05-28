// ============================================
// PASSWORD RESET PAGE
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

export function renderPasswordResetPage(): string {
  return `
    <div class="auth-page">
      <div class="auth-bg"></div>
      <div class="auth-card">
        <div class="auth-brand">
          <div class="auth-logo">e-Tunisia</div>
          <h1 class="auth-title">Reset your password</h1>
          <p class="auth-subtitle">Enter your email and we'll send you a reset link.</p>
        </div>

        <form id="forgot-form" class="auth-form">
          <div class="auth-field">
            <label for="reset-email" class="auth-field-label">Email</label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon" aria-hidden="true"><i class="lucide-mail"></i></span>
              <input
                type="email"
                id="reset-email"
                class="auth-input"
                placeholder="you@example.com"
                required
                autocomplete="email"
              />
            </div>
          </div>

          <button type="submit" id="reset-btn" class="auth-btn primary">Send reset link</button>
          <p class="auth-alt">
            Remember your password? <a href="#/login" class="auth-alt-link">Sign in</a>
          </p>
          <div id="reset-error" class="auth-error" role="alert" aria-live="polite"></div>
          <div id="reset-success" class="auth-success" role="status" aria-live="polite" style="display:none;"></div>
        </form>
      </div>
    </div>
  `;
}

export function renderNewPasswordPage(token: string): string {
  return `
    <div class="auth-page">
      <div class="auth-bg"></div>
      <div class="auth-card">
        <div class="auth-brand">
          <div class="auth-logo">e-Tunisia</div>
          <h1 class="auth-title">Create new password</h1>
          <p class="auth-subtitle">Enter a new password for your account.</p>
        </div>

        <form id="new-password-form" class="auth-form" data-token="${token}">
          <div class="auth-field">
            <label for="new-password" class="auth-field-label">New password</label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon" aria-hidden="true"><i class="lucide-lock"></i></span>
              <input
                type="password"
                id="new-password"
                class="auth-input"
                placeholder="Min 6 characters"
                required
                minlength="6"
                autocomplete="new-password"
              />
              <button type="button" class="auth-input-toggle" data-toggle="new-password" aria-label="Show password" aria-pressed="false">
                <i class="lucide-eye"></i>
              </button>
            </div>
          </div>

          <button type="submit" id="new-password-btn" class="auth-btn primary">Update password</button>
          <div id="reset-error" class="auth-error" role="alert" aria-live="polite"></div>
        </form>
      </div>
    </div>
  `;
}

function setBusy(btn: HTMLButtonElement, text: string) {
  btn.disabled = true;
  btn.dataset.originalText = btn.textContent || '';
  btn.textContent = text;
}

function setIdle(btn: HTMLButtonElement, text?: string) {
  btn.disabled = false;
  btn.textContent = text || btn.dataset.originalText || '';
}

function showError(msg: string) {
  const el = document.getElementById('reset-error');
  if (el) el.textContent = msg;
}

function clearError() {
  const el = document.getElementById('reset-error');
  if (el) el.textContent = '';
}

function showSuccess(msg: string) {
  const el = document.getElementById('reset-success');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

export function initPasswordResetPage() {
  replaceIcons();
  const form = document.getElementById('forgot-form') as HTMLFormElement | null;
  const newPassForm = document.getElementById('new-password-form') as HTMLFormElement | null;

  // Password visibility toggle
  document.querySelectorAll<HTMLButtonElement>('.auth-input-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.toggle;
      const input = document.getElementById(targetId!) as HTMLInputElement | null;
      if (!input) return;
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(isHidden));
      btn.innerHTML = `<i class="lucide-${isHidden ? 'eye-off' : 'eye'}"></i>`;
      replaceIcons();
    });
  });

  // Forgot password form
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const btn = document.getElementById('reset-btn') as HTMLButtonElement;
    setBusy(btn, 'Sending…');

    const email = (document.getElementById('reset-email') as HTMLInputElement).value.trim();

    try {
      const res = await api.requestPasswordReset(email);
      showSuccess('Check your email for a reset link. (Dev mode: check console for token)');
      if ((res as any).token) {
        // eslint-disable-next-line no-console
        console.log('DEV MODE — Reset token:', (res as any).token);
      }
    } catch (err: any) {
      showError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIdle(btn, 'Send reset link');
    }
  });

  // New password form
  newPassForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const btn = document.getElementById('new-password-btn') as HTMLButtonElement;
    setBusy(btn, 'Updating…');

    const token = newPassForm.dataset.token!;
    const password = (document.getElementById('new-password') as HTMLInputElement).value;

    try {
      await api.resetPassword(token, password);
      showSuccess('Password updated! Redirecting to login…');
      setTimeout(() => {
        window.location.hash = '#/login';
      }, 1500);
    } catch (err: any) {
      showError(err?.message || 'Failed to reset password. The link may have expired.');
      setIdle(btn, 'Update password');
    }
  });
}
