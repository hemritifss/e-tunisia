// ============================================
// CREDITS PAGE — balance, top-up, donations history
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';
import { showToast, requireAuth } from '../ui-utils';
import { openDonateModal } from '../donate-modal';

export function renderCreditsPage(): string {
  return `
    <div class="credits-page page-enter" data-design="sleek">
      <a href="#/profile" class="btn btn-ghost" style="margin-bottom: var(--space-4);">
        <i class="lucide-arrow-left"></i> Back
      </a>

      <header class="credits-header">
        <h1><i class="lucide-coins"></i> Credits & Donations</h1>
        <p>Top up to support creators or the platform. We keep a small commission to run e-Tunisia.</p>
      </header>

      <section class="credits-balance-card" id="credits-balance-card">
        <div class="credits-balance-loading">
          <div class="spinner"></div>
          <p>Loading balance…</p>
        </div>
      </section>

      <section class="credits-actions">
        <button class="btn btn-primary" id="credits-topup-btn">
          <i class="lucide-plus-circle"></i> Top up credits
        </button>
        <button class="btn btn-outline" id="credits-donate-platform-btn">
          <i class="lucide-heart-handshake"></i> Support the platform
        </button>
      </section>

      <section class="credits-history">
        <h2>Recent activity</h2>
        <ul class="credits-tx-list" id="credits-tx-list">
          <li class="credits-empty"><i class="lucide-inbox"></i> No activity yet.</li>
        </ul>
      </section>
    </div>
  `;
}

const TX_LABEL: Record<string, string> = {
  deposit: 'Top-up',
  withdrawal: 'Withdrawal',
  donation_out: 'Donation sent',
  donation_in: 'Donation received',
  platform_fee: 'Platform commission',
  refund: 'Refund',
};

const TX_ICON: Record<string, string> = {
  deposit: 'lucide-plus-circle',
  withdrawal: 'lucide-minus-circle',
  donation_out: 'lucide-send',
  donation_in: 'lucide-gift',
  platform_fee: 'lucide-percent',
  refund: 'lucide-rotate-ccw',
};

function fmt(n: number): string {
  return (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function initCreditsPage() {
  if (!requireAuth('view your credits')) return;

  const balanceCard = document.getElementById('credits-balance-card');
  const list = document.getElementById('credits-tx-list');

  let me: any;
  try {
    me = await api.getMyCredits();
  } catch (e) {
    if (balanceCard) balanceCard.innerHTML = '<p class="text-danger">Could not load your credits.</p>';
    return;
  }

  if (balanceCard) {
    balanceCard.innerHTML = `
      <div class="credits-balance-stats">
        <div class="credits-balance-main">
          <span class="credits-balance-label">Available balance</span>
          <span class="credits-balance-value">${fmt(me.balance)} <span>TND</span></span>
        </div>
        <div class="credits-balance-side">
          <div>
            <span class="credits-balance-sublabel">Lifetime received</span>
            <strong>${fmt(me.lifetimeIn)} TND</strong>
          </div>
          <div>
            <span class="credits-balance-sublabel">Lifetime given</span>
            <strong>${fmt(me.lifetimeOut)} TND</strong>
          </div>
        </div>
      </div>
    `;
    replaceIcons(balanceCard);
  }

  if (list) {
    const txs = Array.isArray(me.recent) ? me.recent : [];
    if (txs.length === 0) {
      list.innerHTML = '<li class="credits-empty"><i class="lucide-inbox"></i> No activity yet.</li>';
    } else {
      list.innerHTML = txs.map((tx: any) => {
        const amt = Number(tx.amount) || 0;
        const sign = amt > 0 ? '+' : '';
        const cls = amt > 0 ? 'credit-in' : 'credit-out';
        const label = TX_LABEL[tx.kind] || tx.kind;
        const icon = TX_ICON[tx.kind] || 'lucide-circle';
        const when = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `
          <li class="credits-tx ${cls}">
            <div class="credits-tx-icon"><i class="${icon}"></i></div>
            <div class="credits-tx-body">
              <strong>${label}</strong>
              <span class="text-xs text-muted">${tx.note || ''} · ${when}</span>
            </div>
            <span class="credits-tx-amount">${sign}${fmt(amt)} TND</span>
          </li>
        `;
      }).join('');
    }
    replaceIcons(list);
  }

  // Top-up handler
  document.getElementById('credits-topup-btn')?.addEventListener('click', async () => {
    const raw = prompt('How many credits would you like to top up? (1–5000 TND)');
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Invalid amount', { type: 'error' });
      return;
    }
    try {
      await api.depositCredits(amount);
      showToast(`Topped up ${fmt(amount)} TND`);
      await initCreditsPage(); // re-render
    } catch (err: any) {
      showToast(err?.message || 'Top-up failed', { type: 'error' });
    }
  });

  // Donate-to-platform handler
  document.getElementById('credits-donate-platform-btn')?.addEventListener('click', () => {
    openDonateModal({
      target: 'platform',
      onSuccess: () => initCreditsPage(),
    });
  });
}
