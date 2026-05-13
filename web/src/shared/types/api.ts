export interface Place {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  governorate: string;
  latitude: number;
  longitude: number;
  images: string[];
  coverImage?: string;
  videoUrl?: string;
  website?: string;
  phone?: string;
  openingHours?: string;
  priceRange?: string;
  rating: number;
  reviewCount: number;
  viewCount: number;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isBoosted: boolean;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  description?: string;
  icon: string;
  image?: string;
  color: string;
  sortOrder: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  images: string[];
  userId: string;
  placeId: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    avatar?: string;
  };
}

export interface Post {
  id: string;
  title: string;
  body: string;
  category: string;
  location?: string;
  images: string[];
  authorId: string;
  author?: {
    id: string;
    fullName: string;
    avatar?: string;
  };
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  placeId?: string;
  startDate: string;
  endDate?: string;
  category: string;
  price?: number;
  currency: string;
  isFree: boolean;
  isOnline: boolean;
  location?: string;
  attendeeCount: number;
}

export interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  coverImage?: string;
  authorId: string;
  likes: number;
}

export interface Itinerary {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  days: ItineraryDay[];
  placeIds: string[];
  duration: number;
  difficulty: string;
  authorId: string;
  isPublic: boolean;
  isPremium: boolean;
  likeCount: number;
  viewCount: number;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  places: string[];
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  ownerId: string;
  placeIds: string[];
  isPublic: boolean;
  isPremium: boolean;
  likeCount: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  pointsRequired: number;
  requirement: string;
}

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  avatar?: string;
  points: number;
  level: number;
  rank: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
