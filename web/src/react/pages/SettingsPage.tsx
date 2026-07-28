import '../../styles/settings.css';
import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Palette, Languages, Bell, Shield, User, Pencil, Trash2, UserCheck, Crown } from 'lucide-react';
import * as api from '../../api';
import { showToast, isLoggedIn } from '../../ui-utils';
import { goTo } from '../../router';
import { getLocale, setLocale, LOCALES } from '../../i18n';
import { useT } from '../../i18n/useT';
import { FormSkeleton } from '../components/RouteSkeleton';

// Migrated from vanilla pages/settings.ts — appearance/language/notifications
// (mostly cosmetic), blocked-users list (fetch + unblock), delete account.

// Flip these on when the actual delivery infra ships (roadmap 1.2 / 1.3).
const NOTIF_FLAGS = { push: false, emailDigest: false };

function avatarUrl(u: any): string {
  const seed = encodeURIComponent(u.fullName || u.id);
  return u.avatar && (String(u.avatar).startsWith('http') || String(u.avatar).startsWith('data:'))
    ? u.avatar
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
}

function BlockedList() {
  const t = useT();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const loggedIn = isLoggedIn();

  const { data: rows, isLoading } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => api.listBlockedUsers().catch(() => [] as any[]),
    enabled: loggedIn,
  });

  if (!loggedIn) {
    return <div className="settings-blocked-empty">{t('settings.blockedSignIn')}</div>;
  }
  if (isLoading) {
    return (
      <div className="settings-blocked-loading">
        <FormSkeleton fields={6} label={t('settings.loading')} />
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return <div className="settings-blocked-empty">{t('settings.blockedEmpty')}</div>;
  }

  const unblock = async (id: string) => {
    setBusy(id);
    try {
      await api.unblockUser(id);
      showToast('Unblocked');
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    } catch (e: any) {
      setBusy(null);
      showToast(e?.message || 'Could not unblock', { type: 'error' });
    }
  };

  return (
    <>
      {rows.map((r) => {
        const u = r.user || {};
        const av = avatarUrl(u);
        return (
          <div className="blocked-row" data-id={u.id} key={u.id}>
            <a
              className="blocked-user"
              href={`#/user/${u.id}`}
              data-user-id={u.id}
              data-user-name={u.fullName || ''}
              data-user-avatar={av}
              data-user-handle={u.handle || ''}
            >
              <img src={av} alt="" loading="lazy" />
              <div className="blocked-user-meta">
                <strong>{u.fullName || 'Unknown'}</strong>
                {u.country && <span>{u.country}</span>}
              </div>
            </a>
            <button
              type="button"
              className="btn btn-outline btn-sm blocked-unblock"
              disabled={busy === u.id}
              onClick={() => unblock(u.id)}
            >
              <UserCheck /> {t('settings.unblock')}
            </button>
          </div>
        );
      })}
    </>
  );
}

// Current subscription (from /subscriptions/my) + a manual (bank/cash) upgrade
// request path via /subscriptions/upgrade. Card checkout still lives on /pro.
function SubscriptionCard() {
  const t = useT();
  const loggedIn = isLoggedIn();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: sub } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => api.getMySubscription().catch(() => null),
    enabled: loggedIn,
  });

  if (!loggedIn) {
    return (
      <div className="settings-item">
        <div className="settings-item-text">
          <strong>{t('settings.notSignedIn')}</strong>
          <span>{t('settings.signInToSeePlan')}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => goTo('/login')}>{t('settings.signIn')}</button>
      </div>
    );
  }

  const plan = String(sub?.plan || 'free');
  const isPaid = plan !== 'free';
  const status = sub?.status;
  const expires = sub?.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : null;

  const requestBankUpgrade = async () => {
    setBusy(true);
    try {
      await api.upgradePlan('premium', 'bank');
      showToast("Upgrade requested — we'll confirm your bank transfer shortly.");
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
    } catch (e: any) {
      showToast(e?.message || 'Could not submit request', { type: 'error' });
    }
    setBusy(false);
  };

  return (
    <>
      <div className="settings-item">
        <div className="settings-item-text">
          <strong style={{ textTransform: 'capitalize' }}>
            {isPaid ? `${plan} plan${status ? ` · ${status}` : ''}` : t('settings.freePlanName')}
          </strong>
          <span>
            {isPaid
              ? (expires ? `${t('settings.planRenews')} ${expires}` : t('settings.planActive'))
              : t('settings.freePlanNote')}
          </span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => goTo('/pro')}>
          {isPaid ? t('settings.managePlan') : t('settings.upgrade')}
        </button>
      </div>
      {!isPaid && (
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>{t('settings.bankTitle')}</strong>
            <span>{t('settings.bankHint')}</span>
          </div>
          <button className="btn btn-outline btn-sm" disabled={busy} onClick={requestBankUpgrade}>
            {busy ? t('settings.bankSending') : t('settings.bankRequest')}
          </button>
        </div>
      )}
    </>
  );
}

export default function SettingsPage() {
  const t = useT();
  const locale = getLocale();
  const [dark, setDark] = useState(
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark',
  );

  const onToggleDark = (e: React.ChangeEvent<HTMLInputElement>) => {
    const on = e.target.checked;
    setDark(on);
    const theme = on ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = theme === 'dark' ? 'lucide-sun' : 'lucide-moon';
  };

  // This was labeled "Delete account" but no deletion endpoint exists anywhere
  // — it only cleared localStorage. Renamed to what it actually does, with the
  // app's two-tap confirm instead of window.confirm().
  const [clearArmed, setClearArmed] = useState(false);
  const clearTimer = useRef<number | null>(null);
  useEffect(() => () => { if (clearTimer.current) window.clearTimeout(clearTimer.current); }, []);
  const clearLocalData = () => {
    if (!clearArmed) {
      setClearArmed(true);
      clearTimer.current = window.setTimeout(() => setClearArmed(false), 4000);
      return;
    }
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    goTo('/hero');
    location.reload();
  };

  return (
    // Field Notes via the token layer only — surfaces/text/borders remap to
    // paper/ink/rules. The tinted group chips stay: settings.md documents them
    // as a deliberate scanning aid (the only page in the app that keeps them).
    <div className="settings-page page-enter">
      <header className="settings-head">
        <a href="#/profile" className="settings-back" aria-label={t('settings.back')}><ArrowLeft /></a>
        <div className="settings-head-text">
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </div>
      </header>

      <section className="settings-group">
        <header className="settings-group-head">
          <span className="settings-group-icon" data-tint="gold"><Crown /></span>
          <div>
            <h2>{t('settings.subscription')}</h2>
            <p>{t('settings.subscriptionHint')}</p>
          </div>
        </header>
        <SubscriptionCard />
      </section>

      <section className="settings-group">
        <header className="settings-group-head">
          <span className="settings-group-icon" data-tint="violet"><Palette /></span>
          <div>
            <h2>{t('settings.appearance')}</h2>
            <p>{t('settings.appearanceHint')}</p>
          </div>
        </header>
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>{t('settings.darkMode')}</strong>
            <span>{t('settings.darkModeHint')}</span>
          </div>
          <label className="toggle">
            <input type="checkbox" id="settings-dark-mode" checked={dark} onChange={onToggleDark} />
            <span className="toggle-track" />
            <span className="toggle-thumb" />
          </label>
        </div>
      </section>

      <section className="settings-group">
        <header className="settings-group-head">
          <span className="settings-group-icon" data-tint="cyan"><Languages /></span>
          <div>
            <h2>{t('settings.language')}</h2>
            <p>{t('settings.languageHint')}</p>
          </div>
        </header>
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>{t('settings.language')}</strong>
            <span>{LOCALES.find((l) => l.id === locale)?.label}</span>
          </div>
          <select
            className="settings-select"
            aria-label="Display language"
            value={locale}
            onChange={async (e) => {
              const ok = await setLocale(e.target.value);
              if (!ok) showToast('Translation for this language is unavailable right now.', { type: 'error' });
            }}
          >
            {LOCALES.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="settings-group">
        <header className="settings-group-head">
          <span className="settings-group-icon" data-tint="gold"><Bell /></span>
          <div>
            <h2>{t('settings.notifications')}</h2>
            <p>{t('settings.notificationsHint')}</p>
          </div>
        </header>
        {/* These were decorative toggles for infra that doesn't exist yet
            (roadmap 1.2 push / 1.3 email). A control that does nothing erodes
            trust — show an honest stamp until the flags flip on. */}
        <div className={`settings-item${NOTIF_FLAGS.push ? '' : ' is-upcoming'}`}>
          <div className="settings-item-text">
            <strong>{t('settings.push')}</strong>
            <span>{t('settings.pushHint')}</span>
          </div>
          {NOTIF_FLAGS.push ? (
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-track" />
              <span className="toggle-thumb" />
            </label>
          ) : (
            <span className="settings-stamp">{t('settings.comingSoon')}</span>
          )}
        </div>
        <div className={`settings-item${NOTIF_FLAGS.emailDigest ? '' : ' is-upcoming'}`}>
          <div className="settings-item-text">
            <strong>{t('settings.emailDigest')}</strong>
            <span>{t('settings.emailDigestHint')}</span>
          </div>
          {NOTIF_FLAGS.emailDigest ? (
            <label className="toggle">
              <input type="checkbox" />
              <span className="toggle-track" />
              <span className="toggle-thumb" />
            </label>
          ) : (
            <span className="settings-stamp">{t('settings.comingSoon')}</span>
          )}
        </div>
      </section>

      <section className="settings-group">
        <header className="settings-group-head">
          <span className="settings-group-icon" data-tint="mediterranean"><Shield /></span>
          <div>
            <h2>{t('settings.safety')}</h2>
            <p>{t('settings.safetyHint')}</p>
          </div>
        </header>
        <div className="settings-blocked-list" id="settings-blocked-list">
          <BlockedList />
        </div>
      </section>

      <section className="settings-group">
        <header className="settings-group-head">
          <span className="settings-group-icon" data-tint="accent"><User /></span>
          <div>
            <h2>{t('settings.account')}</h2>
            <p>{t('settings.accountHint')}</p>
          </div>
        </header>
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>{t('settings.editProfile')}</strong>
            <span>{t('settings.editProfileHint')}</span>
          </div>
          <a className="btn btn-outline btn-sm" href="#/profile-edit"><Pencil /> {t('settings.edit')}</a>
        </div>
        <div className="settings-item settings-item-danger">
          <div className="settings-item-text">
            <strong>{t('settings.clearData')}</strong>
            <span>{t('settings.clearDataHint')}</span>
          </div>
          <button type="button" className={`settings-danger-btn${clearArmed ? ' is-confirming' : ''}`} onClick={clearLocalData}>
            <Trash2 /> {clearArmed ? t('settings.clearDataConfirm') : t('settings.clearDataBtn')}
          </button>
        </div>
      </section>
    </div>
  );
}
