import 'package:flutter/material.dart' hide Badge;
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/gamification_provider.dart';
import '../../models/badge.dart';

class BadgesScreen extends StatefulWidget {
  const BadgesScreen({super.key});

  @override
  State<BadgesScreen> createState() => _BadgesScreenState();
}

class _BadgesScreenState extends State<BadgesScreen> {
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<GamificationProvider>().loadAll());
  }

  @override
  Widget build(BuildContext context) {
    final gamif = context.watch<GamificationProvider>();
    final badges = _filter == 'all'
        ? gamif.allBadges
        : _filter == 'earned'
            ? gamif.earnedBadges
            : gamif.allBadges.where((b) => !b.isEarned).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('🏅 My Badges'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // ─── Stats Header ─────────────────
          Container(
            margin: const EdgeInsets.fromLTRB(24, 8, 24, 16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6C5CE7), Color(0xFF8B5CF6)],
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF6C5CE7).withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _Stat('Earned', '${gamif.earnedCount}', Icons.emoji_events_rounded),
                Container(width: 1, height: 40, color: Colors.white.withOpacity(0.2)),
                _Stat('Total', '${gamif.totalBadges}', Icons.grid_view_rounded),
                Container(width: 1, height: 40, color: Colors.white.withOpacity(0.2)),
                _Stat('Level', '${gamif.level}', Icons.trending_up_rounded),
              ],
            ),
          ).animate().fadeIn().slideY(begin: -0.1),

          // ─── Filter Chips ─────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                _FilterChip('All', 'all'),
                const SizedBox(width: 8),
                _FilterChip('Earned', 'earned'),
                const SizedBox(width: 8),
                _FilterChip('Locked', 'locked'),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ─── Badges Grid ─────────────────
          Expanded(
            child: gamif.isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : GridView.builder(
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 100),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.85,
                      crossAxisSpacing: 14,
                      mainAxisSpacing: 14,
                    ),
                    itemCount: badges.length,
                    itemBuilder: (context, index) {
                      return _BadgeCard(badge: badges[index])
                          .animate()
                          .fadeIn(delay: (index * 60).ms)
                          .scale(begin: const Offset(0.9, 0.9));
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _FilterChip(String label, String value) {
    final active = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: active ? AppColors.primary : AppColors.divider),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? Colors.white : AppColors.textSecondary,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _Stat(this.label, this.value, this.icon);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: Colors.white.withOpacity(0.8), size: 20),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 22)),
        Text(label, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 11)),
      ],
    );
  }
}

class _BadgeCard extends StatelessWidget {
  final Badge badge;

  const _BadgeCard({required this.badge});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: badge.isEarned ? _getCategoryColor(badge.category).withOpacity(0.3) : AppColors.divider,
          width: badge.isEarned ? 2 : 1,
        ),
        boxShadow: [
          if (badge.isEarned)
            BoxShadow(
              color: _getCategoryColor(badge.category).withOpacity(0.1),
              blurRadius: 15,
              offset: const Offset(0, 4),
            ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              if (!badge.isEarned)
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: Colors.grey.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                ),
              Text(
                badge.icon,
                style: TextStyle(
                  fontSize: 36,
                  color: badge.isEarned ? null : Colors.grey,
                ),
              ),
              if (!badge.isEarned)
                const Positioned(
                  bottom: 0,
                  right: 0,
                  child: Icon(Icons.lock_rounded, size: 16, color: Colors.grey),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            badge.name,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: badge.isEarned ? AppColors.textPrimary : AppColors.textLight,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            badge.description,
            style: TextStyle(
              color: AppColors.textLight,
              fontSize: 10,
              height: 1.3,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          if (badge.pointsRequired > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: _getCategoryColor(badge.category).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${badge.pointsRequired} pts',
                style: TextStyle(
                  color: _getCategoryColor(badge.category),
                  fontWeight: FontWeight.w600,
                  fontSize: 10,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category) {
      case 'explorer': return const Color(0xFF2A9D8F);
      case 'foodie': return const Color(0xFFF4A261);
      case 'social': return const Color(0xFF6C5CE7);
      case 'contributor': return const Color(0xFFE76F51);
      case 'premium': return const Color(0xFFFFD700);
      default: return AppColors.primary;
    }
  }
}
