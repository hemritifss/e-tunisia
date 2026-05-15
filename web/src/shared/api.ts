// VITE_API_URL is treated as host-only here (endpoints below already include /api/v1).
// If user set it WITH /api/v1, strip it so we don't double up.
const RAW = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const API_BASE = RAW.replace(/\/api\/v\d+$/, '');

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
    // Skip ngrok free-tier browser interstitial on GET requests
    'ngrok-skip-browser-warning': '1',
    ...((options.headers as Record<string, string>) || {}),
  };

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
    throw new ApiError(
      response.status,
      errorData.message || `HTTP ${response.status}`,
      errorData.details,
    );
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
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

  // Favorites
  toggleFavorite: (placeId: string) =>
    fetchWithAuth(`/api/v1/users/favorites/${placeId}`, { method: 'POST' }),

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
