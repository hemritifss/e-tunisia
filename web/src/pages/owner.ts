// ============================================
// OWNER DASHBOARD - /#/owner
// Business-side view: listings you own, leads received,
// pipeline stats, inline status updates.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';
import { showToast } from '../ui-utils';

type Status = 'new' | 'contacted' | 'quoted' | 'booked' | 'closed';
const STATUS_ORDER: Status[] = ['new', 'contacted', 'quoted', 'booked', 'closed'];

export function renderOwnerPage(): string {
  return `
    <div class="owner-page page-enter" data-design="sleek" id="owner-root">
      <div id="owner-plan-strip" class="owner-plan-strip" hidden></div>

      <div class="favorites-header owner-header">
        <h1><i class="lucide-briefcase"></i> Owner Dashboard <span id="owner-tier-chip" class="owner-tier-chip" hidden></span></h1>
        <p>Manage the listings you host and the inquiries travelers send you.</p>
      </div>

      <section id="owner-stats" class="owner-stats">
        <div class="owner-stat-skel"></div>
        <div class="owner-stat-skel"></div>
        <div class="owner-stat-skel"></div>
        <div class="owner-stat-skel"></div>
      </section>

      <section class="owner-section">
        <header class="owner-section-head">
          <h2><i class="lucide-inbox"></i> Recent inquiries</h2>
          <a href="#/inquiries" class="text-muted" style="font-size:0.85rem;">My sent inquiries -&gt;</a>
        </header>
        <div id="owner-inbox" class="inquiry-list">
          <div class="favorites-loading"><div class="spinner"></div></div>
        </div>
      </section>

      <section class="owner-section">
        <header class="owner-section-head">
          <h2><i class="lucide-bar-chart-3"></i> Where leads come from</h2>
        </header>
        <div id="owner-breakdown" class="owner-breakdown">
          <div class="favorites-loading"><div class="spinner"></div></div>
        </div>
      </section>

      <section class="owner-section">
        <header class="owner-section-head">
          <h2><i class="lucide-map-pin"></i> My listings</h2>
        </header>
        <div id="owner-places" class="owner-places-grid">
          <div class="favorites-loading"><div class="spinner"></div></div>
        </div>
      </section>
    </div>
  `;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Build a node with a single lucide icon — keeps icon assignments off innerHTML. */
function iconEl(name: string, opts: { fontSize?: string; color?: string } = {}): HTMLElement {
  const i = document.createElement('i');
  i.className = name;
  if (opts.fontSize) i.style.fontSize = opts.fontSize;
  if (opts.color) i.style.color = opts.color;
  return i;
}

function emptyState(icon: string, title: string, body: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'empty-state';
  wrap.appendChild(iconEl(icon, { fontSize: '3rem', color: 'var(--text-muted)' }));
  const h = document.createElement('h3');
  h.textContent = title;
  wrap.appendChild(h);
  const p = document.createElement('p');
  p.textContent = body;
  wrap.appendChild(p);
  return wrap;
}

function pillButton(currentStatus: Status, target: Status, inquiryId: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = `inquiry-status-pill ${target}${currentStatus === target ? ' active' : ''}`;
  btn.textContent = target;
  btn.dataset.inquiryId = inquiryId;
  btn.dataset.status = target;
  btn.type = 'button';
  return btn;
}

function ctaButton(href: string, iconName: string, label: string, opts: { external?: boolean } = {}): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = 'btn btn-outline btn-sm';
  a.href = href;
  if (opts.external) { a.target = '_blank'; a.rel = 'noopener'; }
  a.appendChild(iconEl(iconName));
  a.appendChild(document.createTextNode(' ' + label));
  return a;
}

function buildInquiryCard(inq: any): HTMLElement {
  const place = inq.place || {};
  const wrap = document.createElement('div');
  wrap.className = 'inquiry-card owner-inquiry-card';
  wrap.dataset.inquiryId = inq.id;

  if (place.coverImage) {
    const img = document.createElement('img');
    img.className = 'inquiry-card-thumb';
    img.src = api.getImageUrl(place.coverImage);
    img.loading = 'lazy';
    img.alt = '';
    wrap.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'inquiry-card-thumb';
    wrap.appendChild(ph);
  }

  const body = document.createElement('div');
  body.className = 'inquiry-card-body';

  const header = document.createElement('div');
  header.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; gap:8px;';
  const title = document.createElement('h3');
  title.className = 'inquiry-card-title';
  title.textContent = `${inq.name || 'Traveler'} -> ${place.name || 'place'}`;
  header.appendChild(title);
  const time = document.createElement('span');
  time.className = 'inquiry-card-meta';
  time.textContent = timeAgo(inq.createdAt);
  header.appendChild(time);
  body.appendChild(header);

  const contact = document.createElement('div');
  contact.className = 'inquiry-card-meta';
  const partyTxt = `${inq.partySize || 1} ${inq.partySize === 1 ? 'traveler' : 'travelers'}`;
  const dateRange = (inq.dateFrom || inq.dateTo)
    ? `${fmtDate(inq.dateFrom)}${inq.dateTo ? ' -> ' + fmtDate(inq.dateTo) : ''}`
    : 'Dates flexible';
  const budgetTxt = inq.budget ? ` - ${inq.budget} ${inq.currency || 'TND'}` : '';
  contact.textContent = `${inq.email}${inq.phone ? ' - ' + inq.phone : ''} - ${partyTxt} - ${dateRange}${budgetTxt}`;
  body.appendChild(contact);

  const msg = document.createElement('p');
  msg.className = 'inquiry-card-msg';
  msg.textContent = inq.message || '';
  body.appendChild(msg);

  const actions = document.createElement('div');
  actions.className = 'owner-inquiry-actions';
  if (inq.email) {
    actions.appendChild(ctaButton(
      `mailto:${inq.email}?subject=${encodeURIComponent('Re: your trip to ' + (place.name || 'Tunisia'))}`,
      'lucide-mail', 'Email',
    ));
  }
  if (inq.phone) {
    actions.appendChild(ctaButton(`tel:${inq.phone}`, 'lucide-phone', 'Call'));
    const digits = String(inq.phone).replace(/\D+/g, '');
    const withCC = digits.startsWith('216') ? digits : (digits.length === 8 ? '216' + digits : digits);
    actions.appendChild(ctaButton(`https://wa.me/${withCC}`, 'lucide-message-circle', 'WhatsApp', { external: true }));
  }
  body.appendChild(actions);

  const pipe = document.createElement('div');
  pipe.className = 'inquiry-status-pipeline';
  for (const s of STATUS_ORDER) pipe.appendChild(pillButton(inq.status, s, inq.id));
  body.appendChild(pipe);

  wrap.appendChild(body);

  pipe.querySelectorAll<HTMLButtonElement>('button[data-inquiry-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const status = btn.dataset.status as Status;
      const inquiryId = btn.dataset.inquiryId!;
      const prev = pipe.querySelector('.active');
      pipe.querySelectorAll('.inquiry-status-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      try {
        await api.updateInquiryStatus(inquiryId, status);
        showToast(`Marked as ${status}`);
        refreshStats();
      } catch (e: any) {
        prev?.classList.add('active');
        btn.classList.remove('active');
        showToast(e?.message || 'Could not update status', { type: 'error' });
      }
    });
  });

  return wrap;
}

async function refreshStats() {
  const root = document.getElementById('owner-stats');
  if (!root) return;
  try {
    const s = await api.getInquiryStats();
    const tiles: Array<[string, string | number, string]> = [
      ['Listings',        s.placeCount,                    'lucide-map-pin'],
      ['New this week',   s.last7Days,                     'lucide-trending-up'],
      ['Open inquiries',  s.new + s.contacted + s.quoted,  'lucide-inbox'],
      ['Conversion',      s.conversionRate + '%',          'lucide-target'],
    ];
    root.replaceChildren();
    for (const [label, val, icon] of tiles) {
      const tile = document.createElement('div');
      tile.className = 'owner-stat';
      const iconWrap = document.createElement('div');
      iconWrap.className = 'owner-stat-icon';
      iconWrap.appendChild(iconEl(icon));
      const meta = document.createElement('div');
      meta.className = 'owner-stat-meta';
      const num = document.createElement('div');
      num.className = 'owner-stat-num';
      num.textContent = String(val);
      const lab = document.createElement('div');
      lab.className = 'owner-stat-label';
      lab.textContent = label;
      meta.appendChild(num);
      meta.appendChild(lab);
      tile.appendChild(iconWrap);
      tile.appendChild(meta);
      root.appendChild(tile);
    }
    replaceIcons(root);
  } catch {
    root.replaceChildren();
    const msg = document.createElement('p');
    msg.className = 'text-muted';
    msg.style.padding = 'var(--space-3)';
    msg.textContent = 'Could not load stats.';
    root.appendChild(msg);
  }
}

async function refreshInbox() {
  const inbox = document.getElementById('owner-inbox');
  if (!inbox) return;
  inbox.replaceChildren();
  try {
    const res = await api.listReceivedInquiries(1, 20);
    const rows: any[] = Array.isArray(res?.data) ? res.data : [];
    if (rows.length === 0) {
      inbox.appendChild(emptyState(
        'lucide-inbox',
        'No inquiries yet',
        "Once travelers send a quote request, they'll appear here with one-tap contact + status tracking.",
      ));
      replaceIcons(inbox);
      return;
    }
    for (const r of rows) inbox.appendChild(buildInquiryCard(r));
    replaceIcons(inbox);
  } catch {
    const err = document.createElement('p');
    err.className = 'text-muted';
    err.style.padding = 'var(--space-3)';
    err.textContent = 'Could not load inquiries.';
    inbox.appendChild(err);
  }
}

async function refreshPlaces() {
  const root = document.getElementById('owner-places');
  if (!root) return;
  root.replaceChildren();
  try {
    const places = await api.listMyPlaces();
    if (!Array.isArray(places) || places.length === 0) {
      root.appendChild(emptyState(
        'lucide-map-pin',
        "You don't host any listings yet",
        'List your hotel, tour, or experience and start receiving direct inquiries.',
      ));
      replaceIcons(root);
      return;
    }
    for (const p of places) {
      root.appendChild(buildPlaceCard(p));
    }
  } catch {
    const err = document.createElement('p');
    err.className = 'text-muted';
    err.style.padding = 'var(--space-3)';
    err.textContent = 'Could not load listings.';
    root.appendChild(err);
  }
}

function buildPlaceCard(p: any): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'owner-place-card';

  const cover = p.coverImage ? api.getImageUrl(p.coverImage) : '';
  const linkArea = document.createElement('a');
  linkArea.href = `#/place/${p.id}`;
  linkArea.style.textDecoration = 'none';
  linkArea.style.color = 'inherit';
  if (cover) {
    const img = document.createElement('img');
    img.src = cover; img.alt = ''; img.loading = 'lazy';
    linkArea.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'owner-place-thumb-fallback';
    linkArea.appendChild(ph);
  }
  wrap.appendChild(linkArea);

  const meta = document.createElement('div');
  meta.className = 'owner-place-meta';
  const name = document.createElement('div');
  name.className = 'owner-place-name';
  name.textContent = p.name;
  meta.appendChild(name);
  const city = document.createElement('div');
  city.className = 'owner-place-sub';
  city.textContent = `${p.city || ''}${p.governorate ? ' - ' + p.governorate : ''}`;
  meta.appendChild(city);
  const stats = document.createElement('div');
  stats.className = 'owner-place-stats';
  // Rating stars rendered as Lucide via icon class so the row stays MASTER-compliant.
  stats.innerHTML = `${p.viewCount || 0} views · ${p.reviewCount || 0} reviews · <span class="owner-place-stat-rating"><i class="lucide-star"></i> ${Number(p.rating || 0).toFixed(1)}</span>`;
  meta.appendChild(stats);

  // Active-boost badge so owners see at-a-glance which listings are live
  if (p.isBoosted && p.boostExpiresAt && new Date(p.boostExpiresAt) > new Date()) {
    const badge = document.createElement('div');
    badge.className = 'owner-place-boost-badge';
    badge.appendChild(iconEl('lucide-sparkles'));
    const until = new Date(p.boostExpiresAt).toLocaleDateString();
    badge.appendChild(document.createTextNode(` Boosted until ${until}`));
    meta.appendChild(badge);
  }

  const actions = document.createElement('div');
  actions.className = 'owner-place-actions';
  const boostBtn = document.createElement('button');
  boostBtn.className = 'btn btn-primary btn-sm';
  boostBtn.type = 'button';
  boostBtn.appendChild(iconEl('lucide-sparkles'));
  boostBtn.appendChild(document.createTextNode(p.isBoosted ? ' Extend boost' : ' Boost'));
  boostBtn.addEventListener('click', () => openBoostModal(p, () => refreshPlaces()));
  actions.appendChild(boostBtn);

  const pkgBtn = document.createElement('button');
  pkgBtn.className = 'btn btn-outline btn-sm';
  pkgBtn.type = 'button';
  pkgBtn.appendChild(iconEl('lucide-package'));
  pkgBtn.appendChild(document.createTextNode(' Packages'));
  pkgBtn.addEventListener('click', () => openPackageManager(p));
  actions.appendChild(pkgBtn);

  const viewBtn = document.createElement('a');
  viewBtn.className = 'btn btn-ghost btn-sm';
  viewBtn.href = `#/place/${p.id}`;
  viewBtn.appendChild(iconEl('lucide-external-link'));
  viewBtn.appendChild(document.createTextNode(' View'));
  actions.appendChild(viewBtn);
  meta.appendChild(actions);

  wrap.appendChild(meta);
  return wrap;
}

// ────────────────────────────────────────────────────────────
// Package manager modal — owner CRUD on their listing's packages
// ────────────────────────────────────────────────────────────
function openPackageManager(place: any) {
  document.getElementById('pkg-mgr-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'pkg-mgr-overlay';
  overlay.className = 'sheet-overlay';

  const sheet = document.createElement('div');
  sheet.className = 'sheet pkg-mgr-modal';
  sheet.setAttribute('role', 'dialog');

  const head = document.createElement('header');
  head.className = 'sheet-head';
  const titleWrap = document.createElement('div');
  const h = document.createElement('h3');
  h.textContent = 'Tour packages';
  titleWrap.appendChild(h);
  const sub = document.createElement('p');
  sub.className = 'inquiry-sub';
  sub.textContent = place.name;
  titleWrap.appendChild(sub);
  head.appendChild(titleWrap);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'sheet-close';
  closeBtn.appendChild(iconEl('lucide-x'));
  head.appendChild(closeBtn);
  sheet.appendChild(head);

  const body = document.createElement('div');
  body.className = 'pkg-mgr-body';

  const listEl = document.createElement('div');
  listEl.className = 'pkg-mgr-list';
  body.appendChild(listEl);

  const newBtn = document.createElement('button');
  newBtn.className = 'btn btn-primary pkg-mgr-new';
  newBtn.type = 'button';
  newBtn.appendChild(iconEl('lucide-plus'));
  newBtn.appendChild(document.createTextNode(' Add package'));
  body.appendChild(newBtn);

  sheet.appendChild(body);
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  replaceIcons(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
    window.removeEventListener('keydown', onKey);
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  window.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);

  newBtn.addEventListener('click', () => openPackageEditor(place, null, () => refreshList()));

  async function refreshList() {
    listEl.replaceChildren();
    try {
      const pkgs = await api.listPackagesForPlace(place.id);
      if (!Array.isArray(pkgs) || pkgs.length === 0) {
        listEl.appendChild(emptyState(
          'lucide-package',
          'No packages yet',
          'Add your first bookable experience to convert inquiries into bookings.',
        ));
        replaceIcons(listEl);
        return;
      }
      for (const pkg of pkgs) listEl.appendChild(buildOwnerPackageRow(place, pkg, refreshList));
      replaceIcons(listEl);
    } catch {
      const err = document.createElement('p');
      err.className = 'text-muted';
      err.style.padding = 'var(--space-3)';
      err.textContent = 'Could not load packages.';
      listEl.appendChild(err);
    }
  }
  refreshList();
}

function buildOwnerPackageRow(place: any, pkg: any, onChange: () => void): HTMLElement {
  const row = document.createElement('div');
  row.className = 'pkg-mgr-row';

  const info = document.createElement('div');
  info.className = 'pkg-mgr-row-info';
  const title = document.createElement('div');
  title.className = 'pkg-mgr-row-title';
  title.textContent = pkg.title;
  info.appendChild(title);
  const meta = document.createElement('div');
  meta.className = 'pkg-mgr-row-meta';
  const days = pkg.durationDays || 1;
  meta.textContent = `${pkg.pricePerPerson} ${pkg.currency || 'TND'} / person - ${days}d - ${pkg.minPartySize}-${pkg.maxPartySize} pax`;
  info.appendChild(meta);
  row.appendChild(info);

  const actions = document.createElement('div');
  actions.className = 'pkg-mgr-row-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-ghost btn-sm';
  editBtn.type = 'button';
  editBtn.appendChild(iconEl('lucide-pencil'));
  editBtn.addEventListener('click', () => openPackageEditor(place, pkg, onChange));
  actions.appendChild(editBtn);

  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-ghost btn-sm';
  delBtn.type = 'button';
  delBtn.style.color = 'var(--brand)';
  delBtn.appendChild(iconEl('lucide-trash-2'));
  delBtn.addEventListener('click', async () => {
    if (!confirm(`Delete "${pkg.title}"?`)) return;
    try {
      await api.deletePackage(pkg.id);
      showToast('Package removed');
      onChange();
    } catch (e: any) {
      showToast(e?.message || 'Could not delete', { type: 'error' });
    }
  });
  actions.appendChild(delBtn);

  row.appendChild(actions);
  return row;
}

function openPackageEditor(place: any, pkg: any | null, onSaved: () => void) {
  document.getElementById('pkg-editor-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'pkg-editor-overlay';
  overlay.className = 'sheet-overlay';

  const sheet = document.createElement('div');
  sheet.className = 'sheet inquiry-modal';
  sheet.setAttribute('role', 'dialog');

  const head = document.createElement('header');
  head.className = 'sheet-head';
  const titleWrap = document.createElement('div');
  const h = document.createElement('h3');
  h.textContent = pkg ? 'Edit package' : 'Add a package';
  titleWrap.appendChild(h);
  const sub = document.createElement('p');
  sub.className = 'inquiry-sub';
  sub.textContent = place.name;
  titleWrap.appendChild(sub);
  head.appendChild(titleWrap);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'sheet-close';
  closeBtn.appendChild(iconEl('lucide-x'));
  head.appendChild(closeBtn);
  sheet.appendChild(head);

  const form = document.createElement('form');
  form.className = 'inquiry-form';
  // Static markup safe — no user content interpolated.
  form.innerHTML = `
    <label class="inquiry-full">
      <span>Title *</span>
      <input name="title" type="text" required maxlength="200" placeholder="e.g. Sunset camel ride + Berber dinner" />
    </label>
    <label class="inquiry-full">
      <span>Description *</span>
      <textarea name="description" rows="3" required minlength="5" maxlength="4000" placeholder="What does the traveler experience? Pickups, meals, highlights..."></textarea>
    </label>
    <div class="inquiry-row">
      <label>
        <span>Price / person *</span>
        <input name="pricePerPerson" type="number" min="0" step="5" required />
      </label>
      <label>
        <span>Currency</span>
        <select name="currency">
          <option value="TND">TND</option>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
        </select>
      </label>
    </div>
    <div class="inquiry-row">
      <label>
        <span>Duration (days)</span>
        <input name="durationDays" type="number" min="1" max="60" value="1" />
      </label>
      <label>
        <span>Badge</span>
        <input name="badge" type="text" maxlength="60" placeholder="Bestseller, New, Limited..." />
      </label>
    </div>
    <div class="inquiry-row">
      <label>
        <span>Min travelers</span>
        <input name="minPartySize" type="number" min="1" max="50" value="1" />
      </label>
      <label>
        <span>Max travelers</span>
        <input name="maxPartySize" type="number" min="1" max="100" value="12" />
      </label>
    </div>
    <label class="inquiry-full">
      <span>Includes (comma-separated)</span>
      <input name="includes" type="text" placeholder="Hotel pickup, English guide, All meals" />
    </label>
    <div class="inquiry-actions">
      <button type="button" class="btn btn-ghost" data-cancel>Cancel</button>
      <button type="submit" class="btn btn-primary">Save</button>
    </div>
  `;
  sheet.appendChild(form);
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  replaceIcons(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
    window.removeEventListener('keydown', onKey);
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  window.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);
  form.querySelector('[data-cancel]')?.addEventListener('click', close);

  // Pre-fill for edit
  if (pkg) {
    const get = (name: string) => form.elements.namedItem(name) as HTMLInputElement | null;
    if (get('title'))           get('title')!.value = pkg.title || '';
    if (get('description'))     (form.elements.namedItem('description') as HTMLTextAreaElement).value = pkg.description || '';
    if (get('pricePerPerson'))  get('pricePerPerson')!.value = String(pkg.pricePerPerson || '');
    if (get('currency'))        (form.elements.namedItem('currency') as HTMLSelectElement).value = pkg.currency || 'TND';
    if (get('durationDays'))    get('durationDays')!.value = String(pkg.durationDays || 1);
    if (get('badge'))           get('badge')!.value = pkg.badge || '';
    if (get('minPartySize'))    get('minPartySize')!.value = String(pkg.minPartySize || 1);
    if (get('maxPartySize'))    get('maxPartySize')!.value = String(pkg.maxPartySize || 12);
    if (get('includes'))        get('includes')!.value = Array.isArray(pkg.includes) ? pkg.includes.join(', ') : '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const includesRaw = String(fd.get('includes') || '');
    const payload: any = {
      title: String(fd.get('title') || '').trim(),
      description: String(fd.get('description') || '').trim(),
      pricePerPerson: Number(fd.get('pricePerPerson') || 0),
      currency: String(fd.get('currency') || 'TND'),
      durationDays: Number(fd.get('durationDays') || 1),
      minPartySize: Number(fd.get('minPartySize') || 1),
      maxPartySize: Number(fd.get('maxPartySize') || 12),
      includes: includesRaw ? includesRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    const badge = String(fd.get('badge') || '').trim();
    if (badge) payload.badge = badge;

    const submit = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submit.disabled = true;
    try {
      if (pkg) await api.updatePackage(pkg.id, payload);
      else await api.createPackage(place.id, payload);
      showToast(pkg ? 'Package updated' : 'Package added');
      close();
      onSaved();
    } catch (err: any) {
      submit.disabled = false;
      const msg = err?.message || (Array.isArray(err?.details) ? err.details.join(', ') : '') || 'Could not save';
      showToast(msg, { type: 'error' });
    }
  });
}

// ────────────────────────────────────────────────────────────
// Lead-source breakdown — shows owners which channels convert
// ────────────────────────────────────────────────────────────
async function refreshBreakdown() {
  const root = document.getElementById('owner-breakdown');
  if (!root) return;
  root.replaceChildren();
  try {
    const data = await api.getInquiryBreakdown();
    const hasSources = data.sources?.length > 0;
    const hasPackages = data.packages?.length > 0;
    if (!hasSources && !hasPackages) {
      root.appendChild(emptyState(
        'lucide-bar-chart-3',
        'No data yet',
        'Once travelers submit inquiries, you\'ll see which sources convert best here.',
      ));
      replaceIcons(root);
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'owner-breakdown-grid';

    // Sources column
    if (hasSources) {
      const card = document.createElement('div');
      card.className = 'owner-breakdown-card';
      const title = document.createElement('h3');
      title.textContent = 'Lead sources';
      card.appendChild(title);
      const maxTotal = Math.max(...data.sources.map(s => s.total), 1);
      for (const s of data.sources) {
        const row = document.createElement('div');
        row.className = 'breakdown-row';
        const label = document.createElement('div');
        label.className = 'breakdown-label';
        label.textContent = sourceLabel(s.source);
        const bar = document.createElement('div');
        bar.className = 'breakdown-bar';
        const fill = document.createElement('div');
        fill.className = 'breakdown-bar-fill';
        fill.style.width = `${Math.round((s.total / maxTotal) * 100)}%`;
        bar.appendChild(fill);
        const num = document.createElement('div');
        num.className = 'breakdown-num';
        num.textContent = `${s.total}${s.booked ? ` - ${s.booked} booked` : ''}`;
        row.appendChild(label);
        row.appendChild(bar);
        row.appendChild(num);
        card.appendChild(row);
      }
      grid.appendChild(card);
    }

    // Packages column
    if (hasPackages) {
      const card = document.createElement('div');
      card.className = 'owner-breakdown-card';
      const title = document.createElement('h3');
      title.textContent = 'Top packages';
      card.appendChild(title);
      const maxTotal = Math.max(...data.packages.map(p => p.total), 1);
      for (const p of data.packages) {
        const row = document.createElement('div');
        row.className = 'breakdown-row';
        const label = document.createElement('div');
        label.className = 'breakdown-label';
        label.textContent = p.title;
        const bar = document.createElement('div');
        bar.className = 'breakdown-bar';
        const fill = document.createElement('div');
        fill.className = 'breakdown-bar-fill';
        fill.style.width = `${Math.round((p.total / maxTotal) * 100)}%`;
        bar.appendChild(fill);
        const num = document.createElement('div');
        num.className = 'breakdown-num';
        num.textContent = `${p.total}${p.booked ? ` - ${p.booked} booked` : ''}`;
        row.appendChild(label);
        row.appendChild(bar);
        row.appendChild(num);
        card.appendChild(row);
      }
      grid.appendChild(card);
    }

    root.appendChild(grid);
  } catch {
    const err = document.createElement('p');
    err.className = 'text-muted';
    err.style.padding = 'var(--space-3)';
    err.textContent = 'Could not load breakdown.';
    root.appendChild(err);
  }
}

function sourceLabel(s: string): string {
  if (s === 'place-detail') return 'Direct (place page)';
  if (s === 'package') return 'Package CTA';
  if (s === 'post') return 'Social post';
  if (s === 'direct') return 'Direct';
  return s;
}

// ────────────────────────────────────────────────────────────
// Boost listing modal
// ────────────────────────────────────────────────────────────
function openBoostModal(place: any, onSuccess: () => void) {
  document.getElementById('boost-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'boost-overlay';
  overlay.className = 'sheet-overlay';

  const sheet = document.createElement('div');
  sheet.className = 'sheet boost-modal';
  sheet.setAttribute('role', 'dialog');

  const head = document.createElement('header');
  head.className = 'sheet-head';
  const titleWrap = document.createElement('div');
  const h = document.createElement('h3');
  h.textContent = 'Boost this listing';
  titleWrap.appendChild(h);
  const sub = document.createElement('p');
  sub.className = 'inquiry-sub';
  sub.textContent = place.name;
  titleWrap.appendChild(sub);
  head.appendChild(titleWrap);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'sheet-close';
  closeBtn.appendChild(iconEl('lucide-x'));
  head.appendChild(closeBtn);
  sheet.appendChild(head);

  const body = document.createElement('div');
  body.className = 'boost-body';

  const intro = document.createElement('p');
  intro.className = 'boost-intro';
  intro.textContent = "Boosted listings show first in the Featured carousel on the home feed and get a sparkle badge on the listing page. Boosts stack if you already have one active.";
  body.appendChild(intro);

  const tiersWrap = document.createElement('div');
  tiersWrap.className = 'boost-tiers';
  body.appendChild(tiersWrap);

  const balanceLine = document.createElement('div');
  balanceLine.className = 'boost-balance';
  balanceLine.textContent = 'Loading balance…';
  body.appendChild(balanceLine);

  sheet.appendChild(body);
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  replaceIcons(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
    window.removeEventListener('keydown', onKey);
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  window.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);

  (async () => {
    let tiers: api.BoostTier[] = [];
    let balance = 0;
    try {
      const [t, b] = await Promise.all([api.getBoostTiers(), api.getMyCredits()]);
      tiers = Array.isArray(t) ? t : [];
      balance = Number((b as any)?.balance || 0);
    } catch {}

    balanceLine.replaceChildren();
    balanceLine.appendChild(iconEl('lucide-coins'));
    balanceLine.appendChild(document.createTextNode(` Balance: ${balance.toLocaleString()} credits`));
    const topUp = document.createElement('a');
    topUp.href = '#/credits';
    topUp.textContent = 'Top up';
    topUp.style.marginLeft = '8px';
    balanceLine.appendChild(topUp);
    replaceIcons(balanceLine);

    tiersWrap.replaceChildren();
    const isMostPopular = tiers.length >= 2 ? tiers[1].days : 7;
    for (const t of tiers) {
      const tierEl = document.createElement('button');
      tierEl.type = 'button';
      tierEl.className = `boost-tier ${balance < t.credits ? 'is-locked' : ''}`;
      if (t.days === isMostPopular) tierEl.classList.add('is-popular');

      if (t.days === isMostPopular) {
        const tag = document.createElement('span');
        tag.className = 'boost-tier-tag';
        tag.textContent = 'Most popular';
        tierEl.appendChild(tag);
      }
      const dur = document.createElement('div');
      dur.className = 'boost-tier-duration';
      dur.textContent = t.label;
      tierEl.appendChild(dur);

      const price = document.createElement('div');
      price.className = 'boost-tier-price';
      const priceStrong = document.createElement('strong');
      priceStrong.textContent = String(t.credits);
      price.appendChild(priceStrong);
      price.appendChild(document.createTextNode(' credits'));
      tierEl.appendChild(price);

      // Effective cost-per-day for transparency
      const cpd = Math.round(t.credits / t.days);
      const sub = document.createElement('div');
      sub.className = 'boost-tier-sub';
      sub.textContent = `${cpd} credits / day`;
      tierEl.appendChild(sub);

      tierEl.addEventListener('click', async () => {
        if (balance < t.credits) {
          showToast('Not enough credits — top up first', { type: 'error' });
          return;
        }
        if (!confirm(`Boost "${place.name}" for ${t.label} (${t.credits} credits)?`)) return;
        tiersWrap.querySelectorAll('button').forEach(b => (b as HTMLButtonElement).disabled = true);
        try {
          const res = await api.boostListing(place.id, t.days as 1 | 7 | 30);
          showToast(`Boost active until ${new Date(res.boostExpiresAt).toLocaleDateString()}`);
          close();
          onSuccess();
        } catch (err: any) {
          tiersWrap.querySelectorAll('button').forEach(b => (b as HTMLButtonElement).disabled = false);
          showToast(err?.message || 'Could not boost', { type: 'error' });
        }
      });

      tiersWrap.appendChild(tierEl);
    }
  })();
}

async function hydratePlanBanner() {
  const strip = document.getElementById('owner-plan-strip');
  const chip = document.getElementById('owner-tier-chip');
  if (!strip || !chip) return;
  let info: any = null;
  try {
    info = await (api as any).getMyPlan?.();
  } catch { info = null; }
  const plan: 'free' | 'premium' | 'business' = info?.plan || 'free';

  if (plan === 'business') {
    chip.innerHTML = '<i class="lucide-check"></i> Verified Business';
    chip.className = 'owner-tier-chip is-business';
    chip.removeAttribute('hidden');
    replaceIcons(chip);
    return;
  }

  // Anyone else (Free or Pro) sees the upsell strip + chip
  if (plan === 'premium') {
    chip.innerHTML = '<i class="lucide-sparkles"></i> Pro Traveler';
    chip.className = 'owner-tier-chip is-pro';
    chip.removeAttribute('hidden');
  } else {
    chip.textContent = '';
    chip.className = 'owner-tier-chip';
  }
  if (!chip.hidden) replaceIcons(chip);

  strip.innerHTML = `
    <a class="pro-gate-card is-business" href="#/pro">
      <span class="pro-gate-card-icon"><i class="lucide-briefcase"></i></span>
      <div class="pro-gate-card-body">
        <strong>Owner Dashboard is a Business feature</strong>
        <span>List places, claim verified status, get inquiry analytics + boost slots, and respond to reviews officially. Free + Pro travelers can still see the surface read-only.</span>
      </div>
      <span class="pro-gate-card-cta">Upgrade →</span>
    </a>
  `;
  strip.removeAttribute('hidden');
}

export async function initOwnerPage() {
  hydratePlanBanner();
  await Promise.all([refreshStats(), refreshInbox(), refreshBreakdown(), refreshPlaces()]);
}
