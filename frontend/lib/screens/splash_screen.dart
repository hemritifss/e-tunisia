import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';
import '../services/api_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(seconds: 4));
    if (!mounted) return;

    final isLoggedIn = await ApiService().isLoggedIn();
    Navigator.pushReplacementNamed(
      context,
      isLoggedIn ? '/main' : '/onboarding',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1A1A2E), Color(0xFF16213E), Color(0xFF0F3460)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          children: [
            // Animated background circles
            Positioned(
              top: -100,
              right: -50,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withOpacity(0.15),
                ),
              ).animate(onPlay: (c) => c.repeat(reverse: true))
                  .scale(begin: const Offset(0.8, 0.8), end: const Offset(1.2, 1.2), duration: 3.seconds),
            ),
            Positioned(
              bottom: -50,
              left: -100,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.secondary.withOpacity(0.15),
                ),
              ).animate(onPlay: (c) => c.repeat(reverse: true))
                  .scale(begin: const Offset(1.2, 1.2), end: const Offset(0.8, 0.8), duration: 4.seconds),
            ),

            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo / Branding
                  Container(
                    width: 250,
                    height: 150,
                    child: Image.network(
                      'https://placehold.co/400x200/png?text=LOGO',
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.explore_rounded, size: 70, color: Colors.white),
                          const SizedBox(height: 12),
                          Text(
                            'E-TUNISIA PLATFORM',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                      .animate()
                      .scale(
                        begin: const Offset(0.5, 0.5),
                        end: const Offset(1, 1),
                        duration: 1000.ms,
                        curve: Curves.elasticOut,
                      )
                      .fadeIn(duration: 600.ms)
                      .shimmer(delay: 1.seconds, duration: 1500.ms, color: Colors.white54),

                  const SizedBox(height: 70),

                  // Loading
                  Column(
                    children: [
                      SizedBox(
                        width: 48,
                        height: 48,
                        child: CircularProgressIndicator(
                          strokeWidth: 4,
                          color: AppColors.accent,
                          backgroundColor: AppColors.accent.withOpacity(0.2),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Preparing your journey...',
                        style: TextStyle(
                          color: AppColors.textLight.withOpacity(0.8),
                          fontSize: 13,
                        ),
                      ).animate(onPlay: (c) => c.repeat(reverse: true)).fadeIn(duration: 1.seconds),
                    ],
                  ).animate().fadeIn(delay: 1200.ms),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}