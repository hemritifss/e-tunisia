import '../../styles/profile.css';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Crown, Star, Compass, Sprout, Sparkles, Edit3, Settings, MapPin, Link as LinkIcon, Calendar,
  Zap, Trophy, Flame, Heart, Award, Coins, BarChart3, Map as MapIcon, Layers, Globe2,
  ExternalLink, ChevronRight, LogOut, ArrowRight, UserX, Home,
} from 'lucide-react';
import * as api from '../../api';
import { goTo } from '../../router';
import { TravelPersonalityCard } from '../components/TravelPersonalityCard';

// Migrated from vanilla pages/profile.ts — own profile (cover, identity, XP, stats, quick links).

const TIER_ICONS: Record<string, React.ComponentType<any>> = { crown: Crown, star: Star, compass: Compass, sprout: Sprout };

function tierFor(level: number): { iconName: string; label: string } {
  if (level >= 10) return { iconName: 'crown', label: 'Legend' };
  if (level >= 7) return { iconName: 'star', label: 'Veteran' };
  if (level >= 4) return { iconName: 'compass', label: 'Explorer' };
  return { iconName: 'sprout', label: 'Newcomer' };
}

const isProPlan = (plan?: string | null) => plan === 'premium' || plan === 'business' || plan === 'admin';

export default function ProfilePage() {
  const userQ = useQuery({ queryKey: ['my-profile-page'], queryFn: () => api.getMyProfile().catch(() => null) });
  const pointsQ = useQuery({ queryKey: ['my-points'], queryFn: () => api.getMyPoints().catch(() => ({ total: 0, level: 1 })), enabled: !!userQ.data });
  const rankQ = useQuery({ queryKey: ['my-rank'], queryFn: () => api.getMyRank().catch(() => ({ rank: '–' })), enabled: !!userQ.data });

  const user = userQ.data;
  const points: any = pointsQ.data || { total: 0, level: 1 };
  const rank: any = rankQ.data || { rank: '–' };

  if (userQ.isLoading) {
    return (
      <div className="profile-page-v2 page-enter" data-design="sleek">
        <div className="up-loading" style={{ paddingTop: 120 }}><div className="spinner" /><p>Loading profile…</p></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page-v2 page-enter" data-design="sleek">
        <div className="pp-empty-state">
          <UserX />
          <h2>Could not load profile</h2>
          <p>Something went wrong. Please try again.</p>
          <a href="#/" className="btn btn-primary"><Home /> Go home</a>
        </div>
      </div>
    );
  }

  const seed = encodeURIComponent(user.fullName || user.name || user.id);
  const avatar = user.avatar ? api.getImageUrl(user.avatar, 'avatar') : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
  const name = user.fullName || user.name || 'Explorer';
  const level = points.level || user.level || 1;
  const xp = (points.total || 0).toLocaleString();
  const rankNum = rank.rank || '–';
  const bio = user.bio || '';
  const country = user.country || '';
  const handle = user.handle || '';
  const website = user.website || '';
  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

  const xpForLevel = (lvl: number) => lvl * lvl * 500;
  const currentLevelXp = xpForLevel(level - 1);
  const nextLevelXp = xpForLevel(level);
  const progressPct = Math.min(100, Math.round((((points.total || 0) - currentLevelXp) / Math.max(1, nextLevelXp - currentLevelXp)) * 100));

  const tier = tierFor(level);
  const TierIcon = TIER_ICONS[tier.iconName] || Sprout;
  const plan = user.plan || null;
  const isPro = isProPlan(plan);
  const userId = user.id || '';

  const logout = () => {
    api.logout();
    goTo('/login');
    location.reload();
  };

  return (
    <div className="profile-page-v2 page-enter" data-design="sleek">
      <header className={`pp-cover${isPro ? ' is-pro' : ''}`}>
        <div className="pp-cover-gradient" aria-hidden="true" />
        <div className="pp-cover-pattern" aria-hidden="true" />
        <div className="pp-cover-orbs" aria-hidden="true"><span className="pp-cover-orb" /><span className="pp-cover-orb" /></div>
        <div className="pp-cover-level-badge" data-tier={tier.iconName}>
          <span className="pp-tier-icon" aria-hidden="true"><TierIcon /></span>
          <span className="pp-level-text">Level {level} {tier.label}</span>
        </div>
      </header>

      <section className="pp-identity">
        <div
          className={`pp-avatar-wrap${isPro ? ' is-pro' : ''}`}
          {...(userId ? { 'data-user-id': userId, 'data-user-name': name, 'data-user-avatar': avatar, 'data-user-handle': handle, 'data-user-plan': plan || '' } : {})}
        >
          <img src={avatar} alt={name} className="pp-avatar" />
          <span className="pp-avatar-ring" aria-hidden="true" />
          {isPro && (
            <span className="pp-avatar-pro-mark" title={plan === 'business' ? 'Verified Business' : 'Pro Traveler'} aria-label={plan === 'business' ? 'Verified Business' : 'Pro Traveler'}><Sparkles /></span>
          )}
        </div>
        <div className="pp-actions-row">
          <a href="#/profile-edit" className="btn btn-primary pp-edit-btn"><Edit3 /> Edit profile</a>
          <a href="#/settings" className="btn btn-outline pp-settings-btn" aria-label="Settings"><Settings /></a>
        </div>
      </section>

      <section className="pp-bio">
        <h1 className="pp-name">{name}</h1>
        {handle && <span className="pp-handle">@{handle}</span>}
        {bio && <p className="pp-bio-text">{bio}</p>}
        <div className="pp-meta">
          {country && <span><MapPin /> {country}</span>}
          {website && <span><LinkIcon /> <a href={website} target="_blank" rel="noopener">{website.replace(/^https?:\/\//, '')}</a></span>}
          {joinDate && <span><Calendar /> Joined {joinDate}</span>}
        </div>
      </section>

      <section className="pp-xp-progress">
        <div className="pp-xp-header">
          <span className="pp-xp-label">Level {level} Progress</span>
          <span className="pp-xp-value">{xp} XP</span>
        </div>
        <div className="pp-xp-bar"><div className="pp-xp-fill" style={{ width: `${progressPct}%` }} /></div>
        <div className="pp-xp-footer">
          <span>{progressPct}% to Level {level + 1}</span>
          <span>{(nextLevelXp - (points.total || 0)).toLocaleString()} XP needed</span>
        </div>
      </section>

      <section className="pp-stats">
        <div className="pp-stat"><div className="pp-stat-icon pp-stat-icon-xp"><Zap /></div><strong>{xp}</strong><span>XP Points</span></div>
        <div className="pp-stat"><div className="pp-stat-icon pp-stat-icon-rank"><Trophy /></div><strong>#{rankNum}</strong><span>Ranking</span></div>
        <div className="pp-stat"><div className="pp-stat-icon pp-stat-icon-level"><Flame /></div><strong>{level}</strong><span>Level</span></div>
        <div className="pp-stat"><div className="pp-stat-icon pp-stat-icon-tier"><TierIcon /></div><strong className="pp-stat-tier-label">{tier.label}</strong><span>Tier</span></div>
      </section>

      <TravelPersonalityCard />

      {isPro && (
        <section className={`pp-pro-card${plan === 'business' ? ' is-business' : ''}`}>
          <div className="pp-pro-icon" aria-hidden="true"><Sparkles /></div>
          <div className="pp-pro-body">
            <strong>{plan === 'business' ? 'Verified Business' : 'Pro Traveler'}</strong>
            <p>Thanks for keeping e-Tunisia running. {plan === 'business' ? 'Your dashboard is unlocked end-to-end.' : 'Every Pro feature is unlocked for you.'}</p>
          </div>
          <a href="#/premium" className="pp-pro-cta">Manage <ArrowRight /></a>
        </section>
      )}

      <section className="pp-quick-links">
        <h3 className="pp-section-title"><Compass /> Quick Access</h3>
        <div className="pp-links-grid">
          <a href="#/favorites" className="pp-quick-link-card" data-tint="rose"><div className="pp-ql-icon"><Heart /></div><div className="pp-ql-content"><strong>Saved Places</strong><span>Your favorite spots</span></div><ChevronRight className="pp-ql-arrow" /></a>
          <a href="#/badges" className="pp-quick-link-card" data-tint="gold"><div className="pp-ql-icon"><Award /></div><div className="pp-ql-content"><strong>Badges</strong><span>Achievements earned</span></div><ChevronRight className="pp-ql-arrow" /></a>
          <a href="#/credits" className="pp-quick-link-card" data-tint="olive"><div className="pp-ql-icon"><Coins /></div><div className="pp-ql-content"><strong>Credits</strong><span>Wallet &amp; donations</span></div><ChevronRight className="pp-ql-arrow" /></a>
          <a href="#/leaderboard" className="pp-quick-link-card" data-tint="mediterranean"><div className="pp-ql-icon"><BarChart3 /></div><div className="pp-ql-content"><strong>Leaderboard</strong><span>Your ranking</span></div><ChevronRight className="pp-ql-arrow" /></a>
          {!isPro && (
            <a href="#/premium" className="pp-quick-link-card pp-ql-premium" data-tint="gold"><div className="pp-ql-icon"><Crown /></div><div className="pp-ql-content"><strong>Go Premium</strong><span>Unlock exclusive features</span></div><ChevronRight className="pp-ql-arrow" /></a>
          )}
          <a href="#/itineraries" className="pp-quick-link-card" data-tint="cyan"><div className="pp-ql-icon"><MapIcon /></div><div className="pp-ql-content"><strong>Trip Plans</strong><span>Curated itineraries</span></div><ChevronRight className="pp-ql-arrow" /></a>
          <a href="#/collections" className="pp-quick-link-card" data-tint="violet"><div className="pp-ql-icon"><Layers /></div><div className="pp-ql-content"><strong>Collections</strong><span>Themed place sets</span></div><ChevronRight className="pp-ql-arrow" /></a>
          <a href="#/settings" className="pp-quick-link-card" data-tint="neutral"><div className="pp-ql-icon"><Settings /></div><div className="pp-ql-content"><strong>Settings</strong><span>Account preferences</span></div><ChevronRight className="pp-ql-arrow" /></a>
        </div>
      </section>

      {handle && (
        <section className="pp-passport-cta">
          <div className="pp-passport-icon"><Globe2 /></div>
          <div>
            <strong>View your public Passport</strong>
            <p>See how other travelers see you</p>
          </div>
          <a href={`#/u/${handle}`} className="btn btn-outline">View <ExternalLink /></a>
        </section>
      )}

      <button className="btn btn-outline pp-logout-btn" onClick={logout}><LogOut /> Log Out</button>
    </div>
  );
}
