import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Crown, Star, Compass, Sprout, Edit3, Sparkles, BadgeCheck, UserCheck, UserPlus, UserMinus,
  MessageCircle, Coins, MoreHorizontal, MapPin, Calendar, Award, Link as LinkIcon, Grid3x3, Users, Zap,
  Bookmark, ImageOff, ArrowUp, MessageSquare, LogIn, UserX, Heart,
} from 'lucide-react';
import * as api from '../../api';
import { openDonateModal } from '../../donate-modal';
import { currentPath, goTo } from '../../router';
import { isLoggedIn, requireAuth, showToast, linkifyHashtagsAndMentions } from '../../ui-utils';
import { openSafetyMenu } from '../../safety-menu';

// Migrated from vanilla pages/user-profile.ts — public profile at /user/:id.

const TIER_ICONS: Record<string, React.ComponentType<any>> = { crown: Crown, star: Star, compass: Compass, sprout: Sprout };
function tierFor(level: number) {
  if (level >= 10) return { iconName: 'crown', label: 'Legend' };
  if (level >= 7) return { iconName: 'star', label: 'Veteran' };
  if (level >= 4) return { iconName: 'compass', label: 'Explorer' };
  return { iconName: 'sprout', label: 'Newcomer' };
}
const isProPlan = (plan?: string | null) => plan === 'premium' || plan === 'business' || plan === 'admin';

function fmt(n: number) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
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
function userIdFromPath(): string {
  const m = currentPath().match(/^\/user\/([^/?]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

function FollowButton({ userId, userName, initial, onCountDelta }: { userId: string; userName: string; initial: boolean; onCountDelta: (d: number) => void }) {
  const [following, setFollowing] = useState(initial);
  const [hovering, setHovering] = useState(false);
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (!requireAuth('follow members')) return;
    const was = following;
    setBusy(true);
    try {
      if (was) await api.unfollowUser(userId); else await api.followUser(userId);
      setFollowing(!was);
      onCountDelta(was ? -1 : 1);
      showToast(was ? `Unfollowed ${userName}` : `Following ${userName}`);
    } catch (err: any) {
      showToast(err?.message || 'Could not update follow', { type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const label = following ? (hovering ? 'Unfollow' : 'Following') : 'Follow';
  const Icon = following ? (hovering ? UserMinus : UserCheck) : UserPlus;
  return (
    <button
      className={`btn ${following ? 'btn-following' : 'btn-primary'} ${following && hovering ? 'btn-following-hover' : ''}`}
      disabled={busy}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={onClick}
    >
      <Icon /> <span>{label}</span>
    </button>
  );
}

function PostTile({ p }: { p: any }) {
  const cover = Array.isArray(p.images) && p.images[0] ? p.images[0] : null;
  return (
    <a className="up-post-tile" href={`#/post/${p.id}`}>
      <div className="up-post-tile-img">
        {cover ? <img src={cover} loading="lazy" alt={p.title || ''} /> : <div className="up-post-tile-text"><span>{(p.title || '').slice(0, 60)}</span></div>}
        <div className="up-post-tile-overlay">
          <span><ArrowUp /> {fmt(p.upvotes || 0)}</span>
          <span><MessageSquare /> {fmt(p.commentCount || 0)}</span>
        </div>
      </div>
      <span className="up-post-tile-meta">{timeAgo(p.createdAt)} · {p.category || 'Post'}</span>
    </a>
  );
}

export default function UserProfilePage() {
  const queryClient = useQueryClient();
  const [userId] = useState(userIdFromPath());
  const [tab, setTab] = useState<'posts' | 'badges' | 'saved'>('posts');
  const [followers, setFollowers] = useState(0);
  const loggedIn = isLoggedIn();

  const { data, isLoading } = useQuery({
    queryKey: ['public-user', userId],
    queryFn: async () => {
      const [user, counts, followStatus, me, postsRes, blockedStatus] = await Promise.all([
        api.getPublicUser(userId).catch(() => null),
        api.getFollowCounts(userId).catch(() => ({ followers: 0, following: 0 })),
        loggedIn ? api.isFollowing(userId).catch(() => false) : Promise.resolve(false),
        loggedIn ? api.getMyProfile().catch(() => null) : Promise.resolve(null),
        api.getUserPosts(userId, 12).catch(() => ({ data: [], meta: { total: 0 } })),
        loggedIn ? api.isUserBlocked(userId).catch(() => ({ isBlocked: false })) : Promise.resolve({ isBlocked: false }),
      ]);
      return { user, counts, followStatus, me, postsRes, blockedStatus };
    },
  });

  useEffect(() => {
    if (data?.counts) setFollowers(Number((data.counts as any).followers) || 0);
  }, [data?.counts]);

  if (isLoading) {
    return (
      <div className="user-profile-v2 page-enter" data-design="sleek" id="user-profile-root">
        <a href="javascript:history.back()" className="back-floating-btn" aria-label="Back"><ArrowLeft /></a>
        <div className="user-profile-skeleton">
          <div className="sk-cover skeleton-block" />
          <div className="sk-identity"><div className="sk-avatar skeleton-block" /><div className="sk-name skeleton-block" /><div className="sk-handle skeleton-block" /><div className="sk-bio skeleton-block" /></div>
          <div className="sk-stats">{[0, 1, 2, 3].map((i) => <div className="sk-stat" key={i}><div className="sk-stat-num skeleton-block" /><div className="sk-stat-label skeleton-block" /></div>)}</div>
        </div>
      </div>
    );
  }

  const user = data?.user;
  if (!user) {
    return (
      <div className="user-profile-v2 page-enter" data-design="sleek" id="user-profile-root">
        <a href="javascript:history.back()" className="back-floating-btn"><ArrowLeft /></a>
        <div className="up-not-found"><UserX /><h3>Profile not found</h3><p>This account may have been removed or the link is invalid.</p></div>
      </div>
    );
  }

  const me = data!.me;
  const following = Number((data!.counts as any)?.following) || 0;
  const fs = data!.followStatus as any;
  const initialFollowing = typeof fs === 'boolean' ? fs : !!fs?.isFollowing;
  const isMe = !!me && me.id === user.id;
  const seed = encodeURIComponent(user.fullName || user.id);
  const avatar = user.avatar ? api.getImageUrl(user.avatar, 'avatar') : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
  const joinedLabel = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
  const posts: any[] = Array.isArray(data!.postsRes?.data) ? data!.postsRes.data : [];
  const postCount = Number(data!.postsRes?.meta?.total ?? posts.length);
  const isVerified = user.role === 'admin' || user.level >= 10;
  const plan = user.plan || null;
  const isPro = isProPlan(plan);
  const tier = tierFor(user.level || 1);
  const tierIconName = isVerified ? 'crown' : tier.iconName;
  const TierIcon = TIER_ICONS[tierIconName] || Sprout;
  const tierLabel = isVerified ? 'Verified' : tier.label;

  const onMessage = () => {
    const open = (window as any).openChatPopup;
    if (typeof open === 'function') open(user.id);
    else goTo(`/messages/user/${encodeURIComponent(user.id)}`);
  };
  const onTip = () => openDonateModal({ target: 'user', toUserId: user.id, toUserName: user.fullName, toUserAvatar: avatar });
  const onMore = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    openSafetyMenu(e.currentTarget, {
      target: { type: 'user', id: user.id, name: user.fullName },
      initiallyBlocked: !!data!.blockedStatus?.isBlocked,
      onAfterBlock: () => queryClient.invalidateQueries({ queryKey: ['public-user', userId] }),
    });
  };

  return (
    <div className="user-profile-v2 page-enter" data-design="sleek" id="user-profile-root">
      <header className={`up-cover${isPro ? ' is-pro' : ''}`}>
        <div className="up-cover-gradient" aria-hidden="true" />
        <div className="up-cover-pattern" aria-hidden="true" />
        <div className="up-cover-orbs" aria-hidden="true"><span className="up-cover-orb" /><span className="up-cover-orb" /></div>
        <a href="javascript:history.back()" className="back-floating-btn" aria-label="Back"><ArrowLeft /></a>
        <div className="up-cover-tier-badge" data-tier={tierIconName} aria-label={`Level ${user.level || 1} ${tierLabel}`}>
          <span className="up-tier-icon" aria-hidden="true"><TierIcon /></span>
          <span className="up-tier-text">Level {user.level || 1} {tierLabel}</span>
        </div>
        {isMe && <a href="#/profile-edit" className="up-cover-edit-btn"><Edit3 /> Edit cover</a>}
      </header>

      <section className="up-identity">
        <div
          className={`up-avatar-wrap${isPro ? ' is-pro' : ''}`}
          data-user-id={user.id} data-user-name={user.fullName} data-user-avatar={avatar} data-user-handle={user.handle || ''} data-user-plan={plan || ''}
        >
          <img src={avatar} alt={user.fullName} className="up-avatar" />
          {isPro && <span className="up-avatar-pro-mark" title={plan === 'business' ? 'Verified Business' : 'Pro Traveler'} aria-label={plan === 'business' ? 'Verified Business' : 'Pro Traveler'}><Sparkles /></span>}
        </div>
        <div className="up-actions">
          {isMe ? (
            <>
              <a className="btn btn-primary" href="#/profile/edit"><Edit3 /> Edit profile</a>
              <a className="btn btn-outline" href="#/credits"><Coins /> Credits</a>
            </>
          ) : loggedIn ? (
            <>
              <FollowButton userId={user.id} userName={user.fullName} initial={initialFollowing} onCountDelta={(d) => setFollowers((c) => c + d)} />
              <button className="btn btn-outline" onClick={onMessage}><MessageCircle /> Message</button>
              <button className="btn btn-outline" onClick={onTip}><Coins /> Tip</button>
              <button className="btn-icon up-more-btn" aria-label="More options" onClick={onMore}><MoreHorizontal /></button>
            </>
          ) : (
            <a className="btn btn-primary" href="#/login"><LogIn /> Sign in to follow</a>
          )}
        </div>
      </section>

      <section className="up-bio">
        <h1 className="up-name">
          <span className="up-name-text">{user.fullName}</span>
          {isVerified && <span className="up-verified" title="Verified"><BadgeCheck /></span>}
          {isPro && !isVerified && <span className="up-pro-sparkle" title={plan === 'business' ? 'Verified Business' : 'Pro Traveler'}><Sparkles /></span>}
        </h1>
        {user.handle && <p className="up-handle">@{user.handle}</p>}
        <p className="up-headline">{user.role === 'admin' ? 'e-Tunisia team' : `${tier.label} · Level ${user.level || 1}`}</p>
        <div className="up-meta">
          {user.country && <span><MapPin /> {user.country}</span>}
          {joinedLabel && <span><Calendar /> Joined {joinedLabel}</span>}
          {Array.isArray(user.badges) && user.badges.length > 0 && <span><Award /> {user.badges.length} badge{user.badges.length === 1 ? '' : 's'}</span>}
        </div>
      </section>

      <section className="up-stats">
        <div className="up-stat"><div className="up-stat-icon up-stat-icon-posts"><Grid3x3 /></div><strong>{fmt(postCount)}</strong><span>Posts</span></div>
        <div className="up-stat"><div className="up-stat-icon up-stat-icon-followers"><Users /></div><strong>{fmt(followers)}</strong><span>Followers</span></div>
        <div className="up-stat"><div className="up-stat-icon up-stat-icon-following"><UserPlus /></div><strong>{fmt(following)}</strong><span>Following</span></div>
        <div className="up-stat"><div className="up-stat-icon up-stat-icon-xp"><Zap /></div><strong>{fmt(user.points || 0)}</strong><span>XP</span></div>
      </section>

      {(user.bio || user.website || user.country) && (
        <section className="up-about">
          <h3 className="up-about-title">About</h3>
          {user.bio && <p className="up-about-bio" dangerouslySetInnerHTML={{ __html: linkifyHashtagsAndMentions(user.bio).replace(/\n/g, '<br />') }} />}
          <ul className="up-about-list">
            {user.country && <li><MapPin /><span>{user.country}</span></li>}
            {user.website && <li><LinkIcon /><a className="up-about-link" href={user.website} target="_blank" rel="noopener noreferrer">{user.website.replace(/^https?:\/\//i, '').replace(/\/$/, '')}</a></li>}
            {joinedLabel && <li><Calendar /><span>Joined {joinedLabel}</span></li>}
          </ul>
        </section>
      )}

      <nav className="up-tabs" role="tablist">
        <button className={`up-tab ${tab === 'posts' ? 'active' : ''}`} role="tab" aria-selected={tab === 'posts'} onClick={() => setTab('posts')}><Grid3x3 /><span>Posts</span></button>
        <button className={`up-tab ${tab === 'badges' ? 'active' : ''}`} role="tab" aria-selected={tab === 'badges'} onClick={() => setTab('badges')}><Award /><span>Badges</span></button>
        {isMe && <button className={`up-tab ${tab === 'saved' ? 'active' : ''}`} role="tab" aria-selected={tab === 'saved'} onClick={() => setTab('saved')}><Bookmark /><span>Saved</span></button>}
      </nav>

      <section className="up-tab-panel" data-panel="posts" hidden={tab !== 'posts'}>
        {posts.length === 0 ? (
          <div className="up-empty"><ImageOff /><p>No posts yet</p></div>
        ) : (
          <div className="up-posts-grid">{posts.map((p) => <PostTile key={p.id} p={p} />)}</div>
        )}
      </section>
      <section className="up-tab-panel" data-panel="badges" hidden={tab !== 'badges'}>
        {Array.isArray(user.badges) && user.badges.length > 0 ? (
          <div className="up-badges-grid">
            {user.badges.map((b: any, i: number) => (
              <div className="up-badge-card" key={i}><Award /><span>{typeof b === 'string' ? b : b.name || 'Badge'}</span></div>
            ))}
          </div>
        ) : (
          <div className="up-empty"><Award /><p>No badges yet</p></div>
        )}
      </section>
      {isMe && (
        <section className="up-tab-panel" data-panel="saved" hidden={tab !== 'saved'}>
          <div className="up-empty">
            <Bookmark /><p>Saved posts live here</p>
            <a className="btn btn-outline btn-sm" href="#/favorites" style={{ marginTop: 'var(--space-3)' }}><Heart /> View saved places</a>
          </div>
        </section>
      )}
    </div>
  );
}
