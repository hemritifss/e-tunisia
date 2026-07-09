// ============================================
// Top-up modal — add TND credit to the wallet via Flouci.
// Mountable from anywhere by calling openTopupModal({...}).
// In mock mode (no Flouci creds) the wallet is credited instantly on the
// server-verified return; with creds, we redirect to Flouci's hosted page.
// ============================================

import * as api from './api';
import { replaceIcons } from './icons';
import { showToast, requireAuth } from './ui-utils';

interface OpenOpts {
  /** Prefill the amount field (e.g. the shortfall needed to afford a plan). */
  suggestedAmount?: number;
  /** Short context line under the title (e.g. "You need 4.90 TND more for Pro Traveler"). */
  reason?: string;
  /** Called after a successful instant (mock) top-up. Not called on Flouci redirect. */
  onSuccess?: () => void;
}

const PRESETS = [10, 20, 50, 100];

function fmt(n: number): string {
  return (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function openTopupModal(opts: OpenOpts = {}) {
  if (!requireAuth('top up your wallet')) return;

  // Remove any prior instance
  document.getElementById('topup-modal')?.remove();

  const suggested = opts.suggestedAmount && opts.suggestedAmount > 0
    ? Math.min(5000, Math.ceil(opts.suggestedAmount))
    : '';

  const modal = document.createElement('div');
  modal.id = 'topup-modal';
  modal.className = 'donate-modal topup-modal';
  modal.innerHTML = `
    <div class="donate-modal-overlay" id="topup-modal-overlay"></div>
    <div class="donate-modal-card" role="dialog" aria-modal="true" aria-label="Top up credits">
      <button class="donate-modal-close" id="topup-modal-close" aria-label="Close">
        <i class="lucide-x"></i>
      </button>
      <div class="donate-modal-header">
        <div class="topup-modal-icon"><i class="lucide-wallet"></i></div>
        <div>
          <span class="text-xs text-muted">Top up your wallet</span>
          <h3>Add credit</h3>
        </div>
      </div>

      <div class="topup-balance" id="topup-balance">
        <span class="text-xs text-muted">Current balance</span>
        <strong id="topup-balance-value">…</strong>
      </div>

      ${opts.reason ? `<p class="topup-reason">${opts.reason}</p>` : ''}

      <div class="donate-modal-section">
        <label class="donate-modal-label">Amount (TND)</label>
        <div class="donate-presets">
          ${PRESETS.map(p => `<button type="button" class="donate-preset" data-amount="${p}">${p}</button>`).join('')}
        </div>
        <input type="number" id="topup-amount" class="input" min="1" max="5000" step="1" placeholder="Custom amount" value="${suggested}" />
        <p class="donate-fee-note">Paid securely in TND via Flouci. Your balance updates once the payment clears.</p>
      </div>

      <div class="donate-modal-footer">
        <button class="btn btn-ghost" id="topup-cancel">Cancel</button>
        <button class="btn btn-primary" id="topup-submit" disabled>
          <i class="lucide-plus"></i>
          Top up <span id="topup-submit-amount"></span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  replaceIcons(modal);
  requestAnimationFrame(() => modal.classList.add('open'));
  document.body.style.overflow = 'hidden';

  const amtInput = modal.querySelector('#topup-amount') as HTMLInputElement;
  const submit = modal.querySelector('#topup-submit') as HTMLButtonElement;
  const submitAmt = modal.querySelector('#topup-submit-amount') as HTMLElement;
  const balanceValue = modal.querySelector('#topup-balance-value') as HTMLElement;

  // Show the live balance so the amount is in context.
  api.getMyCredits()
    .then((c: any) => { balanceValue.textContent = `${fmt(c?.balance)} TND`; })
    .catch(() => { balanceValue.textContent = '—'; });

  function refreshState() {
    const v = Number(amtInput.value);
    const valid = Number.isFinite(v) && v >= 1 && v <= 5000;
    submit.disabled = !valid;
    submitAmt.textContent = valid ? `${v} TND` : '';
  }

  modal.querySelectorAll<HTMLButtonElement>('.donate-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.donate-preset').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      amtInput.value = btn.dataset.amount || '';
      refreshState();
    });
  });
  amtInput.addEventListener('input', refreshState);
  refreshState(); // honour any prefilled suggested amount

  const close = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => modal.remove(), 200);
  };
  modal.querySelector('#topup-modal-overlay')?.addEventListener('click', close);
  modal.querySelector('#topup-modal-close')?.addEventListener('click', close);
  modal.querySelector('#topup-cancel')?.addEventListener('click', close);
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);

  submit.addEventListener('click', async () => {
    const amount = Number(amtInput.value);
    if (!Number.isFinite(amount) || amount <= 0) return;
    submit.disabled = true;
    submit.innerHTML = 'Starting…';
    try {
      const res: any = await api.startCreditTopup(amount);
      if (res?.mock) {
        // No Flouci creds — the server-verified return already credited the wallet.
        showToast(`Topped up ${fmt(amount)} TND`);
        close();
        opts.onSuccess?.();
      } else if (res?.url) {
        window.location.href = res.url; // Flouci hosted payment page
      } else {
        throw new Error('Top-up did not return a payment URL.');
      }
    } catch (err: any) {
      submit.disabled = false;
      submit.innerHTML = '<i class="lucide-plus-circle"></i> Try again';
      replaceIcons(submit);
      showToast(err?.message || 'Top-up failed', { type: 'error' });
    }
  });
}
