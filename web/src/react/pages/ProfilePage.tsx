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
import { getLocale } from '../../i18n';
import { useT } from '../../i18n/useT';
import { TravelPersonalityCard } from '../components/TravelPersonalityCard';
import { ProfilePageSkeleton } from '../components/RouteSkeleton';

// Migrated from vanilla pages/profile.ts — own profile (cover, identity, XP, stats, quick links).

const TIER_ICONS: Record<string, React.ComponentType<any>> = { crown: Crown, star: Star, compass: Compass, sprout: Sprout };

// Icon + i18n key per tier; the label is resolved at render so it localizes.
function tierFor(level: number): { iconName: string; labelKey: string } {
  if (level >= 10) return { iconName: 'crown', labelKey: 'profile.tierLegend' };
  if (level >= 7) return { iconName: 'star', labelKey: 'profile.tierVeteran' };
  if (level >= 4) return { iconName: 'compass', labelKey: 'profile.tierExplorer' };
  return { iconName: 'sprout', labelKey: 'profile.tierNewcomer' };
}

const isProPlan = (plan?: string | null) => plan === 'premium' || plan === 'business' || plan === 'admin';

export default function ProfilePage() {
  const t = useT();
  const userQ = useQuery({ queryKey: ['my-profile-page'], queryFn: () => api.getMyProfile().catch(() => null) });
  const pointsQ = useQuery({ queryKey: ['my-points'], queryFn: () => api.getMyPoints().catch(() => ({ total: 0, level: 1 })), enabled: !!userQ.data });
  const rankQ = useQuery({ queryKey: ['my-rank'], queryFn: () => api.getMyRank().catch(() => ({ rank: '–' })), enabled: !!userQ.data });

  const user = userQ.data;
  const points: any = pointsQ.data || { total: 0, level: 1 };
  const rank: any = rankQ.data || { rank: '–' };

  if (userQ.isLoading) {
    return (
      <div className="profile-page-v2 page-enter" data-design="sleek">
        <ProfilePageSkeleton label={t('profile.loading')} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page-v2 page-enter" data-design="sleek">
        <div className="pp-empty-state">
          <UserX />
          <h2>{t('profile.loadError')}</h2>
          <p>{t('profile.loadErrorHint')}</p>
          <a href="#/" className="btn btn-primary"><Home /> {t('profile.goHome')}</a>
        </div>
      </div>
    );
  }

  const seed = encodeURIComponent(user.fullName || user.name || user.id);
  const avatar = user.avatar ? api.getImageUrl(user.avatar, 'avatar') : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
  const name = user.fullName || user.name || 'Explorer';
  const level = points.level || user.level || 1;
  const xpNum = points.total || 0;
  const xp = xpNum.toLocaleString();
  const rankNum = rank.rank || '–';
  const bio = user.bio || '';
  const country = user.country || '';
  const handle = user.handle || '';
  const website = user.website || '';
  const joinDate = user.createdAt ? new Intl.DateTimeFormat(getLocale(), { month: 'short', year: 'numeric' }).format(new Date(user.createdAt)) : '';

  const xpForLevel = (lvl: number) => lvl * lvl * 500;
  const currentLevelXp = xpForLevel(level - 1);
  const nextLevelXp = xpForLevel(level);
  const progressPct = Math.min(100, Math.round((((points.total || 0) - currentLevelXp) / Math.max(1, nextLevelXp - currentLevelXp)) * 100));

  const tier = tierFor(level);
  const tierLabel = t(tier.labelKey);
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
          <span className="pp-level-text">{t('profile.level')} {level} {tierLabel}</span>
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
            <span className="pp-avatar-pro-mark" title={plan === 'business' ? t('profile.verifiedBusiness') : t('profile.proTraveler')} aria-label={plan === 'business' ? t('profile.verifiedBusiness') : t('profile.proTraveler')}><Sparkles /></span>
          )}
        </div>
        <div className="pp-actions-row">
          <a href="#/profile-edit" className="btn btn-primary pp-edit-btn"><Edit3 /> {t('profile.editProfile')}</a>
          <a href="#/settings" className="btn btn-outline pp-settings-btn" aria-label={t('profile.settings')}><Settings /></a>
        </div>
      </section>

      <section className="pp-bio">
        <h1 className="pp-name">{name}</h1>
        {handle && <span className="pp-handle">@{handle}</span>}
        {bio && <p className="pp-bio-text">{bio}</p>}
        <div className="pp-meta">
          {country && <span><MapPin /> {country}</span>}
          {website && <span><LinkIcon /> <a href={website} target="_blank" rel="noopener">{website.replace(/^https?:\/\//, '')}</a></span>}
          {joinDate && <span><Calendar /> {t('profile.joined')} {joinDate}</span>}
        </div>
      </section>

      <section className="pp-xp-progress">
        <div className="pp-xp-header">
          <span className="pp-xp-label">{t('profile.level')} {level} {t('profile.progress')}</span>
          <span className="pp-xp-value">{xp} XP</span>
        </div>
        <div className="pp-xp-bar"><div className="pp-xp-fill" style={{ width: `${progressPct}%` }} /></div>
        <div className="pp-xp-footer">
          {xpNum === 0
            ? <span>{t('profile.routeStart')}</span>
            : <span>{progressPct}% {t('profile.toLevel')} {level + 1}</span>}
          <span>{(nextLevelXp - (points.total || 0)).toLocaleString()} {t('profile.xpNeeded')}</span>
        </div>
      </section>

      <section className="pp-stats">
        <div className="pp-stat"><div className="pp-stat-icon pp-stat-icon-xp"><Zap /></div><strong>{xp}</strong><span>{t('profile.xpPoints')}</span></div>
        {/* A rank with zero activity reads fake — earn it first. */}
        {xpNum > 0
          ? <div className="pp-stat"><div className="pp-stat-icon pp-stat-icon-rank"><Trophy /></div><strong>#{rankNum}</strong><span>{t('profile.ranking')}</span></div>
          : <div className="pp-stat"><div className="pp-stat-icon pp-stat-icon-rank"><Trophy /></div><strong>—</strong><span>{t('profile.unranked')}</span></div>}
        <div className="pp-stat"><div className="pp-stat-icon pp-stat-icon-level"><Flame /></div><strong>{level}</strong><span>{t('profile.level')}</span></div>
        <div className="pp-stat"><div className="pp-stat-icon pp-stat-icon-tier"><TierIcon /></div><strong className="pp-stat-tier-label">{tierLabel}</strong><span>{t('profile.tier')}</span></div>
      </section>

      <TravelPersonalityCard />

      {isPro && (
        <section className={`pp-pro-card${plan === 'business' ? ' is-business' : ''}`}>
          <div className="pp-pro-icon" aria-hidden="true"><Sparkles /></div>
          <div className="pp-pro-body">
            <strong>{plan === 'business' ? t('profile.verifiedBusiness') : t('profile.proTraveler')}</strong>
            <p>{plan === 'business' ? t('profile.proThanksBiz') : t('profile.proThanks')}</p>
          </div>
          <a href="#/premium" className="pp-pro-cta">{t('profile.manage')} <ArrowRight /></a>
        </section>
      )}

      <section className="pp-quick-links">
        <h3 className="pp-section-title"><Compass /> {t('profile.quickAccess')}</h3>
        <div className="pp-links-grid">
          <a href="#/favorites" className="pp-quick-link-card" data-tint="rose"><div className="pp-ql-icon"><Heart /></div><div className="pp-ql-content"><strong>{t('profile.savedPlaces')}</strong><span>{t('profile.savedPlacesSub')}</span></div><ChevronRight className="pp-ql-arrow" /></a>
          <a href="#/badges" className="pp-quick-link-card" data-tint="gold"><div className="pp-ql-icon"><Award /></div><div className="pp-ql-content"><strong>{t('profile.badges')}</strong><span>{t('profile.badgesSub')}</span></div><ChevronRight className="pp-ql-arrow" /></a>
          <a href="#/credits" className="pp-quick-link-card" data-tint="olive"><div className="pp-ql-icon"><Coins /></div><div className="pp-ql-content"><strong>{t('profile.credits')}</strong><span>{t('profile.creditsSub')}</span></div><ChevronRight className="pp-ql-arrow" /></a>
          <a href="#/leaderboard" className="pp-quick-link-card" data-tint="mediterranean"><div className="pp-ql-icon"><BarChart3 /></div><div className="pp-ql-content"><strong>{t('profile.leaderboard')}</strong><span>{t('profile.leaderboardSub')}</span></div><ChevronRight className="pp-ql-arrow" /></a>
          {!isPro && (
            <a href="#/premium" className="pp-quick-link-card pp-ql-premium" data-tint="gold"><div className="pp-ql-icon"><Crown /></div><div className="pp-ql-content"><strong>{t('profile.goPremium')}</strong><span>{t('profile.goPremiumSub')}</span></div><ChevronRight className="pp-ql-arrow" /></a>
          )}
          <a href="#/itineraries" className="pp-quick-link-card" data-tint="cyan"><div className="pp-ql-icon"><MapIcon /></div><div className="pp-ql-content"><strong>{t('profile.tripPlans')}</strong><span>{t('profile.tripPlansSub')}</span></div><ChevronRight className="pp-ql-arrow" /></a>
          <a href="#/collections" className="pp-quick-link-card" data-tint="violet"><div className="pp-ql-icon"><Layers /></div><div className="pp-ql-content"><strong>{t('profile.collections')}</strong><span>{t('profile.collectionsSub')}</span></div><ChevronRight className="pp-ql-arrow" /></a>
          <a href="#/settings" className="pp-quick-link-card" data-tint="neutral"><div className="pp-ql-icon"><Settings /></div><div className="pp-ql-content"><strong>{t('profile.settings')}</strong><span>{t('profile.settingsSub')}</span></div><ChevronRight className="pp-ql-arrow" /></a>
        </div>
      </section>

      {handle && (
        <section className="pp-passport-cta">
          <div className="pp-passport-icon"><Globe2 /></div>
          <div>
            <strong>{t('profile.publicPassport')}</strong>
            <p>{t('profile.publicPassportSub')}</p>
          </div>
          <a href={`#/u/${handle}`} className="btn btn-outline">{t('profile.view')} <ExternalLink /></a>
        </section>
      )}

      <button className="btn btn-outline pp-logout-btn" onClick={logout}><LogOut /> {t('profile.logout')}</button>
    </div>
  );
}
