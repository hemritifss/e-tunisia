import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'config/routes.dart';
import 'providers/auth_provider.dart';
import 'providers/places_provider.dart';
import 'providers/app_provider.dart';
import 'providers/community_provider.dart';
import 'providers/notifications_provider.dart';
import 'providers/gamification_provider.dart';
import 'screens/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const ETunisiaApp());
}

class ETunisiaApp extends StatelessWidget {
  const ETunisiaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PlacesProvider()),
        ChangeNotifierProvider(create: (_) => AppProvider()),
        ChangeNotifierProvider(create: (_) => CommunityProvider()),
        ChangeNotifierProvider(create: (_) => NotificationsProvider()),
        ChangeNotifierProvider(create: (_) => GamificationProvider()),
      ],
      child: MaterialApp(
        title: 'e-Tunisia',
        debugShowCheckedModeBanner: false,
        theme: ETunisiaTheme.lightTheme,
        darkTheme: ETunisiaTheme.darkTheme,
        themeMode: ThemeMode.light,
        home: const SplashScreen(),
        routes: AppRoutes.routes,
      ),
    );
  }
}