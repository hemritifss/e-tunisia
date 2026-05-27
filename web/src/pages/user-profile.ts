// ============================================
// PUBLIC USER PROFILE — /#/u/<handle> or /#/user/<id>
// Cover banner + identity + stats + about + tabs.
// Mirrors design-system/pages/profile.md primitives for the
// "viewing someone else" surface. See design-system/pages/user-profile.md.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';
import { openDonateModal } from '../donate-modal';
import { isLoggedIn, requireAuth, showToast, linkifyHashtagsAndMentions } from '../ui-utils';
import { openSafetyMenu } from '../safety-menu';

/** Tier → Lucide icon + label (same source-of-truth as profile.ts). */
function tierFor(level: number): { iconName: string; label: string } {
  if (level >= 10) return { iconName: 'crown',   label: 'Legend' };
  if (level >= 7)  return { iconName: 'star',    label: 'Veteran' };
  if (level >= 4)  return { iconName: 'compass', label: 'Explorer' };
  return { iconName: 'sprout', label: 'Newcomer' };
}

function isProPlan(plan: string | null | undefined): boolean {
  return plan === 'premium' || plan === 'business' || plan === 'admin';
}

export function renderUserProfilePage(_id: string): string {
  return `
    <div class="user-profile-v2 page-enter" data-design="sleek" id="user-profile-root">
      <a href="javascript:history.back()" class="back-floating-btn" aria-label="Back">
        <i class="lucide-arrow-left"></i>
      </a>
      <div class="up-loading">
        <div class="spinner"></div>
        <p>Loading profile…</p>
      </div>
    </div>
  `;
}

function fmt(n: number) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

function escapeHtml(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export async function initUserProfilePage(id: string) {
  const root = document.getElementById('user-profile-root');
  if (!root) return;

  const [user, counts, followStatus, me, postsRes, blockedStatus] = await Promise.all([
    api.getPublicUser(id).catch(() => null),
    api.getFollowCounts(id).catch(() => ({ followers: 0, following: 0 })),
    isLoggedIn() ? api.isFollowing(id).catch(() => false) : Promise.resolve(false),
    isLoggedIn() ? api.getMyProfile().catch(() => null) : Promise.resolve(null),
    api.getUserPosts(id, 12).catch(() => ({ data: [], meta: { total: 0 } })),
    isLoggedIn() ? api.isUserBlocked(id).catch(() => ({ isBlocked: false })) : Promise.resolve({ isBlocked: false }),
  ]) as any;

  if (!user) {
    root.innerHTML = `
      <a href="javascript:history.back()" class="back-floating-btn"><i class="lucide-arrow-left"></i></a>
      <div class="up-not-found">
        <i class="lucide-user-x"></i>
        <h3>Profile not found</h3>
        <p>This account may have been removed or the link is invalid.</p>
      </div>
    `;
    replaceIcons(root);
    return;
  }

  const isMe = !!me && me.id === user.id;
  const followers = Number(counts?.followers) || 0;
  const following = Number(counts?.following) || 0;
  let isFollowingNow = false;
  if (typeof followStatus === 'boolean') isFollowingNow = followStatus;
  else if (followStatus && typeof followStatus === 'object') isFollowingNow = !!followStatus.isFollowing;

  const seed = encodeURIComponent(user.fullName || user.id);
  const avatar = user.avatar
    ? api.getImageUrl(user.avatar, 'avatar')
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;

  const joinedAt = user.createdAt ? new Date(user.createdAt) : null;
  const joinedLabel = joinedAt
    ? joinedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const posts: any[] = Array.isArray(postsRes?.data) ? postsRes.data : [];
  const postCount = Number(postsRes?.meta?.total ?? posts.length);

  const isVerified = user.role === 'admin' || user.level >= 10;
  const plan = user.plan || null;
  const isPro = isProPlan(plan);
  const tier = tierFor(user.level || 1);
  const tierIcon = isVerified ? 'crown' : tier.iconName;
  const tierLabel = isVerified ? 'Verified' : tier.label;

  root.innerHTML = `
    <!-- Cover banner — cinematic mesh + 2 floating orbs + tier badge -->
    <header class="up-cover${isPro ? ' is-pro' : ''}">
      <div class="up-cover-gradient" aria-hidden="true"></div>
      <div class="up-cover-pattern" aria-hidden="true"></div>
      <div class="up-cover-orbs" aria-hidden="true">
        <span class="up-cover-orb"></span>
        <span class="up-cover-orb"></span>
      </div>
      <a href="javascript:history.back()" class="back-floating-btn" aria-label="Back">
        <i class="lucide-arrow-left"></i>
      </a>
      <div class="up-cover-tier-badge" data-tier="${tierIcon}" aria-label="Level ${user.level || 1} ${tierLabel}">
        <span class="up-tier-icon" aria-hidden="true"><i class="lucide-${tierIcon}"></i></span>
        <span class="up-tier-text">Level ${user.level || 1} ${tierLabel}</span>
      </div>
      ${isMe ? `
        <a href="#/profile-edit" class="up-cover-edit-btn">
          <i class="lucide-edit-3"></i> Edit cover
        </a>` : ''}
    </header>

    <!-- Identity row: avatar overlaps cover, action buttons sit beside it on desktop -->
    <section class="up-identity">
      <div class="up-avatar-wrap${isPro ? ' is-pro' : ''}"
           data-user-id="${user.id}"
           data-user-name="${escapeHtml(user.fullName)}"
           data-user-avatar="${avatar}"
           data-user-handle="${escapeHtml(user.handle || '')}"
           data-user-plan="${escapeHtml(plan || '')}">
        <img src="${avatar}" alt="${escapeHtml(user.fullName)}" class="up-avatar" />
        ${isPro ? `<span class="up-avatar-pro-mark" title="${plan === 'business' ? 'Verified Business' : 'Pro Traveler'}" aria-label="${plan === 'business' ? 'Verified Business' : 'Pro Traveler'}"><i class="lucide-sparkles"></i></span>` : ''}
      </div>

      <div class="up-actions">
        ${isMe ? `
          <a class="btn btn-primary" href="#/profile/edit">
            <i class="lucide-edit-3"></i> Edit profile
          </a>
          <a class="btn btn-outline" href="#/credits">
            <i class="lucide-coins"></i> Credits
          </a>
        ` : isLoggedIn() ? `
          <button class="btn ${isFollowingNow ? 'btn-following' : 'btn-primary'}" id="user-follow-btn" data-following="${isFollowingNow ? '1' : '0'}">
            <i class="lucide-${isFollowingNow ? 'user-check' : 'user-plus'}" data-follow-icon></i>
            <span data-follow-label>${isFollowingNow ? 'Following' : 'Follow'}</span>
          </button>
          <button class="btn btn-outline" id="user-profile-message-btn" data-user-id="${user.id}">
            <i class="lucide-message-circle"></i> Message
          </button>
          <button class="btn btn-outline" id="user-profile-tip-btn">
            <i class="lucide-coins"></i> Tip
          </button>
          <button class="btn-icon up-more-btn" aria-label="More options" id="up-more-btn">
            <i class="lucide-more-horizontal"></i>
          </button>
        ` : `
          <a class="btn btn-primary" href="#/login">
            <i class="lucide-log-in"></i> Sign in to follow
          </a>
        `}
      </div>
    </section>

    <!-- Bio block: name + verified badge + Pro sparkle + handle + meta -->
    <section class="up-bio">
      <h1 class="up-name">
        <span class="up-name-text">${escapeHtml(user.fullName)}</span>
        ${isVerified ? '<span class="up-verified" title="Verified"><i class="lucide-badge-check"></i></span>' : ''}
        ${isPro && !isVerified ? `<span class="up-pro-sparkle" title="${plan === 'business' ? 'Verified Business' : 'Pro Traveler'}"><i class="lucide-sparkles"></i></span>` : ''}
      </h1>
      ${user.handle ? `<p class="up-handle">@${escapeHtml(user.handle)}</p>` : ''}
      <p class="up-headline">${user.role === 'admin' ? 'e-Tunisia team' : `${tier.label} · Level ${user.level || 1}`}</p>

      <div class="up-meta">
        ${user.country ? `<span><i class="lucide-map-pin"></i> ${escapeHtml(user.country)}</span>` : ''}
        ${joinedLabel ? `<span><i class="lucide-calendar"></i> Joined ${joinedLabel}</span>` : ''}
        ${Array.isArray(user.badges) && user.badges.length > 0
          ? `<span><i class="lucide-award"></i> ${user.badges.length} badge${user.badges.length === 1 ? '' : 's'}</span>`
          : ''}
      </div>
    </section>

    <!-- Stats bar — tinted icon tiles (closes the loop with explore/mood palette) -->
    <section class="up-stats">
      <div class="up-stat">
        <div class="up-stat-icon up-stat-icon-posts"><i class="lucide-grid-3x3"></i></div>
        <strong>${fmt(postCount)}</strong>
        <span>Posts</span>
      </div>
      <div class="up-stat" id="up-stat-followers">
        <div class="up-stat-icon up-stat-icon-followers"><i class="lucide-users"></i></div>
        <strong id="user-followers-count">${fmt(followers)}</strong>
        <span>Followers</span>
      </div>
      <div class="up-stat">
        <div class="up-stat-icon up-stat-icon-following"><i class="lucide-user-plus"></i></div>
        <strong>${fmt(following)}</strong>
        <span>Following</span>
      </div>
      <div class="up-stat">
        <div class="up-stat-icon up-stat-icon-xp"><i class="lucide-zap"></i></div>
        <strong>${fmt(user.points || 0)}</strong>
        <span>XP</span>
      </div>
    </section>

    <!-- About card — bio, website, location, joined date -->
    ${(user.bio || user.website || user.country) ? `
    <section class="up-about">
      <h3 class="up-about-title">About</h3>
      ${user.bio
        ? `<p class="up-about-bio">${linkifyHashtagsAndMentions(user.bio).replace(/\n/g, '<br />')}</p>`
        : ''}
      <ul class="up-about-list">
        ${user.country ? `<li><i class="lucide-map-pin"></i><span>${escapeHtml(user.country)}</span></li>` : ''}
        ${user.website ? `<li><i class="lucide-link"></i>
          <a class="up-about-link" href="${escapeHtml(user.website)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(user.website.replace(/^https?:\/\//i, '').replace(/\/$/, ''))}
          </a></li>` : ''}
        ${joinedLabel ? `<li><i class="lucide-calendar"></i><span>Joined ${joinedLabel}</span></li>` : ''}
      </ul>
    </section>` : ''}

    <!-- Tabs -->
    <nav class="up-tabs" role="tablist">
      <button class="up-tab active" role="tab" aria-selected="true" data-tab="posts">
        <i class="lucide-grid-3x3"></i><span>Posts</span>
      </button>
      <button class="up-tab" role="tab" aria-selected="false" data-tab="badges">
        <i class="lucide-award"></i><span>Badges</span>
      </button>
      ${isMe ? `
      <button class="up-tab" role="tab" aria-selected="false" data-tab="saved">
        <i class="lucide-bookmark"></i><span>Saved</span>
      </button>` : ''}
    </nav>

    <!-- Tab panels -->
    <section class="up-tab-panel" data-panel="posts">
      ${posts.length === 0
        ? `<div class="up-empty"><i class="lucide-image-off"></i><p>No posts yet</p></div>`
        : `<div class="up-posts-grid">
            ${posts.map(renderPostTile).join('')}
          </div>`}
    </section>
    <section class="up-tab-panel" data-panel="badges" hidden>
      ${Array.isArray(user.badges) && user.badges.length > 0
        ? `<div class="up-badges-grid">
            ${user.badges.map((b: any) => `
              <div class="up-badge-card">
                <i class="${typeof b === 'string' ? 'lucide-award' : (b.icon || 'lucide-award')}"></i>
                <span>${escapeHtml(typeof b === 'string' ? b : (b.name || 'Badge'))}</span>
              </div>`).join('')}
          </div>`
        : `<div class="up-empty"><i class="lucide-award"></i><p>No badges yet</p></div>`}
    </section>
    ${isMe ? `
    <section class="up-tab-panel" data-panel="saved" hidden>
      <div class="up-empty">
        <i class="lucide-bookmark"></i>
        <p>Saved posts live here</p>
        <a class="btn btn-outline btn-sm" href="#/favorites" style="margin-top:var(--space-3);">
          <i class="lucide-heart"></i> View saved places
        </a>
      </div>
    </section>` : ''}
  `;

  replaceIcons(root);
  wireTabs(root);
  wireActions(root, user, avatar);
  wireSafety(root, user, !!blockedStatus?.isBlocked);

  function renderPostTile(p: any): string {
    const cover = Array.isArray(p.images) && p.images[0] ? p.images[0] : null;
    const placeholder = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(p.id || p.title)}`;
    return `
      <a class="up-post-tile" href="#/post/${p.id}">
        <div class="up-post-tile-img">
          ${cover
            ? `<img src="${cover}" loading="lazy" alt="${escapeHtml(p.title || '')}" />`
            : `<div class="up-post-tile-text"><span>${escapeHtml((p.title || '').slice(0, 60))}</span></div>`}
          <div class="up-post-tile-overlay">
            <span><i class="lucide-arrow-up"></i> ${fmt(p.upvotes || 0)}</span>
            <span><i class="lucide-message-square"></i> ${fmt(p.commentCount || 0)}</span>
          </div>
        </div>
        <span class="up-post-tile-meta">${timeAgo(p.createdAt)} · ${escapeHtml(p.category || 'Post')}</span>
      </a>
    `;
  }
}

function wireTabs(root: HTMLElement) {
  const tabs = Array.from(root.querySelectorAll<HTMLElement>('.up-tab'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('.up-tab-panel'));
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.tab;
      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      panels.forEach(p => {
        p.hidden = p.dataset.panel !== key;
      });
    });
  });
}

function wireSafety(root: HTMLElement, user: any, isBlocked: boolean) {
  const moreBtn = root.querySelector<HTMLButtonElement>('#up-more-btn');
  moreBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    openSafetyMenu(moreBtn, {
      target: { type: 'user', id: user.id, name: user.fullName },
      initiallyBlocked: isBlocked,
      onAfterBlock: () => {
        // Re-render the page so the feed-filter + state stays in sync
        const cur = location.hash;
        location.hash = '#/'; // force a transition
        setTimeout(() => { location.hash = cur; }, 0);
      },
    });
  });
}

function wireActions(root: HTMLElement, user: any, avatar: string) {
  root.querySelector<HTMLButtonElement>('#user-profile-tip-btn')?.addEventListener('click', () => {
    openDonateModal({
      target: 'user',
      toUserId: user.id,
      toUserName: user.fullName,
      toUserAvatar: avatar,
    });
  });

  // Message → open Facebook-Messenger-style popup over the current page.
  // Falls back to the full Messages route only if the global manager hasn't mounted yet.
  root.querySelector<HTMLButtonElement>('#user-profile-message-btn')?.addEventListener('click', () => {
    const open = (window as any).openChatPopup;
    if (typeof open === 'function') open(user.id);
    else location.hash = `#/messages/user/${encodeURIComponent(user.id)}`;
  });

  const followBtn = root.querySelector<HTMLButtonElement>('#user-follow-btn');
  if (followBtn) {
    // Hover state — toggle "Following" → "Unfollow"
    followBtn.addEventListener('mouseenter', () => {
      if (followBtn.dataset.following !== '1') return;
      const label = followBtn.querySelector('[data-follow-label]');
      const icon = followBtn.querySelector('[data-follow-icon]') as HTMLElement | null;
      if (label) label.textContent = 'Unfollow';
      if (icon) icon.className = 'lucide-user-minus';
      replaceIcons(followBtn);
      followBtn.classList.add('btn-following-hover');
    });
    followBtn.addEventListener('mouseleave', () => {
      if (followBtn.dataset.following !== '1') return;
      const label = followBtn.querySelector('[data-follow-label]');
      const icon = followBtn.querySelector('[data-follow-icon]') as HTMLElement | null;
      if (label) label.textContent = 'Following';
      if (icon) icon.className = 'lucide-user-check';
      replaceIcons(followBtn);
      followBtn.classList.remove('btn-following-hover');
    });

    followBtn.addEventListener('click', async () => {
      if (!requireAuth('follow members')) return;
      const wasFollowing = followBtn.dataset.following === '1';
      followBtn.disabled = true;
      try {
        if (wasFollowing) await api.unfollowUser(user.id);
        else await api.followUser(user.id);
        const nowFollowing = !wasFollowing;
        followBtn.dataset.following = nowFollowing ? '1' : '0';
        followBtn.classList.toggle('btn-primary', !nowFollowing);
        followBtn.classList.toggle('btn-following', nowFollowing);
        followBtn.classList.remove('btn-following-hover');
        const icon = followBtn.querySelector('[data-follow-icon]') as HTMLElement | null;
        const label = followBtn.querySelector('[data-follow-label]');
        if (icon) icon.className = nowFollowing ? 'lucide-user-check' : 'lucide-user-plus';
        if (label) label.textContent = nowFollowing ? 'Following' : 'Follow';
        replaceIcons(followBtn);

        const fc = document.getElementById('user-followers-count');
        if (fc) {
          const cur = parseInt((fc.textContent || '0').replace(/[^\d]/g, ''));
          fc.textContent = String(cur + (nowFollowing ? 1 : -1));
        }
        showToast(nowFollowing ? `Following ${user.fullName}` : `Unfollowed ${user.fullName}`);
      } catch (err: any) {
        showToast(err?.message || 'Could not update follow', { type: 'error' });
      } finally {
        followBtn.disabled = false;
      }
    });
  }
}
