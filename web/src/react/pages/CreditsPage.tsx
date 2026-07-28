import '../../styles/referral.css';
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Coins, PlusCircle, HeartHandshake, Gift, Copy, Inbox,
  MinusCircle, Send, Percent, RotateCcw, UserPlus, Sparkles, Circle, Crown,
  Share2, Users2, CheckCircle2,
} from 'lucide-react';
import * as api from '../../api';
import { ogShareUrl } from '../../shared/api';
import { showToast } from '../../ui-utils';
import { openDonateModal } from '../../donate-modal';
import { formatShortDate } from '../../shared/dates';
import { openTopupModal } from '../../topup-modal';
import { absoluteUrl } from '../../router';
import { StatsRowSkeleton } from '../components/RouteSkeleton';

// Migrated from vanilla pages/credits.ts — balance, top-up, donate, referral,
// transaction history.

const TX_LABEL: Record<string, string> = {
  deposit: 'Top-up', withdrawal: 'Withdrawal', donation_out: 'Donation sent',
  donation_in: 'Donation received', platform_fee: 'Platform commission', refund: 'Refund',
  referral: 'Referral reward', boost: 'Listing boost', subscription: 'Subscription',
};

const TX_ICON: Record<string, React.ComponentType> = {
  deposit: PlusCircle, withdrawal: MinusCircle, donation_out: Send, donation_in: Gift,
  platform_fee: Percent, refund: RotateCcw, referral: UserPlus, boost: Sparkles,
  subscription: Crown,
};

function fmt(n: number): string {
  return (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TxRow({ tx }: { tx: any }) {
  const amt = Number(tx.amount) || 0;
  const sign = amt > 0 ? '+' : '';
  const cls = amt > 0 ? 'credit-in' : 'credit-out';
  const label = TX_LABEL[tx.kind] || tx.kind;
  const Icon = TX_ICON[tx.kind] || Circle;
  const when = formatShortDate(tx.createdAt);
  return (
    <li className={`credits-tx ${cls}`}>
      <div className="credits-tx-icon"><Icon /></div>
      <div className="credits-tx-body">
        <strong>{label}</strong>
        <span className="text-xs text-muted">{tx.note || ''} · {when}</span>
      </div>
      <span className="credits-tx-amount">{sign}{fmt(amt)} TND</span>
    </li>
  );
}

export default function CreditsPage() {
  const queryClient = useQueryClient();

  const { data: me, isLoading, isError } = useQuery({ queryKey: ['credits'], queryFn: () => api.getMyCredits() });
  const { data: profile } = useQuery({ queryKey: ['credits-referral-profile'], queryFn: () => api.getMyProfile().catch(() => null) });

  const handle = profile?.handle;
  const refLink = handle ? absoluteUrl(`/register?ref=${encodeURIComponent(handle)}`) : '';

  const { data: refStats } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: () => api.getReferralStats().catch(() => null),
    enabled: !!handle,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['credits'] });

  const topUp = () => openTopupModal({ onSuccess: refresh });

  // Land here after a Flouci top-up return (#/credits?topup=success|failed). Toast,
  // refresh the balance, then strip the param so a reload doesn't re-fire the toast.
  React.useEffect(() => {
    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx === -1) return;
    const topup = new URLSearchParams(hash.slice(qIdx + 1)).get('topup');
    if (!topup) return;
    if (topup === 'success') {
      showToast('Top-up complete — your balance is updated.');
      refresh();
    } else if (topup === 'failed') {
      showToast('Top-up was not completed.', { type: 'error' });
    }
    window.history.replaceState(null, '', hash.slice(0, qIdx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const donatePlatform = () => openDonateModal({ target: 'platform', onSuccess: refresh });

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
    } catch {
      /* clipboard may be blocked; ignore */
    }
    showToast('Referral link copied — share it!');
  };

  // Share the passport card (rich OG preview) carrying the ref, so a single share
  // is both a beautiful artifact and a working referral link.
  const passportRefLink = handle
    ? `${ogShareUrl(`u/${encodeURIComponent(handle)}`)}?ref=${encodeURIComponent(handle)}`
    : '';
  const shareRef = async () => {
    const url = passportRefLink || refLink;
    const shareData = {
      title: 'Join me on e-Tunisia',
      text: 'Plan your Tunisia trip in 5 minutes — join with my link and we both get 10 TND credit.',
      url,
    };
    if ((navigator as any).share) {
      try { await (navigator as any).share(shareData); return; } catch { /* cancelled / unsupported */ }
    }
    try { await navigator.clipboard.writeText(url); showToast('Share link copied!'); }
    catch { showToast('Could not share right now.', { type: 'error' }); }
  };

  const txs: any[] = Array.isArray(me?.recent) ? me!.recent : [];
  // Referral dashboard figures.
  const rewardTnd = Number(refStats?.rewardTnd ?? 10);
  const converted = Number(refStats?.released ?? 0);
  const pendingRef = Number(refStats?.pending ?? 0);
  const invited = converted + pendingRef;
  const creditsEarned = converted * rewardTnd;

  return (
    <div className="credits-page page-enter">
      <a href="#/profile" className="btn btn-ghost" style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft /> Back
      </a>

      <header className="credits-header">
        <h1><Coins /> Credits &amp; Donations</h1>
        <p>Top up to support creators or the platform. We keep a small commission to run e-Tunisia.</p>
      </header>

      <section className="credits-balance-card">
        {isLoading ? (
          <div className="credits-balance-loading"><StatsRowSkeleton count={3} label="Loading balance" /></div>
        ) : isError || !me ? (
          <p className="text-danger">Could not load your credits.</p>
        ) : (
          <div className="credits-balance-stats">
            <div className="credits-balance-main">
              <span className="credits-balance-label">Available balance</span>
              <span className="credits-balance-value">{fmt(me.balance)} <span>TND</span></span>
            </div>
            <div className="credits-balance-side">
              <div>
                <span className="credits-balance-sublabel">Lifetime received</span>
                <strong>{fmt(me.lifetimeIn)} TND</strong>
              </div>
              <div>
                <span className="credits-balance-sublabel">Lifetime given</span>
                <strong>{fmt(me.lifetimeOut)} TND</strong>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="credits-actions">
        <button className="btn btn-primary" onClick={topUp}><PlusCircle /> Top up credits</button>
        <button className="btn btn-outline" onClick={donatePlatform}><HeartHandshake /> Support the platform</button>
      </section>

      {handle && (
        <section className="credits-referral">
          <div className="credits-referral-head">
            <h2><Gift /> Refer &amp; earn</h2>
            <p>Give {rewardTnd} TND, get {rewardTnd} TND. Share your passport — when a friend joins, you both get credit.</p>
          </div>

          <div className="credits-referral-stats-grid">
            <div className="credits-referral-stat">
              <span className="credits-referral-stat-icon"><Users2 size={18} /></span>
              <strong>{invited}</strong><span>Invited</span>
            </div>
            <div className="credits-referral-stat">
              <span className="credits-referral-stat-icon"><CheckCircle2 size={18} /></span>
              <strong>{converted}</strong><span>Joined</span>
            </div>
            <div className="credits-referral-stat">
              <span className="credits-referral-stat-icon"><Coins size={18} /></span>
              <strong>{fmt(creditsEarned)}</strong><span>TND earned</span>
            </div>
          </div>

          <div className="credits-referral-row">
            <input className="input" type="text" readOnly aria-label="Your referral link" value={refLink} />
            <button className="btn btn-outline" type="button" onClick={copyRef}><Copy /> Copy</button>
            <button className="btn btn-primary" type="button" onClick={shareRef}><Share2 /> Share passport</button>
          </div>
          {pendingRef > 0 && (
            <p className="credits-referral-stats">{pendingRef} pending — released once they’re active.</p>
          )}
        </section>
      )}

      <section className="credits-history">
        <h2>Recent activity</h2>
        <ul className="credits-tx-list">
          {txs.length === 0 ? (
            <li className="credits-empty"><Inbox /> No activity yet.</li>
          ) : (
            txs.map((tx, i) => <TxRow key={tx.id || i} tx={tx} />)
          )}
        </ul>
      </section>
    </div>
  );
}
