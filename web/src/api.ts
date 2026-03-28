// ============================================
// E-TUNISIA WEB — API Service
// Mirrors Flutter ApiService, talks to NestJS backend
// ============================================

const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api/v1';

// ── Token management ─────────────────────────
function getToken(): string | null {
  return localStorage.getItem('etunisia_token');
}

export function setToken(token: string) {
  localStorage.setItem('etunisia_token', token);
}

export function clearToken() {
  localStorage.removeItem('etunisia_token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

function headers(json = true): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ── Generic fetch wrapper ────────────────────
async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: { ...headers(), ...(opts.headers as Record<string, string> || {}) },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      window.location.hash = '#/hero';
      window.location.reload();
    }
    const body = await res.json().catch(() => ({}));
    throw { status: res.status, ...body };
  }
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ── AUTH ──────────────────────────────────────
export async function login(email: string, password: string) {
  const data = await api<{ accessToken: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.accessToken);
  return data;
}

export async function register(body: { name: string; email: string; password: string; country?: string }) {
  const data = await api<{ accessToken: string; user: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName: body.name, email: body.email, password: body.password, country: body.country }),
  });
  setToken(data.accessToken);
  return data;
}

export function logout() {
  clearToken();
}

// ── PLACES ───────────────────────────────────
export async function getPlaces(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return api<any>(`/places${qs ? '?' + qs : ''}`);
}

export async function getPlace(id: string) {
  return api<any>(`/places/${id}`);
}

export async function getFeaturedPlaces() {
  return api<any[]>('/places/featured');
}

export async function getPopularPlaces() {
  return api<any[]>('/places/popular');
}

export async function getNearbyPlaces(lat: number, lng: number, radius = 50) {
  return api<any[]>(`/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
}

export async function getPlaceBySlug(slug: string) {
  return api<any>(`/places/slug/${slug}`);
}

export async function getPlacesByIds(ids: string[]) {
  return api<any[]>('/places/by-ids', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

// ── CATEGORIES ───────────────────────────────
export async function getCategories() {
  return api<any[]>('/categories');
}

// ── REVIEWS ──────────────────────────────────
export async function getReviews(placeId: string) {
  return api<any[]>(`/reviews/place/${placeId}`);
}

export async function addReview(placeId: string, rating: number, comment: string) {
  return api<any>(`/reviews/place/${placeId}`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment }),
  });
}

// ── FAVORITES ────────────────────────────────
export async function toggleFavorite(placeId: string) {
  return api<string[]>(`/users/favorites/${placeId}`, { method: 'POST' });
}

export async function getFavoritePlaces(ids: string[]) {
  return getPlacesByIds(ids);
}

// ── TIPS ─────────────────────────────────────
export async function getTips(category?: string) {
  const qs = category ? `?category=${category}` : '';
  return api<any[]>(`/tips${qs}`);
}

export async function addTip(title: string, content: string, category: string) {
  return api<any>('/tips', {
    method: 'POST',
    body: JSON.stringify({ title, content, category }),
  });
}

export async function likeTip(tipId: string) {
  return api<void>(`/tips/${tipId}/like`, { method: 'POST' });
}

// ── EVENTS ───────────────────────────────────
export async function getEvents(category?: string) {
  const qs = category ? `?category=${category}` : '';
  return api<any[]>(`/events${qs}`);
}

export async function attendEvent(eventId: string) {
  return api<void>(`/events/${eventId}/attend`, { method: 'POST' });
}

// ── ITINERARIES ──────────────────────────────
export async function getItineraries() {
  return api<any[]>('/itineraries');
}

// ── COLLECTIONS ──────────────────────────────
export async function getCollections() {
  return api<any[]>('/collections');
}

// ── SPONSORS ─────────────────────────────────
export async function getSponsors() {
  return api<any[]>('/sponsors');
}

export async function trackSponsorClick(sponsorId: string) {
  return api<void>(`/sponsors/${sponsorId}/click`, { method: 'POST' });
}

// ── ADS ──────────────────────────────────────
export async function getAds(placement?: string) {
  const qs = placement ? `?placement=${placement}` : '';
  return api<any[]>(`/ads${qs}`);
}

export async function trackAdImpression(adId: string) {
  return api<void>(`/ads/${adId}/impression`, { method: 'POST' });
}

export async function trackAdClick(adId: string) {
  return api<void>(`/ads/${adId}/click`, { method: 'POST' });
}

// ── GAMIFICATION ─────────────────────────────
export async function getAllBadges() {
  return api<any[]>('/gamification/badges');
}

export async function getMyBadges() {
  return api<any[]>('/gamification/my-badges');
}

export async function getMyPoints() {
  return api<any>('/gamification/my-points');
}

export async function getMyRank() {
  return api<any>('/gamification/my-rank');
}

export async function getLeaderboard(limit = 20) {
  return api<any[]>(`/gamification/leaderboard?limit=${limit}`);
}

// ── NOTIFICATIONS ────────────────────────────
export async function getNotifications() {
  return api<any[]>('/notifications');
}

export async function getUnreadCount() {
  return api<{ count: number }>('/notifications/unread-count');
}

export async function markNotificationRead(id: string) {
  return api<void>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  return api<void>('/notifications/read-all', { method: 'PATCH' });
}

// ── SUBSCRIPTIONS ────────────────────────────
export async function getMySubscription() {
  return api<any | null>('/subscriptions/my');
}

export async function upgradePlan(plan: string, paymentMethod: string, reference?: string) {
  return api<void>('/subscriptions/upgrade', {
    method: 'POST',
    body: JSON.stringify({ plan, paymentMethod, ...(reference ? { reference } : {}) }),
  });
}

// ── CONTACT ──────────────────────────────────
export async function submitContactForm(data: Record<string, any>) {
  return api<void>('/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── USER PROFILE ─────────────────────────────
export async function getMyProfile() {
  return api<any>('/users/me');
}
