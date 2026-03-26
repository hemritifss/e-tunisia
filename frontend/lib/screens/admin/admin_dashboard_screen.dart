import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import 'admin_users_screen.dart';
import 'admin_places_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  Map<String, dynamic>? stats;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final data = await ApiService().getAdminStats();
      setState(() {
        stats = data;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        centerTitle: true,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : stats == null
              ? const Center(child: Text('Failed to load stats'))
              : RefreshIndicator(
                  onRefresh: _loadStats,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ─── Stats Grid ─────────────────
                        Text('Overview',
                            style: Theme.of(context).textTheme.headlineMedium),
                        const SizedBox(height: 16),
                        GridView.count(
                          crossAxisCount: 2,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          mainAxisSpacing: 14,
                          crossAxisSpacing: 14,
                          childAspectRatio: 1.5,
                          children: [
                            _StatCard(
                              icon: Icons.people_rounded,
                              label: 'Total Users',
                              value: '${stats!['totalUsers'] ?? 0}',
                              color: const Color(0xFF6366F1),
                            ),
                            _StatCard(
                              icon: Icons.place_rounded,
                              label: 'Total Places',
                              value: '${stats!['totalPlaces'] ?? 0}',
                              color: const Color(0xFF10B981),
                            ),
                            _StatCard(
                              icon: Icons.rate_review_rounded,
                              label: 'Reviews',
                              value: '${stats!['totalReviews'] ?? 0}',
                              color: const Color(0xFFF59E0B),
                            ),
                            _StatCard(
                              icon: Icons.event_rounded,
                              label: 'Events',
                              value: '${stats!['totalEvents'] ?? 0}',
                              color: const Color(0xFFEF4444),
                            ),
                            _StatCard(
                              icon: Icons.pending_actions_rounded,
                              label: 'Pending Places',
                              value: '${stats!['pendingPlaces'] ?? 0}',
                              color: const Color(0xFFEC4899),
                            ),
                            _StatCard(
                              icon: Icons.monetization_on_rounded,
                              label: 'Revenue (TND)',
                              value: '${stats!['totalRevenue'] ?? 0}',
                              color: const Color(0xFF14B8A6),
                            ),
                            _StatCard(
                              icon: Icons.workspace_premium_rounded,
                              label: 'Premium Users',
                              value: '${stats!['premiumUsers'] ?? 0}',
                              color: const Color(0xFF8B5CF6),
                            ),
                            _StatCard(
                              icon: Icons.tips_and_updates_rounded,
                              label: 'Tips',
                              value: '${stats!['totalTips'] ?? 0}',
                              color: const Color(0xFF0EA5E9),
                            ),
                          ],
                        ),

                        const SizedBox(height: 32),

                        // ─── Quick Actions ─────────────────
                        Text('Quick Actions',
                            style: Theme.of(context).textTheme.headlineMedium),
                        const SizedBox(height: 16),

                        _ActionTile(
                          icon: Icons.people_outline_rounded,
                          title: 'Manage Users',
                          subtitle: 'View, ban, or promote users',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const AdminUsersScreen()),
                          ),
                        ),
                        const SizedBox(height: 12),
                        _ActionTile(
                          icon: Icons.place_outlined,
                          title: 'Manage Places',
                          subtitle: 'Approve, feature, or delete places',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const AdminPlacesScreen()),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 26),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color.withOpacity(0.7),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.divider),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: AppColors.primary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 15)),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: TextStyle(
                          color: AppColors.textSecondary, fontSize: 13)),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: AppColors.textLight),
          ],
        ),
      ),
    );
  }
}
