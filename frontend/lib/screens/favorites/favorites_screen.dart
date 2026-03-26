import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/places_provider.dart';
import '../../widgets/place_card.dart';
import '../detail/place_detail_screen.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                child: Text(
                  'My Places',
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
              ).animate().fadeIn().slideY(begin: -0.1),
              const SizedBox(height: 16),

              // ─── TAB BAR ─────────────────────────────
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 24),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: TabBar(
                  labelColor: Colors.white,
                  unselectedLabelColor: AppColors.primary,
                  indicator: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  splashBorderRadius: BorderRadius.circular(14),
                  labelStyle: const TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 14),
                  tabs: const [
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.favorite_rounded, size: 18),
                          SizedBox(width: 8),
                          Text('Saved'),
                        ],
                      ),
                    ),
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle_rounded, size: 18),
                          SizedBox(width: 8),
                          Text('Visited'),
                        ],
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 100.ms),

              const SizedBox(height: 16),

              // ─── TAB VIEWS ───────────────────────────
              Expanded(
                child: TabBarView(
                  children: [
                    _PlaceListTab(type: _ListType.saved),
                    _PlaceListTab(type: _ListType.visited),
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

enum _ListType { saved, visited }

class _PlaceListTab extends StatelessWidget {
  final _ListType type;
  const _PlaceListTab({required this.type});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PlacesProvider>();
    final allPlaces =
        [...provider.featured, ...provider.popular].toSet().toList();

    final filteredPlaces = type == _ListType.saved
        ? allPlaces.where((p) => provider.isFavorite(p.id)).toList()
        : allPlaces.where((p) => provider.isVisited(p.id)).toList();

    if (filteredPlaces.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              type == _ListType.saved
                  ? Icons.favorite_border_rounded
                  : Icons.flag_outlined,
              size: 80,
              color: AppColors.textLight.withOpacity(0.4),
            ),
            const SizedBox(height: 16),
            Text(
              type == _ListType.saved
                  ? 'No saved places yet'
                  : 'No places visited yet',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              type == _ListType.saved
                  ? 'Tap the heart icon to save places'
                  : 'Mark places as visited to track your journey',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ).animate().fadeIn(),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: filteredPlaces.length,
      itemBuilder: (context, i) {
        final place = filteredPlaces[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: PlaceCard(
            place: place,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PlaceDetailScreen(placeId: place.id),
              ),
            ),
            isFavorite: provider.isFavorite(place.id),
            onFavorite: () => provider.toggleFavorite(place.id),
          ),
        ).animate().fadeIn(delay: (i * 80).ms).slideX(begin: 0.1);
      },
    );
  }
}