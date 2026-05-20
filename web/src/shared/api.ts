// VITE_API_URL accepts either a full URL or empty (= same-origin, recommended).
// Endpoints below include /api/v1, so we strip it from the env if user added one.
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

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
): Promise<any> {
  const token = localStorage.getItem('etunisia_token');
  const url = `${API_BASE}${endpoint}`;

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
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Ignore parse errors
    }
    // Backend wraps errors as { success: false, error: { message, details }, ... }.
    const err = errorData?.error ?? errorData;
    throw new ApiError(
      response.status,
      err?.message || `HTTP ${response.status}`,
      err?.details,
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

  // Credits & donations
  getMyCredits: () => fetchWithAuth('/api/v1/credits/me'),
  depositCredits: (amount: number, note?: string) =>
    fetchWithAuth('/api/v1/credits/deposit', { method: 'POST', body: JSON.stringify({ amount, note }) }),
  donate: (data: { target: 'user' | 'platform'; toUserId?: string; amount: number; message?: string; isAnonymous?: boolean }) =>
    fetchWithAuth('/api/v1/credits/donate', { method: 'POST', body: JSON.stringify(data) }),
  getMyDonationsSent: () => fetchWithAuth('/api/v1/credits/donations/sent'),
  getMyDonationsReceived: () => fetchWithAuth('/api/v1/credits/donations/received'),
  getDonationLeaderboard: () => fetchWithAuth('/api/v1/credits/leaderboard'),

  // Posts (user-authored)
  createPost: (data: {
    title: string; body: string; category?: string;
    location?: string; placeId?: string; images?: string[]; tags?: string[];
  }) =>
    fetchWithAuth('/api/v1/posts', { method: 'POST', body: JSON.stringify(data) }),
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

  // Contact
  sendContact: (data: Record<string, string>) =>
    fetchWithAuth('/api/v1/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export function getImageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) return `${API_BASE}${path}`;
  return path;
}

export { ApiError };
