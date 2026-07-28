import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Home, Compass, Map, Clapperboard, Calendar, Route, Layers, Lightbulb, Sparkles,
  Bus, Shield, Heart, Bookmark, Gem, IdCard, Flame, Award, Trophy, Coins,
  MessageCircle, Rss, UserRound, Send, Briefcase, Settings, Luggage, User,
  LogOut, ChevronRight,
} from 'lucide-react';
import * as api from '../../api';
import { goTo } from '../../router';
import { isLoggedIn } from '../../ui-utils';
import { PageShell } from '../components/PageShell';
import { PageHeader } from '../components/PageHeader';
import { Sk, SkRegion } from '../components/RouteSkeleton';
import {
  DESTINATIONS, GROUP_TITLES, type Destination, type DestinationGroup,
} from '../../destinations';

// ============================================================================
// The "You" hub — one page that replaced two menus.
//
// The avatar dropdown held 21 links across 6 sections and the mobile drawer
// held ~20 more, with different names for the same pages. Both were dead ends:
// a cramped list you had to scroll inside a popover, with no room to say what
// anything *was*.
//
// This page is that list, given room to breathe: grouped, described, and
// reachable as a real destination (the "You" tab) that you can link to, go back
// to, and land on after login. Everything renders from the shared destination
// registry, so a rename happens once.
// ============================================================================

/** Registry icon names → the actual lucide components. */
const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  home: Home, compass: Compass, map: Map, clapperboard: Clapperboard,
  calendar: Calendar, route: Route, layers: Layers, lightbulb: Lightbulb,
  sparkles: Sparkles, bus: Bus, shield: Shield, heart: Heart,
  bookmark: Bookmark, gem: Gem, 'id-card': IdCard, flame: Flame,
  award: Award, trophy: Trophy, coins: Coins, 'message-circle': MessageCircle,
  rss: Rss, 'user-round': UserRound, send: Send, briefcase: Briefcase,
  settings: Settings, luggage: Luggage, user: User,
};

/** Sections shown on the hub, in order. "primary" is excluded — those are tabs. */
const SECTIONS: DestinationGroup[] = ['library', 'progress', 'connect', 'discover', 'business', 'account'];

function DestinationRow({ dest, authed }: { dest: Destination; authed: boolean }) {
  const Icon = ICONS[dest.icon] ?? Compass;
  // Auth-gated rows stay visible but route guests to sign-in rather than
  // dumping them on a page that will just 401 — a dead end teaches nothing.
  const target = dest.auth && !authed ? '/login' : dest.path;

  return (
    <a
      href={target}
      className="you-row"
      onClick={(e) => {
        e.preventDefault();
        goTo(target);
      }}
    >
      <span className="you-row__icon" aria-hidden>
        <Icon size={18} />
      </span>
      <span className="you-row__text">
        <span className="you-row__label">{dest.label}</span>
        {dest.blurb && <span className="you-row__blurb">{dest.blurb}</span>}
      </span>
      <ChevronRight size={16} className="you-row__chev" aria-hidden />
    </a>
  );
}

function IdentityCard({ authed }: { authed: boolean }) {
  const { data: me, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.getMyProfile().catch(() => null),
    enabled: authed,
  });

  if (!authed) {
    return (
      <section className="you-identity you-identity--guest">
        <div className="you-identity__text">
          <strong>You're browsing as a guest</strong>
          <p>Sign in to save places, collect passport stamps and plan trips.</p>
        </div>
        <button className="btn btn-primary" onClick={() => goTo('/login')}>
          Sign in
        </button>
      </section>
    );
  }

  if (isLoading) {
    return (
      <SkRegion label="Loading your profile" className="you-identity">
        <Sk w={64} h={64} radius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Sk h={18} w="45%" />
          <Sk h={12} w="30%" />
        </div>
      </SkRegion>
    );
  }

  const name = (me as any)?.fullName || (me as any)?.name || 'Explorer';
  const level = (me as any)?.level;
  const avatarPath = (me as any)?.avatar || (me as any)?.avatarUrl;
  const avatar = avatarPath
    ? api.getImageUrl(avatarPath, 'avatar')
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name)}`;

  return (
    <section className="you-identity">
      <img src={avatar} alt="" className="you-identity__avatar" />
      <div className="you-identity__text">
        <strong>{name}</strong>
        <span>{level != null ? `Level ${level} Explorer` : 'Explorer'}</span>
      </div>
      <button className="btn btn-ghost" onClick={() => goTo('/u/me')}>
        Passport
      </button>
    </section>
  );
}

export default function YouPage() {
  const authed = isLoggedIn();

  const sections = React.useMemo(
    () =>
      SECTIONS.map((g) => ({
        group: g,
        title: GROUP_TITLES[g],
        // Business tools are noise for most travellers — only surface them to
        // signed-in users, who are the only ones who can act on them anyway.
        items: DESTINATIONS.filter((d) => d.group === g && (g !== 'business' || authed)),
      })).filter((s) => s.items.length > 0),
    [authed],
  );

  const logout = () => {
    try {
      api.logout();
    } finally {
      goTo('/');
    }
  };

  return (
    <PageShell className="you-page">
      <PageHeader
        eyebrow="Your carnet"
        title="You"
        subtitle="Everything that belongs to you, in one place."
      />

      <IdentityCard authed={authed} />

      {sections.map((section) => (
        <section key={section.group} className="you-section">
          <h2 className="you-section__title">{section.title}</h2>
          <div className="you-section__rows">
            {section.items.map((d) => (
              <DestinationRow key={d.path} dest={d} authed={authed} />
            ))}
          </div>
        </section>
      ))}

      {authed && (
        <button type="button" className="you-logout" onClick={logout}>
          <LogOut size={16} aria-hidden /> Log out
        </button>
      )}
    </PageShell>
  );
}
