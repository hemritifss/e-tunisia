// ============================================
// PLACE DETAIL PAGE
// Mirrors Flutter PlaceDetailScreen
// ============================================

import * as apiService from '../api';
import { places as mockPlaces } from '../data';
import { replaceIcons } from '../icons';
import { shareUrl, toggleSaved, isSaved, showToast } from '../ui-utils';
import * as tripCart from '../trip-cart';
import { addVisitedCity, isAnonymous } from '../passport-draft';

const mockComments = [
  { author: 'Sarah M.', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Sarah', text: 'Absolutely stunning place! The views are breathtaking.', rating: 5, timeAgo: '2d ago', votes: 12 },
  { author: 'Karim B.', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Karim', text: 'Great historical site. Would recommend visiting early morning to avoid crowds.', rating: 4, timeAgo: '5d ago', votes: 8 },
  { author: 'Leila T.', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Leila', text: 'Beautiful architecture and rich history. The guide was very knowledgeable.', rating: 5, timeAgo: '1w ago', votes: 5 },
];

function getPlaceById(id: string) {
  return mockPlaces.find(p => p.id === id);
}

function escAttr(s: string | null | undefined): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));
}

/** Strip non-digits and build a wa.me link (Tunisian default country code +216). */
function whatsappLink(phone: string): string {
  const digits = String(phone || '').replace(/\D+/g, '');
  if (!digits) return '#';
  const withCountry = digits.startsWith('216') ? digits : (digits.length === 8 ? '216' + digits : digits);
  return `https://wa.me/${withCountry}`;
}

export function renderPlaceDetailPage(id: string): string {
  const place = getPlaceById(id);
  const name = place?.name || 'Loading...';
  return `
    <div class="place-detail-page page-enter" id="place-detail-page" data-place-id="${id}">
      <div class="place-detail-loading" id="place-detail-loading">
        <div class="spinner"></div>
        <p>Loading place details...</p>
      </div>
      <div class="place-detail-content" id="place-detail-content" style="display:none;">
        <!-- Will be filled by JS -->
      </div>
    </div>
  `;
}

function renderReviewItem(r: any, place: any, me: any): string {
  const isOwner = !!me?.id && place?.submittedBy === me.id;
  const reviewerId = r.user?.id || r.userId || '';
  const reviewerHandle = r.user?.handle || '';
  const reviewerPlan = r.user?.plan || '';
  const avatar = r.avatar || r.user?.avatar || 'https://api.dicebear.com/9.x/thumbs/svg?seed=user';
  const author = r.author || r.user?.fullName || r.user?.name || 'Anonymous';
  const when = r.timeAgo || (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '');
  const stars = r.rating
    ? `<div class="place-review-stars" aria-label="${r.rating} out of 5 stars">${Array.from({ length: 5 }, (_, i) =>
        `<i class="lucide-star ${i < r.rating ? 'filled' : ''}"></i>`,
      ).join('')}</div>`
    : '';
  const verifiedBadge = r.verifiedInquiryId
    ? `<span class="review-verified-badge" title="Posted by a traveler whose booking was confirmed by the host">
         <i class="lucide-shield-check"></i> Verified booking
       </span>`
    : '';
  const avatarAttrs = reviewerId
    ? `data-user-id="${escAttr(reviewerId)}" data-user-name="${escAttr(author)}" data-user-avatar="${escAttr(avatar)}" data-user-handle="${escAttr(reviewerHandle)}" data-user-plan="${escAttr(reviewerPlan)}"`
    : '';
  const hostReply = r.hostReply
    ? `<div class="review-host-reply">
         <div class="review-host-reply-head">
           <i class="lucide-corner-down-right"></i>
           Response from the host${r.hostRepliedAt ? ` - ${new Date(r.hostRepliedAt).toLocaleDateString()}` : ''}
         </div>
         <p>${escapeHtml(r.hostReply)}</p>
         ${isOwner ? `<button class="btn btn-ghost btn-sm" data-host-reply-delete="${r.id}"><i class="lucide-trash-2"></i> Remove reply</button>` : ''}
       </div>`
    : (isOwner
        ? `<button class="btn btn-outline btn-sm review-host-reply-btn" data-host-reply="${r.id}">
             <i class="lucide-message-square-reply"></i> Reply as host
           </button>`
        : '');

  return `
    <article class="place-review-item" data-review-id="${r.id || ''}">
      <span class="place-review-avatar-wrap" ${avatarAttrs}>
        <img src="${avatar}" alt="" class="place-review-avatar" loading="lazy" />
      </span>
      <div class="place-review-body">
        <header class="place-review-header">
          <strong>${escapeHtml(author)}</strong>
          ${verifiedBadge}
          <span class="place-review-when">${escapeHtml(when)}</span>
        </header>
        ${stars}
        <p class="place-review-text">${escapeHtml(r.text || r.comment || '')}</p>
        ${hostReply}
      </div>
    </article>
  `;
}

function escapeHtml(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));
}

function findReviewById(reviews: any[], id: string): any {
  return reviews.find(r => r && r.id === id) || {};
}

function renderPlaceContent(place: any, reviews: any[], me: any): string {
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<i class="lucide-star ${i < Math.round(place.rating || 4.5) ? 'filled' : ''}" style="font-size: 1rem;"></i>`
  ).join('');

  return `
    <!-- Hero Image -->
    <div class="place-detail-hero">
      <img src="${apiService.getImageUrl(place.coverImage || place.image || place.imageUrl || (place.images && place.images[0]) || '')}" alt="${place.name}" class="place-detail-hero-img"
           onerror="this.style.background='linear-gradient(135deg, var(--terracotta-pale), var(--mediterranean-pale))';" />
      <div class="place-detail-hero-overlay"></div>
      <div class="place-detail-hero-actions">
        <a href="#/" class="btn-icon place-detail-back"><i class="lucide-arrow-left"></i></a>
        <div class="place-detail-hero-right">
          <button class="btn-icon place-detail-save" id="place-save-btn" aria-label="Save"><i class="lucide-heart"></i></button>
          <button class="btn-icon" id="place-share-btn" aria-label="Share"><i class="lucide-share-2"></i></button>
        </div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="place-detail-info">
      <div class="place-detail-category">${typeof place.category === 'object' && place.category ? place.category.name : (place.category || '')}</div>
      <h1 class="place-detail-name">${place.name}</h1>
      <div class="place-detail-location">
        <i class="lucide-map-pin"></i>
        ${place.location || place.city || ''}
      </div>
      <div class="place-detail-rating">
        <div class="place-detail-stars">${stars}</div>
        <span class="place-detail-rating-value">${place.rating || '4.5'}</span>
        <span class="place-detail-review-count">(${place.reviewCount || reviews.length} reviews)</span>
      </div>
      <p class="place-detail-description">${place.description || ''}</p>

      <!-- Primary CTA row — drives conversion -->
      <div class="place-detail-cta-row">
        <button class="btn btn-primary place-cta-primary" id="place-inquiry-btn">
          <i class="lucide-send"></i> Request a quote
        </button>
        ${place.phone ? `
          <a class="btn btn-outline" href="tel:${escAttr(place.phone)}" id="place-call-btn">
            <i class="lucide-phone"></i> Call
          </a>` : ''}
        ${place.phone ? `
          <a class="btn btn-outline" target="_blank" rel="noopener" href="${whatsappLink(place.phone)}" id="place-wa-btn">
            <i class="lucide-message-circle"></i> WhatsApp
          </a>` : ''}
        ${place.website ? `
          <a class="btn btn-outline" target="_blank" rel="noopener" href="${escAttr(place.website)}" id="place-web-btn">
            <i class="lucide-external-link"></i> Website
          </a>` : ''}
        ${place.latitude && place.longitude ? `
          <a class="btn btn-outline" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}">
            <i class="lucide-navigation"></i> Directions
          </a>` : `
          <button class="btn btn-outline" onclick="location.hash='#/map'">
            <i class="lucide-map"></i> View on Map
          </button>`}
        <button class="btn btn-outline" id="place-add-trip-btn" type="button">
          <i class="lucide-luggage"></i> Add to trip
        </button>
        <button class="btn btn-ghost" id="place-write-review-btn">
          <i class="lucide-pencil"></i> Review
        </button>
      </div>
    </div>

    <!-- Write Review Form (hidden by default) -->
    <div class="place-detail-review-form" id="place-review-form" style="display:none;">
      <h3>Write a Review</h3>
      <div class="place-review-rating-input" id="place-review-stars">
        <button data-star="1" class="star-btn"><i class="lucide-star"></i></button>
        <button data-star="2" class="star-btn"><i class="lucide-star"></i></button>
        <button data-star="3" class="star-btn"><i class="lucide-star"></i></button>
        <button data-star="4" class="star-btn"><i class="lucide-star"></i></button>
        <button data-star="5" class="star-btn"><i class="lucide-star"></i></button>
      </div>
      <textarea id="place-review-text" class="input" rows="3" placeholder="Share your experience..."></textarea>
      <button class="btn btn-primary" id="place-review-submit">Submit Review</button>
    </div>

    <!-- Tour packages (loaded async) -->
    <div class="place-detail-packages" id="place-packages-section" hidden>
      <h2><i class="lucide-package"></i> Bookable experiences</h2>
      <div id="place-packages-list" class="packages-grid"></div>
    </div>

    <!-- Reviews Section -->
    <div class="place-detail-reviews">
      <h2><i class="lucide-message-square"></i> Reviews (${reviews.length})</h2>
      <div class="place-detail-review-list" id="place-review-list">
        ${reviews.length === 0 ? '<p class="text-muted text-center">No reviews yet. Be the first!</p>' : ''}
        ${reviews.map(r => renderReviewItem(r, place, me)).join('')}
      </div>
    </div>
  `;
}

export async function initPlaceDetailPage() {
  const page = document.getElementById('place-detail-page');
  const loadingEl = document.getElementById('place-detail-loading');
  const contentEl = document.getElementById('place-detail-content');
  if (!page || !contentEl) return;

  const placeId = page.dataset.placeId || '';

  let place: any;
  let reviews: any[] = [];

  try {
    place = await apiService.getPlace(placeId);
  } catch {
    place = getPlaceById(placeId);
  }

  if (!place) {
    place = getPlaceById(placeId) || {
      name: 'Place Not Found', description: 'This place could not be loaded.',
      image: '', category: '', location: '', rating: 0, reviewCount: 0,
    };
  }

  // Anonymous-visitor passport seeding: every city they actually open the detail
  // page for gets remembered locally. Right after they claim a handle the draft
  // is POSTed to /users/me/seed so their map opens with cities already lit up.
  if (place?.city && isAnonymous()) {
    try { addVisitedCity(place.city); } catch {}
  }

  try {
    reviews = await apiService.getReviews(placeId);
  } catch {
    reviews = mockComments; // fallback to mock comments
  }

  // Fetch the current user lazily — needed to know if they own this listing
  // (drives the "Reply as host" button on each review).
  let me: any = null;
  try {
    if (localStorage.getItem('etunisia_token')) {
      me = await apiService.getMyProfile();
    }
  } catch {}

  if (loadingEl) loadingEl.style.display = 'none';
  contentEl.style.display = 'block';
  contentEl.innerHTML = renderPlaceContent(place, reviews, me);
  replaceIcons(contentEl);

  // --- Initialize interactions ---
  // Save button
  const saveBtn = document.getElementById('place-save-btn');
  if (saveBtn && isSaved('place:' + placeId)) saveBtn.classList.add('saved');
  saveBtn?.addEventListener('click', () => {
    const nowSaved = toggleSaved('place:' + placeId);
    saveBtn.classList.toggle('saved', nowSaved);
    showToast(nowSaved ? 'Saved to favorites' : 'Removed from favorites');
    try { apiService.toggleFavorite(placeId); } catch {}
  });

  // Share button
  document.getElementById('place-share-btn')?.addEventListener('click', () => {
    shareUrl({
      title: place.name || 'e-Tunisia',
      text: place.description || '',
      url: `${location.origin}${location.pathname}#/place/${placeId}`,
    });
  });

  // Inquiry / "Request a quote" — opens a modal that submits to the lead-gen endpoint
  document.getElementById('place-inquiry-btn')?.addEventListener('click', () => {
    openInquiryModal(place, placeId);
  });

  // "Add to trip" — drops the place into the localStorage trip cart
  document.getElementById('place-add-trip-btn')?.addEventListener('click', () => {
    if (tripCart.inCart(placeId, null)) {
      tripCart.removeStop(placeId, null);
      showToast('Removed from trip');
    } else {
      tripCart.addStop({
        placeId,
        placeName: place.name,
        placeCity: place.city || place.location,
        placeCover: place.coverImage || (place.images && place.images[0]),
      });
      showToast('Added to trip');
    }
  });

  // Tour packages — load async so they don't block the hero render
  loadPackagesForPlace(place, placeId).catch(() => {});

  // Write review toggle
  const reviewFormToggle = document.getElementById('place-write-review-btn');
  const reviewForm = document.getElementById('place-review-form');
  reviewFormToggle?.addEventListener('click', () => {
    if (reviewForm) reviewForm.style.display = reviewForm.style.display === 'none' ? 'block' : 'none';
    replaceIcons(reviewForm as HTMLElement);
  });

  // Parse any query params from the hash (e.g. ?review=1&inquiry=<uuid>)
  const queryFromHash = (() => {
    const i = location.hash.indexOf('?');
    return i < 0 ? new URLSearchParams() : new URLSearchParams(location.hash.slice(i + 1));
  })();
  const verifyingInquiryId = queryFromHash.get('inquiry') || null;

  // Auto-open the review form when arriving from "Leave a review" on /#/inquiries
  if (queryFromHash.get('review') === '1' && reviewForm) {
    reviewForm.style.display = 'block';
    // Inject a "verifying" hint so the user understands the badge they'll get
    if (verifyingInquiryId && !document.getElementById('place-review-verified-hint')) {
      const hint = document.createElement('div');
      hint.id = 'place-review-verified-hint';
      hint.className = 'review-verified-hint';
      const ic = document.createElement('i');
      ic.className = 'lucide-shield-check';
      hint.appendChild(ic);
      const txt = document.createElement('span');
      txt.textContent = ' This review will show a Verified booking badge.';
      hint.appendChild(txt);
      reviewForm.insertBefore(hint, reviewForm.firstChild);
      replaceIcons(hint);
    }
    setTimeout(() => {
      reviewForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (document.getElementById('place-review-text') as HTMLTextAreaElement | null)?.focus();
    }, 80);
  }

  // Host-reply / delete-reply handlers (delegated, so they work after re-renders)
  const reviewList = document.getElementById('place-review-list');
  reviewList?.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const replyBtn = target.closest('[data-host-reply]') as HTMLElement | null;
    const deleteBtn = target.closest('[data-host-reply-delete]') as HTMLElement | null;
    if (replyBtn) {
      const reviewId = replyBtn.dataset.hostReply!;
      const item = replyBtn.closest('.place-review-item') as HTMLElement | null;
      if (!item || item.querySelector('.review-host-reply-form')) return;
      // Inline form
      const form = document.createElement('div');
      form.className = 'review-host-reply-form';
      const ta = document.createElement('textarea');
      ta.className = 'input';
      ta.rows = 2;
      ta.placeholder = 'Thank the traveler, clarify, or follow up...';
      ta.maxLength = 2000;
      form.appendChild(ta);
      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex; gap:6px; margin-top:6px;';
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'btn btn-ghost btn-sm';
      cancel.textContent = 'Cancel';
      cancel.addEventListener('click', () => form.remove());
      const submit = document.createElement('button');
      submit.type = 'button';
      submit.className = 'btn btn-primary btn-sm';
      submit.textContent = 'Post reply';
      submit.addEventListener('click', async () => {
        const body = ta.value.trim();
        if (body.length < 2) { showToast('Reply is too short', { type: 'error' }); return; }
        submit.disabled = true;
        try {
          const updated = await apiService.replyToReview(reviewId, body);
          showToast('Reply posted');
          // Swap markup for the whole item with re-rendered version
          const fresh = document.createElement('div');
          fresh.innerHTML = renderReviewItem({ ...findReviewById(reviews, reviewId), ...updated }, place, me);
          item?.replaceWith(fresh.firstElementChild as HTMLElement);
          replaceIcons(reviewList);
        } catch (err: any) {
          submit.disabled = false;
          showToast(err?.message || 'Could not post reply', { type: 'error' });
        }
      });
      actions.appendChild(cancel);
      actions.appendChild(submit);
      form.appendChild(actions);
      replyBtn.replaceWith(form);
      ta.focus();
    } else if (deleteBtn) {
      const reviewId = deleteBtn.dataset.hostReplyDelete!;
      if (!confirm('Remove your reply?')) return;
      try {
        const updated = await apiService.deleteReviewReply(reviewId);
        const item = deleteBtn.closest('.place-review-item') as HTMLElement | null;
        const fresh = document.createElement('div');
        fresh.innerHTML = renderReviewItem({ ...findReviewById(reviews, reviewId), ...updated }, place, me);
        item?.replaceWith(fresh.firstElementChild as HTMLElement);
        replaceIcons(reviewList);
        showToast('Reply removed');
      } catch (err: any) {
        showToast(err?.message || 'Could not remove reply', { type: 'error' });
      }
    }
  });

  // Star rating
  let selectedRating = 0;
  document.querySelectorAll('#place-review-stars .star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt((btn as HTMLElement).dataset.star || '0');
      document.querySelectorAll('#place-review-stars .star-btn').forEach((b, i) => {
        b.classList.toggle('active', i < selectedRating);
      });
    });
  });

  // Submit review
  document.getElementById('place-review-submit')?.addEventListener('click', async () => {
    const text = (document.getElementById('place-review-text') as HTMLTextAreaElement)?.value.trim();
    if (!text || !selectedRating) { alert('Please add a rating and comment.'); return; }

    try {
      await apiService.addReview(placeId, selectedRating, text, { inquiryId: verifyingInquiryId });
      if (verifyingInquiryId) showToast('Verified review posted');
    } catch (err: any) {
      showToast(err?.message || 'Could not post review', { type: 'error' });
      return;
    }

    // Add to UI immediately
    const list = document.getElementById('place-review-list');
    const newReview = `
      <div class="place-review-item" style="animation: fadeSlideUp .3s ease;">
        <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=Tunisia" alt="" class="place-review-avatar" />
        <div class="place-review-body">
          <div class="place-review-header">
            <strong>You</strong>
            <span class="text-muted text-xs">just now</span>
          </div>
          <div class="place-review-stars">${Array.from({ length: 5 }, (_, i) =>
            `<i class="lucide-star ${i < selectedRating ? 'filled' : ''}" style="font-size:0.75rem;"></i>`
          ).join('')}</div>
          <p>${text}</p>
        </div>
      </div>
    `;
    if (list) list.insertAdjacentHTML('afterbegin', newReview);
    replaceIcons(list as HTMLElement);

    // Reset
    (document.getElementById('place-review-text') as HTMLTextAreaElement).value = '';
    selectedRating = 0;
    document.querySelectorAll('#place-review-stars .star-btn').forEach(b => b.classList.remove('active'));
    if (reviewForm) reviewForm.style.display = 'none';
  });
}

// ────────────────────────────────────────────────────────────
// Tour packages — show what the host actually sells, with one-click booking
// ────────────────────────────────────────────────────────────
async function loadPackagesForPlace(place: any, placeId: string) {
  const section = document.getElementById('place-packages-section');
  const list = document.getElementById('place-packages-list');
  if (!section || !list) return;

  let pkgs: any[] = [];
  try {
    pkgs = await apiService.listPackagesForPlace(placeId);
  } catch { return; }
  if (!Array.isArray(pkgs) || pkgs.length === 0) return;

  section.hidden = false;
  list.replaceChildren();
  for (const pkg of pkgs) {
    list.appendChild(buildPackageCard(place, placeId, pkg));
  }
  replaceIcons(section);
}

function buildPackageCard(place: any, placeId: string, pkg: any): HTMLElement {
  const card = document.createElement('div');
  card.className = 'package-card';

  // Cover image
  const cover = document.createElement('div');
  cover.className = 'package-cover';
  const firstImage = Array.isArray(pkg.images) && pkg.images[0]
    ? apiService.getImageUrl(pkg.images[0])
    : (place.coverImage ? apiService.getImageUrl(place.coverImage) : '');
  if (firstImage) {
    const img = document.createElement('img');
    img.src = firstImage;
    img.alt = '';
    img.loading = 'lazy';
    cover.appendChild(img);
  }
  if (pkg.badge) {
    const badge = document.createElement('span');
    badge.className = 'package-badge';
    badge.textContent = pkg.badge;
    cover.appendChild(badge);
  }
  card.appendChild(cover);

  // Body
  const body = document.createElement('div');
  body.className = 'package-body';

  const title = document.createElement('h3');
  title.className = 'package-title';
  title.textContent = pkg.title;
  body.appendChild(title);

  // Meta line: duration + party
  const meta = document.createElement('div');
  meta.className = 'package-meta';
  const days = pkg.durationDays || 1;
  meta.textContent = `${days} ${days === 1 ? 'day' : 'days'} - ${pkg.minPartySize || 1}-${pkg.maxPartySize || 12} travelers`;
  body.appendChild(meta);

  // Description (clamped)
  const desc = document.createElement('p');
  desc.className = 'package-desc';
  desc.textContent = pkg.description || '';
  body.appendChild(desc);

  // Includes chips
  if (Array.isArray(pkg.includes) && pkg.includes.length > 0) {
    const chips = document.createElement('div');
    chips.className = 'package-chips';
    for (const inc of pkg.includes.slice(0, 6)) {
      const chip = document.createElement('span');
      chip.className = 'package-chip';
      chip.textContent = inc;
      chips.appendChild(chip);
    }
    body.appendChild(chips);
  }

  // Footer: price + CTA
  const footer = document.createElement('div');
  footer.className = 'package-footer';
  const price = document.createElement('div');
  price.className = 'package-price';
  const priceNum = document.createElement('strong');
  priceNum.textContent = `${pkg.pricePerPerson} ${pkg.currency || 'TND'}`;
  price.appendChild(priceNum);
  const priceSub = document.createElement('span');
  priceSub.textContent = ' / person';
  price.appendChild(priceSub);
  footer.appendChild(price);

  const ctaWrap = document.createElement('div');
  ctaWrap.className = 'package-cta-wrap';

  const addBtn = document.createElement('button');
  addBtn.className = 'package-add-trip btn btn-ghost btn-sm';
  addBtn.type = 'button';
  addBtn.title = 'Add to trip';
  addBtn.setAttribute('aria-label', 'Add to trip');
  const addIcon = document.createElement('i');
  addIcon.className = 'lucide-luggage';
  addBtn.appendChild(addIcon);
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (tripCart.inCart(placeId, pkg.id)) {
      tripCart.removeStop(placeId, pkg.id);
      showToast('Removed from trip');
    } else {
      tripCart.addStop({
        placeId,
        placeName: place.name,
        placeCity: place.city || place.location,
        placeCover: place.coverImage || (place.images && place.images[0]),
        packageId: pkg.id,
        packageTitle: pkg.title,
        pricePerPerson: pkg.pricePerPerson,
        currency: pkg.currency,
      });
      showToast('Added to trip');
    }
  });
  ctaWrap.appendChild(addBtn);

  const cta = document.createElement('button');
  cta.className = 'btn btn-primary btn-sm';
  cta.type = 'button';
  const ctaIcon = document.createElement('i');
  ctaIcon.className = 'lucide-send';
  cta.appendChild(ctaIcon);
  cta.appendChild(document.createTextNode(' Book this'));
  cta.addEventListener('click', () => openInquiryModal(place, placeId, pkg));
  ctaWrap.appendChild(cta);

  footer.appendChild(ctaWrap);

  body.appendChild(footer);
  card.appendChild(body);
  return card;
}

// ────────────────────────────────────────────────────────────
// "Request a quote" — lead-gen modal
// ────────────────────────────────────────────────────────────
function buildInquiryFormMarkup(placeName: string, prefName: string, prefEmail: string, prefPhone: string, today: string): string {
  return `
    <header class="sheet-head">
      <div>
        <h3>Request a quote</h3>
        <p class="inquiry-sub">${escAttr(placeName)} — usually replies within 24h</p>
      </div>
      <button class="sheet-close" id="inquiry-close" aria-label="Close"><i class="lucide-x"></i></button>
    </header>
    <form class="inquiry-form" id="inquiry-form">
      <div class="inquiry-row">
        <label>
          <span>Your name *</span>
          <input name="name" type="text" required maxlength="120" value="${escAttr(prefName)}" placeholder="Full name" />
        </label>
        <label>
          <span>Email *</span>
          <input name="email" type="email" required maxlength="200" value="${escAttr(prefEmail)}" placeholder="you@example.com" />
        </label>
      </div>
      <div class="inquiry-row">
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" maxlength="40" value="${escAttr(prefPhone)}" placeholder="+216 …" />
        </label>
        <label>
          <span>Travelers *</span>
          <input name="partySize" type="number" min="1" max="50" value="2" />
        </label>
      </div>
      <div class="inquiry-row">
        <label>
          <span>From</span>
          <input name="dateFrom" type="date" min="${today}" />
        </label>
        <label>
          <span>To</span>
          <input name="dateTo" type="date" min="${today}" />
        </label>
      </div>
      <div class="inquiry-row">
        <label>
          <span>Budget</span>
          <input name="budget" type="number" min="0" step="50" placeholder="e.g. 800" />
        </label>
        <label>
          <span>Currency</span>
          <select name="currency">
            <option value="TND">TND</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
      </div>
      <label class="inquiry-full">
        <span>What can they help you with? *</span>
        <textarea name="message" rows="4" required minlength="5" maxlength="2000" placeholder="Tell them about your trip — dates flexible? Group includes kids? Any must-do experiences?"></textarea>
      </label>
      <p class="inquiry-disclaimer">
        <i class="lucide-shield-check"></i>
        We share your contact only with this listing's host. By submitting you agree to be contacted about this trip.
      </p>
      <div class="inquiry-actions">
        <button type="button" class="btn btn-ghost" id="inquiry-cancel">Cancel</button>
        <button type="submit" class="btn btn-primary" id="inquiry-submit">
          <i class="lucide-send"></i> Send request
        </button>
      </div>
    </form>
  `;
}

function openInquiryModal(place: any, placeId: string, pkg?: any) {
  document.getElementById('inquiry-modal-overlay')?.remove();

  let prefName = '';
  let prefEmail = '';
  let prefPhone = '';
  try {
    const cached = localStorage.getItem('etunisia_user');
    if (cached) {
      const u = JSON.parse(cached);
      prefName  = u?.fullName || u?.name || '';
      prefEmail = u?.email || '';
      prefPhone = u?.phone || '';
    }
  } catch {}

  const today = new Date().toISOString().slice(0, 10);

  const overlay = document.createElement('div');
  overlay.id = 'inquiry-modal-overlay';
  overlay.className = 'sheet-overlay';
  const sheet = document.createElement('div');
  sheet.className = 'sheet inquiry-modal';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', 'Request a quote');
  sheet.innerHTML = buildInquiryFormMarkup(place?.name || 'this place', prefName, prefEmail, prefPhone, today);
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
  document.getElementById('inquiry-close')?.addEventListener('click', close);
  document.getElementById('inquiry-cancel')?.addEventListener('click', close);

  // Pre-fill from package context, when present
  if (pkg) {
    const head = sheet.querySelector('.sheet-head h3') as HTMLElement | null;
    if (head) head.textContent = 'Book this experience';
    const sub = sheet.querySelector('.sheet-head .inquiry-sub') as HTMLElement | null;
    if (sub) sub.textContent = `${pkg.title} - ${pkg.pricePerPerson} ${pkg.currency || 'TND'} / person`;

    const partyInput = sheet.querySelector('input[name="partySize"]') as HTMLInputElement | null;
    if (partyInput) {
      const min = pkg.minPartySize || 1;
      const max = pkg.maxPartySize || 12;
      partyInput.min = String(min);
      partyInput.max = String(max);
      // Clamp the current value to the package's allowed range
      const current = Number(partyInput.value) || min;
      partyInput.value = String(Math.max(min, Math.min(max, current)));
    }
    const currencySel = sheet.querySelector('select[name="currency"]') as HTMLSelectElement | null;
    if (currencySel && pkg.currency) currencySel.value = pkg.currency;

    const budgetInput = sheet.querySelector('input[name="budget"]') as HTMLInputElement | null;
    if (budgetInput && pkg.pricePerPerson && pkg.minPartySize) {
      budgetInput.placeholder = `Suggested: ${pkg.pricePerPerson * pkg.minPartySize}`;
    }
    const msgInput = sheet.querySelector('textarea[name="message"]') as HTMLTextAreaElement | null;
    if (msgInput && !msgInput.value) {
      msgInput.value = `I'd like to book "${pkg.title}". Please share availability + next steps.`;
    }
    const submitBtn = sheet.querySelector('#inquiry-submit') as HTMLElement | null;
    if (submitBtn) {
      submitBtn.innerHTML = '';
      const i = document.createElement('i');
      i.className = 'lucide-send';
      submitBtn.appendChild(i);
      submitBtn.appendChild(document.createTextNode(' Request booking'));
    }
    replaceIcons(sheet);
  }

  const form = document.getElementById('inquiry-form') as HTMLFormElement;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload: any = {
      name: String(fd.get('name') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      phone: String(fd.get('phone') || '').trim() || undefined,
      partySize: Number(fd.get('partySize') || 1),
      dateFrom: String(fd.get('dateFrom') || '') || undefined,
      dateTo: String(fd.get('dateTo') || '') || undefined,
      budget: fd.get('budget') ? Number(fd.get('budget')) : undefined,
      currency: String(fd.get('currency') || 'TND'),
      message: String(fd.get('message') || '').trim(),
      source: pkg ? `package:${pkg.id}` : 'place-detail',
    };
    if (pkg?.id) payload.packageId = pkg.id;

    const submit = document.getElementById('inquiry-submit') as HTMLButtonElement;
    if (submit) submit.disabled = true;
    try {
      await apiService.submitPlaceInquiry(placeId, payload);
      // Swap form → success state using safe DOM ops (no innerHTML on user input).
      const oldForm = sheet.querySelector('#inquiry-form');
      const head = sheet.querySelector('.sheet-head .inquiry-sub') as HTMLElement | null;
      if (head) head.textContent = 'Request sent — the host will be in touch.';

      const success = document.createElement('div');
      success.className = 'inquiry-success';
      const iconWrap = document.createElement('div');
      iconWrap.className = 'inquiry-success-icon';
      iconWrap.innerHTML = '<i class="lucide-check-circle-2"></i>';
      success.appendChild(iconWrap);
      const h = document.createElement('h3');
      h.textContent = 'Request sent!';
      success.appendChild(h);
      const p = document.createElement('p');
      p.textContent = 'The host will reach out at ';
      const strong = document.createElement('strong');
      strong.textContent = payload.email;
      p.appendChild(strong);
      p.appendChild(document.createTextNode(' shortly. You can track it under '));
      const link = document.createElement('a');
      link.href = '#/inquiries';
      link.textContent = 'My Inquiries';
      p.appendChild(link);
      p.appendChild(document.createTextNode('.'));
      success.appendChild(p);
      const doneBtn = document.createElement('button');
      doneBtn.className = 'btn btn-primary';
      doneBtn.textContent = 'Done';
      doneBtn.addEventListener('click', close);
      success.appendChild(doneBtn);
      oldForm?.replaceWith(success);
      replaceIcons(success);
      showToast('Inquiry sent — keep an eye on your email');
    } catch (err: any) {
      if (submit) submit.disabled = false;
      const msg = err?.message || (Array.isArray(err?.details) ? err.details.join(', ') : '') || 'Could not send — try again';
      showToast(msg, { type: 'error' });
    }
  });
}
