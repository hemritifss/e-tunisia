// ============================================
// E-TUNISIA WEB — API Service
// Mirrors Flutter ApiService, talks to NestJS backend
// ============================================

// VITE_API_URL accepts:
//   ""                                     → same-origin (recommended; works behind a proxy / ngrok)
//   "https://abc.ngrok-free.app"           → /api/v1 is appended
//   "https://abc.ngrok-free.app/api/v1"    → used as-is
import { goTo } from './router';
import { brandPlaceholder } from './shared/placeholder';

const RAW_BASE = (import.meta.env?.VITE_API_URL ?? '').replace(/\/+$/, '');
const BASE_URL = !RAW_BASE
    ? '/api/v1'
    : (/\/api\/v\d+$/.test(RAW_BASE) ? RAW_BASE : `${RAW_BASE}/api/v1`);

// ── Token management ─────────────────────────
function getToken(): string | null {
  const t = localStorage.getItem('etunisia_token');
  // Reject literal "undefined"/"null" strings written by older buggy code paths.
  if (!t || t === 'undefined' || t === 'null') return null;
  return t;
}

export function setToken(token: string | undefined | null) {
  if (!token) {
    localStorage.removeItem('etunisia_token');
    return;
  }
  localStorage.setItem('etunisia_token', token);
}

export function clearToken() {
  localStorage.removeItem('etunisia_token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// Clean up any "undefined" string left in localStorage by older builds.
if (typeof localStorage !== 'undefined') {
  const stale = localStorage.getItem('etunisia_token');
  if (stale === 'undefined' || stale === 'null') {
    localStorage.removeItem('etunisia_token');
  }
}

function headers(json = true): Record<string, string> {
  const h: Record<string, string> = {};
  // Only send the ngrok-skip header when the API itself is on ngrok — avoids an
  // unnecessary custom-header CORS preflight when the backend is on localhost.
  if (/\.ngrok(-free)?\.(app|dev|io)/.test(BASE_URL)) {
    h['ngrok-skip-browser-warning'] = '1';
  }
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
      goTo('/hero');
      window.location.reload();
    }
    const body = await res.json().catch(() => ({}));
    // Backend wraps errors as { success: false, error: {...}, ... } — unwrap.
    const err = body && typeof body === 'object' && 'error' in body ? body.error : body;
    throw { status: res.status, ...(err as object) };
  }
  const text = await res.text();
  if (!text) return {} as T;
  const parsed = JSON.parse(text);
  // Backend wraps successes in { success: true, data: <payload>, [meta], timestamp }.
  if (parsed && typeof parsed === 'object' && parsed.success === true && 'data' in parsed) {
    // Paginated endpoints carry meta at the top — re-attach so callers see { data, meta }.
    if ('meta' in parsed && parsed.meta && typeof parsed.meta === 'object') {
      return { data: parsed.data, meta: parsed.meta } as T;
    }
    return parsed.data as T;
  }
  return parsed as T;
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

export async function googleLogin(credential: string) {
  const data = await api<{ accessToken: string; user: any }>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
  setToken(data.accessToken);
  return data;
}

export function getImageUrl(path: string | null | undefined, context?: 'place' | 'post' | 'event' | 'itinerary' | 'avatar'): string {
  if (!path) {
    // Branded, self-contained placeholder — never random stock scenery.
    return brandPlaceholder(context);
  }
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  // Get host from base URL by stripping /api/v1
  const hostUrl = BASE_URL.replace(/\/api\/v1\/?$/, '');
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${hostUrl}/${cleanPath}`;
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || 'Failed to send reset link');
  return data;
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || 'Failed to reset password');
  return data;
}

export async function register(body: { name: string; email: string; password: string; country?: string; ref?: string }) {
  const data = await api<{ accessToken: string; user: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: body.name, email: body.email, password: body.password, country: body.country,
      ...(body.ref ? { ref: body.ref } : {}),
    }),
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

// ── VISITED ("Kont houni" one-tap check-in) ──
export async function toggleVisited(placeId: string) {
  return api<string[]>(`/users/visited/${encodeURIComponent(placeId)}`, { method: 'POST' });
}

export async function getVisitedIds() {
  return api<string[]>('/users/visited');
}

// ── GEMS (community contribution engine) ─────
export interface GemSubmitResult {
  duplicate: boolean;
  place: { id: string; name: string; slug: string; city?: string; governorate?: string };
  needsConfirmations?: number;
}
export async function submitGem(payload: {
  name: string; description: string; latitude: number; longitude: number;
  images?: string[]; city?: string; governorate?: string; categoryId?: string;
}) {
  return api<GemSubmitResult>('/gems/submit', { method: 'POST', body: JSON.stringify(payload) });
}
export async function confirmGem(placeId: string) {
  return api<{ confirmations: number; wentLive: boolean; approved: boolean }>(
    `/gems/${encodeURIComponent(placeId)}/confirm`, { method: 'POST' },
  );
}
export async function getGemStatus(placeId: string) {
  return api<{ confirmations: number; confirmedByMe: boolean; pending: boolean; needed: number; isMine: boolean }>(
    `/gems/${encodeURIComponent(placeId)}/status`,
  );
}
export async function getCompleteness() {
  return api<Array<{ governorate: string; count: number; target: number; pct: number; missing: number }>>(
    '/gems/completeness',
  );
}

// ── ROUTING (real roads via OSRM/Mapbox) ─────
export async function getRoute(coords: [number, number][]) {
  const path = coords.map((c) => c.join(',')).join(';');
  return api<any>(`/routing/route?coords=${encodeURIComponent(path)}`);
}

export async function optimizeRoute(coords: [number, number][]) {
  const path = coords.map((c) => c.join(',')).join(';');
  return api<any>(`/routing/optimize?coords=${encodeURIComponent(path)}`);
}

// ── REVIEWS ──────────────────────────────────
export async function getReviews(placeId: string) {
  return api<any[]>(`/reviews/place/${placeId}`);
}

export async function addReview(
  placeId: string,
  rating: number,
  comment: string,
  opts: { images?: string[]; inquiryId?: string | null } = {},
) {
  const body: any = { rating, comment };
  if (opts.images?.length) body.images = opts.images;
  if (opts.inquiryId) body.inquiryId = opts.inquiryId;
  return api<any>(`/reviews/place/${placeId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function replyToReview(reviewId: string, replyBody: string) {
  return api<any>(`/reviews/${reviewId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ body: replyBody }),
  });
}

export async function deleteReviewReply(reviewId: string) {
  return api<any>(`/reviews/${reviewId}/reply`, { method: 'DELETE' });
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
export async function getEvents(category?: string, city?: string) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (city) params.set('city', city);
  const qs = params.toString();
  return api<any[]>(`/events${qs ? `?${qs}` : ''}`);
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

// ── CHALLENGES / DAILY TASKS / STREAK ─────────
export async function getDailyChallenges() {
  return api<any[]>('/challenges/daily');
}
export async function getMyStreak() {
  return api<any>('/challenges/streak');
}
export async function getChallengeLeaderboard(period: 'daily' | 'weekly' | 'all-time' = 'weekly', limit = 50) {
  return api<any[]>(`/challenges/leaderboard?period=${period}&limit=${limit}`);
}
export async function claimChallenge(userChallengeId: string) {
  return api<any>(`/challenges/${userChallengeId}/claim`, { method: 'POST' });
}
export async function challengeCheckIn() {
  return api<any>('/challenges/check-in', { method: 'POST' });
}

export async function getActiveTravelers(limit = 50) {
  return api<any[]>('/users/active-travelers?limit=' + limit);
}

export async function searchUsers(q: string, limit = 12) {
  return api<any[]>(`/users/search?q=${encodeURIComponent(q)}&limit=${limit}`);
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

// ── SUBSCRIPTIONS / BILLING ──────────────────
export async function getMySubscription() {
  return api<any | null>('/subscriptions/my');
}

/** Effective plan + caps from the billing service. Used by the owner dashboard banner. */
export async function getMyPlan() {
  return api<any>('/billing/me');
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

// ── MEDIA UPLOADS ────────────────────────────
/**
 * Convert a base64 data URL into a hosted URL by sending it to MinIO via the backend.
 * If anything fails (network, server, etc.) the function returns the original data URL
 * so legacy flows still work — it just won't be hosted.
 */
export async function uploadDataUrl(dataUrl: string, folder = 'uploads'): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
  try {
    const res = await api<{ url: string }>('/media/from-data-url', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, folder }),
    });
    return res?.url || dataUrl;
  } catch {
    return dataUrl;
  }
}

// ── POSTS ────────────────────────────────────
export async function createPost(data: {
  title: string; body: string; category?: string;
  location?: string; placeId?: string; images?: string[]; tags?: string[];
  videoUrl?: string;
}) {
  return api<any>('/posts', { method: 'POST', body: JSON.stringify(data) });
}

// ── AI compose assist ────────────────────────
export async function aiAssist(input: {
  text: string;
  action: 'improve' | 'translate' | 'shorten' | 'expand';
  targetLang?: string;
  tone?: string;
}) {
  return api<{ text: string; mock?: boolean }>('/ai/assist', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ── AI natural-language search ───────────────
export interface AiSearchResult {
  places: any[];
  posts: any[];
  users: any[];
  interpreted: { summary?: string; city?: string; category?: string; minRating?: number; keywords?: string } | null;
  mock?: boolean;
}
export async function aiSearch(query: string) {
  return api<AiSearchResult>('/ai/search', { method: 'POST', body: JSON.stringify({ query }) });
}

// ── SAVED / BOOKMARKS ────────────────────────
export async function savePost(postId: string) {
  return api<{ saved: true }>(`/posts/${postId}/save`, { method: 'POST' });
}

export async function unsavePost(postId: string) {
  return api<{ saved: false }>(`/posts/${postId}/save`, { method: 'DELETE' });
}

export async function listSavedPosts(page = 1, limit = 12) {
  return api<{ data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(
    `/posts/saved?page=${page}&limit=${limit}`,
  );
}

// ── FEED ─────────────────────────────────────
export async function getFeed(params: Record<string, string | number> = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  return api<{ data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(
    `/feed${qs ? `?${qs}` : ''}`,
  );
}

export async function getStories(limit = 12) {
  return api<{ stories: any[] }>(`/feed/stories?limit=${limit}`);
}

// ── CREDITS & DONATIONS ──────────────────────
export async function getMyCredits() {
  return api<{
    balance: number;
    lifetimeIn: number;
    lifetimeOut: number;
    recent: any[];
  }>('/credits/me');
}

export async function depositCredits(amount: number, note?: string) {
  return api<any>('/credits/deposit', {
    method: 'POST',
    body: JSON.stringify({ amount, note }),
  });
}

/** Start a Flouci (TND) wallet top-up. Returns { url, mock }: redirect to url, or
 *  (mock) the wallet was credited on the server-verified return. */
export async function startCreditTopup(amount: number) {
  return api<{ url: string; mock: boolean }>('/credits/topup/flouci', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function getReferralStats() {
  return api<{ released: number; pending: number; rewardTnd: number }>('/credits/referral-stats');
}

export async function getGifts() {
  return api<Array<{ id: string; label: string; emoji: string; price: number }>>('/credits/gifts');
}

export async function sendGift(toUserId: string, giftId: string, isAnonymous = false) {
  return api<any>('/credits/gift', {
    method: 'POST',
    body: JSON.stringify({ toUserId, giftId, isAnonymous }),
  });
}

export async function donate(data: {
  target: 'user' | 'platform';
  toUserId?: string;
  amount: number;
  message?: string;
  isAnonymous?: boolean;
}) {
  return api<any>('/credits/donate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyDonationsSent(limit = 25) {
  return api<any[]>(`/credits/donations/sent?limit=${limit}`);
}

export async function getMyDonationsReceived(limit = 25) {
  return api<any[]>(`/credits/donations/received?limit=${limit}`);
}

export async function getDonationLeaderboard(limit = 10) {
  return api<{ topPlatformSupporters: any[]; topReceivers: any[] }>(
    `/credits/leaderboard?limit=${limit}`,
  );
}

// ── PUBLIC USERS ─────────────────────────────
export async function getPublicUser(id: string) {
  return api<any>(`/users/${id}`);
}

// ── PROFILE EDIT ─────────────────────────────
export async function updateMyProfile(data: Partial<{
  fullName: string; country: string; avatar: string; phone: string;
  bio: string; website: string;
}>) {
  return api<any>('/users/me', { method: 'PUT', body: JSON.stringify(data) });
}

export async function getSuggestedUsers(limit = 6) {
  return api<any[]>(`/users/suggest/list?limit=${limit}`);
}

export async function getFollowingFeed(params: Record<string, string | number> = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  return api<{ data: any[]; meta: any }>(
    `/feed/following${qs ? `?${qs}` : ''}`,
  );
}

// ── DIRECT MESSAGES ──────────────────────────
export async function getMyRooms() {
  return api<any[]>('/messages/rooms');
}

export async function openDirectRoom(userId: string) {
  return api<any>(`/messages/direct/${userId}`, { method: 'POST' });
}

export async function getRoomMessages(roomId: string, page = 1, limit = 50) {
  return api<any[]>(`/messages/rooms/${roomId}/messages?page=${page}&limit=${limit}`);
}

export async function sendMessage(roomId: string, content: string) {
  return api<any>(`/messages/rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function markRoomRead(roomId: string) {
  return api<{ ok: boolean }>(`/messages/rooms/${roomId}/read`, { method: 'POST' });
}

export async function getUnreadMessagesCount() {
  return api<number | { count: number }>('/messages/unread-count');
}

// ── SAFETY (Block + Report) ──────────────────
export async function blockUser(userId: string) {
  return api<any>(`/safety/block/${userId}`, { method: 'POST' });
}

export async function unblockUser(userId: string) {
  return api<{ ok: boolean }>(`/safety/block/${userId}`, { method: 'DELETE' });
}

export async function isUserBlocked(userId: string) {
  return api<{ isBlocked: boolean }>(`/safety/is-blocked/${userId}`);
}

export async function listBlockedUsers() {
  return api<Array<{ id: string; blockedAt: string; user: { id: string; fullName: string; avatar: string | null; country: string | null } }>>(
    '/safety/blocks',
  );
}

export async function reportContent(body: {
  targetType: 'post' | 'comment' | 'user' | 'message' | 'review' | 'place';
  targetId: string;
  reason: 'spam' | 'harassment' | 'hate_speech' | 'nudity' | 'violence' | 'misinformation' | 'scam' | 'other';
  details?: string;
  targetOwnerId?: string;
}) {
  return api<any>('/safety/report', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── FOLLOW SYSTEM ────────────────────────────
export async function followUser(userId: string) {
  return api<any>(`/social/follow/${userId}`, { method: 'POST' });
}

export async function unfollowUser(userId: string) {
  return api<any>(`/social/follow/${userId}`, { method: 'DELETE' });
}

export async function getFollowCounts(userId: string) {
  return api<{ followers: number; following: number }>(
    `/social/follow-counts/${userId}`,
  );
}

export async function isFollowing(userId: string) {
  return api<{ isFollowing: boolean } | boolean>(`/social/is-following/${userId}`);
}

export async function getUserPosts(userId: string, limit = 12) {
  return api<{ data: any[]; meta: any }>(
    `/posts/by-user/${userId}?limit=${limit}`,
  );
}

// ── POST DETAIL + COMMENTS ───────────────────
export async function getPostById(id: string) {
  return api<any>(`/posts/${id}`);
}

export async function getPostComments(postId: string) {
  return api<any[]>(`/posts/${postId}/comments`);
}

export async function addPostComment(postId: string, body: string, parentId?: string | null) {
  return api<any>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body, parentId: parentId || undefined }),
  });
}

export async function likeComment(commentId: string) {
  return api<{ liked: boolean; likeCount: number }>(`/posts/comments/${commentId}/like`, {
    method: 'POST',
  });
}

// ── PLACE INQUIRIES (lead-gen) ───────────────
export async function submitPlaceInquiry(placeId: string, body: {
  name: string; email: string; phone?: string;
  partySize?: number; dateFrom?: string; dateTo?: string;
  budget?: number; currency?: string;
  message: string; source?: string;
  packageId?: string;
}) {
  return api<{ id: string; placeId: string; placeName: string; status: string; createdAt: string }>(
    `/places/${placeId}/inquiries`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

// ── TOUR PACKAGES ───────────────────────────
export interface TourPackage {
  id: string;
  placeId: string;
  title: string;
  description: string;
  durationDays: number;
  pricePerPerson: number;
  currency: string;
  minPartySize: number;
  maxPartySize: number;
  includes: string[] | null;
  images: string[] | null;
  badge: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listPackagesForPlace(placeId: string) {
  return api<TourPackage[]>(`/places/${placeId}/packages`);
}

export async function createPackage(placeId: string, body: Partial<TourPackage>) {
  return api<TourPackage>(`/places/${placeId}/packages`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updatePackage(id: string, body: Partial<TourPackage>) {
  return api<TourPackage>(`/packages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deletePackage(id: string) {
  return api<{ deleted: true }>(`/packages/${id}`, { method: 'DELETE' });
}

export async function listMyPlaces() {
  return api<any[]>('/places/mine');
}

// ── TRIP PLANS ───────────────────────────────
export interface TripStop {
  placeId: string;
  placeName?: string | null;
  placeCity?: string | null;
  placeCover?: string | null;
  packageId?: string | null;
  packageTitle?: string | null;
  pricePerPerson?: number | null;
  currency?: string | null;
  dayIndex: number;
  addedAt: string;
}
export interface TripPlan {
  id: string;
  slug: string;
  userId: string | null;
  title: string;
  travelers: number;
  currency: string;
  stops: TripStop[];
  days: number;
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function saveTrip(body: {
  title?: string;
  travelers?: number;
  currency?: string;
  days?: number;
  isPublic?: boolean;
  stops: Array<{ placeId: string; packageId?: string; dayIndex?: number }>;
}) {
  return api<TripPlan>('/trips', { method: 'POST', body: JSON.stringify(body) });
}

export async function getTripBySlug(slug: string) {
  return api<TripPlan>(`/trips/${slug}`);
}

export interface DiscoverTripCard {
  slug: string;
  title: string;
  travelers: number;
  days: number;
  currency: string;
  viewCount: number;
  stopCount: number;
  previewCities: string[];
  previewCovers: string[];
  updatedAt: string;
}

export async function discoverTrips(params: {
  page?: number; limit?: number; city?: string;
  minDays?: number; maxDays?: number; sort?: 'popular' | 'new';
} = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const tail = qs.toString();
  return api<{
    data: DiscoverTripCard[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }>(`/trips/discover${tail ? `?${tail}` : ''}`);
}

export async function listMyTrips() {
  return api<TripPlan[]>('/trips/mine');
}

export async function updateTrip(slug: string, body: any) {
  return api<TripPlan>(`/trips/${slug}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteTrip(slug: string) {
  return api<{ deleted: true }>(`/trips/${slug}`, { method: 'DELETE' });
}

/** Fan-out one inquiry per stop in a trip. Guests allowed (returns slug + sent count + failures). */
export async function batchInquireTrip(slug: string, body: {
  name: string; email: string; phone?: string;
  dateFrom?: string; dateTo?: string; budget?: number;
  message: string;
}) {
  return api<{
    slug: string;
    sent: number;
    failures: Array<{ placeId: string; reason: string }>;
    inquiries: Array<{ placeId: string; inquiryId: string; placeName: string }>;
  }>(`/trips/${slug}/inquiry`, { method: 'POST', body: JSON.stringify(body) });
}

// ── BOOST LISTING ────────────────────────────
export interface BoostTier {
  days: number;
  credits: number;
  label: string;
}
export async function getBoostTiers() {
  return api<BoostTier[]>('/places/boost/tiers');
}
export async function boostListing(placeId: string, days: 1 | 7 | 30) {
  return api<{
    placeId: string;
    isBoosted: true;
    boostExpiresAt: string;
    balanceAfter: number;
    charged: number;
  }>(`/places/${placeId}/boost`, {
    method: 'POST',
    body: JSON.stringify({ days }),
  });
}

export async function getInquiryBreakdown() {
  return api<{
    sources: Array<{ source: string; total: number; booked: number }>;
    packages: Array<{ id: string; title: string; pricePerPerson: number; currency: string; total: number; booked: number }>;
  }>('/inquiries/breakdown');
}

export async function getInquiryStats() {
  return api<{
    placeCount: number; total: number;
    new: number; contacted: number; quoted: number; booked: number; closed: number;
    last7Days: number; conversionRate: number;
  }>('/inquiries/stats');
}

// ── OWNER PAYOUT LEDGER (Tier 2.6) ──
export interface OwnerEarnings {
  summary: { bookings: number; grossTnd: number; commissionTnd: number; netTnd: number; owedTnd: number; paidOutTnd: number };
  entries: Array<{
    id: string; placeId: string; placeName: string; currency: string;
    grossTnd: number; commissionTnd: number; netTnd: number;
    status: string; checkIn: string; settled: boolean; payoutSettledAt: string | null; createdAt: string;
  }>;
}
export async function getOwnerEarnings() {
  return api<OwnerEarnings>('/bookings/owner/earnings');
}

export async function listMyInquiries(page = 1, limit = 20) {
  return api<{ data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(
    `/inquiries/mine?page=${page}&limit=${limit}`,
  );
}

export async function listReceivedInquiries(page = 1, limit = 20) {
  return api<{ data: any[]; meta: any }>(`/inquiries/received?page=${page}&limit=${limit}`);
}

export async function updateInquiryStatus(id: string, status: 'new' | 'contacted' | 'quoted' | 'booked' | 'closed') {
  return api<any>(`/inquiries/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getPostReactors(postId: string, params: { type?: string; page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return api<{ data: Array<{ userId: string; type: string; createdAt: string; user: { id: string; fullName: string; avatar: string | null; country: string | null } }>; meta: any }>(
    `/posts/${postId}/reactors${qs ? `?${qs}` : ''}`,
  );
}

// ── SEARCH (aggregated across places, posts, users) ──────
export async function search(q: string) {
  const res = await api<{ places: any[]; posts: any[]; users: any[]; total: number }>(
    `/search?q=${encodeURIComponent(q)}&limit=12`,
  ).catch(() => ({ places: [], posts: [], users: [], total: 0 }));
  return {
    query: q,
    places: res?.places || [],
    posts: res?.posts || [],
    users: res?.users || [],
    total: res?.total || 0,
  };
}
