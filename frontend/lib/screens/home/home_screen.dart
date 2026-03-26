import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../providers/places_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/community_provider.dart';
import '../../models/place.dart';
import '../../models/category.dart';
import '../../widgets/place_card.dart';
import '../../widgets/category_chip.dart';
import '../../widgets/shimmer_loading.dart';
import '../detail/place_detail_screen.dart';
import '../search/search_screen.dart';
import '../events/events_screen.dart';
import '../tips/tips_screen.dart';
import '../itineraries/itineraries_screen.dart';
import '../nearby/nearby_screen.dart';
import '../collections/collections_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<PlacesProvider>().loadHomeData();
      context.read<CommunityProvider>().loadCommunityData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final places = context.watch<PlacesProvider>();
    final community = context.watch<CommunityProvider>();
    final auth = context.watch<AuthProvider>();
    final userName = auth.user?.fullName.split(' ').first ?? 'Explorer';

    return Scaffold(
      body: places.isLoading
          ? const HomeShimmer()
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async {
                await places.loadHomeData();
                await community.loadCommunityData();
              },
              child: CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  // ─── HEADER ─────────────────────────
                  SliverToBoxAdapter(
                    child: SafeArea(
                      bottom: false,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Hello, $userName! 👋',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyLarge
                                        ?.copyWith(
                                            color: AppColors.textSecondary),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Discover Tunisia',
                                    style: Theme.of(context)
                                        .textTheme
                                        .headlineLarge,
                                  ),
                                ],
                              ),
                            ),
                            GestureDetector(
                              onTap: () {},
                              child: Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  border:
                                      Border.all(color: AppColors.divider),
                                ),
                                child: const Icon(
                                  Icons.notifications_none_rounded,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                          ],
                        ).animate().fadeIn(duration: 500.ms),
                      ),
                    ),
                  ),

                  // ─── SEARCH BAR ──────────────────────
                  SliverToBoxAdapter(
                    child: GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const SearchScreen()),
                      ),
                      child: Container(
                        margin: const EdgeInsets.fromLTRB(24, 20, 24, 0),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 16),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: AppColors.divider),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 20,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.search_rounded,
                                color: AppColors.textLight, size: 22),
                            const SizedBox(width: 12),
                            Text(
                              'Search places, cities, food...',
                              style: TextStyle(
                                color: AppColors.textLight,
                                fontSize: 15,
                              ),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.tune_rounded,
                                  color: AppColors.primary, size: 18),
                            ),
                          ],
                        ),
                      ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),
                    ),
                  ),

                  // ─── QUICK ACTIONS ─────────────────────
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 20, 24, 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _QuickAction(
                            icon: Icons.event_rounded,
                            label: 'Events',
                            color: const Color(0xFF6C5CE7),
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EventsScreen())),
                          ),
                          _QuickAction(
                            icon: Icons.lightbulb_rounded,
                            label: 'Tips',
                            color: AppColors.accent,
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TipsScreen())),
                          ),
                          _QuickAction(
                            icon: Icons.alt_route_rounded,
                            label: 'Trips',
                            color: AppColors.success,
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ItinerariesScreen())),
                          ),
                          _QuickAction(
                            icon: Icons.near_me_rounded,
                            label: 'Nearby',
                            color: AppColors.secondary,
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NearbyScreen())),
                          ),
                        ],
                      ).animate().fadeIn(delay: 250.ms).slideY(begin: 0.1),
                    ),
                  ),

                  // ─── 🔥 TRENDING NOW ──────────────────
                  SliverToBoxAdapter(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFFFF6B6B), Color(0xFFFF9F43)],
                                  ),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text('🔥', style: TextStyle(fontSize: 14)),
                                    SizedBox(width: 4),
                                    Text(
                                      'TRENDING',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 11,
                                        letterSpacing: 1.2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'Most popular right now',
                                style: TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (places.featured.isNotEmpty)
                          CarouselSlider.builder(
                            itemCount: places.featured.length,
                            options: CarouselOptions(
                              height: 260,
                              viewportFraction: 0.82,
                              enlargeCenterPage: true,
                              enlargeFactor: 0.2,
                              autoPlay: true,
                              autoPlayInterval: const Duration(seconds: 5),
                            ),
                            itemBuilder: (context, index, _) {
                              final place = places.featured[index];
                              return _FeaturedCard(
                                place: place,
                                onTap: () => _openPlace(context, place),
                              );
                            },
                          ),
                      ],
                    ),
                  ),

                  // ─── 📢 SPONSOR ZONE ──────────────────
                  SliverToBoxAdapter(
                    child: _SponsorZone(),
                  ),

                  // ─── 🗞️ ACTUALITIES ──────────────────
                  if (community.events.isNotEmpty)
                    SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
                            child: Row(
                              children: [
                                const Text('🗞️', style: TextStyle(fontSize: 18)),
                                const SizedBox(width: 8),
                                Text('Actualities', style: Theme.of(context).textTheme.headlineMedium),
                                const Spacer(),
                                TextButton(
                                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EventsScreen())),
                                  child: Text('See All', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(
                            height: 180,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              itemCount: community.events.length.clamp(0, 5),
                              itemBuilder: (context, i) {
                                final event = community.events[i];
                                return _ActualityCard(event: event)
                                    .animate()
                                    .fadeIn(delay: (i * 80).ms)
                                    .slideX(begin: 0.1);
                              },
                            ),
                          ),
                        ],
                      ),
                    ),

                  // ─── 📌 RECOMMENDATIONS ──────────────────
                  SliverToBoxAdapter(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(24, 24, 24, 4),
                          child: Row(
                            children: [
                              const Text('💎', style: TextStyle(fontSize: 18)),
                              const SizedBox(width: 8),
                              Text('Recommended for you', style: Theme.of(context).textTheme.headlineMedium),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(24, 0, 24, 12),
                          child: Text(
                            'Based on your interests and what\'s popular',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),

                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final place = places.popular[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: PlaceCard(
                              place: place,
                              onTap: () => _openPlace(context, place),
                              isFavorite: places.isFavorite(place.id),
                              onFavorite: () =>
                                  places.toggleFavorite(place.id),
                            ),
                          )
                              .animate()
                              .fadeIn(delay: (200 + index * 100).ms)
                              .slideY(begin: 0.1);
                        },
                        childCount: places.popular.length.clamp(0, 6),
                      ),
                    ),
                  ),

                  // ─── 📚 CURATED COLLECTIONS ──────────────────
                  if (community.collections.isNotEmpty)
                    SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(24, 8, 24, 12),
                            child: Row(
                              children: [
                                const Text('📚', style: TextStyle(fontSize: 18)),
                                const SizedBox(width: 8),
                                Text('Curated Collections', style: Theme.of(context).textTheme.headlineMedium),
                                const Spacer(),
                                TextButton(
                                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CollectionsScreen())),
                                  child: Text('See All', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(
                            height: 150,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              itemCount: community.collections.length,
                              itemBuilder: (context, i) {
                                final col = community.collections[i];
                                return _CollectionCard(collection: col)
                                    .animate()
                                    .fadeIn(delay: (i * 80).ms)
                                    .slideX(begin: 0.1);
                              },
                            ),
                          ),
                        ],
                      ),
                    ),

                  // ─── CATEGORIES ──────────────────
                  SliverToBoxAdapter(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                          child: _sectionHeader('Browse by Category', () {}),
                        ),
                        SizedBox(
                          height: 110,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            itemCount: places.categories.length,
                            itemBuilder: (context, i) {
                              return Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 6),
                                child: CategoryChip(
                                  category: places.categories[i],
                                  onTap: () {},
                                ),
                              )
                                  .animate()
                                  .fadeIn(delay: (300 + i * 80).ms)
                                  .slideX(begin: 0.2);
                            },
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ─── 💡 COMMUNITY TIPS ──────────────────
                  if (community.tips.isNotEmpty)
                    SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(24, 16, 24, 12),
                            child: Row(
                              children: [
                                const Text('💡', style: TextStyle(fontSize: 18)),
                                const SizedBox(width: 8),
                                Text('Community Tips', style: Theme.of(context).textTheme.headlineMedium),
                                const Spacer(),
                                TextButton(
                                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TipsScreen())),
                                  child: Text('See All', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ),
                          ),
                          ...community.tips.take(3).map((tip) => _TipCard(tip: tip)).toList(),
                        ],
                      ),
                    ),

                  const SliverToBoxAdapter(
                    child: SizedBox(height: 100),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _sectionHeader(String title, VoidCallback onSeeAll) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: Theme.of(context).textTheme.headlineMedium),
        TextButton(
          onPressed: onSeeAll,
          child: Text('See All',
              style: TextStyle(
                  color: AppColors.primary, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }

  void _openPlace(BuildContext context, Place place) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PlaceDetailScreen(placeId: place.id),
      ),
    );
  }
}

// ─── Sponsor Zone ────────────────────────────────────────
class _SponsorZone extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 24, 24, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2D3436), Color(0xFF636E72)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2D3436).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.accent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'SPONSORED',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  'Promote your business\nto thousands of travelers',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 17,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Reach tourists visiting Tunisia. Boost your restaurant, hotel, or experience.',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 12,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'Become a Partner →',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              Icons.campaign_rounded,
              color: AppColors.accent,
              size: 40,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1);
  }
}

// ─── Actuality Card ────────────────────────────────────────
class _ActualityCard extends StatelessWidget {
  final Map<String, dynamic> event;
  const _ActualityCard({required this.event});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.divider.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFF6C5CE7).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.event_rounded, color: Color(0xFF6C5CE7), size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        event['category']?.toString().toUpperCase() ?? 'EVENT',
                        style: TextStyle(
                          color: const Color(0xFF6C5CE7),
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.8,
                        ),
                      ),
                      Text(
                        event['location'] ?? '',
                        style: TextStyle(color: AppColors.textLight, fontSize: 11),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                if (event['isFree'] == true)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.success.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text('FREE', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w700, fontSize: 10)),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              event['title'] ?? '',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, height: 1.3),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),
            Row(
              children: [
                Icon(Icons.people_rounded, size: 14, color: AppColors.textLight),
                const SizedBox(width: 4),
                Text(
                  '${event['attendeeCount'] ?? 0} going',
                  style: TextStyle(color: AppColors.textLight, fontSize: 11, fontWeight: FontWeight.w600),
                ),
                const Spacer(),
                Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppColors.primary),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Collection Card ────────────────────────────────────────
class _CollectionCard extends StatelessWidget {
  final Map<String, dynamic> collection;
  const _CollectionCard({required this.collection});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (collection['coverImage'] != null)
              CachedNetworkImage(
                imageUrl: collection['coverImage'],
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(color: AppColors.shimmerBase),
                errorWidget: (_, __, ___) => Container(
                  decoration: const BoxDecoration(
                    gradient: AppColors.primaryGradient,
                  ),
                  child: const Icon(Icons.collections_rounded, color: Colors.white54, size: 32),
                ),
              )
            else
              Container(
                decoration: const BoxDecoration(
                  gradient: AppColors.primaryGradient,
                ),
                child: const Icon(Icons.collections_rounded, color: Colors.white54, size: 32),
              ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.black.withOpacity(0.7), Colors.transparent],
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                ),
              ),
            ),
            Positioned(
              bottom: 14,
              left: 14,
              right: 14,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    collection['title'] ?? '',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      height: 1.2,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.favorite_rounded, size: 12, color: Colors.white70),
                      const SizedBox(width: 4),
                      Text(
                        '${collection['likeCount'] ?? 0}',
                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Tip Card ────────────────────────────────────────────
class _TipCard extends StatelessWidget {
  final Map<String, dynamic> tip;
  const _TipCard({required this.tip});

  String _getCategoryEmoji() {
    switch (tip['category']) {
      case 'food': return '🍽️';
      case 'transport': return '🚐';
      case 'cultural': return '🕌';
      case 'safety': return '🛡️';
      case 'money': return '💰';
      default: return '💡';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 0, 24, 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider.withOpacity(0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_getCategoryEmoji(), style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tip['title'] ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  tip['content'] ?? '',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.favorite_rounded, size: 14, color: AppColors.error.withOpacity(0.5)),
                    const SizedBox(width: 4),
                    Text(
                      '${tip['likes'] ?? 0} likes',
                      style: TextStyle(color: AppColors.textLight, fontSize: 11),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        tip['category'] ?? 'general',
                        style: TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.05);
  }
}

// ─── Featured Card ────────────────────────────────────────
class _FeaturedCard extends StatelessWidget {
  final Place place;
  final VoidCallback onTap;

  const _FeaturedCard({required this.place, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Image
              CachedNetworkImage(
                imageUrl: place.displayImage,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                  color: AppColors.shimmerBase,
                ),
                errorWidget: (_, __, ___) => Container(
                  decoration: const BoxDecoration(
                    gradient: AppColors.primaryGradient,
                  ),
                  child: const Icon(Icons.landscape, color: Colors.white54, size: 60),
                ),
              ),

              // Gradient overlay
              Container(
                decoration: const BoxDecoration(
                  gradient: AppColors.cardOverlay,
                ),
              ),

              // Trending badge
              Positioned(
                top: 14,
                left: 14,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('🔥', style: TextStyle(fontSize: 11)),
                      SizedBox(width: 4),
                      Text(
                        'Trending',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Content
              Positioned(
                bottom: 20,
                left: 20,
                right: 20,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category tag
                    if (place.category != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          place.category!.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),

                    const SizedBox(height: 10),

                    Text(
                      place.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 8),

                    Row(
                      children: [
                        const Icon(Icons.location_on_rounded,
                            color: Colors.white70, size: 14),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            '${place.city}, ${place.governorate}',
                            style: const TextStyle(
                                color: Colors.white70, fontSize: 13),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Icon(Icons.star_rounded,
                            color: AppColors.accent, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          place.rating.toStringAsFixed(1),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Quick Action Button ──────────────────────────────────
class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}