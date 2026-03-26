import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:readmore/readmore.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/theme.dart';
import '../../providers/places_provider.dart';
import '../../models/place.dart';
import '../../widgets/glass_container.dart';

class PlaceDetailScreen extends StatefulWidget {
  final String placeId;

  const PlaceDetailScreen({super.key, required this.placeId});

  @override
  State<PlaceDetailScreen> createState() => _PlaceDetailScreenState();
}

class _PlaceDetailScreenState extends State<PlaceDetailScreen> {
  int _currentImageIndex = 0;

  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => context.read<PlacesProvider>().loadPlace(widget.placeId),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PlacesProvider>();
    final place = provider.selectedPlace;

    if (provider.isLoading || place == null) {
      return Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    final allImages = [
      if (place.coverImage != null) place.coverImage!,
      ...place.images,
    ].toSet().toList();

    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ─── HERO IMAGE SECTION ─────────────────
          SliverToBoxAdapter(
            child: SizedBox(
              height: 420,
              child: Stack(
                children: [
                  // Image PageView
                  PageView.builder(
                    itemCount: allImages.isEmpty ? 1 : allImages.length,
                    onPageChanged: (i) =>
                        setState(() => _currentImageIndex = i),
                    itemBuilder: (context, i) {
                      return CachedNetworkImage(
                        imageUrl: allImages.isNotEmpty
                            ? allImages[i]
                            : '',
                        fit: BoxFit.cover,
                        width: double.infinity,
                        placeholder: (_, __) =>
                            Container(color: AppColors.shimmerBase),
                        errorWidget: (_, __, ___) => Container(
                          decoration: const BoxDecoration(
                            gradient: AppColors.primaryGradient,
                          ),
                          child: const Icon(Icons.landscape,
                              color: Colors.white54, size: 80),
                        ),
                      );
                    },
                  ),

                  // Top gradient
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 120,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.black.withOpacity(0.5),
                            Colors.transparent,
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                  ),

                  // Bottom gradient
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 150,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.background,
                            AppColors.background.withOpacity(0),
                          ],
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                        ),
                      ),
                    ),
                  ),

                  // Back & Favorite buttons
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 8,
                    left: 16,
                    right: 16,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _circleButton(
                          Icons.arrow_back_ios_new_rounded,
                          () => Navigator.pop(context),
                        ),
                        Row(
                          children: [
                            _circleButton(
                              Icons.share_rounded,
                              () {},
                            ),
                            const SizedBox(width: 8),
                            _circleButton(
                              provider.isFavorite(place.id)
                                  ? Icons.favorite_rounded
                                  : Icons.favorite_border_rounded,
                              () => provider.toggleFavorite(place.id),
                              color: provider.isFavorite(place.id)
                                  ? AppColors.error
                                  : Colors.white,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Image indicator
                  if (allImages.length > 1)
                    Positioned(
                      bottom: 60,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          allImages.length,
                          (i) => AnimatedContainer(
                            duration: 300.ms,
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            width: i == _currentImageIndex ? 24 : 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: i == _currentImageIndex
                                  ? AppColors.primary
                                  : Colors.white54,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // ─── CONTENT ──────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top indicators row
                  Row(
                    children: [
                      if (place.category != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            place.category!.name,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ).animate().fadeIn(delay: 200.ms),
                      
                      const SizedBox(width: 8),

                      if (place.isBoosted)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Colors.orange, Colors.deepOrange],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.orange.withOpacity(0.4),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              )
                            ],
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.local_fire_department_rounded, color: Colors.white, size: 14),
                              SizedBox(width: 4),
                              Text(
                                'Sponsored',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ).animate().fadeIn(delay: 250.ms).slideX(),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Name
                  Text(
                    place.name,
                    style: Theme.of(context).textTheme.displayMedium,
                  ).animate().fadeIn(delay: 300.ms),

                  const SizedBox(height: 8),

                  // Location
                  Row(
                    children: [
                      Icon(Icons.location_on_rounded,
                          color: AppColors.primary, size: 18),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${place.address}, ${place.city}',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 400.ms),

                  const SizedBox(height: 20),

                  // Stats Row
                  Row(
                    children: [
                      _statBadge(
                        Icons.star_rounded,
                        place.rating.toStringAsFixed(1),
                        '${place.reviewCount} reviews',
                        AppColors.accent,
                      ),
                      const SizedBox(width: 12),
                      _statBadge(
                        Icons.visibility_rounded,
                        '${place.viewCount}',
                        'views',
                        AppColors.secondary,
                      ),
                      if (place.priceRange != null) ...[
                        const SizedBox(width: 12),
                        _statBadge(
                          Icons.payments_rounded,
                          place.priceRange!,
                          'price',
                          AppColors.success,
                        ),
                      ],
                    ],
                  ).animate().fadeIn(delay: 500.ms),

                  const SizedBox(height: 28),

                  // Description
                  Text('About',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  ReadMoreText(
                    place.description,
                    trimLines: 4,
                    trimMode: TrimMode.Line,
                    trimCollapsedText: ' Read more',
                    trimExpandedText: ' Show less',
                    moreStyle: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                    lessStyle: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                    style: Theme.of(context)
                        .textTheme
                        .bodyLarge
                        ?.copyWith(height: 1.7),
                  ).animate().fadeIn(delay: 600.ms),

                  const SizedBox(height: 24),

                  // Tags
                  if (place.tags.isNotEmpty) ...[
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: place.tags
                          .map((tag) => Chip(
                                label: Text(tag),
                                visualDensity: VisualDensity.compact,
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Info cards
                  if (place.openingHours != null || place.phone != null ||
                      place.website != null)
                    _infoSection(place),

                  const SizedBox(height: 24),

                  // Reviews section
                  Text('Reviews',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 16),

                  if (place.reviews.isEmpty)
                    Center(
                      child: Column(
                        children: [
                          Icon(Icons.rate_review_outlined,
                              size: 48, color: AppColors.textLight),
                          const SizedBox(height: 8),
                          Text('No reviews yet',
                              style: Theme.of(context).textTheme.bodyMedium),
                        ],
                      ),
                    )
                  else
                    ...place.reviews.take(5).map((review) => Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(16),
                            border:
                                Border.all(color: AppColors.divider),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 18,
                                    backgroundColor: AppColors.primary.withOpacity(0.1),
                                    child: Text(
                                      review.user?.fullName[0] ?? '?',
                                      style: TextStyle(
                                        color: AppColors.primary,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          review.user?.fullName ?? 'Anonymous',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                          ),
                                        ),
                                        RatingBarIndicator(
                                          rating: review.rating,
                                          itemSize: 14,
                                          itemBuilder: (_, __) => const Icon(
                                            Icons.star_rounded,
                                            color: AppColors.accent,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                review.comment,
                                style:
                                    Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                          ),
                        )),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),

      // ─── BOTTOM ACTION BAR ────────────────────
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: Row(
          children: [
            // Price / Rating
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.star_rounded, color: AppColors.accent, size: 20),
                      const SizedBox(width: 4),
                      Text(
                        place.rating.toStringAsFixed(1),
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                  Text('${place.reviewCount} reviews', style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () => provider.toggleVisited(place.id),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          provider.isVisited(place.id) ? Icons.check_circle_rounded : Icons.check_circle_outline_rounded,
                          color: provider.isVisited(place.id) ? AppColors.success : AppColors.textLight,
                          size: 18,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          provider.isVisited(place.id) ? 'Visited' : 'Mark as Visited',
                          style: TextStyle(
                            color: provider.isVisited(place.id) ? AppColors.success : AppColors.textLight,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () async {
                  final url = Uri.parse(
                    'https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${place.latitude},${place.longitude}',
                  );
                  if (await canLaunchUrl(url)) {
                    await launchUrl(url, mode: LaunchMode.externalApplication);
                  }
                },
                icon: const Icon(Icons.directions_rounded,
                    color: Colors.white),
                label: const Text('Get Directions',
                    style: TextStyle(color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _circleButton(IconData icon, VoidCallback onTap,
      {Color? color}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.3),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white24),
        ),
        child: Icon(icon, color: color ?? Colors.white, size: 20),
      ),
    );
  }

  Widget _statBadge(
      IconData icon, String value, String label, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 18, color: color),
                const SizedBox(width: 4),
                Text(
                  value,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: color,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: color.withOpacity(0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoSection(Place place) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        children: [
          if (place.openingHours != null)
            _infoRow(Icons.access_time_rounded, 'Hours', place.openingHours!),
          if (place.phone != null) ...[
            const SizedBox(height: 14),
            _infoRow(Icons.phone_rounded, 'Phone', place.phone!),
          ],
          if (place.website != null) ...[
            const SizedBox(height: 14),
            _infoRow(Icons.language_rounded, 'Website', place.website!),
          ],
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 20, color: AppColors.primary),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: TextStyle(
                      fontSize: 12, color: AppColors.textLight)),
              Text(value,
                  style: const TextStyle(
                      fontWeight: FontWeight.w500, fontSize: 14)),
            ],
          ),
        ),
      ],
    );
  }
}