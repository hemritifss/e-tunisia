// ============================================
// SETTINGS PAGE — Account preferences
// Per design-system/pages/settings.md.
// Utility page — no cinematic hero, focused chrome.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';
import { showToast, isLoggedIn } from '../ui-utils';

function esc(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderSettingsPage(): string {
  return `
    <div class="settings-page page-enter">
      <header class="settings-head">
        <a href="#/profile" class="settings-back" aria-label="Back to profile">
          <i class="lucide-arrow-left"></i>
        </a>
        <div class="settings-head-text">
          <h1>Settings</h1>
          <p>Manage your account, appearance, and notifications.</p>
        </div>
      </header>

      <section class="settings-group">
        <header class="settings-group-head">
          <span class="settings-group-icon" data-tint="violet"><i class="lucide-palette"></i></span>
          <div>
            <h2>Appearance</h2>
            <p>How e-Tunisia looks on your device.</p>
          </div>
        </header>
        <div class="settings-item">
          <div class="settings-item-text">
            <strong>Dark mode</strong>
            <span>Switch between light and dark themes.</span>
          </div>
          <label class="toggle">
            <input type="checkbox" id="settings-dark-mode" />
            <span class="toggle-track"></span>
            <span class="toggle-thumb"></span>
          </label>
        </div>
      </section>

      <section class="settings-group">
        <header class="settings-group-head">
          <span class="settings-group-icon" data-tint="cyan"><i class="lucide-languages"></i></span>
          <div>
            <h2>Language</h2>
            <p>Localized content and UI.</p>
          </div>
        </header>
        <div class="settings-item">
          <div class="settings-item-text">
            <strong>Display language</strong>
            <span>Choose your preferred language.</span>
          </div>
          <select class="settings-select" aria-label="Display language">
            <option>English</option>
            <option>Français</option>
          </select>
        </div>
      </section>

      <section class="settings-group">
        <header class="settings-group-head">
          <span class="settings-group-icon" data-tint="gold"><i class="lucide-bell"></i></span>
          <div>
            <h2>Notifications</h2>
            <p>When and how we reach you.</p>
          </div>
        </header>
        <div class="settings-item">
          <div class="settings-item-text">
            <strong>Push notifications</strong>
            <span>Alerts for new events, tips, and DMs.</span>
          </div>
          <label class="toggle">
            <input type="checkbox" checked />
            <span class="toggle-track"></span>
            <span class="toggle-thumb"></span>
          </label>
        </div>
        <div class="settings-item">
          <div class="settings-item-text">
            <strong>Email digest</strong>
            <span>Weekly summary of popular posts.</span>
          </div>
          <label class="toggle">
            <input type="checkbox" />
            <span class="toggle-track"></span>
            <span class="toggle-thumb"></span>
          </label>
        </div>
      </section>

      <section class="settings-group">
        <header class="settings-group-head">
          <span class="settings-group-icon" data-tint="mediterranean"><i class="lucide-shield"></i></span>
          <div>
            <h2>Safety</h2>
            <p>People you've blocked. They can't see your posts or DM you.</p>
          </div>
        </header>
        <div class="settings-blocked-list" id="settings-blocked-list">
          <div class="settings-blocked-loading">
            <div class="spinner"></div>
            <span>Loading…</span>
          </div>
        </div>
      </section>

      <section class="settings-group">
        <header class="settings-group-head">
          <span class="settings-group-icon" data-tint="accent"><i class="lucide-user"></i></span>
          <div>
            <h2>Account</h2>
            <p>Profile and account-level controls.</p>
          </div>
        </header>
        <div class="settings-item">
          <div class="settings-item-text">
            <strong>Edit profile</strong>
            <span>Update your name, photo, and bio.</span>
          </div>
          <a class="btn btn-outline btn-sm" href="#/profile-edit">
            <i class="lucide-pencil"></i> Edit
          </a>
        </div>
        <div class="settings-item settings-item-danger">
          <div class="settings-item-text">
            <strong>Delete account</strong>
            <span>Permanently delete your account and data. This cannot be undone.</span>
          </div>
          <button type="button" class="settings-danger-btn" id="settings-delete-account">
            <i class="lucide-trash-2"></i> Delete
          </button>
        </div>
      </section>
    </div>
  `;
}

async function renderBlockedList() {
  const wrap = document.getElementById('settings-blocked-list');
  if (!wrap) return;
  if (!isLoggedIn()) {
    wrap.innerHTML = `<div class="settings-blocked-empty">Sign in to manage blocked accounts.</div>`;
    return;
  }
  let rows: any[] = [];
  try { rows = await api.listBlockedUsers(); } catch { rows = []; }
  if (!rows.length) {
    wrap.innerHTML = `<div class="settings-blocked-empty">You haven't blocked anyone.</div>`;
    return;
  }
  wrap.innerHTML = rows.map((r) => {
    const u = r.user || {};
    const seed = encodeURIComponent(u.fullName || u.id);
    const av = u.avatar && (String(u.avatar).startsWith('http') || String(u.avatar).startsWith('data:'))
      ? u.avatar
      : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
    return `
      <div class="blocked-row" data-id="${esc(u.id)}">
        <a class="blocked-user"
           href="#/user/${esc(u.id)}"
           data-user-id="${esc(u.id)}"
           data-user-name="${esc(u.fullName || '')}"
           data-user-avatar="${esc(av)}"
           data-user-handle="${esc(u.handle || '')}">
          <img src="${esc(av)}" alt="" loading="lazy" />
          <div class="blocked-user-meta">
            <strong>${esc(u.fullName || 'Unknown')}</strong>
            ${u.country ? `<span>${esc(u.country)}</span>` : ''}
          </div>
        </a>
        <button type="button" class="btn btn-outline btn-sm blocked-unblock" data-id="${esc(u.id)}">
          <i class="lucide-user-check"></i> Unblock
        </button>
      </div>
    `;
  }).join('');
  replaceIcons(wrap);

  wrap.querySelectorAll<HTMLButtonElement>('.blocked-unblock').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (!id) return;
      btn.disabled = true;
      try {
        await api.unblockUser(id);
        showToast('Unblocked');
        await renderBlockedList();
      } catch (e: any) {
        btn.disabled = false;
        showToast(e?.message || 'Could not unblock', { type: 'error' });
      }
    });
  });
}

export function initSettingsPage() {
  const darkToggle = document.getElementById('settings-dark-mode') as HTMLInputElement | null;
  if (darkToggle) {
    darkToggle.checked = document.documentElement.dataset.theme === 'dark';
    darkToggle.addEventListener('change', () => {
      const theme = darkToggle.checked ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('theme', theme);
      const icon = document.getElementById('theme-icon');
      if (icon) {
        icon.className = theme === 'dark' ? 'lucide-sun' : 'lucide-moon';
      }
    });
  }

  renderBlockedList();

  document.getElementById('settings-delete-account')?.addEventListener('click', () => {
    const ok = window.confirm('Delete your account permanently? This action cannot be undone.');
    if (!ok) return;
    try { localStorage.clear(); } catch {}
    location.hash = '#/hero';
    location.reload();
  });
}
