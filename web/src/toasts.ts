/**
 * Vanilla-JS toast layer. Mounted once at app boot from main.ts so every
 * page (React island OR vanilla TS pages) can fire `showToast(...)` without
 * caring about the rendering layer.
 *
 * Exposed on window so any code path — including React via a one-line
 * dispatch — can trigger it without importing.
 */

export type ToastType = 'success' | 'error' | 'info' | 'achievement';

export interface ToastOptions {
    message: string;
    type?: ToastType;
    title?: string;
    /** Optional emoji rendered in the icon slot. Overrides the default per-type emoji. */
    emoji?: string;
    /** Optional action button {label, onClick}. */
    action?: { label: string; onClick: () => void };
    /** Auto-dismiss in ms. Default 4000 (the Bled hold). Pass 0 for sticky. */
    duration?: number;
}

let container: HTMLDivElement | null = null;
let nextId = 1;

const ICONS: Record<ToastType, string> = {
    success: '✓',
    error: '!',
    info: 'i',
    achievement: '🌟',
};

function ensureContainer(): HTMLDivElement {
    if (container && document.body.contains(container)) return container;
    container = document.createElement('div');
    container.className = 'toast-stack';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
    return container;
}

function buildToast(opts: ToastOptions): HTMLDivElement {
    const id = nextId++;
    const type: ToastType = opts.type || 'info';
    const dur = opts.duration ?? 4000;

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.dataset.id = String(id);
    el.setAttribute('role', 'status');

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = opts.emoji || ICONS[type];
    el.appendChild(icon);

    const body = document.createElement('div');
    body.className = 'toast-body';
    if (opts.title) {
        const t = document.createElement('strong');
        t.textContent = opts.title;
        body.appendChild(t);
    }
    const msg = document.createElement('span');
    msg.textContent = opts.message;
    body.appendChild(msg);
    el.appendChild(body);

    if (opts.action) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'toast-action';
        btn.textContent = opts.action.label;
        btn.addEventListener('click', () => {
            try { opts.action!.onClick(); } catch {}
            dismiss(el);
        });
        el.appendChild(btn);
    }

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'toast-close';
    close.setAttribute('aria-label', 'Dismiss');
    close.textContent = '×';
    close.addEventListener('click', () => dismiss(el));
    el.appendChild(close);

    if (dur > 0) {
        const timer = window.setTimeout(() => dismiss(el), dur);
        (el as any)._toastTimer = timer;
        // Pause auto-dismiss while the user hovers.
        el.addEventListener('mouseenter', () => {
            window.clearTimeout((el as any)._toastTimer);
        });
        el.addEventListener('mouseleave', () => {
            // Not the hold: a hovered toast has already been read, so this is
            // only the grace period for the pointer to clear the stack. It is
            // independent of `dur` and stays put.
            (el as any)._toastTimer = window.setTimeout(() => dismiss(el), 1600);
        });
    }
    return el;
}

function dismiss(el: HTMLDivElement) {
    if (!el || !el.parentElement) return;
    window.clearTimeout((el as any)._toastTimer);
    el.classList.add('toast-leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    // Backstop for the case where animationend never fires (element detached
    // mid-exit, animations suppressed). Sized to the 180ms Bled exit plus slack.
    window.setTimeout(() => el.remove(), 300);
}

export function showToast(opts: ToastOptions | string, type?: ToastType): void {
    const o: ToastOptions = typeof opts === 'string' ? { message: opts, type: type || 'info' } : opts;
    const root = ensureContainer();
    const el = buildToast(o);
    root.appendChild(el);
    // trim to last 5
    while (root.children.length > 5) root.firstElementChild?.remove();
}

export function initToasts(): void {
    ensureContainer();
    (window as any).showToast = showToast;
    // Bridge for React: dispatch a custom event from anywhere → toast shows up.
    window.addEventListener('etunisia:toast', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail) showToast(detail);
    });
}

// Convenience presets used across the app.
export const toast = {
    success: (msg: string, opts: Partial<ToastOptions> = {}) => showToast({ message: msg, type: 'success', ...opts }),
    error: (msg: string, opts: Partial<ToastOptions> = {}) => showToast({ message: msg, type: 'error', ...opts }),
    info: (msg: string, opts: Partial<ToastOptions> = {}) => showToast({ message: msg, type: 'info', ...opts }),
    achievement: (msg: string, opts: Partial<ToastOptions> = {}) => showToast({ message: msg, type: 'achievement', emoji: '🌟', ...opts }),
};
