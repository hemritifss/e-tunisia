import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/glass_container.dart';
import '../admin/admin_dashboard_screen.dart';
import '../premium/premium_screen.dart';
import '../events/events_screen.dart';
import '../tips/tips_screen.dart';
import '../itineraries/itineraries_screen.dart';
import '../collections/collections_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // Dynamic Background
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.background, Color(0xFFF3E5D8)],
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
              ),
            ),
          ),
          
          // Animated decorative blobs
          Positioned(
            top: -50,
            left: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [AppColors.primary.withOpacity(0.35), Colors.transparent],
                ),
              ),
            ).animate(onPlay: (c) => c.repeat(reverse: true))
             .moveX(begin: 0, end: 40, duration: 5.seconds)
             .moveY(begin: 0, end: 30, duration: 6.seconds),
          ),
          Positioned(
            top: 200,
            right: -100,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [AppColors.accent.withOpacity(0.3), Colors.transparent],
                ),
              ),
            ).animate(onPlay: (c) => c.repeat(reverse: true))
             .moveX(begin: 0, end: -30, duration: 4.seconds)
             .moveY(begin: 0, end: 40, duration: 5.seconds),
          ),

          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  const SizedBox(height: 10),

                  // Header title
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Profile',
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.7),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(Icons.settings_outlined, color: AppColors.textPrimary),
                      ),
                    ],
                  ).animate().fadeIn(duration: 500.ms).slideY(begin: -0.2),

                  const SizedBox(height: 24),

                  // Profile Header Card (Glassmorphic)
                  GlassContainer(
                    blur: 20,
                    opacity: 0.6,
                    padding: const EdgeInsets.all(28),
                    borderRadius: BorderRadius.circular(32),
                    child: Column(
                      children: [
                        // Avatar with animated pulse
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 4),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.3),
                                blurRadius: 20,
                                spreadRadius: 5,
                              ),
                            ],
                            gradient: AppColors.primaryGradient,
                          ),
                          child: Center(
                            child: Text(
                              user?.fullName[0].toUpperCase() ?? 'G',
                              style: const TextStyle(
                                fontSize: 40,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ).animate(onPlay: (c) => c.repeat(reverse: true))
                         .scale(begin: const Offset(1, 1), end: const Offset(1.05, 1.05), duration: 2.seconds),
                        
                        const SizedBox(height: 20),
                        
                        Text(
                          user?.fullName ?? 'Guest User',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user?.email ?? 'guest@etunisia.com',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        
                        if (user?.country != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text('🇹🇳 ', style: TextStyle(fontSize: 16)),
                                Text(
                                  user!.country!,
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ).animate().fadeIn(delay: 200.ms, duration: 600.ms).slideY(begin: 0.1),

                  const SizedBox(height: 24),

                  // ─── GAMIFICATION BANNER ──────────────────────────
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.accent.withOpacity(0.8), AppColors.accent],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.accent.withOpacity(0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _StatColumn(icon: Icons.explore_rounded, value: 'Lv. ${user?.role == 'admin' ? 99 : 5}', label: 'Rank'),
                        Container(width: 1, height: 40, color: Colors.white.withOpacity(0.3)),
                        _StatColumn(icon: Icons.stars_rounded, value: '${user?.role == 'admin' ? 9999 : 1250}', label: 'Points'),
                        Container(width: 1, height: 40, color: Colors.white.withOpacity(0.3)),
                        _StatColumn(icon: Icons.emoji_events_rounded, value: '12', label: 'Badges'),
                      ],
                    ),
                  ).animate().fadeIn(delay: 250.ms).slideY(begin: 0.1),

                  const SizedBox(height: 32),

                  // ─── DISCOVER & PLAN ─────────────────────────
                  _buildSectionLabel('Discover & Plan')
                      .animate().fadeIn(delay: 300.ms).slideX(begin: -0.1),
                  _buildMenuGroup([
                    _MenuItem(
                      icon: Icons.alt_route_rounded,
                      title: 'Trip Itineraries',
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ItinerariesScreen())),
                    ),
                    _MenuItem(
                      icon: Icons.collections_bookmark_rounded,
                      title: 'Curated Collections',
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CollectionsScreen())),
                    ),
                    _MenuItem(
                      icon: Icons.event_rounded,
                      title: 'Events & Festivals',
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EventsScreen())),
                    ),
                    _MenuItem(
                      icon: Icons.tips_and_updates_rounded,
                      title: 'Traveler Tips',
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TipsScreen())),
                      isLast: true,
                    ),
                  ]).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1),

                  const SizedBox(height: 24),

                  // ─── PREMIUM BENEFITS ─────────────────────────
                  _buildSectionLabel('Premium Benefits')
                      .animate().fadeIn(delay: 420.ms).slideX(begin: -0.1),
                  _buildMenuGroup([
                    _MenuItem(
                      icon: Icons.workspace_premium_rounded,
                      title: 'Go Premium',
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PremiumScreen())),
                      isLast: true,
                    ),
                  ]).animate().fadeIn(delay: 430.ms).slideY(begin: 0.1),

                  const SizedBox(height: 24),

                  // ─── ADMIN PANEL (Conditional) ───────────────────
                  if (user?.role == 'admin') ...[
                    _buildSectionLabel('Administrative')
                        .animate().fadeIn(delay: 450.ms).slideX(begin: -0.1),
                    _buildMenuGroup([
                      _MenuItem(
                        icon: Icons.admin_panel_settings_rounded,
                        title: 'Admin Dashboard',
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminDashboardScreen())),
                        isLast: true,
                      ),
                    ]).animate().fadeIn(delay: 500.ms).slideY(begin: 0.1),
                    const SizedBox(height: 24),
                  ],

                  // Menu Sections
                  _buildSectionLabel('Account Settings')
                      .animate().fadeIn(delay: 550.ms).slideX(begin: -0.1),
                  _buildMenuGroup([
                    _MenuItem(icon: Icons.person_outline_rounded, title: 'Edit Profile'),
                    _MenuItem(icon: Icons.language_rounded, title: 'Language', trailing: 'English'),
                    _MenuItem(icon: Icons.dark_mode_outlined, title: 'Dark Mode', trailing: 'Off', isLast: true),
                  ]).animate().fadeIn(delay: 600.ms).slideY(begin: 0.1),

                  const SizedBox(height: 24),
                  
                  _buildSectionLabel('General')
                      .animate().fadeIn(delay: 700.ms).slideX(begin: -0.1),
                  _buildMenuGroup([
                    _MenuItem(icon: Icons.notifications_none_rounded, title: 'Notifications'),
                    _MenuItem(icon: Icons.help_outline_rounded, title: 'Help & Support'),
                    _MenuItem(icon: Icons.info_outline_rounded, title: 'About e-Tunisia'),
                    _MenuItem(icon: Icons.star_border_rounded, title: 'Rate the App', isLast: true),
                  ]).animate().fadeIn(delay: 800.ms).slideY(begin: 0.1),

                  const SizedBox(height: 32),

                  // Logout Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        await auth.logout();
                        if (context.mounted) {
                          Navigator.pushReplacementNamed(context, '/login');
                        }
                      },
                      icon: const Icon(Icons.logout_rounded, color: AppColors.error),
                      label: const Text('Log Out', style: TextStyle(color: AppColors.error, fontSize: 16, fontWeight: FontWeight.w600)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        backgroundColor: Colors.white.withOpacity(0.8),
                        side: BorderSide(color: AppColors.error.withOpacity(0.3), width: 2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                    ),
                  ).animate().fadeIn(delay: 700.ms).slideY(begin: 0.2),

                  const SizedBox(height: 20),

                  Text(
                    'Version 1.0.0',
                    style: TextStyle(
                      color: AppColors.textLight.withOpacity(0.6),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ).animate().fadeIn(delay: 800.ms),

                  const SizedBox(height: 120), // Bottom padding for navbar
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 12),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          text,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }

  Widget _buildMenuGroup(List<_MenuItem> items) {
    return GlassContainer(
      blur: 15,
      opacity: 0.5,
      padding: EdgeInsets.zero,
      borderRadius: BorderRadius.circular(24),
      child: Column(
        children: items.map((item) {
          return Column(
            children: [
              ListTile(
                onTap: item.onTap,
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(item.icon, color: AppColors.primary, size: 22),
                ),
                title: Text(
                  item.title,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: AppColors.textPrimary),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (item.trailing != null) ...[
                      Text(item.trailing!, style: TextStyle(color: AppColors.textLight, fontSize: 14, fontWeight: FontWeight.w500)),
                      const SizedBox(width: 8),
                    ],
                    const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textLight, size: 16),
                  ],
                ),
              ),
              if (!item.isLast)
                Divider(height: 1, indent: 64, endIndent: 20, color: AppColors.divider.withOpacity(0.4)),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _StatColumn extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  const _StatColumn({
    required this.icon,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: Colors.white.withOpacity(0.9), size: 22),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        Text(label, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12)),
      ],
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final String? trailing;
  final bool isLast;
  final VoidCallback? onTap;

  _MenuItem({
    required this.icon,
    required this.title,
    this.trailing,
    this.isLast = false,
    this.onTap,
  });
}