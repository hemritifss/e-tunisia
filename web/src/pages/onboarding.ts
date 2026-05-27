// ============================================
// ONBOARDING WIZARD — /#/onboarding
// Day-1 retention loop:
//   1. Welcome
//   2. Complete your profile (avatar + bio + country)
//   3. Pick interests
//   4. Follow 5+ explorers
//   5. Done → /
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';
import { requireAuth, showToast } from '../ui-utils';

interface State {
  step: 0 | 1 | 2 | 3 | 4;
  avatarDataUrl: string | null;
  fullName: string;
  bio: string;
  country: string;
  interests: Set<string>;
  followed: Set<string>;
  suggested: any[];
  me: any | null;
}

/**
 * Each interest is a (id, label, icon, tint) tuple. Icon is the Lucide name;
 * tint is a brand-token CSS variable reference. Aligns with the Mood / Explore
 * / Events / Tips category vocabulary — same icon for the same concept across
 * the app (e.g. Beaches always uses Waves, Food always uses UtensilsCrossed).
 */
interface Interest {
  id: string;
  label: string;
  icon: string;
  tint: string;
}

const INTERESTS: Interest[] = [
  { id: 'beaches',     label: 'Beaches',          icon: 'waves',             tint: 'var(--cyan)' },
  { id: 'historical',  label: 'Historical sites', icon: 'landmark',          tint: 'var(--sand)' },
  { id: 'food',        label: 'Food & drink',     icon: 'utensils-crossed',  tint: 'var(--accent)' },
  { id: 'nature',      label: 'Nature & parks',   icon: 'trees',             tint: 'var(--olive)' },
  { id: 'culture',     label: 'Culture & arts',   icon: 'library',           tint: 'var(--violet)' },
  { id: 'adventure',   label: 'Adventure',        icon: 'mountain',          tint: 'var(--gold)' },
  { id: 'desert',      label: 'Sahara & deserts', icon: 'sun',               tint: 'var(--amber)' },
  { id: 'photography', label: 'Photography',      icon: 'camera',            tint: 'var(--mediterranean)' },
  { id: 'budget',      label: 'Budget travel',    icon: 'piggy-bank',        tint: 'var(--success)' },
  { id: 'nightlife',   label: 'Nightlife',        icon: 'moon',              tint: 'var(--rose)' },
];

const state: State = {
  step: 0,
  avatarDataUrl: null,
  fullName: '',
  bio: '',
  country: '',
  interests: new Set(),
  followed: new Set(),
  suggested: [],
  me: null,
};

export function renderOnboardingPage(): string {
  return `
    <div class="onb-page page-enter" data-design="sleek" id="onb-root">
      <div class="onb-progress-wrap">
        <ol class="onb-progress" id="onb-progress" aria-label="Onboarding progress">
          <li data-step="0"><span class="dot"></span><span class="label">Welcome</span></li>
          <li data-step="1"><span class="dot"></span><span class="label">Profile</span></li>
          <li data-step="2"><span class="dot"></span><span class="label">Interests</span></li>
          <li data-step="3"><span class="dot"></span><span class="label">Connect</span></li>
        </ol>
      </div>
      <main class="onb-shell" id="onb-shell">
        <div class="onb-loading"><div class="spinner"></div><p>Setting things up…</p></div>
      </main>
    </div>
  `;
}

export async function initOnboardingPage() {
  if (!requireAuth('start onboarding')) return;
  try {
    state.me = await api.getMyProfile();
  } catch {
    showToast('Could not load your account', { type: 'error' });
    return;
  }
  state.fullName = state.me?.fullName || '';
  state.bio = state.me?.bio || '';
  state.country = state.me?.country || '';
  if (Array.isArray(state.me?.interests)) for (const i of state.me.interests) state.interests.add(i);

  // Skip wizard if already complete (defensive)
  if (state.me?.onboardingComplete) {
    location.hash = '#/';
    return;
  }

  // Pre-fetch suggested users for step 4
  try {
    state.suggested = await api.getSuggestedUsers(10);
  } catch {
    state.suggested = [];
  }

  render();
}

function render() {
  const shell = document.getElementById('onb-shell');
  const progress = document.getElementById('onb-progress');
  if (!shell || !progress) return;

  // Sync progress
  progress.querySelectorAll<HTMLLIElement>('li').forEach((li) => {
    const stepNum = Number(li.dataset.step);
    li.classList.toggle('active', stepNum === state.step);
    li.classList.toggle('done', stepNum < state.step);
  });

  if (state.step === 0)      shell.innerHTML = stepWelcome();
  else if (state.step === 1) shell.innerHTML = stepProfile();
  else if (state.step === 2) shell.innerHTML = stepInterests();
  else if (state.step === 3) shell.innerHTML = stepConnect();
  else if (state.step === 4) shell.innerHTML = stepDone();

  replaceIcons(shell);
  wire(shell);
}

function stepWelcome(): string {
  const firstName = (state.fullName || 'there').split(' ')[0];
  return `
    <section class="onb-card onb-welcome">
      <div class="onb-illustration onb-illustration-welcome" aria-hidden="true">
        <div class="onb-illustration-orbs">
          <span class="onb-illustration-orb"></span>
          <span class="onb-illustration-orb"></span>
        </div>
        <div class="onb-illustration-icon">
          <i class="lucide-compass"></i>
        </div>
      </div>
      <h1>Ahlan wa sahlan, <span class="onb-name-highlight">${escapeHtml(firstName)}</span></h1>
      <p class="onb-sub">Welcome to e-Tunisia — the platform where locals share real Tunisia.<br>Let's set you up in under a minute.</p>
      <ul class="onb-perks">
        <li><span class="onb-perk-icon"><i class="lucide-sparkles"></i></span>Pick what you love so the feed feels personal</li>
        <li><span class="onb-perk-icon"><i class="lucide-users"></i></span>Follow other explorers — share tips, ask questions</li>
        <li><span class="onb-perk-icon"><i class="lucide-award"></i></span>Earn XP, badges, and credits as you go</li>
      </ul>
      <div class="onb-actions onb-actions-center">
        <button type="button" class="btn btn-primary btn-lg onb-cta-primary" id="onb-next">
          Let's go <i class="lucide-arrow-right"></i>
        </button>
        <button type="button" class="btn btn-ghost" id="onb-skip">Skip for now</button>
      </div>
    </section>
  `;
}

function stepProfile(): string {
  const seed = encodeURIComponent(state.fullName || state.me?.id || 'user');
  const fallback = `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
  const currentAvatar = state.avatarDataUrl
    || (state.me?.avatar
        ? (String(state.me.avatar).startsWith('http') || String(state.me.avatar).startsWith('data:')
            ? state.me.avatar
            : fallback)
        : fallback);
  return `
    <section class="onb-card">
      <header class="onb-step-head">
        <span class="onb-step-pill">Step 1 of 3</span>
        <h2>Make yourself recognisable</h2>
        <p class="text-muted">Real photo, real name, one-line bio — that's all it takes.</p>
      </header>

      <div class="onb-profile-row">
        <div class="onb-avatar-wrap">
          <img id="onb-avatar-preview" src="${currentAvatar}" alt="" class="onb-avatar" />
          <button class="onb-avatar-edit" id="onb-pick-avatar" aria-label="Change avatar">
            <i class="lucide-camera"></i>
          </button>
          <input id="onb-file" type="file" accept="image/*" hidden />
        </div>
        <div class="onb-profile-fields">
          <div class="input-group">
            <label class="input-label">Display name</label>
            <input id="onb-name" class="input" type="text" maxlength="80" value="${escapeAttr(state.fullName)}" placeholder="Your name" />
          </div>
          <div class="input-group">
            <label class="input-label">Country</label>
            <input id="onb-country" class="input" type="text" maxlength="80" value="${escapeAttr(state.country)}" placeholder="e.g. Tunisia" />
          </div>
        </div>
      </div>

      <div class="input-group">
        <label class="input-label">One-line bio <span class="text-muted">(optional)</span></label>
        <textarea id="onb-bio" class="input" rows="2" maxlength="320" placeholder="Where you've been, what you love to share…">${escapeAttr(state.bio)}</textarea>
      </div>

      <div class="onb-actions">
        <button class="btn btn-ghost" id="onb-back">Back</button>
        <button class="btn btn-primary" id="onb-next">Continue <i class="lucide-arrow-right"></i></button>
      </div>
    </section>
  `;
}

function stepInterests(): string {
  return `
    <section class="onb-card">
      <header class="onb-step-head">
        <span class="onb-step-pill">Step 2 of 3</span>
        <h2>What are you into?</h2>
        <p class="text-muted">Pick 3 or more — we'll match places, posts, and people to what you love.</p>
      </header>

      <div class="onb-interest-grid">
        ${INTERESTS.map(i => `
          <button
            type="button"
            class="onb-interest${state.interests.has(i.id) ? ' is-selected' : ''}"
            data-interest="${i.id}"
            style="--int-tint: ${i.tint}"
            aria-pressed="${state.interests.has(i.id) ? 'true' : 'false'}"
          >
            <span class="onb-interest-icon" aria-hidden="true"><i class="lucide-${i.icon}"></i></span>
            <span class="onb-interest-label">${i.label}</span>
            <span class="onb-interest-check" aria-hidden="true"><i class="lucide-check"></i></span>
          </button>
        `).join('')}
      </div>

      <div class="onb-actions">
        <button class="btn btn-ghost" id="onb-back">Back</button>
        <span class="onb-status text-muted" id="onb-interest-count"></span>
        <button class="btn btn-primary" id="onb-next">Continue <i class="lucide-arrow-right"></i></button>
      </div>
    </section>
  `;
}

function stepConnect(): string {
  const candidates = (state.suggested || []).filter(u => !state.me || u.id !== state.me.id).slice(0, 8);
  return `
    <section class="onb-card">
      <header class="onb-step-head">
        <span class="onb-step-pill">Step 3 of 3</span>
        <h2>Follow a few explorers</h2>
        <p class="text-muted">Tunisia's most active members — pick at least 3 to see their posts in your feed.</p>
      </header>

      <div class="onb-people-grid">
        ${candidates.length === 0
          ? `<div class="onb-empty">
               <div class="onb-empty-icon" aria-hidden="true"><i class="lucide-users"></i></div>
               <p>No suggestions yet — we'll set you up with a discovery feed.</p>
             </div>`
          : candidates.map(u => {
              const seed = encodeURIComponent(u.fullName || u.id);
              const avatar = u.avatar && (String(u.avatar).startsWith('http') || String(u.avatar).startsWith('data:'))
                ? u.avatar
                : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
              const followed = state.followed.has(u.id);
              return `
                <article class="onb-person${followed ? ' is-followed' : ''}" data-user="${u.id}">
                  <span class="onb-person-avatar-wrap"
                        data-user-id="${escapeAttr(u.id)}"
                        data-user-name="${escapeAttr(u.fullName || '')}"
                        data-user-avatar="${escapeAttr(avatar)}"
                        data-user-handle="${escapeAttr(u.handle || '')}"
                        data-user-plan="${escapeAttr(u.plan || '')}">
                    <img src="${avatar}" alt="" loading="lazy" />
                  </span>
                  <div class="onb-person-info">
                    <strong>${escapeHtml(u.fullName)}</strong>
                    <span class="onb-person-sub">${escapeHtml(u.bio || u.country || `Level ${u.level || 1} Explorer`)}</span>
                  </div>
                  <button type="button" class="onb-follow-btn${followed ? ' is-followed' : ''}" data-user="${u.id}" aria-pressed="${followed ? 'true' : 'false'}">
                    <i class="lucide-${followed ? 'user-check' : 'user-plus'}"></i>
                    <span>${followed ? 'Following' : 'Follow'}</span>
                  </button>
                </article>
              `;
            }).join('')}
      </div>

      <div class="onb-actions">
        <button class="btn btn-ghost" id="onb-back">Back</button>
        <span class="onb-status text-muted" id="onb-follow-count"></span>
        <button class="btn btn-primary" id="onb-next">Finish <i class="lucide-arrow-right"></i></button>
      </div>
    </section>
  `;
}

function stepDone(): string {
  return `
    <section class="onb-card onb-done">
      <div class="onb-illustration onb-illustration-done" aria-hidden="true">
        <div class="onb-illustration-orbs">
          <span class="onb-illustration-orb"></span>
          <span class="onb-illustration-orb"></span>
        </div>
        <div class="onb-illustration-icon onb-illustration-icon-done">
          <i class="lucide-party-popper"></i>
        </div>
      </div>
      <h2>You're all set!</h2>
      <p class="onb-sub">Your feed is ready. Add your first post any time from the home page.</p>
      <div class="onb-actions onb-actions-center">
        <a class="btn btn-primary btn-lg onb-cta-primary" href="#/">Open my feed <i class="lucide-arrow-right"></i></a>
      </div>
    </section>
  `;
}

// ──────────────── wiring ────────────────
function wire(shell: HTMLElement) {
  shell.querySelector('#onb-next')?.addEventListener('click', onNext);
  shell.querySelector('#onb-back')?.addEventListener('click', onBack);
  shell.querySelector('#onb-skip')?.addEventListener('click', skip);

  if (state.step === 1) {
    const file = shell.querySelector<HTMLInputElement>('#onb-file');
    const preview = shell.querySelector<HTMLImageElement>('#onb-avatar-preview');
    shell.querySelector('#onb-pick-avatar')?.addEventListener('click', () => file?.click());
    file?.addEventListener('change', () => {
      const f = file.files?.[0];
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) { showToast('Image too large (max 5MB)', { type: 'error' }); return; }
      const r = new FileReader();
      r.onload = (ev) => {
        const dataUrl = (ev.target?.result as string) || null;
        state.avatarDataUrl = dataUrl;
        if (preview && dataUrl) preview.src = dataUrl;
      };
      r.readAsDataURL(f);
    });

    shell.querySelector('#onb-name')?.addEventListener('input', (e) => {
      state.fullName = (e.target as HTMLInputElement).value;
    });
    shell.querySelector('#onb-country')?.addEventListener('input', (e) => {
      state.country = (e.target as HTMLInputElement).value;
    });
    shell.querySelector('#onb-bio')?.addEventListener('input', (e) => {
      state.bio = (e.target as HTMLTextAreaElement).value;
    });
  }

  if (state.step === 2) {
    shell.querySelectorAll<HTMLButtonElement>('.onb-interest').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.interest!;
        if (state.interests.has(id)) state.interests.delete(id);
        else state.interests.add(id);
        btn.classList.toggle('selected', state.interests.has(id));
        updateInterestCount();
      });
    });
    updateInterestCount();
  }

  if (state.step === 3) {
    shell.querySelectorAll<HTMLButtonElement>('.onb-follow-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const userId = btn.dataset.user!;
        const wasFollowed = state.followed.has(userId);
        btn.disabled = true;
        try {
          if (wasFollowed) await api.unfollowUser(userId);
          else await api.followUser(userId);
          if (wasFollowed) state.followed.delete(userId); else state.followed.add(userId);
          const now = state.followed.has(userId);
          btn.classList.toggle('is-followed', now);
          btn.setAttribute('aria-pressed', now ? 'true' : 'false');
          const icon = btn.querySelector('i');
          const label = btn.querySelector('span');
          if (icon) icon.className = now ? 'lucide-user-check' : 'lucide-user-plus';
          if (label) label.textContent = now ? 'Following' : 'Follow';
          replaceIcons(btn);
          // Card hint
          btn.closest('.onb-person')?.classList.toggle('is-followed', now);
          updateFollowCount();
        } catch (err: any) {
          showToast(err?.message || 'Could not follow', { type: 'error' });
        } finally {
          btn.disabled = false;
        }
      });
    });
    updateFollowCount();
  }
}

function updateInterestCount() {
  const el = document.getElementById('onb-interest-count');
  if (!el) return;
  const n = state.interests.size;
  el.textContent = n === 0 ? 'Pick at least 3' : `${n} selected`;
}

function updateFollowCount() {
  const el = document.getElementById('onb-follow-count');
  if (!el) return;
  const n = state.followed.size;
  el.textContent = n === 0 ? 'Pick at least 3' : `${n} selected`;
}

async function onBack() {
  if (state.step > 0) state.step = (state.step - 1) as State['step'];
  render();
}

async function onNext() {
  // Validate & persist per step
  if (state.step === 1) {
    if (!state.fullName.trim()) { showToast('Name is required', { type: 'error' }); return; }
    try {
      const patch: any = {
        fullName: state.fullName.trim(),
        country: state.country.trim(),
        bio: state.bio.trim(),
      };
      if (state.avatarDataUrl) {
        patch.avatar = await api.uploadDataUrl(state.avatarDataUrl, 'avatars');
      }
      await api.updateMyProfile(patch);
      // re-hydrate navbar
      (window as any).__userHydrated = false;
      window.dispatchEvent(new CustomEvent('etunisia:profile-updated'));
    } catch (e: any) {
      showToast(e?.message || 'Could not save profile', { type: 'error' });
      return;
    }
  }
  if (state.step === 2) {
    if (state.interests.size < 3) {
      showToast('Pick at least 3 interests', { type: 'info' });
      return;
    }
    try {
      await api.updateMyProfile({ interests: Array.from(state.interests) } as any);
    } catch {}
  }
  if (state.step === 3) {
    if (state.followed.size < 3) {
      const ok = window.confirm("You haven't followed 3 yet — that means an empty feed. Continue anyway?");
      if (!ok) return;
    }
    // Mark onboarding done
    try {
      await api.updateMyProfile({ onboardingComplete: true } as any);
    } catch {}
  }

  if (state.step < 4) {
    state.step = (state.step + 1) as State['step'];
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    location.hash = '#/';
  }
}

async function skip() {
  try { await api.updateMyProfile({ onboardingComplete: true } as any); } catch {}
  location.hash = '#/';
}

// ──────────────── helpers ────────────────
function escapeHtml(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
