import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../widgets/custom_nav_bar.dart';
import 'home_screen.dart';
import '../feed/activity_feed_screen.dart';
import '../map/map_screen.dart';
import '../favorites/favorites_screen.dart';
import '../profile/profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final _screens = const [
    HomeScreen(),
    ActivityFeedScreen(),
    MapScreen(),
    FavoritesScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();

    return Scaffold(
      body: IndexedStack(
        index: app.currentNavIndex,
        children: _screens,
      ),
      bottomNavigationBar: CustomNavBar(
        currentIndex: app.currentNavIndex,
        onTap: app.setNavIndex,
      ),
    );
  }
}