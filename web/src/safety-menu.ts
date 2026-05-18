// ============================================
// Safety affordances — Block / Report dropdown + modal.
// Used from user-profile and (later) post/comment context menus.
// ============================================

import * as api from './api';
import { replaceIcons } from './icons';
import { requireAuth, showToast } from './ui-utils';

type TargetType = 'post' | 'comment' | 'user' | 'message' | 'review' | 'place';

const REASON_OPTIONS: Array<{ value: string; label: string; help: string }> = [
  { value: 'spam',           label: 'Spam',                help: 'Repeated, irrelevant, or promotional content.' },
  { value: 'harassment',     label: 'Harassment or bullying', help: 'Targeted insults, threats, or unwanted contact.' },
  { value: 'hate_speech',    label: 'Hate speech',         help: 'Attacks on identity, race, religion, etc.' },
  { value: 'nudity',         label: 'Nudity or sexual',    help: 'Sexually explicit or inappropriate content.' },
  { value: 'violence',       label: 'Violence',            help: 'Graphic violence, threats, or self-harm.' },
  { value: 'misinformation', label: 'Misinformation',      help: 'Knowingly false or misleading information.' },
  { value: 'scam',           label: 'Scam or fraud',       help: 'Phishing, fake offers, financial abuse.' },
  { value: 'other',          label: 'Something else',      help: 'Use the details box below.' },
];

/** Open a small dropdown anchored to a "more" button (block / report). */
export function openSafetyMenu(anchor: HTMLElement, opts: {
  target: { type: TargetType; id: string; ownerId?: string; name?: string };
  initiallyBlocked?: boolean;
  onAfterBlock?: () => void;
}) {
  document.getElementById('safety-menu')?.remove();

  const isUserTarget = opts.target.type === 'user';
  const rect = anchor.getBoundingClientRect();

  const menu = document.createElement('div');
  menu.id = 'safety-menu';
  menu.className = 'safety-menu';
  menu.style.top = `${rect.bottom + window.scrollY + 6}px`;
  menu.style.left = `${Math.max(8, rect.right + window.scrollX - 220)}px`;
  menu.innerHTML = `
    <button class="safety-menu-item" data-action="report">
      <i class="lucide-flag"></i><span>Report${isUserTarget ? ' user' : ''}</span>
    </button>
    ${isUserTarget ? `
      <button class="safety-menu-item ${opts.initiallyBlocked ? 'is-active' : ''}" data-action="${opts.initiallyBlocked ? 'unblock' : 'block'}">
        <i class="lucide-${opts.initiallyBlocked ? 'user-check' : 'user-x'}"></i>
        <span>${opts.initiallyBlocked ? 'Unblock user' : 'Block user'}</span>
      </button>` : ''}
    <button class="safety-menu-item" data-action="cancel">
      <i class="lucide-x"></i><span>Cancel</span>
    </button>
  `;
  document.body.appendChild(menu);
  replaceIcons(menu);

  const close = () => { menu.remove(); document.removeEventListener('click', onDocClick); };
  const onDocClick = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node) && e.target !== anchor) close();
  };
  setTimeout(() => document.addEventListener('click', onDocClick), 0);

  menu.querySelectorAll<HTMLButtonElement>('.safety-menu-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      if (action === 'cancel') return close();
      if (action === 'report') {
        close();
        return openReportModal(opts.target);
      }
      if (action === 'block') {
        close();
        if (!requireAuth('block users')) return;
        const ok = window.confirm(`Block ${opts.target.name || 'this user'}? They won't be able to see your posts or message you, and you won't see theirs.`);
        if (!ok) return;
        try {
          await api.blockUser(opts.target.id);
          showToast(`Blocked ${opts.target.name || 'user'}`);
          opts.onAfterBlock?.();
        } catch (e: any) {
          showToast(e?.message || 'Could not block', { type: 'error' });
        }
        return;
      }
      if (action === 'unblock') {
        close();
        if (!requireAuth('unblock users')) return;
        try {
          await api.unblockUser(opts.target.id);
          showToast(`Unblocked ${opts.target.name || 'user'}`);
          opts.onAfterBlock?.();
        } catch (e: any) {
          showToast(e?.message || 'Could not unblock', { type: 'error' });
        }
      }
    });
  });
}

/** Report modal with a reason picker. */
export function openReportModal(target: { type: TargetType; id: string; ownerId?: string; name?: string }) {
  if (!requireAuth('report content')) return;

  document.getElementById('report-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'report-modal';
  modal.className = 'report-modal';
  modal.innerHTML = `
    <div class="report-modal-overlay"></div>
    <div class="report-modal-card" role="dialog" aria-modal="true">
      <header class="report-modal-head">
        <h3>Report ${target.type}${target.name ? ` — ${target.name}` : ''}</h3>
        <button class="dm-icon-btn" id="report-close" aria-label="Close">
          <i class="lucide-x"></i>
        </button>
      </header>
      <p class="report-modal-intro">Help us keep e-Tunisia safe. Reports stay anonymous to the reported user.</p>

      <fieldset class="report-reasons">
        ${REASON_OPTIONS.map((r, i) => `
          <label class="report-reason">
            <input type="radio" name="reason" value="${r.value}" ${i === 0 ? 'checked' : ''} />
            <span>
              <strong>${r.label}</strong>
              <em>${r.help}</em>
            </span>
          </label>
        `).join('')}
      </fieldset>

      <div class="input-group">
        <label class="input-label">More details (optional)</label>
        <textarea id="report-details" class="input" rows="3" maxlength="600" placeholder="Anything moderators should know…"></textarea>
      </div>

      <footer class="report-modal-foot">
        <button class="btn btn-ghost" id="report-cancel">Cancel</button>
        <button class="btn btn-primary" id="report-submit">
          <i class="lucide-flag"></i> Submit report
        </button>
      </footer>
    </div>
  `;
  document.body.appendChild(modal);
  replaceIcons(modal);
  requestAnimationFrame(() => modal.classList.add('open'));
  document.body.style.overflow = 'hidden';

  const close = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => modal.remove(), 200);
  };
  modal.querySelector('.report-modal-overlay')?.addEventListener('click', close);
  modal.querySelector('#report-close')?.addEventListener('click', close);
  modal.querySelector('#report-cancel')?.addEventListener('click', close);
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);

  modal.querySelector('#report-submit')?.addEventListener('click', async () => {
    const reason = (modal.querySelector('input[name="reason"]:checked') as HTMLInputElement)?.value;
    const details = (modal.querySelector('#report-details') as HTMLTextAreaElement)?.value.trim() || undefined;
    const btn = modal.querySelector('#report-submit') as HTMLButtonElement;
    btn.disabled = true; btn.innerHTML = 'Sending…';
    try {
      await api.reportContent({
        targetType: target.type,
        targetId: target.id,
        reason: reason as any,
        details,
        targetOwnerId: target.ownerId,
      });
      showToast('Thanks — our team will review it');
      close();
    } catch (e: any) {
      showToast(e?.message || 'Could not submit report', { type: 'error' });
      btn.disabled = false;
      btn.innerHTML = '<i class="lucide-flag"></i> Submit report';
      replaceIcons(btn);
    }
  });
}
