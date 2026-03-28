// ============================================
// PLACE DETAIL PAGE
// Mirrors Flutter PlaceDetailScreen
// ============================================

import * as apiService from '../api';
import { places as mockPlaces } from '../data';
import { replaceIcons } from '../icons';

const mockComments = [
  { author: 'Sarah M.', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Sarah', text: 'Absolutely stunning place! The views are breathtaking.', rating: 5, timeAgo: '2d ago', votes: 12 },
  { author: 'Karim B.', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Karim', text: 'Great historical site. Would recommend visiting early morning to avoid crowds.', rating: 4, timeAgo: '5d ago', votes: 8 },
  { author: 'Leila T.', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Leila', text: 'Beautiful architecture and rich history. The guide was very knowledgeable.', rating: 5, timeAgo: '1w ago', votes: 5 },
];

function getPlaceById(id: string) {
  return mockPlaces.find(p => p.id === id);
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

function renderPlaceContent(place: any, reviews: any[]): string {
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<i class="lucide-star ${i < Math.round(place.rating || 4.5) ? 'filled' : ''}" style="font-size: 1rem;"></i>`
  ).join('');

  return `
    <!-- Hero Image -->
    <div class="place-detail-hero">
      <img src="${place.image || place.imageUrl || ''}" alt="${place.name}" class="place-detail-hero-img"
           onerror="this.style.background='linear-gradient(135deg, var(--terracotta-pale), var(--mediterranean-pale))';" />
      <div class="place-detail-hero-overlay"></div>
      <div class="place-detail-hero-actions">
        <a href="#/" class="btn-icon place-detail-back"><i class="lucide-arrow-left"></i></a>
        <div class="place-detail-hero-right">
          <button class="btn-icon place-detail-save" id="place-save-btn" aria-label="Save"><i class="lucide-heart"></i></button>
          <button class="btn-icon" aria-label="Share"><i class="lucide-share-2"></i></button>
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

      <!-- Quick Actions -->
      <div class="place-detail-actions">
        <button class="btn btn-primary" onclick="location.hash='#/map'">
          <i class="lucide-map"></i> View on Map
        </button>
        <button class="btn btn-outline" id="place-write-review-btn">
          <i class="lucide-pencil"></i> Write Review
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

    <!-- Reviews Section -->
    <div class="place-detail-reviews">
      <h2><i class="lucide-message-square"></i> Reviews (${reviews.length})</h2>
      <div class="place-detail-review-list" id="place-review-list">
        ${reviews.length === 0 ? '<p class="text-muted text-center">No reviews yet. Be the first!</p>' : ''}
        ${reviews.map(r => `
          <div class="place-review-item">
            <img src="${r.avatar || r.user?.avatar || 'https://api.dicebear.com/9.x/thumbs/svg?seed=user'}" alt="" class="place-review-avatar" />
            <div class="place-review-body">
              <div class="place-review-header">
                <strong>${r.author || r.user?.name || 'Anonymous'}</strong>
                <span class="text-muted text-xs">${r.timeAgo || ''}</span>
              </div>
              ${r.rating ? `<div class="place-review-stars">${Array.from({ length: 5 }, (_, i) =>
                `<i class="lucide-star ${i < r.rating ? 'filled' : ''}" style="font-size:0.75rem;"></i>`
              ).join('')}</div>` : ''}
              <p>${r.text || r.comment || ''}</p>
              <div class="place-review-actions">
                <button class="post-action-btn"><i class="lucide-chevron-up"></i> ${r.votes || 0}</button>
              </div>
            </div>
          </div>
        `).join('')}
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

  try {
    reviews = await apiService.getReviews(placeId);
  } catch {
    reviews = mockComments; // fallback to mock comments
  }

  if (loadingEl) loadingEl.style.display = 'none';
  contentEl.style.display = 'block';
  contentEl.innerHTML = renderPlaceContent(place, reviews);
  replaceIcons(contentEl);

  // --- Initialize interactions ---
  // Save button
  const saveBtn = document.getElementById('place-save-btn');
  saveBtn?.addEventListener('click', () => {
    saveBtn.classList.toggle('saved');
    try { apiService.toggleFavorite(placeId); } catch {}
  });

  // Write review toggle
  const reviewFormToggle = document.getElementById('place-write-review-btn');
  const reviewForm = document.getElementById('place-review-form');
  reviewFormToggle?.addEventListener('click', () => {
    if (reviewForm) reviewForm.style.display = reviewForm.style.display === 'none' ? 'block' : 'none';
    replaceIcons(reviewForm as HTMLElement);
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
      await apiService.addReview(placeId, selectedRating, text);
    } catch {}

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
