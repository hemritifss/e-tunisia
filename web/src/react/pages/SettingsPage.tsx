import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Palette, Languages, Bell, Shield, User, Pencil, Trash2, UserCheck, Crown } from 'lucide-react';
import * as api from '../../api';
import { showToast, isLoggedIn } from '../../ui-utils';
import { goTo } from '../../router';

// Migrated from vanilla pages/settings.ts — appearance/language/notifications
// (mostly cosmetic), blocked-users list (fetch + unblock), delete account.

function avatarUrl(u: any): string {
  const seed = encodeURIComponent(u.fullName || u.id);
  return u.avatar && (String(u.avatar).startsWith('http') || String(u.avatar).startsWith('data:'))
    ? u.avatar
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
}

function BlockedList() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const loggedIn = isLoggedIn();

  const { data: rows, isLoading } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => api.listBlockedUsers().catch(() => [] as any[]),
    enabled: loggedIn,
  });

  if (!loggedIn) {
    return <div className="settings-blocked-empty">Sign in to manage blocked accounts.</div>;
  }
  if (isLoading) {
    return (
      <div className="settings-blocked-loading">
        <div className="spinner" />
        <span>Loading…</span>
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return <div className="settings-blocked-empty">You haven't blocked anyone.</div>;
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
              <UserCheck /> Unblock
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
          <strong>Not signed in</strong>
          <span>Sign in to see your plan.</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => goTo('/login')}>Sign in</button>
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
            {plan} plan{isPaid && status ? ` · ${status}` : ''}
          </strong>
          <span>
            {isPaid
              ? (expires ? `Renews / expires ${expires}` : 'Active subscription')
              : 'You are on the free plan.'}
          </span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => goTo('/pro')}>
          {isPaid ? 'Manage plan' : 'Upgrade'}
        </button>
      </div>
      {!isPaid && (
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>Prefer bank transfer?</strong>
            <span>Request a manual upgrade — our team confirms your payment offline.</span>
          </div>
          <button className="btn btn-outline btn-sm" disabled={busy} onClick={requestBankUpgrade}>
            {busy ? 'Sending…' : 'Request upgrade'}
          </button>
        </div>
      )}
    </>
  );
}

export default function SettingsPage() {
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

  const deleteAccount = () => {
    const ok = window.confirm('Delete your account permanently? This action cannot be undone.');
    if (!ok) return;
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    goTo('/hero');
    location.reload();
  };

  return (
    <div className="settings-page page-enter">
      <header className="settings-head">
        <a href="#/profile" className="settings-back" aria-label="Back to profile"><ArrowLeft /></a>
        <div className="settings-head-text">
          <h1>Settings</h1>
          <p>Manage your account, appearance, and notifications.</p>
        </div>
      </header>

      <section className="settings-group">
        <header className="settings-group-head">
          <span className="settings-group-icon" data-tint="gold"><Crown /></span>
          <div>
            <h2>Subscription</h2>
            <p>Your plan and how it renews.</p>
          </div>
        </header>
        <SubscriptionCard />
      </section>

      <section className="settings-group">
        <header className="settings-group-head">
          <span className="settings-group-icon" data-tint="violet"><Palette /></span>
          <div>
            <h2>Appearance</h2>
            <p>How e-Tunisia looks on your device.</p>
          </div>
        </header>
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>Dark mode</strong>
            <span>Switch between light and dark themes.</span>
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
            <h2>Language</h2>
            <p>Localized content and UI.</p>
          </div>
        </header>
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>Display language</strong>
            <span>Choose your preferred language.</span>
          </div>
          <select className="settings-select" aria-label="Display language" defaultValue="English">
            <option>English</option>
            <option>Français</option>
          </select>
        </div>
      </section>

      <section className="settings-group">
        <header className="settings-group-head">
          <span className="settings-group-icon" data-tint="gold"><Bell /></span>
          <div>
            <h2>Notifications</h2>
            <p>When and how we reach you.</p>
          </div>
        </header>
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>Push notifications</strong>
            <span>Alerts for new events, tips, and DMs.</span>
          </div>
          <label className="toggle">
            <input type="checkbox" defaultChecked />
            <span className="toggle-track" />
            <span className="toggle-thumb" />
          </label>
        </div>
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>Email digest</strong>
            <span>Weekly summary of popular posts.</span>
          </div>
          <label className="toggle">
            <input type="checkbox" />
            <span className="toggle-track" />
            <span className="toggle-thumb" />
          </label>
        </div>
      </section>

      <section className="settings-group">
        <header className="settings-group-head">
          <span className="settings-group-icon" data-tint="mediterranean"><Shield /></span>
          <div>
            <h2>Safety</h2>
            <p>People you've blocked. They can't see your posts or DM you.</p>
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
            <h2>Account</h2>
            <p>Profile and account-level controls.</p>
          </div>
        </header>
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>Edit profile</strong>
            <span>Update your name, photo, and bio.</span>
          </div>
          <a className="btn btn-outline btn-sm" href="#/profile-edit"><Pencil /> Edit</a>
        </div>
        <div className="settings-item settings-item-danger">
          <div className="settings-item-text">
            <strong>Delete account</strong>
            <span>Permanently delete your account and data. This cannot be undone.</span>
          </div>
          <button type="button" className="settings-danger-btn" onClick={deleteAccount}>
            <Trash2 /> Delete
          </button>
        </div>
      </section>
    </div>
  );
}
