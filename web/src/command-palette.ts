/**
 * Global ⌘K / Ctrl+K command palette.
 *
 * One keyboard shortcut, one place to find anything: people, places, and
 * every section of the app. Keyboard-first navigation (↑↓ Enter Esc),
 * mouse works too, but the design rewards the keyboard.
 */

import * as api from './api';
import { goTo } from './router';

interface CommandItem {
    id: string;
    section: 'recent' | 'action' | 'page' | 'people' | 'places';
    icon: string;            // lucide-react icon name OR inline SVG markup; never emoji.
    title: string;
    subtitle?: string;
    href: string;
    avatar?: string | null;
    /** Imperative commands (compose, theme toggle) run this instead of navigating. */
    run?: () => void;
}

/**
 * Inline SVGs (Lucide stroke style, 18px) — emoji icons violated MASTER.md
 * `no-emoji-icons` rule and rendered inconsistently across OS fonts. Stored
 * here as strings so we can innerHTML them safely (controlled, not user input).
 */
const SVG: Record<string, string> = {
    home:        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    passport:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="18" x="5" y="3" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17h8"/></svg>',
    activity:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    compass:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    map:         '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>',
    trophy:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
    award:       '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
    bookmark:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
    heart:       '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    message:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    mail:        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/></svg>',
    calendar:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
    lightbulb:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
    settings:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    search:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    pin:         '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    plus:        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    moon:        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
    sparkles:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
    clock:       '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
};

const PAGE_SHORTCUTS: CommandItem[] = [
    { id: 'p-home',        section: 'page', icon: 'home',      title: 'Home feed',                href: '#/' },
    { id: 'p-passport',    section: 'page', icon: 'passport',  title: 'My Travel Profile',        href: '__OWN_HANDLE__' },
    { id: 'p-activity',    section: 'page', icon: 'activity',  title: 'Following activity',       href: '#/activity' },
    { id: 'p-explore',     section: 'page', icon: 'compass',   title: 'Explore places',           href: '#/explore' },
    { id: 'p-trips',       section: 'page', icon: 'map',       title: 'Trip plans by travelers',  href: '#/discover-trips' },
    { id: 'p-leaderboard', section: 'page', icon: 'trophy',    title: 'Leaderboard',              href: '#/leaderboard' },
    { id: 'p-badges',      section: 'page', icon: 'award',     title: 'My badges',                href: '#/badges' },
    { id: 'p-saved',       section: 'page', icon: 'bookmark',  title: 'Saved posts',              href: '#/saved' },
    { id: 'p-favorites',   section: 'page', icon: 'heart',     title: 'Saved places',             href: '#/favorites' },
    { id: 'p-messages',    section: 'page', icon: 'message',   title: 'Messages',                 href: '#/messages' },
    { id: 'p-inquiries',   section: 'page', icon: 'mail',      title: 'My inquiries',             href: '#/inquiries' },
    { id: 'p-events',      section: 'page', icon: 'calendar',  title: 'Events',                   href: '#/events' },
    { id: 'p-tips',        section: 'page', icon: 'lightbulb', title: 'Travel tips',              href: '#/tips' },
    { id: 'p-profile',     section: 'page', icon: 'settings',  title: 'Edit profile',             href: '#/profile-edit' },
    { id: 'p-search',      section: 'page', icon: 'search',    title: 'Full search',              href: '#/search' },
];

/** Imperative commands — the difference between a search box and a command palette. */
function quickActions(): CommandItem[] {
    const loggedIn = !!localStorage.getItem('etunisia_token');
    const items: CommandItem[] = [];
    if (loggedIn) {
        items.push({
            id: 'a-compose', section: 'action', icon: 'plus', title: 'Create a post',
            subtitle: 'Share a place, tip, or photo', href: '#',
            run: () => document.dispatchEvent(new CustomEvent('etunisia:open-post-modal')),
        });
    }
    items.push({
        id: 'a-ai', section: 'action', icon: 'sparkles', title: 'Plan a trip with AI',
        subtitle: 'Generate a full itinerary', href: '#/ai-planner',
    });
    items.push({
        id: 'a-theme', section: 'action', icon: 'moon', title: 'Toggle dark mode',
        subtitle: 'Switch light / dark', href: '#',
        run: () => document.getElementById('theme-toggle')?.click(),
    });
    return items;
}

function filterActions(q: string): CommandItem[] {
    const all = quickActions();
    if (!q) return all;
    const lower = q.toLowerCase();
    return all.filter((a) => (a.title + ' ' + (a.subtitle || '')).toLowerCase().includes(lower));
}

// ── Recents — the palette should remember where you go ────
const RECENTS_KEY = 'etunisia_cmdk_recents';
const RECENTS_MAX = 5;

function readRecents(): CommandItem[] {
    try {
        const arr = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
        if (!Array.isArray(arr)) return [];
        return arr
            .filter((r) => r && r.title && r.href)
            .slice(0, RECENTS_MAX)
            .map((r) => ({ ...r, section: 'recent' as const, run: undefined }));
    } catch { return []; }
}

function pushRecent(item: CommandItem) {
    // Actions are re-runnable from their own section; only destinations recur.
    if (item.run || item.section === 'action') return;
    try {
        const entry = { id: item.id, icon: item.icon || 'clock', title: item.title, subtitle: item.subtitle, href: item.href, avatar: item.avatar ?? null };
        const next = [entry, ...readRecents().filter((r) => r.id !== item.id)].slice(0, RECENTS_MAX);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {}
}

function escapeHtml(s: string): string {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

let root: HTMLDivElement | null = null;
let input: HTMLInputElement | null = null;
let list: HTMLDivElement | null = null;
let activeIndex = 0;
let lastItems: CommandItem[] = [];
let debounceTimer: number | null = null;

function mountShell() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'cmdk-root';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = `
        <div class="cmdk-backdrop"></div>
        <div class="cmdk-panel" role="dialog" aria-modal="true" aria-label="Command palette">
            <div class="cmdk-input-row">
                <i class="lucide-search cmdk-search-icon" aria-hidden="true"></i>
                <input class="cmdk-input" type="text" placeholder="Search people, places, pages…" autocomplete="off" spellcheck="false" />
                <kbd class="cmdk-esc">esc</kbd>
            </div>
            <div class="cmdk-list" role="listbox"></div>
            <div class="cmdk-footer">
                <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
                <span><kbd>↵</kbd> to open</span>
                <span><kbd>esc</kbd> to close</span>
            </div>
        </div>
    `;
    document.body.appendChild(root);
    input = root.querySelector('.cmdk-input');
    list = root.querySelector('.cmdk-list');

    root.querySelector('.cmdk-backdrop')?.addEventListener('click', close);

    input?.addEventListener('input', () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => render(input!.value), 180);
    });

    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); move(1); return; }
        if (e.key === 'ArrowUp')   { e.preventDefault(); move(-1); return; }
        if (e.key === 'Enter')     { e.preventDefault(); commit(); return; }
    });
}

function ownHandle(): string | null {
    try {
        // Zustand-persisted auth store: { state: { user: { handle } } }
        const persisted = localStorage.getItem('etunisia-auth');
        if (persisted) {
            const h = JSON.parse(persisted)?.state?.user?.handle;
            if (h) return h;
        }
        const raw = localStorage.getItem('etunisia_user') || localStorage.getItem('auth_user');
        if (!raw) return null;
        const u = JSON.parse(raw);
        return u?.handle ?? null;
    } catch { return null; }
}

function resolveHref(item: CommandItem): string {
    if (item.href === '__OWN_HANDLE__') {
        const h = ownHandle();
        return h ? `#/u/${encodeURIComponent(h)}` : '#/login';
    }
    return item.href;
}

function filterPages(q: string): CommandItem[] {
    if (!q) return PAGE_SHORTCUTS;
    const lower = q.toLowerCase();
    return PAGE_SHORTCUTS.filter((p) => p.title.toLowerCase().includes(lower));
}

async function fetchPeople(q: string): Promise<CommandItem[]> {
    if (!q || q.length < 2) return [];
    try {
        const r = await fetch(`/api/v1/users/search?q=${encodeURIComponent(q)}&limit=6`).then((r) => r.json());
        const arr: any[] = Array.isArray(r) ? r : (r?.data ?? []);
        return arr.map((u: any) => ({
            id: `u-${u.id}`,
            section: 'people' as const,
            icon: '',
            title: u.fullName || 'Traveler',
            subtitle: [u.handle ? '@' + u.handle : '', u.country].filter(Boolean).join(' · '),
            href: u.handle ? `#/u/${encodeURIComponent(u.handle)}` : '#',
            avatar: u.avatar || null,
        }));
    } catch { return []; }
}

async function fetchPlaces(q: string): Promise<CommandItem[]> {
    if (!q || q.length < 2) return [];
    try {
        const r: any = await (api as any).search?.(q);
        const arr: any[] = (r?.places || []).slice(0, 6);
        return arr.map((p: any) => ({
            id: `pl-${p.id}`,
            section: 'places' as const,
            icon: 'pin',
            title: p.name || 'Place',
            subtitle: [p.city, p.category?.name || p.category].filter(Boolean).join(' · '),
            href: `#/place/${p.id}`,
            avatar: p.coverImage || (p.images && p.images[0]) || null,
        }));
    } catch { return []; }
}

async function render(q: string) {
    if (!list) return;
    const trimmed = q.trim();
    const recents = trimmed ? [] : readRecents();
    const actions = filterActions(trimmed);
    const pages = filterPages(trimmed);

    // Optimistic instant render of local items while the async fetches resolve.
    activeIndex = 0;
    const local = [...recents, ...actions, ...pages];
    lastItems = local;
    paint(local, { peopleLoading: trimmed.length >= 2, placesLoading: trimmed.length >= 2 });

    const [people, places] = await Promise.all([fetchPeople(trimmed), fetchPlaces(trimmed)]);
    lastItems = [...local, ...people, ...places];
    paint(lastItems, { peopleLoading: false, placesLoading: false });
}

function sectionHeader(label: string): string {
    return `<div class="cmdk-section-head">${escapeHtml(label)}</div>`;
}

function renderItem(item: CommandItem, idx: number): string {
    const isActive = idx === activeIndex;
    const sub = item.subtitle ? `<span class="cmdk-sub">${escapeHtml(item.subtitle)}</span>` : '';
    const svg = SVG[item.icon];
    const iconCell = item.avatar
        ? `<img class="cmdk-avatar" src="${escapeHtml(item.avatar)}" alt="" />`
        : svg
            ? `<span class="cmdk-icon" aria-hidden="true">${svg}</span>`
            : `<span class="cmdk-emoji" aria-hidden="true">•</span>`;
    return `
        <div role="option" aria-selected="${isActive}" class="cmdk-item ${isActive ? 'active' : ''}" data-idx="${idx}">
            ${iconCell}
            <div class="cmdk-text">
                <span class="cmdk-title">${escapeHtml(item.title)}</span>
                ${sub}
            </div>
            <span class="cmdk-section-pill">${item.section}</span>
        </div>
    `;
}

function paint(items: CommandItem[], state: { peopleLoading: boolean; placesLoading: boolean }) {
    if (!list) return;

    const grouped = { recent: [] as CommandItem[], action: [] as CommandItem[], page: [] as CommandItem[], people: [] as CommandItem[], places: [] as CommandItem[] };
    items.forEach((i) => grouped[i.section].push(i));

    const flat: CommandItem[] = [...grouped.recent, ...grouped.action, ...grouped.page, ...grouped.people, ...grouped.places];
    lastItems = flat;
    if (activeIndex >= flat.length) activeIndex = Math.max(0, flat.length - 1);

    let html = '';
    if (grouped.recent.length) {
        html += sectionHeader('Recent');
        grouped.recent.forEach((it) => {
            const idx = flat.indexOf(it);
            html += renderItem(it, idx);
        });
    }
    if (grouped.action.length) {
        html += sectionHeader('Actions');
        grouped.action.forEach((it) => {
            const idx = flat.indexOf(it);
            html += renderItem(it, idx);
        });
    }
    if (grouped.page.length) {
        html += sectionHeader('Pages');
        grouped.page.forEach((it) => {
            const idx = flat.indexOf(it);
            html += renderItem(it, idx);
        });
    }
    if (grouped.people.length || state.peopleLoading) {
        html += sectionHeader(`People${state.peopleLoading ? ' …' : ''}`);
        grouped.people.forEach((it) => {
            const idx = flat.indexOf(it);
            html += renderItem(it, idx);
        });
        if (state.peopleLoading && !grouped.people.length) html += `<div class="cmdk-skel">Searching travelers…</div>`;
    }
    if (grouped.places.length || state.placesLoading) {
        html += sectionHeader(`Places${state.placesLoading ? ' …' : ''}`);
        grouped.places.forEach((it) => {
            const idx = flat.indexOf(it);
            html += renderItem(it, idx);
        });
        if (state.placesLoading && !grouped.places.length) html += `<div class="cmdk-skel">Searching destinations…</div>`;
    }
    if (!html) {
        html = `<div class="cmdk-empty">No matches. Try a name, city, or page.</div>`;
    }
    list.innerHTML = html;

    list.querySelectorAll<HTMLElement>('.cmdk-item').forEach((el) => {
        el.addEventListener('mouseenter', () => {
            activeIndex = Number(el.dataset.idx) || 0;
            highlight();
        });
        el.addEventListener('click', () => {
            activeIndex = Number(el.dataset.idx) || 0;
            commit();
        });
    });
}

function highlight() {
    if (!list) return;
    list.querySelectorAll<HTMLElement>('.cmdk-item').forEach((el) => {
        const isActive = Number(el.dataset.idx) === activeIndex;
        el.classList.toggle('active', isActive);
        el.setAttribute('aria-selected', String(isActive));
        if (isActive) el.scrollIntoView({ block: 'nearest' });
    });
}

function move(delta: number) {
    if (!lastItems.length) return;
    activeIndex = (activeIndex + delta + lastItems.length) % lastItems.length;
    highlight();
}

function commit() {
    const item = lastItems[activeIndex];
    if (!item) return;
    pushRecent(item);
    if (item.run) {
        close();
        item.run();
        return;
    }
    const href = resolveHref(item);
    if (href && href !== '#') goTo(href);
    close();
}

function open() {
    mountShell();
    if (!root || !input) return;
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    input.value = '';
    render('');
    setTimeout(() => input?.focus(), 30);
    document.body.style.overflow = 'hidden';
}

function close() {
    if (!root) return;
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function isTextInputTarget(t: EventTarget | null): boolean {
    if (!(t instanceof HTMLElement)) return false;
    if (t.isContentEditable) return true;
    const tag = t.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/** "⌘K" on a Mac, "Ctrl K" everywhere else — a ⌘ badge on Windows reads as a bug. */
function shortcutLabel(): string {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || (navigator as any).userAgentData?.platform || '');
    return isMac ? '⌘K' : 'Ctrl K';
}

export function initCommandPalette() {
    document.addEventListener('keydown', (e) => {
        const meta = e.metaKey || e.ctrlKey;
        if (meta && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            open();
            return;
        }
        // FB/Twitter/GitHub convention: '/' focuses search-anything from anywhere
        // (skip when the user is already typing into an input)
        if (e.key === '/' && !meta && !e.altKey && !isTextInputTarget(e.target)) {
            e.preventDefault();
            open();
        }
    });
    // Surface the shortcut on the existing topbar search input as a hint.
    const topbarSearch = document.querySelector<HTMLInputElement>('input[type="search"], #topbar-search-input, #global-search-input');
    if (topbarSearch) {
        topbarSearch.placeholder = `${topbarSearch.placeholder || 'Search'}  (${shortcutLabel()})`;
    }
    // The static markup ships "⌘K" — stamp the platform-correct label + aria.
    const kbd = document.querySelector<HTMLElement>('.nav-search-trigger-kbd');
    if (kbd) kbd.textContent = shortcutLabel();
    // Mention both ways in: the shortcut chord and the "/" convention.
    const trigger = document.querySelector<HTMLElement>('.nav-search-trigger');
    if (trigger) trigger.setAttribute('aria-label', `Search anything (${shortcutLabel().replace(' ', '+')} or /)`);
    const mobileSearch = document.querySelector<HTMLElement>('.nav-search-mobile');
    if (mobileSearch) mobileSearch.setAttribute('aria-label', 'Search');
    // Expose for the keyboard-shy: clicking the topbar search bar opens the palette.
    const searchTriggers = document.querySelectorAll('[data-open-cmdk]');
    searchTriggers.forEach((t) => t.addEventListener('click', open));
    (window as any).openCommandPalette = open;
}
