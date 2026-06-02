// VITE_API_URL accepts either a full URL or empty (= same-origin, recommended).
// Endpoints below include /api/v1, so we strip it from the env if user added one.
import { goTo } from '../router';

const RAW = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
const API_BASE = RAW.replace(/\/api\/v\d+$/, ''); // '' when same-origin

class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * GET endpoints that have returned 404 in this session — likely a stale
 * backend running pre-route-registration. We stop hammering them so the
 * console doesn't fill up and the network panel stays readable. Mutation
 * methods (POST/PUT/DELETE) are NOT cached — they can succeed at any time.
 *
 * Cleared automatically on tab focus (in case the user has just restarted
 * the backend), and explicitly via clearApi404Cache().
 */
const dead404Cache = new Set<string>();
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => dead404Cache.clear());
}
export function clearApi404Cache() { dead404Cache.clear(); }

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
): Promise<any> {
  const token = localStorage.getItem('etunisia_token');
  const url = `${API_BASE}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = `${method} ${endpoint.split('?')[0]}`;

  // Short-circuit if we've already learned this GET 404s in this session.
  if (method === 'GET' && dead404Cache.has(cacheKey)) {
    throw new ApiError(404, 'Route not available (cached this session)');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  // Only send the ngrok-skip header when the API itself is on ngrok — avoids an
  // unnecessary custom-header CORS preflight when the backend is on localhost.
  if (/\.ngrok(-free)?\.(app|dev|io)/.test(API_BASE)) {
    headers['ngrok-skip-browser-warning'] = '1';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Remember GET 404s for this session so we don't keep hammering.
    if (response.status === 404 && method === 'GET') {
      dead404Cache.add(cacheKey);
    }
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Ignore parse errors
    }
    // Backend wraps errors as { success: false, error: { message, details }, ... }.
    const err = errorData?.error ?? errorData;

    // Plan-cap shortcut: when Nest throws ForbiddenException({ code: 'cap_reached', ... }),
    // the structured payload lands on either err.message (object) or err.details. Surface a
    // single, action-rich toast pointing to /#/pro so every cap moment gets the same treatment.
    if (response.status === 403) {
      const capPayload = (err?.message && typeof err.message === 'object') ? err.message : err?.details;
      const code = capPayload?.code;
      if (code === 'cap_reached') {
        const feature = capPayload.feature === 'maxTrips' ? 'trip plans'
          : capPayload.feature === 'maxSaves' ? 'saved posts'
          : 'this feature';
        try {
          (window as any).showToast?.({
            title: `You've hit your Free ${feature} limit`,
            message: `Free is capped at ${capPayload.cap}. Pro and Business get unlimited — and a ✦ badge.`,
            type: 'achievement',
            duration: 7000,
            action: { label: 'Upgrade →', onClick: () => { goTo('/pro'); } },
          });
        } catch {}
      } else if (code === 'pro_required' || code === 'business_required') {
        try {
          (window as any).showToast?.({
            title: code === 'business_required' ? 'Business members only' : 'Pro members only',
            message: capPayload?.message || 'This feature is part of a paid plan.',
            type: 'info',
            duration: 6000,
            action: { label: 'See plans →', onClick: () => { goTo('/pro'); } },
          });
        } catch {}
      } else if (code === 'ai_quota_reached') {
        // Daily AI allowance hit → nudge to Pro (guests get a sign-in hint instead).
        try {
          (window as any).showToast?.({
            title: capPayload?.scope === 'guest' ? 'Sign in for more AI' : "You've hit today's AI limit",
            message: capPayload?.message || 'Upgrade to Pro for more AI every day.',
            type: 'achievement',
            duration: 7000,
            action: capPayload?.scope === 'guest'
              ? { label: 'Sign in →', onClick: () => { goTo('/hero'); } }
              : { label: 'Upgrade →', onClick: () => { goTo('/pro'); } },
          });
        } catch {}
      } else if (code === 'content_blocked') {
        // AI moderation rejected the post/comment before publishing.
        try {
          (window as any).showToast?.({
            title: 'Post not published',
            message: capPayload?.message || 'This content goes against our community guidelines.',
            type: 'error',
            duration: 6000,
          });
        } catch {}
      }
    }

    throw new ApiError(
      response.status,
      typeof err?.message === 'string' ? err.message : (err?.message?.message || `HTTP ${response.status}`),
      err?.details ?? (typeof err?.message === 'object' ? err.message : undefined),
    );
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return null;
  }

  const parsed = await response.json();
  // Backend wraps successes in { success: true, data: <payload>, [meta], timestamp }. Unwrap.
  if (parsed && typeof parsed === 'object' && parsed.success === true && 'data' in parsed) {
    // For paginated endpoints the interceptor lifts `meta` to the top level — re-attach it
    // alongside the data array so callers get the { data, meta } shape they expect.
    if ('meta' in parsed && parsed.meta && typeof parsed.meta === 'object') {
      return { data: parsed.data, meta: parsed.meta };
    }
    return parsed.data;
  }
  return parsed;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    fetchWithAuth('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { name: string; email: string; password: string; country?: string }) =>
    fetchWithAuth('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => fetchWithAuth('/api/v1/users/me'),
  updateProfile: (data: Record<string, any>) =>
    fetchWithAuth('/api/v1/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  getPassportAnalytics: () => fetchWithAuth('/api/v1/users/me/passport-analytics'),

  // Places
  getPlaces: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchWithAuth(`/api/v1/places${query}`);
  },

  getPlace: (id: string) => fetchWithAuth(`/api/v1/places/${id}`),
  getFeaturedPlaces: () => fetchWithAuth('/api/v1/places/featured'),
  getPopularPlaces: () => fetchWithAuth('/api/v1/places/popular'),
  getNearbyPlaces: (lat: number, lng: number, radius = 10) =>
    fetchWithAuth(`/api/v1/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),

  // Categories
  getCategories: () => fetchWithAuth('/api/v1/categories'),

  // Reviews
  getReviews: (placeId: string) => fetchWithAuth(`/api/v1/reviews/place/${placeId}`),
  createReview: (placeId: string, data: { rating: number; comment: string; images?: string[] }) =>
    fetchWithAuth(`/api/v1/reviews/place/${placeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Feed (unified: posts + reviews + ads)
  getFeed: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchWithAuth(`/api/v1/feed${query}`);
  },
  getMyFeed: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchWithAuth(`/api/v1/feed/mine${query}`);
  },
  getFollowingFeed: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchWithAuth(`/api/v1/feed/following${query}`);
  },
  // Live 24h stories grouped by author
  getStories: () => fetchWithAuth(`/api/v1/stories`),
  getTrendingHashtags: (limit = 8) =>
    fetchWithAuth(`/api/v1/feed/trending-hashtags?limit=${limit}`),

  // Post reactions
  reactToPost: (postId: string, type: string | null) =>
    fetchWithAuth(`/api/v1/posts/${postId}/react`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  getPostReactions: (postId: string) =>
    fetchWithAuth(`/api/v1/posts/${postId}/reactions`),
  getPostReactors: (postId: string, params?: { type?: string; page?: number; limit?: number }) => {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : '';
    return fetchWithAuth(`/api/v1/posts/${postId}/reactors${qs}`);
  },
  createStory: (data: { imageUrl: string; caption?: string }) =>
    fetchWithAuth(`/api/v1/stories`, { method: 'POST', body: JSON.stringify(data) }),
  viewStory: (id: string) =>
    fetchWithAuth(`/api/v1/stories/${id}/view`, { method: 'POST' }),
  toggleStoryHighlight: (id: string) =>
    fetchWithAuth(`/api/v1/stories/${id}/highlight`, { method: 'POST' }),
  getStoryHighlights: (handle: string) =>
    fetchWithAuth(`/api/v1/stories/highlights/${encodeURIComponent(handle)}`),

  // Credits & donations
  getMyCredits: () => fetchWithAuth('/api/v1/credits/me'),
  depositCredits: (amount: number, note?: string) =>
    fetchWithAuth('/api/v1/credits/deposit', { method: 'POST', body: JSON.stringify({ amount, note }) }),
  /** Flouci (TND) wallet top-up → returns { url, mock }. Redirect to url (or mock = credited on return). */
  startCreditTopup: (amount: number) =>
    fetchWithAuth('/api/v1/credits/topup/flouci', { method: 'POST', body: JSON.stringify({ amount }) }),
  donate: (data: { target: 'user' | 'platform'; toUserId?: string; amount: number; message?: string; isAnonymous?: boolean }) =>
    fetchWithAuth('/api/v1/credits/donate', { method: 'POST', body: JSON.stringify(data) }),
  getMyDonationsSent: () => fetchWithAuth('/api/v1/credits/donations/sent'),
  getMyDonationsReceived: () => fetchWithAuth('/api/v1/credits/donations/received'),
  getDonationLeaderboard: () => fetchWithAuth('/api/v1/credits/leaderboard'),

  // Posts (user-authored)
  createPost: (data: {
    title: string; body: string; category?: string;
    location?: string; placeId?: string; images?: string[]; tags?: string[];
    videoUrl?: string;
  }) =>
    fetchWithAuth('/api/v1/posts', { method: 'POST', body: JSON.stringify(data) }),
  aiAssist: (input: { text: string; action: 'improve' | 'translate' | 'shorten' | 'expand'; targetLang?: string; tone?: string }) =>
    fetchWithAuth('/api/v1/ai/assist', { method: 'POST', body: JSON.stringify(input) }),
  aiCaption: (input: { topic?: string; location?: string }) =>
    fetchWithAuth('/api/v1/ai/caption', { method: 'POST', body: JSON.stringify(input) }),
  aiSuggestions: (interests?: string[]) =>
    fetchWithAuth(
      `/api/v1/ai/suggestions${interests && interests.length ? `?interests=${encodeURIComponent(interests.join(','))}` : ''}`,
    ),
  aiSurprise: () => fetchWithAuth('/api/v1/ai/surprise', { method: 'POST', body: '{}' }),
  aiPersonality: () => fetchWithAuth('/api/v1/ai/personality'),
  aiGreeting: () => fetchWithAuth('/api/v1/ai/greeting'),
  votePost: (postId: string, direction: 'up' | 'down' | 'clear') =>
    fetchWithAuth(`/api/v1/posts/${postId}/vote`, { method: 'POST', body: JSON.stringify({ direction }) }),
  deletePost: (postId: string) =>
    fetchWithAuth(`/api/v1/posts/${postId}`, { method: 'DELETE' }),

  // Favorites
  toggleFavorite: (placeId: string) =>
    fetchWithAuth(`/api/v1/users/favorites/${placeId}`, { method: 'POST' }),

  // Saved posts (bookmarks)
  savePost: (postId: string) =>
    fetchWithAuth(`/api/v1/posts/${postId}/save`, { method: 'POST' }),
  unsavePost: (postId: string) =>
    fetchWithAuth(`/api/v1/posts/${postId}/save`, { method: 'DELETE' }),
  // ── Passport ──────────────────────────────────────────────────
  getPassport: (handle: string) =>
    fetchWithAuth(`/api/v1/users/by-handle/${encodeURIComponent(handle)}`),
  checkHandle: (h: string) =>
    fetchWithAuth(`/api/v1/users/handle-available?h=${encodeURIComponent(h)}`),
  getPassportOgUrl: (handle: string, version?: string | number) => {
    const v = version ? `?v=${encodeURIComponent(String(version))}` : '';
    return `/api/v1/users/by-handle/${encodeURIComponent(handle)}/og.png${v}`;
  },
  seedPassport: (draft: { visitedCities?: string[]; interests?: string[] }) =>
    fetchWithAuth('/api/v1/users/me/seed', {
      method: 'POST',
      body: JSON.stringify(draft),
    }),
  getTripsByHandle: (handle: string) =>
    fetchWithAuth(`/api/v1/trips/by-handle/${encodeURIComponent(handle)}`),
  getReviewsByHandle: (handle: string) =>
    fetchWithAuth(`/api/v1/reviews/by-handle/${encodeURIComponent(handle)}`),
  getSavesByHandle: (handle: string, params?: { page?: number; limit?: number }) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return fetchWithAuth(`/api/v1/posts/saved-by-handle/${encodeURIComponent(handle)}${qs}`);
  },
  followHandle: (handle: string) =>
    fetchWithAuth(`/api/v1/users/by-handle/${encodeURIComponent(handle)}/follow`, { method: 'POST' }),
  unfollowHandle: (handle: string) =>
    fetchWithAuth(`/api/v1/users/by-handle/${encodeURIComponent(handle)}/unfollow`, { method: 'POST' }),
  listFollowers: (handle: string, limit = 50) =>
    fetchWithAuth(`/api/v1/users/by-handle/${encodeURIComponent(handle)}/followers?limit=${limit}`),
  listFollowing: (handle: string, limit = 50) =>
    fetchWithAuth(`/api/v1/users/by-handle/${encodeURIComponent(handle)}/following?limit=${limit}`),
  endorseHandle: (handle: string, topic: string) =>
    fetchWithAuth(`/api/v1/users/by-handle/${encodeURIComponent(handle)}/endorse`, {
      method: 'POST',
      body: JSON.stringify({ topic }),
    }),
  unendorseHandle: (handle: string, topic: string) =>
    fetchWithAuth(`/api/v1/users/by-handle/${encodeURIComponent(handle)}/unendorse`, {
      method: 'POST',
      body: JSON.stringify({ topic }),
    }),
  listEndorsements: (handle: string) =>
    fetchWithAuth(`/api/v1/users/by-handle/${encodeURIComponent(handle)}/endorsements`),
  applyLocalGuide: () =>
    fetchWithAuth('/api/v1/users/me/apply-local-guide', { method: 'POST' }),
  getFollowingActivity: (limit = 20) =>
    fetchWithAuth(`/api/v1/users/me/activity-feed?limit=${limit}`)
      .catch(() => [] as any[]),
  getGlobalActivity: (limit = 20) =>
    fetchWithAuth(`/api/v1/users/activity-feed/global?limit=${limit}`)
      .catch(() => [] as any[]),
  searchUsers: (q: string, limit = 12) =>
    fetchWithAuth(`/api/v1/users/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  // Billing / Pro Traveler tier
  getMyPlan: () => fetchWithAuth('/api/v1/billing/me'),
  getPlans: () => fetchWithAuth('/api/v1/billing/plans'),
  /** Card checkout → returns { url, mock }. Redirect to url (Stripe hosted or mock success). */
  startCheckout: (plan: 'premium' | 'business', cycle: 'monthly' | 'yearly' = 'monthly') =>
    fetchWithAuth('/api/v1/billing/checkout', { method: 'POST', body: JSON.stringify({ plan, cycle }) }),
  /** Flouci (local TND) checkout → returns { url, mock }. Redirect to url. */
  startFlouciCheckout: (plan: 'premium' | 'business', cycle: 'monthly' | 'yearly' = 'monthly') =>
    fetchWithAuth('/api/v1/billing/flouci/checkout', { method: 'POST', body: JSON.stringify({ plan, cycle }) }),
  /** Manual bank/cash → pending subscription an admin confirms later. */
  manualUpgrade: (plan: 'premium' | 'business', cycle: 'monthly' | 'yearly', method: 'bank' | 'cash') =>
    fetchWithAuth('/api/v1/billing/upgrade', { method: 'POST', body: JSON.stringify({ plan, cycle, method }) }),
  /** Pay for a plan from the credit wallet → activates instantly. Throws 400 (code
   *  insufficient_credits) when the balance is short. */
  payWithCredits: (plan: 'premium' | 'business', cycle: 'monthly' | 'yearly') =>
    fetchWithAuth('/api/v1/billing/pay-with-credits', { method: 'POST', body: JSON.stringify({ plan, cycle }) }),
  /** Open the Stripe billing portal → returns { url }. */
  openBillingPortal: () => fetchWithAuth('/api/v1/billing/portal', { method: 'POST' }),
  cancelPlan: () => fetchWithAuth('/api/v1/billing/cancel', { method: 'POST' }),

  // Public trip discovery
  getTripsDiscover: (params?: { sort?: 'popular' | 'new'; limit?: number; city?: string }) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)]),
    ).toString() : '';
    return fetchWithAuth(`/api/v1/trips/discover${qs}`);
  },

  listSavedPosts: (params?: { page?: number; limit?: number }) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return fetchWithAuth(`/api/v1/posts/saved${qs}`);
  },

  // Tips
  getTips: () => fetchWithAuth('/api/v1/tips'),
  addTip: (data: { title: string; content: string; category: string }) =>
    fetchWithAuth('/api/v1/tips', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  likeTip: (id: string) => fetchWithAuth(`/api/v1/tips/${id}/like`, { method: 'POST' }),

  // Events
  getEvents: () => fetchWithAuth('/api/v1/events'),
  attendEvent: (id: string) => fetchWithAuth(`/api/v1/events/${id}/attend`, { method: 'POST' }),

  // Itineraries
  getItineraries: () => fetchWithAuth('/api/v1/itineraries'),

  // Collections
  getCollections: () => fetchWithAuth('/api/v1/collections'),

  // Sponsors
  getSponsors: () => fetchWithAuth('/api/v1/sponsors'),
  clickSponsor: (id: string) => fetchWithAuth(`/api/v1/sponsors/${id}/click`, { method: 'POST' }),

  // Ads
  getAds: () => fetchWithAuth('/api/v1/ads'),
  trackAdImpression: (id: string) => fetchWithAuth(`/api/v1/ads/${id}/impression`, { method: 'POST' }),
  trackAdClick: (id: string) => fetchWithAuth(`/api/v1/ads/${id}/click`, { method: 'POST' }),

  // Gamification
  getBadges: () => fetchWithAuth('/api/v1/gamification/badges'),
  getMyBadges: () => fetchWithAuth('/api/v1/gamification/my-badges'),
  getMyPoints: () => fetchWithAuth('/api/v1/gamification/my-points'),
  getMyRank: () => fetchWithAuth('/api/v1/gamification/my-rank'),
  getLeaderboard: () => fetchWithAuth('/api/v1/gamification/leaderboard'),

  // Notifications
  getNotifications: () => fetchWithAuth('/api/v1/notifications'),
  getUnreadCount: () => fetchWithAuth('/api/v1/notifications/unread-count'),
  markNotificationRead: (id: string) =>
    fetchWithAuth(`/api/v1/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => fetchWithAuth('/api/v1/notifications/read-all', { method: 'PATCH' }),

  // Subscriptions
  getMySubscription: () => fetchWithAuth('/api/v1/subscriptions/my'),
  upgradePlan: (plan: string, paymentMethod: string) =>
    fetchWithAuth('/api/v1/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan, paymentMethod }),
    }),

  // Bookings
  createBooking: (data: {
    placeId: string;
    itemId: string;
    type: 'hotel' | 'tour' | 'experience' | 'event' | 'restaurant';
    checkIn: string;
    checkOut?: string;
    guests: number;
    addons?: { name: string; price: number; quantity: number }[];
    specialRequests?: string;
  }) => fetchWithAuth('/api/v1/bookings', { method: 'POST', body: JSON.stringify(data) }),

  getMyBookings: () => fetchWithAuth('/api/v1/bookings/my'),

  // Password reset
  requestPasswordReset: (email: string) =>
    fetchWithAuth('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    fetchWithAuth('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),

  // Reposts
  repostPost: (postId: string, comment?: string) =>
    fetchWithAuth(`/api/v1/posts/${postId}/repost`, { method: 'POST', body: JSON.stringify({ comment }) }),
  undoRepost: (postId: string) =>
    fetchWithAuth(`/api/v1/posts/${postId}/repost`, { method: 'DELETE' }),

  // Search
  search: (q: string, limit?: number) =>
    fetchWithAuth(`/api/v1/search?q=${encodeURIComponent(q)}&limit=${limit || 20}`),

  // Push notifications
  subscribePush: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    fetchWithAuth('/api/v1/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription }) }),
  unsubscribePush: (endpoint: string) =>
    fetchWithAuth('/api/v1/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) }),

  // Contact
  sendContact: (data: Record<string, string>) =>
    fetchWithAuth('/api/v1/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

/**
 * Upload a raw File (image or video) as multipart/form-data → returns the hosted URL.
 * Used by the reel composer: videos are too large to base64-inline, so we stream the
 * binary straight to MinIO via the backend. Throws ApiError on failure so callers can
 * surface a toast.
 */
export async function uploadMedia(file: File, folder = 'uploads'): Promise<string> {
  const token = localStorage.getItem('etunisia_token');
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);

  const headers: Record<string, string> = {};
  // Do NOT set Content-Type — the browser must add the multipart boundary itself.
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (/\.ngrok(-free)?\.(app|dev|io)/.test(API_BASE)) headers['ngrok-skip-browser-warning'] = '1';

  const res = await fetch(`${API_BASE}/api/v1/media/upload`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) {
    let msg = `Upload failed (HTTP ${res.status})`;
    try { const e = await res.json(); msg = e?.error?.message || e?.message || msg; } catch {}
    throw new ApiError(res.status, msg);
  }
  const json = await res.json();
  // Unwrap the { success, data } envelope; the controller payload carries `url`.
  const payload = (json && typeof json === 'object' && 'data' in json) ? json.data : json;
  const url = payload?.url;
  if (!url) throw new ApiError(500, 'Upload succeeded but no URL was returned');
  return url;
}

export function getImageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) return `${API_BASE}${path}`;
  return path;
}

export { ApiError };
