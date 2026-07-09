// ============================================
// Donate modal — to a user or to the platform.
// Mountable from anywhere by calling openDonateModal({...}).
// ============================================

import * as api from './api';
import { replaceIcons } from './icons';
import { showToast, requireAuth } from './ui-utils';

interface OpenOpts {
  target: 'user' | 'platform';
  toUserId?: string;
  toUserName?: string;
  toUserAvatar?: string;
  onSuccess?: () => void;
}

const PRESETS = [5, 10, 20, 50];

// Mirrors backend GIFT_CATALOG (server is authoritative on price). Emojis are product content.
const GIFTS = [
  { id: 'jasmine', label: 'Jasmine', emoji: '🌼', price: 1 },
  { id: 'mint_tea', label: 'Mint Tea', emoji: '🍵', price: 3 },
  { id: 'dates', label: 'Box of Dates', emoji: '🌴', price: 5 },
  { id: 'carpet', label: 'Kairouan Carpet', emoji: '🧶', price: 15 },
  { id: 'camel', label: 'Camel', emoji: '🐪', price: 50 },
];

export function openDonateModal(opts: OpenOpts) {
  if (!requireAuth('donate credits')) return;

  // Remove any prior instance
  document.getElementById('donate-modal')?.remove();

  const isPlatform = opts.target === 'platform';
  const recipientName = isPlatform ? 'e-Tunisia' : (opts.toUserName || 'this member');
  const recipientAvatar = isPlatform
    ? '/icon.png'
    : (opts.toUserAvatar || `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(recipientName)}`);

  const modal = document.createElement('div');
  modal.id = 'donate-modal';
  modal.className = 'donate-modal';
  modal.innerHTML = `
    <div class="donate-modal-overlay" id="donate-modal-overlay"></div>
    <div class="donate-modal-card" role="dialog" aria-modal="true">
      <button class="donate-modal-close" id="donate-modal-close" aria-label="Close">
        <i class="lucide-x"></i>
      </button>
      <div class="donate-modal-header">
        <img src="${recipientAvatar}" alt="" class="donate-modal-avatar" />
        <div>
          <span class="text-xs text-muted">${isPlatform ? 'Support the platform' : 'Send credits to'}</span>
          <h3>${recipientName}</h3>
        </div>
      </div>

      ${isPlatform ? '' : `
      <div class="donate-modal-section">
        <label class="donate-modal-label">Send a gift</label>
        <div class="donate-gifts">
          ${GIFTS.map(g => `<button type="button" class="donate-gift" data-gift="${g.id}" title="${g.label} · ${g.price} TND"><span class="donate-gift-emoji">${g.emoji}</span><span class="donate-gift-price">${g.price} TND</span></button>`).join('')}
        </div>
      </div>`}

      <div class="donate-modal-section">
        <label class="donate-modal-label">Amount (TND)</label>
        <div class="donate-presets">
          ${PRESETS.map(p => `<button class="donate-preset" data-amount="${p}">${p}</button>`).join('')}
        </div>
        <input type="number" id="donate-amount" class="input" min="1" max="5000" step="1" placeholder="Custom amount" />
        <p class="donate-fee-note" id="donate-fee-note">${
          isPlatform
            ? '100% of your gift supports e-Tunisia. Thank you!'
            : 'A 10% platform fee helps keep e-Tunisia running.'
        }</p>
      </div>

      <div class="donate-modal-section">
        <label class="donate-modal-label">Message (optional)</label>
        <textarea id="donate-message" class="input" rows="2" maxlength="280" placeholder="Say something nice…"></textarea>
      </div>

      ${isPlatform ? '' : `
      <label class="donate-anon">
        <input type="checkbox" id="donate-anon" />
        <span>Send anonymously</span>
      </label>`}

      <div class="donate-modal-footer">
        <button class="btn btn-ghost" id="donate-cancel">Cancel</button>
        <button class="btn btn-primary" id="donate-submit" disabled>
          <i class="lucide-send"></i>
          Send <span id="donate-submit-amount"></span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  replaceIcons(modal);
  requestAnimationFrame(() => modal.classList.add('open'));
  document.body.style.overflow = 'hidden';

  const amtInput = modal.querySelector('#donate-amount') as HTMLInputElement;
  const submit = modal.querySelector('#donate-submit') as HTMLButtonElement;
  const submitAmt = modal.querySelector('#donate-submit-amount') as HTMLElement;
  const msgInput = modal.querySelector('#donate-message') as HTMLTextAreaElement;
  const anonInput = modal.querySelector('#donate-anon') as HTMLInputElement | null;

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

  // Gift quick-picks — send a catalog-priced gift directly (a donation under the hood).
  modal.querySelectorAll<HTMLButtonElement>('.donate-gift').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!opts.toUserId) return;
      const giftId = btn.dataset.gift!;
      modal.querySelectorAll('.donate-gift').forEach(b => (b as HTMLButtonElement).disabled = true);
      btn.classList.add('selected');
      try {
        await api.sendGift(opts.toUserId, giftId, !!anonInput?.checked);
        const g = GIFTS.find(x => x.id === giftId);
        showToast(`Sent ${g?.emoji || ''} ${g?.label || 'gift'} to ${recipientName}`);
        close();
        opts.onSuccess?.();
      } catch (err: any) {
        modal.querySelectorAll('.donate-gift').forEach(b => (b as HTMLButtonElement).disabled = false);
        btn.classList.remove('selected');
        showToast(err?.message || 'Could not send gift', { type: 'error' });
      }
    });
  });

  const close = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => modal.remove(), 200);
  };
  modal.querySelector('#donate-modal-overlay')?.addEventListener('click', close);
  modal.querySelector('#donate-modal-close')?.addEventListener('click', close);
  modal.querySelector('#donate-cancel')?.addEventListener('click', close);
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);

  submit.addEventListener('click', async () => {
    const amount = Number(amtInput.value);
    if (!Number.isFinite(amount) || amount <= 0) return;
    submit.disabled = true;
    submit.innerHTML = 'Sending…';
    try {
      await api.donate({
        target: opts.target,
        toUserId: opts.target === 'user' ? opts.toUserId : undefined,
        amount,
        message: msgInput.value.trim() || undefined,
        isAnonymous: !!anonInput?.checked,
      });
      showToast(opts.target === 'platform' ? `Thanks for supporting e-Tunisia! 💛` : `Sent ${amount} TND to ${recipientName}`);
      close();
      opts.onSuccess?.();
    } catch (err: any) {
      submit.disabled = false;
      submit.innerHTML = '<i class="lucide-send"></i> Try again';
      replaceIcons(submit);
      showToast(err?.message || 'Donation failed', { type: 'error' });
    }
  });
}
