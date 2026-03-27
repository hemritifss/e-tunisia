// ============================================
// MOCK DATA
// Realistic Tunisian tourism content
// ============================================

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  image?: string;
  category: string;
  categoryClass: string;
  author: { name: string; avatar: string; level: number };
  votes: number;
  userVote: number; // -1, 0, 1
  commentCount: number;
  timeAgo: string;
  location?: string;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  categoryClass: string;
  image: string;
  location: string;
  rating: number;
  reviewCount: number;
  saved: boolean;
  description: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  month: string;
  day: string;
  location: string;
  time: string;
  attendees: number;
  category: string;
}

export interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  categoryClass: string;
  author: { name: string; avatar: string };
  likes: number;
  liked: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  category: string;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  level: number;
}

export const categories = [
  { id: 'all', name: 'All', class: '' },
  { id: 'beaches', name: 'Beaches', class: 'cat-beaches' },
  { id: 'historical', name: 'Historical', class: 'cat-historical' },
  { id: 'food', name: 'Food & Drink', class: 'cat-food' },
  { id: 'nature', name: 'Nature', class: 'cat-nature' },
  { id: 'culture', name: 'Culture', class: 'cat-culture' },
  { id: 'adventure', name: 'Adventure', class: 'cat-adventure' },
];

export const posts: Post[] = [
  {
    id: '1',
    title: 'Sidi Bou Said: The most photogenic village in all of North Africa',
    excerpt: 'Wandered through the blue-and-white streets of Sidi Bou Said at golden hour. The contrast of Mediterranean blue doors against whitewashed walls is unlike anything I\'ve seen in my travels across 40 countries.',
    body: 'Wandered through the blue-and-white streets of Sidi Bou Said at golden hour. The contrast of Mediterranean blue doors against whitewashed walls is unlike anything I\'ve seen in my travels across 40 countries. The Cafe des Nattes has been serving mint tea since 1700 and the view from there across the Gulf of Tunis is absolutely stunning.',
    image: 'https://images.unsplash.com/photo-1726428977623-39f687724a40?w=800&q=80',
    category: 'Culture',
    categoryClass: 'cat-culture',
    author: { name: 'Sarah Chen', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=sarah', level: 7 },
    votes: 342,
    userVote: 0,
    commentCount: 47,
    timeAgo: '4h ago',
    location: 'Sidi Bou Said, Tunis',
  },
  {
    id: '2',
    title: 'Survived a night under the Sahara stars in Douz - here\'s what to expect',
    excerpt: 'Booked a desert camp experience in Douz and it was the highlight of my entire trip. The silence of the Sahara at night is otherworldly. No light pollution, just pure starfield. Here\'s everything you need to know before booking.',
    body: 'Booked a desert camp experience in Douz and it was the highlight of my entire trip. The silence of the Sahara at night is otherworldly.',
    image: 'https://images.unsplash.com/photo-1689742855019-a09e208930e8?w=800&q=80',
    category: 'Adventure',
    categoryClass: 'cat-adventure',
    author: { name: 'Marco Rossi', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=marco', level: 5 },
    votes: 289,
    userVote: 1,
    commentCount: 63,
    timeAgo: '6h ago',
    location: 'Douz, Tozeur',
  },
  {
    id: '3',
    title: 'The ultimate Tunisian street food tour: 12 dishes you can\'t miss',
    excerpt: 'After spending 3 weeks eating my way through Tunisia, here are the must-try street foods ranked. From brik to lablabi, fricasse to bambalouni, this list has been taste-tested across multiple cities.',
    body: 'After spending 3 weeks eating my way through Tunisia, here are the must-try street foods ranked.',
    image: 'https://images.unsplash.com/photo-1742806418170-f051cb880314?w=800&q=80',
    category: 'Food & Drink',
    categoryClass: 'cat-food',
    author: { name: 'Yasmine Khelil', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=yasmine', level: 9 },
    votes: 456,
    userVote: 0,
    commentCount: 89,
    timeAgo: '8h ago',
    location: 'Tunis Medina',
  },
  {
    id: '4',
    title: 'Carthage ruins at sunrise - absolutely zero crowds',
    excerpt: 'Pro tip: arrive at the Carthage archaeological site right when it opens at 8 AM. You will have the entire Antonine Baths and the Byrsa Hill to yourself for at least an hour. The morning light on the ancient stones is magical.',
    body: 'Pro tip: arrive at the Carthage archaeological site right when it opens at 8 AM.',
    image: 'https://images.unsplash.com/photo-1770712857881-2133f72fcab7?w=800&q=80',
    category: 'Historical',
    categoryClass: 'cat-historical',
    author: { name: 'David Park', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=david', level: 4 },
    votes: 198,
    userVote: 0,
    commentCount: 32,
    timeAgo: '12h ago',
    location: 'Carthage, Tunis',
  },
  {
    id: '5',
    title: 'Djerba Island: the hidden gem that rivals Greek islands',
    excerpt: 'Spent a week on Djerba and I\'m convinced this is one of the most underrated islands in the Mediterranean. Crystal-clear water, ancient synagogue, incredible seafood, and a fraction of the price of Santorini.',
    body: 'Spent a week on Djerba and I\'m convinced this is one of the most underrated islands in the Mediterranean.',
    image: 'https://images.unsplash.com/photo-1598554200951-b9f36526ecd9?w=800&q=80',
    category: 'Beaches',
    categoryClass: 'cat-beaches',
    author: { name: 'Emma Laurent', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=emma', level: 6 },
    votes: 267,
    userVote: 0,
    commentCount: 41,
    timeAgo: '1d ago',
    location: 'Djerba, Medenine',
  },
  {
    id: '6',
    title: 'Ichkeul National Park: bird watching in a UNESCO World Heritage Site',
    excerpt: 'Visited Ichkeul in December during migration season. Thousands of flamingos, ducks, and geese against the backdrop of Mount Ichkeul. A completely different side of Tunisia that most tourists miss.',
    body: 'Visited Ichkeul in December during migration season.',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
    category: 'Nature',
    // Ichkeul - keeping generic nature image as no specific Unsplash exists
    categoryClass: 'cat-nature',
    author: { name: 'Amina Trabelsi', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=amina', level: 8 },
    votes: 145,
    userVote: 0,
    commentCount: 19,
    timeAgo: '1d ago',
    location: 'Ichkeul, Bizerte',
  },
];

// In-memory store for user-created posts
export function addUserPost(post: Post) {
  posts.unshift(post);
}

export function generateId(): string {
  return 'user-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const places: Place[] = [
  {
    id: '1',
    name: 'Sidi Bou Said',
    category: 'Culture',
    categoryClass: 'cat-culture',
    image: 'https://images.unsplash.com/photo-1680600855512-441b69ef3d18?w=600&q=80',
    location: 'Tunis Governorate',
    rating: 4.8,
    reviewCount: 1247,
    saved: true,
    description: 'Iconic blue-and-white clifftop village overlooking the Gulf of Tunis',
  },
  {
    id: '2',
    name: 'Carthage Archaeological Site',
    category: 'Historical',
    categoryClass: 'cat-historical',
    image: 'https://images.unsplash.com/photo-1770712857881-2133f72fcab7?w=600&q=80',
    location: 'Tunis Governorate',
    rating: 4.6,
    reviewCount: 892,
    saved: false,
    description: 'Ancient Phoenician city and UNESCO World Heritage Site',
  },
  {
    id: '3',
    name: 'Djerba Island',
    category: 'Beaches',
    categoryClass: 'cat-beaches',
    image: 'https://images.unsplash.com/photo-1598554200951-b9f36526ecd9?w=600&q=80',
    location: 'Medenine Governorate',
    rating: 4.7,
    reviewCount: 1056,
    saved: false,
    description: 'Largest island in North Africa with stunning beaches and rich culture',
  },
  {
    id: '4',
    name: 'Medina of Tunis',
    category: 'Culture',
    categoryClass: 'cat-culture',
    image: 'https://images.unsplash.com/photo-1677942269665-1a08bf81d362?w=600&q=80',
    location: 'Tunis',
    rating: 4.5,
    reviewCount: 789,
    saved: false,
    description: 'UNESCO-listed medieval medina with vibrant souks and historic mosques',
  },
  {
    id: '5',
    name: 'Sahara Desert - Douz',
    category: 'Adventure',
    categoryClass: 'cat-adventure',
    image: 'https://images.unsplash.com/photo-1689742855019-a09e208930e8?w=600&q=80',
    location: 'Tozeur Governorate',
    rating: 4.9,
    reviewCount: 634,
    saved: true,
    description: 'Gateway to the Sahara with camel treks, desert camps, and star-lit nights',
  },
  {
    id: '6',
    name: 'El Jem Amphitheatre',
    category: 'Historical',
    categoryClass: 'cat-historical',
    image: 'https://images.unsplash.com/photo-1611094184403-df84cdcc7523?w=600&q=80',
    location: 'Mahdia Governorate',
    rating: 4.7,
    reviewCount: 567,
    saved: false,
    description: 'Third-largest Roman amphitheatre in the world, remarkably preserved',
  },
  {
    id: '7',
    name: 'Tabarka',
    category: 'Nature',
    categoryClass: 'cat-nature',
    image: 'https://images.unsplash.com/photo-1653173449794-09b4ec96a17f?w=600&q=80',
    location: 'Jendouba Governorate',
    rating: 4.4,
    reviewCount: 342,
    saved: false,
    description: 'Coral coast town with pine forests, diving spots, and Genoese fort',
  },
  {
    id: '8',
    name: 'Sousse Medina',
    category: 'Culture',
    categoryClass: 'cat-culture',
    image: 'https://images.unsplash.com/photo-1665083766545-a5b0b11fc4f3?w=600&q=80',
    location: 'Sousse Governorate',
    rating: 4.3,
    reviewCount: 456,
    saved: false,
    description: 'Fortified old town with the iconic Ribat and bustling markets',
  },
];

export const events: Event[] = [
  {
    id: '5',
    title: 'Medina Heritage Walking Tour',
    date: '2026-04-02',
    month: 'APR',
    day: '02',
    location: 'Tunis Medina',
    time: '9:00 AM',
    attendees: 20,
    category: 'Cultural',
  },
  {
    id: '3',
    title: 'Sahara Sunrise Yoga Retreat',
    date: '2026-04-10',
    month: 'APR',
    day: '10',
    location: 'Douz Desert Camp',
    time: '5:30 AM',
    attendees: 45,
    category: 'Wellness',
  },
  {
    id: '4',
    title: 'Tunisian Olive Oil Tasting Tour',
    date: '2026-05-05',
    month: 'MAY',
    day: '05',
    location: 'Sfax Region',
    time: '2:00 PM',
    attendees: 30,
    category: 'Food & Drink',
  },
  {
    id: '2',
    title: 'Djerba Street Art Festival',
    date: '2026-06-20',
    month: 'JUN',
    day: '20',
    location: 'Erriadh Village, Djerba',
    time: '10:00 AM',
    attendees: 800,
    category: 'Art',
  },
  {
    id: '1',
    title: 'Carthage International Festival',
    date: '2026-07-15',
    month: 'JUL',
    day: '15',
    location: 'Carthage Roman Theatre',
    time: '9:00 PM',
    attendees: 2500,
    category: 'Music & Arts',
  },
  {
    id: '6',
    title: 'Tabarka Jazz Festival',
    date: '2026-08-01',
    month: 'AUG',
    day: '01',
    location: 'Tabarka',
    time: '8:00 PM',
    attendees: 1200,
    category: 'Music & Arts',
  },
];

export const tips: Tip[] = [
  {
    id: '1',
    title: 'Bargaining etiquette in the Medina',
    content: 'Always start at about 40% of the asking price and work your way up. Shopkeepers expect and enjoy the negotiation process. Smile, be friendly, and don\'t be afraid to walk away - they will often call you back with a better price. Never bargain if you don\'t intend to buy.',
    category: 'Cultural',
    categoryClass: 'cultural',
    author: { name: 'Karim Mansour', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=karim' },
    likes: 234,
    liked: false,
  },
  {
    id: '2',
    title: 'Best SIM card options for tourists',
    content: 'Ooredoo and Tunisie Telecom both offer tourist SIM cards at the airport. Ooredoo\'s "Haya" plan gives you 20GB for about 20 TND (around 6 USD). Coverage is excellent in cities but can be patchy in the deep south.',
    category: 'Transport',
    categoryClass: 'transport',
    author: { name: 'Julia Weber', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=julia' },
    likes: 189,
    liked: true,
  },
  {
    id: '3',
    title: 'The Tunisian Dinar: cash is still king',
    content: 'While larger hotels and restaurants accept cards, most souks, taxis, and smaller restaurants are cash-only. ATMs are widely available in cities. The Dinar cannot be exchanged outside Tunisia, so only convert what you need.',
    category: 'Money',
    categoryClass: 'money',
    author: { name: 'Ahmed Ben Ali', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Tunisia' },
    likes: 156,
    liked: false,
  },
  {
    id: '4',
    title: 'Stay safe: avoid unlicensed taxis',
    content: 'Only use yellow taxis with meters or arrange transport through your hotel. Ride-sharing apps work in Tunis (Bolt is popular). For intercity travel, louages (shared minivans) are cheap and frequent but agree on price before boarding.',
    category: 'Safety',
    categoryClass: 'safety',
    author: { name: 'Nadia Khelifi', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=nadia' },
    likes: 312,
    liked: false,
  },
  {
    id: '5',
    title: 'Must-try: Lablabi for breakfast',
    content: 'Lablabi is a hearty chickpea soup served with torn bread, olive oil, harissa, tuna, and a poached egg. It\'s the ultimate Tunisian breakfast, especially in winter. Find the best bowls in the Medina of Tunis for about 3-5 TND.',
    category: 'Food',
    categoryClass: 'food',
    author: { name: 'Fatma Chaari', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=fatma' },
    likes: 278,
    liked: false,
  },
  {
    id: '6',
    title: 'Ramadan travel: what to expect',
    content: 'If visiting during Ramadan, be respectful by not eating or drinking in public during daytime. Many restaurants close during the day but open after sunset for iftar. It\'s a beautiful time to experience Tunisian culture and hospitality.',
    category: 'Cultural',
    categoryClass: 'cultural',
    author: { name: 'Omar Jebali', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=omar' },
    likes: 167,
    liked: false,
  },
];

export const badges: Badge[] = [
  { id: '1', name: 'First Steps', description: 'Create your account and complete your profile', icon: 'lucide-footprints', earned: true, category: 'Getting Started' },
  { id: '2', name: 'Explorer', description: 'Visit 5 different places', icon: 'lucide-compass', earned: true, category: 'Exploration' },
  { id: '3', name: 'Storyteller', description: 'Write your first review', icon: 'lucide-pencil', earned: true, category: 'Community' },
  { id: '4', name: 'Adventurer', description: 'Visit 10 places across 3 governorates', icon: 'lucide-mountain', earned: false, category: 'Exploration' },
  { id: '5', name: 'Local Expert', description: 'Share 10 travel tips', icon: 'lucide-lightbulb', earned: false, category: 'Community' },
  { id: '6', name: 'Photographer', description: 'Upload 20 photos with reviews', icon: 'lucide-camera', earned: true, category: 'Content' },
  { id: '7', name: 'Social Butterfly', description: 'Comment on 25 posts', icon: 'lucide-message-circle', earned: false, category: 'Community' },
  { id: '8', name: 'Sahara Trekker', description: 'Visit any desert destination', icon: 'lucide-sun', earned: true, category: 'Exploration' },
  { id: '9', name: 'History Buff', description: 'Visit 5 historical sites', icon: 'lucide-landmark', earned: false, category: 'Exploration' },
  { id: '10', name: 'Food Critic', description: 'Review 10 restaurants or food spots', icon: 'lucide-utensils', earned: false, category: 'Content' },
];

export const leaderboard: LeaderboardUser[] = [
  { rank: 1, name: 'Yasmine Khelil', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=yasmine', points: 9450, level: 9 },
  { rank: 2, name: 'Amina Trabelsi', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=amina', points: 7800, level: 8 },
  { rank: 3, name: 'Sarah Chen', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=sarah', points: 6200, level: 7 },
  { rank: 4, name: 'Emma Laurent', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=emma', points: 4800, level: 6 },
  { rank: 5, name: 'Marco Rossi', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=marco', points: 3200, level: 5 },
  { rank: 6, name: 'Ahmed Ben Ali', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Tunisia', points: 2800, level: 5 },
  { rank: 7, name: 'David Park', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=david', points: 2100, level: 4 },
  { rank: 8, name: 'Karim Mansour', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=karim', points: 1800, level: 4 },
  { rank: 9, name: 'Julia Weber', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=julia', points: 1400, level: 3 },
  { rank: 10, name: 'Nadia Khelifi', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=nadia', points: 1100, level: 3 },
];

export const comments = [
  {
    id: '1',
    author: 'Marco Rossi',
    avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=marco',
    text: 'Incredible photos! I visited last summer and the sunset from Cafe des Nattes was one of the most beautiful things I\'ve ever seen. Make sure to try the bambalouni from the vendor near the entrance.',
    timeAgo: '2h ago',
    votes: 24,
  },
  {
    id: '2',
    author: 'Yasmine Khelil',
    avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=yasmine',
    text: 'As a Tunisian, I\'m always happy to see foreign visitors appreciating Sidi Bou Said. If you want to avoid the tourist crowds, try visiting on a weekday morning. The light is magical around 7-8 AM.',
    timeAgo: '3h ago',
    votes: 41,
  },
  {
    id: '3',
    author: 'David Park',
    avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=david',
    text: 'How walkable is it? I have some mobility issues and was wondering about the terrain.',
    timeAgo: '4h ago',
    votes: 8,
  },
  {
    id: '4',
    author: 'Sarah Chen',
    avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=sarah',
    text: 'Great question. The main street is fairly flat but some side alleys have steep steps. The Cafe des Nattes itself requires climbing quite a few stairs. There are some accessible routes though.',
    timeAgo: '4h ago',
    votes: 15,
  },
];
