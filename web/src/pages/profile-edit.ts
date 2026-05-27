// ============================================
// EDIT PROFILE — /#/profile/edit
// Cover banner + avatar uploader + section cards.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';
import { requireAuth, showToast } from '../ui-utils';

export function renderProfileEditPage(): string {
  return `
    <div class="profile-edit-v2 page-enter" id="profile-edit-root">
      <a href="#/profile" class="back-floating-btn" aria-label="Back to profile"><i class="lucide-arrow-left"></i></a>
      <div class="pe-loading">
        <div class="spinner"></div>
        <p>Loading…</p>
      </div>
    </div>
  `;
}

function escapeAttr(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export async function initProfileEditPage() {
  if (!requireAuth('edit your profile')) return;
  const root = document.getElementById('profile-edit-root');
  if (!root) return;

  let me: any;
  try { me = await api.getMyProfile(); } catch { me = null; }
  if (!me) {
    root.innerHTML = `
      <a href="#/profile" class="back-floating-btn"><i class="lucide-arrow-left"></i></a>
      <div class="pe-error">
        <div class="pe-error-icon"><i class="lucide-user-x"></i></div>
        <h3>Could not load your profile</h3>
        <p>Try again in a moment, or return to your profile.</p>
        <a href="#/profile" class="btn btn-primary"><i class="lucide-arrow-left"></i> Back to profile</a>
      </div>`;
    replaceIcons(root);
    return;
  }

  const seed = encodeURIComponent(me.fullName || me.id);
  const currentAvatar = me.avatar
    ? api.getImageUrl(me.avatar, 'avatar')
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;

  root.innerHTML = `
    <!-- Mirror the public profile layout so users see exactly how their changes will look -->
    <header class="up-cover pe-cover">
      <div class="up-cover-gradient" aria-hidden="true"></div>
      <div class="up-cover-pattern" aria-hidden="true"></div>
      <div class="up-cover-orbs" aria-hidden="true">
        <span class="up-cover-orb"></span>
        <span class="up-cover-orb"></span>
      </div>
      <a href="#/profile" class="back-floating-btn" aria-label="Back to profile"><i class="lucide-arrow-left"></i></a>
      <span class="pe-editing-chip" aria-live="polite">
        <i class="lucide-edit-3"></i> Editing profile
      </span>
    </header>

    <section class="up-identity">
      <div class="up-avatar-wrap">
        <img id="profile-edit-avatar-preview" src="${currentAvatar}" alt="" class="up-avatar" />
        <button id="profile-edit-pick-avatar" class="up-avatar-edit-overlay" aria-label="Change avatar">
          <i class="lucide-camera"></i>
        </button>
      </div>
      <div class="up-actions">
        <button class="btn btn-primary" id="profile-edit-save">
          <i class="lucide-save"></i> Save changes
        </button>
        <a class="btn btn-outline" href="#/profile">Cancel</a>
      </div>
    </section>
    <input id="profile-edit-file" type="file" accept="image/*" hidden />

    <!-- Completeness meter — LinkedIn-style nudge -->
    <section class="pe-completeness" id="pe-completeness"></section>

    <div class="pe-grid">
      <article class="pe-section-card">
        <header class="pe-section-head">
          <i class="lucide-user-circle"></i>
          <div>
            <h3>Basic info</h3>
            <p>How you appear across e-Tunisia</p>
          </div>
        </header>
        <div class="pe-section-body">
          <div class="input-group">
            <label class="input-label">Full name <span class="input-required">*</span></label>
            <input id="pe-name" class="input" type="text" maxlength="80" value="${escapeAttr(me.fullName || '')}" />
            <span class="input-hint">Shown on your posts, comments, and tips.</span>
          </div>
          <div class="input-group">
            <label class="input-label">Bio / Headline</label>
            <textarea id="pe-bio" class="input" rows="3" maxlength="320" placeholder="One line about you — what you love, where you've been, what you write about…">${escapeAttr(me.bio || '')}</textarea>
            <span class="input-hint"><span id="pe-bio-count">0</span> / 320 characters · Shows on your profile + post cards.</span>
          </div>
        </div>
      </article>

      <article class="pe-section-card">
        <header class="pe-section-head">
          <i class="lucide-globe-2"></i>
          <div>
            <h3>Location &amp; links</h3>
            <p>Helps the right people find you</p>
          </div>
        </header>
        <div class="pe-section-body">
          <div class="input-group">
            <label class="input-label">Country</label>
            <input id="pe-country" class="input" type="text" maxlength="80" value="${escapeAttr(me.country || '')}" placeholder="e.g. Tunisia" />
          </div>
          <div class="input-group">
            <label class="input-label">Website</label>
            <input id="pe-website" class="input" type="url" maxlength="200" value="${escapeAttr(me.website || '')}" placeholder="https://yoursite.com" />
          </div>
          <div class="input-group">
            <label class="input-label">Phone (optional)</label>
            <input id="pe-phone" class="input" type="tel" maxlength="30" value="${escapeAttr(me.phone || '')}" placeholder="+216 …" />
          </div>
        </div>
      </article>

      <article class="pe-section-card">
        <header class="pe-section-head">
          <i class="lucide-shield-check"></i>
          <div>
            <h3>Account</h3>
            <p>Read-only — contact support to change</p>
          </div>
        </header>
        <div class="pe-section-body">
          <div class="input-group">
            <label class="input-label">Email</label>
            <input class="input" value="${escapeAttr(me.email || '')}" disabled />
          </div>
        </div>
      </article>
    </div>

    <!-- Sticky bottom action bar (mobile-friendly) -->
    <div class="pe-sticky-bar">
      <a class="btn btn-ghost" href="#/profile">Cancel</a>
      <button class="btn btn-primary" id="profile-edit-save-mobile">
        <i class="lucide-save"></i> Save changes
      </button>
    </div>
  `;
  replaceIcons(root);

  let pendingAvatar: string | null = null;
  const preview = document.getElementById('profile-edit-avatar-preview') as HTMLImageElement;
  const fileInput = document.getElementById('profile-edit-file') as HTMLInputElement;
  document.getElementById('profile-edit-pick-avatar')?.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput?.click();
  });
  fileInput?.addEventListener('change', () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      showToast('Image too large (max 5 MB)', { type: 'error' });
      return;
    }
    const r = new FileReader();
    r.onload = (ev) => {
      pendingAvatar = (ev.target?.result as string) || null;
      if (pendingAvatar) preview.src = pendingAvatar;
    };
    r.readAsDataURL(f);
  });

  // Live char counter for bio
  const bio = document.getElementById('pe-bio') as HTMLTextAreaElement;
  const bioCount = document.getElementById('pe-bio-count');
  const setBioCount = () => { if (bioCount) bioCount.textContent = String((bio?.value || '').length); };
  bio?.addEventListener('input', () => { setBioCount(); refreshMeter(); });
  setBioCount();

  // Completeness meter — fires on every input
  const checks: Array<{ key: string; label: string; got: () => boolean; weight: number }> = [
    { key: 'name',    label: 'Full name',  weight: 15, got: () => !!(document.getElementById('pe-name') as HTMLInputElement)?.value.trim() },
    { key: 'avatar',  label: 'Profile photo', weight: 25, got: () => !!(pendingAvatar || me.avatar) },
    { key: 'bio',     label: 'Bio / headline', weight: 20, got: () => !!(document.getElementById('pe-bio') as HTMLTextAreaElement)?.value.trim() },
    { key: 'country', label: 'Country', weight: 15, got: () => !!(document.getElementById('pe-country') as HTMLInputElement)?.value.trim() },
    { key: 'website', label: 'Website', weight: 15, got: () => !!(document.getElementById('pe-website') as HTMLInputElement)?.value.trim() },
    { key: 'phone',   label: 'Phone', weight: 10, got: () => !!(document.getElementById('pe-phone') as HTMLInputElement)?.value.trim() },
  ];

  function refreshMeter() {
    const wrap = document.getElementById('pe-completeness');
    if (!wrap) return;
    let score = 0;
    const missing: string[] = [];
    for (const c of checks) {
      if (c.got()) score += c.weight;
      else missing.push(c.label);
    }
    const tier = score >= 90 ? 'great' : score >= 60 ? 'good' : 'low';
    const tierLabel = tier === 'great' ? 'All-star' : tier === 'good' ? 'Strong' : 'Just starting';
    const tierIcon = tier === 'great' ? 'star' : tier === 'good' ? 'trending-up' : 'sprout';
    wrap.innerHTML = `
      <div class="pe-meter-row">
        <div class="pe-meter-text">
          <span class="pe-meter-label">Profile strength</span>
          <strong class="pe-meter-value">
            <span class="pe-meter-pct">${score}%</span>
            <span class="pe-meter-tier" data-tier="${tier}"><i class="lucide-${tierIcon}"></i> ${tierLabel}</span>
          </strong>
        </div>
        ${missing.length > 0 ? `<span class="pe-meter-missing">Add: ${missing.slice(0, 3).join(' · ')}</span>` : ''}
      </div>
      <div class="pe-meter-bar" data-tier="${tier}">
        <div class="pe-meter-fill" style="width:${score}%;"></div>
      </div>
    `;
    replaceIcons(wrap);
  }
  refreshMeter();
  // Keep the meter in sync as the user types in any input
  ['pe-name', 'pe-country', 'pe-website', 'pe-phone'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', refreshMeter);
  });

  const doSave = async (btn: HTMLButtonElement) => {
    const fullName = (document.getElementById('pe-name') as HTMLInputElement).value.trim();
    const country = (document.getElementById('pe-country') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('pe-phone') as HTMLInputElement).value.trim();
    const bioVal = (document.getElementById('pe-bio') as HTMLTextAreaElement).value.trim();
    const website = (document.getElementById('pe-website') as HTMLInputElement).value.trim();
    if (!fullName) {
      showToast('Name is required', { type: 'error' });
      return;
    }
    btn.disabled = true;
    const original = btn.innerHTML;
    btn.innerHTML = 'Saving…';
    try {
      const patch: any = { fullName, country, phone, bio: bioVal, website };
      if (pendingAvatar) {
        // Upload the data URL to MinIO so we store a short URL, not 2MB of base64 in PG.
        patch.avatar = await api.uploadDataUrl(pendingAvatar, 'avatars');
      }
      await api.updateMyProfile(patch);
      (window as any).__userHydrated = false;
      window.dispatchEvent(new CustomEvent('etunisia:profile-updated'));
      showToast('Profile updated');
      location.hash = '#/profile';
    } catch (err: any) {
      showToast(err?.message || 'Could not save', { type: 'error' });
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
      replaceIcons(btn);
    }
  };

  document.getElementById('profile-edit-save')?.addEventListener('click', (e) =>
    doSave(e.currentTarget as HTMLButtonElement));
  document.getElementById('profile-edit-save-mobile')?.addEventListener('click', (e) =>
    doSave(e.currentTarget as HTMLButtonElement));
}
