import 'package:flutter/material.dart';
import '../screens/splash_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/main_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/gamification/leaderboard_screen.dart';
import '../screens/gamification/badges_screen.dart';
import '../screens/partners/become_partner_screen.dart';
import '../screens/about/about_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String main = '/main';
  static const String placeDetail = '/place';
  static const String search = '/search';
  static const String notifications = '/notifications';
  static const String leaderboard = '/leaderboard';
  static const String badges = '/badges';
  static const String becomePartner = '/become-partner';
  static const String about = '/about';

  static Map<String, WidgetBuilder> get routes => {
        onboarding: (_) => const OnboardingScreen(),
        login: (_) => const LoginScreen(),
        register: (_) => const RegisterScreen(),
        main: (_) => const MainScreen(),
        notifications: (_) => const NotificationsScreen(),
        leaderboard: (_) => const LeaderboardScreen(),
        badges: (_) => const BadgesScreen(),
        becomePartner: (_) => const BecomePartnerScreen(),
        about: (_) => const AboutScreen(),
      };
}