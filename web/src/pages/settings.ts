import * as api from '../api';
import { replaceIcons } from '../icons';
import { showToast, isLoggedIn } from '../ui-utils';

export function renderSettingsPage(): string {
  return `
    <div class="settings-page page-enter" data-design="sleek">
      <a href="#/profile" class="btn btn-ghost" style="margin-bottom: var(--space-4);">
        <i class="lucide-arrow-left"></i> Back
      </a>

      <h2 style="margin-bottom: var(--space-6);">Settings</h2>

      <div class="settings-group">
        <div class="settings-group-title">Appearance</div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Dark Mode</div>
            <div class="settings-item-desc">Switch between light and dark themes</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="settings-dark-mode" />
            <span class="toggle-track"></span>
            <span class="toggle-thumb"></span>
          </label>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Language</div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Display Language</div>
            <div class="settings-item-desc">Choose your preferred language</div>
          </div>
          <select class="input" style="width: auto; padding: var(--space-2) var(--space-3);">
            <option>English</option>
            <option>Francais</option>
          </select>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Notifications</div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Push Notifications</div>
            <div class="settings-item-desc">Receive alerts for new events and tips</div>
          </div>
          <label class="toggle">
            <input type="checkbox" checked />
            <span class="toggle-track"></span>
            <span class="toggle-thumb"></span>
          </label>
        </div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Email Digest</div>
            <div class="settings-item-desc">Weekly summary of popular posts</div>
          </div>
          <label class="toggle">
            <input type="checkbox" />
            <span class="toggle-track"></span>
            <span class="toggle-thumb"></span>
          </label>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Safety</div>
        <div class="settings-item settings-item-stacked">
          <div>
            <div class="settings-item-label"><i class="lucide-shield"></i> Blocked accounts</div>
            <div class="settings-item-desc">People you've blocked. They can't see your posts or DM you.</div>
          </div>
          <div class="settings-blocked-list" id="settings-blocked-list">
            <div class="text-muted text-sm" style="padding: var(--space-2);">Loading…</div>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Account</div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Edit Profile</div>
            <div class="settings-item-desc">Update your name, photo, and bio</div>
          </div>
          <a class="btn btn-sm btn-secondary" href="#/profile/edit">Edit</a>
        </div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label text-danger">Delete Account</div>
            <div class="settings-item-desc">Permanently delete your account and data</div>
          </div>
          <button class="btn btn-sm btn-secondary text-danger" id="settings-delete-account">Delete</button>
        </div>
      </div>
    </div>
  `;
}

async function renderBlockedList() {
  const wrap = document.getElementById('settings-blocked-list');
  if (!wrap) return;
  if (!isLoggedIn()) {
    wrap.innerHTML = `<div class="text-muted text-sm">Sign in to manage blocked accounts.</div>`;
    return;
  }
  let rows: any[] = [];
  try { rows = await api.listBlockedUsers(); } catch { rows = []; }
  if (!rows.length) {
    wrap.innerHTML = `<div class="text-muted text-sm">You haven't blocked anyone.</div>`;
    return;
  }
  wrap.innerHTML = rows.map(r => {
    const u = r.user || {};
    const seed = encodeURIComponent(u.fullName || u.id);
    const av = u.avatar && (String(u.avatar).startsWith('http') || String(u.avatar).startsWith('data:'))
      ? u.avatar
      : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
    return `
      <div class="blocked-row" data-id="${u.id}">
        <a class="blocked-user" href="#/user/${u.id}">
          <img src="${av}" alt="" />
          <div>
            <strong>${(u.fullName || 'Unknown').replace(/</g, '&lt;')}</strong>
            ${u.country ? `<span class="text-xs text-muted">${(u.country || '').replace(/</g, '&lt;')}</span>` : ''}
          </div>
        </a>
        <button class="btn btn-sm btn-outline blocked-unblock" data-id="${u.id}">
          <i class="lucide-user-check"></i> Unblock
        </button>
      </div>
    `;
  }).join('');
  replaceIcons(wrap);

  wrap.querySelectorAll<HTMLButtonElement>('.blocked-unblock').forEach(btn => {
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
  const darkToggle = document.getElementById('settings-dark-mode') as HTMLInputElement;
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
