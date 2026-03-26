import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/community_provider.dart';

class ActivityFeedScreen extends StatefulWidget {
  const ActivityFeedScreen({super.key});

  @override
  State<ActivityFeedScreen> createState() => _ActivityFeedScreenState();
}

class _ActivityFeedScreenState extends State<ActivityFeedScreen> {
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<CommunityProvider>().loadCommunityData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final community = context.watch<CommunityProvider>();

    final filteredFeed = _filter == 'all'
        ? community.activityFeed
        : community.activityFeed.where((item) => item['type'] == _filter).toList();

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── HEADER ─
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child: Text(
                'Community Feed',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
            ).animate().fadeIn(),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 4, 24, 12),
              child: Text(
                'What\'s happening in Tunisia',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ),

            // ─── FILTER CHIPS ─
            SizedBox(
              height: 42,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  _FilterChip(label: 'All', value: 'all', selected: _filter, onTap: (v) => setState(() => _filter = v)),
                  _FilterChip(label: '🎪 Events', value: 'event', selected: _filter, onTap: (v) => setState(() => _filter = v)),
                  _FilterChip(label: '💡 Tips', value: 'tip', selected: _filter, onTap: (v) => setState(() => _filter = v)),
                  _FilterChip(label: '🗺️ Trips', value: 'itinerary', selected: _filter, onTap: (v) => setState(() => _filter = v)),
                ],
              ),
            ).animate().fadeIn(delay: 100.ms),

            const SizedBox(height: 8),

            // ─── FEED LIST ─
            Expanded(
              child: community.isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  : filteredFeed.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.forum_rounded, size: 64, color: AppColors.textLight.withOpacity(0.3)),
                              const SizedBox(height: 16),
                              Text('No activity yet', style: Theme.of(context).textTheme.titleMedium),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          color: AppColors.primary,
                          onRefresh: () => community.loadCommunityData(),
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            itemCount: filteredFeed.length,
                            itemBuilder: (context, i) {
                              return _FeedCard(item: filteredFeed[i])
                                  .animate()
                                  .fadeIn(delay: (i * 60).ms)
                                  .slideY(begin: 0.05);
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Filter Chip ─
class _FilterChip extends StatelessWidget {
  final String label;
  final String value;
  final String selected;
  final ValueChanged<String> onTap;

  const _FilterChip({
    required this.label,
    required this.value,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isSelected = selected == value;
    return GestureDetector(
      onTap: () => onTap(value),
      child: Container(
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.primary.withOpacity(0.08),
          borderRadius: BorderRadius.circular(30),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.primary,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

// ─── Feed Card ─
class _FeedCard extends StatelessWidget {
  final Map<String, dynamic> item;
  const _FeedCard({required this.item});

  IconData _getIcon() {
    switch (item['icon']) {
      case 'event': return Icons.event_rounded;
      case 'lightbulb': return Icons.lightbulb_rounded;
      case 'route': return Icons.alt_route_rounded;
      default: return Icons.article_rounded;
    }
  }

  String _getTypeLabel() {
    switch (item['type']) {
      case 'event': return 'EVENT';
      case 'tip': return 'TIP';
      case 'itinerary': return 'TRIP';
      default: return 'POST';
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = Color(item['color'] as int);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.divider.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                // Icon
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(_getIcon(), color: color, size: 20),
                ),
                const SizedBox(width: 12),
                // Type + subtitle
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _getTypeLabel(),
                          style: TextStyle(
                            color: color,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item['subtitle'] ?? '',
                        style: TextStyle(
                          color: AppColors.textLight,
                          fontSize: 12,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                // Engagement
                if (item['type'] == 'event' && item['isFree'] == true)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.success.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'FREE',
                      style: TextStyle(
                        color: AppColors.success,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Title
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Text(
              item['title'] ?? '',
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 16,
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),

          // Description
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Text(
              item['description'] ?? '',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                height: 1.5,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),

          // Engagement bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
            child: Row(
              children: [
                if (item['likes'] != null || item['likeCount'] != null) ...[
                  Icon(Icons.favorite_rounded, size: 16, color: AppColors.error.withOpacity(0.7)),
                  const SizedBox(width: 4),
                  Text(
                    '${item['likes'] ?? item['likeCount'] ?? 0}',
                    style: TextStyle(color: AppColors.textLight, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(width: 16),
                ],
                if (item['viewCount'] != null) ...[
                  Icon(Icons.visibility_rounded, size: 16, color: AppColors.textLight),
                  const SizedBox(width: 4),
                  Text(
                    '${item['viewCount']}',
                    style: TextStyle(color: AppColors.textLight, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(width: 16),
                ],
                if (item['attendeeCount'] != null && (item['attendeeCount'] as int) > 0) ...[
                  Icon(Icons.people_rounded, size: 16, color: AppColors.textLight),
                  const SizedBox(width: 4),
                  Text(
                    '${item['attendeeCount']} going',
                    style: TextStyle(color: AppColors.textLight, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ],
                const Spacer(),
                Icon(Icons.share_rounded, size: 18, color: AppColors.textLight),
                const SizedBox(width: 12),
                Icon(Icons.bookmark_border_rounded, size: 18, color: AppColors.textLight),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
