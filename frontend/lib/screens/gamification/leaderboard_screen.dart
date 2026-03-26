import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/gamification_provider.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<GamificationProvider>().loadAll());
  }

  @override
  Widget build(BuildContext context) {
    final gamif = context.watch<GamificationProvider>();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1A1A2E), Color(0xFF16213E), AppColors.background],
            stops: [0.0, 0.35, 0.65],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // ─── Header ─────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      '🏆 Leaderboard',
                      style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ).animate().fadeIn().slideY(begin: -0.2),

              const SizedBox(height: 20),

              // ─── Your Stats ─────────────────
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 24),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF4A261), Color(0xFFE76F51)],
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFF4A261).withOpacity(0.4),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Center(
                        child: Text(
                          '#${gamif.rank}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 20,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Your Rank', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 4),
                          Text(
                            '${gamif.points} points • Level ${gamif.level}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: LinearProgressIndicator(
                              value: gamif.levelProgress,
                              backgroundColor: Colors.white.withOpacity(0.2),
                              valueColor: const AlwaysStoppedAnimation(Colors.white),
                              minHeight: 6,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${gamif.points}/${gamif.nextLevelPoints} to next level',
                            style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),

              const SizedBox(height: 24),

              // ─── Leaderboard List ─────────────────
              Expanded(
                child: Container(
                  decoration: const BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                  ),
                  child: gamif.isLoading
                      ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                      : gamif.leaderboard.isEmpty
                          ? const Center(child: Text('No data yet'))
                          : ListView.builder(
                              padding: const EdgeInsets.fromLTRB(24, 24, 24, 100),
                              itemCount: gamif.leaderboard.length,
                              itemBuilder: (context, index) {
                                final user = gamif.leaderboard[index];
                                return _LeaderboardTile(
                                  rank: index + 1,
                                  name: user['fullName'] ?? 'User',
                                  points: user['points'] ?? 0,
                                  avatar: user['avatar'],
                                ).animate().fadeIn(delay: (100 + index * 60).ms).slideX(begin: 0.05);
                              },
                            ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LeaderboardTile extends StatelessWidget {
  final int rank;
  final String name;
  final int points;
  final String? avatar;

  const _LeaderboardTile({
    required this.rank,
    required this.name,
    required this.points,
    this.avatar,
  });

  @override
  Widget build(BuildContext context) {
    final isTop3 = rank <= 3;
    final medals = ['🥇', '🥈', '🥉'];

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isTop3 ? AppColors.primary.withOpacity(0.04) : AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isTop3 ? AppColors.primary.withOpacity(0.15) : AppColors.divider,
        ),
      ),
      child: Row(
        children: [
          isTop3
              ? Text(medals[rank - 1], style: const TextStyle(fontSize: 24))
              : Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      '#$rank',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
          const SizedBox(width: 14),
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: TextStyle(fontWeight: isTop3 ? FontWeight.w700 : FontWeight.w600, fontSize: 15)),
                Text('Level ${_level(points)}', style: TextStyle(color: AppColors.textLight, fontSize: 12)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.accent.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '$points pts',
              style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w700, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  int _level(int pts) {
    if (pts < 100) return 1;
    if (pts < 300) return 2;
    if (pts < 600) return 3;
    if (pts < 1000) return 4;
    if (pts < 1500) return 5;
    if (pts < 2500) return 6;
    if (pts < 4000) return 7;
    if (pts < 6000) return 8;
    if (pts < 9000) return 9;
    return 10;
  }
}
