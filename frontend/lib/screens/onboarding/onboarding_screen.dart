import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../../config/theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _currentPage = 0;

  final _pages = [
    _OnboardingPage(
      image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6',
      title: 'Discover Tunisia',
      subtitle:
          'Explore ancient ruins, vibrant medinas, and breathtaking landscapes across this Mediterranean gem.',
      icon: Icons.castle_rounded,
      gradient: [Color(0xFFC84B31), Color(0xFFE8734F)],
    ),
    _OnboardingPage(
      image: 'https://images.unsplash.com/photo-1547234935-80c7145ec969',
      title: 'Taste the Flavors',
      subtitle:
          'From street-side bambalouni to refined palace dining, experience authentic Tunisian cuisine.',
      icon: Icons.restaurant_rounded,
      gradient: [Color(0xFFF4A261), Color(0xFFE76F51)],
    ),
    _OnboardingPage(
      image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07',
      title: 'Nature Awaits',
      subtitle:
          'From Saharan dunes to Mediterranean shores, discover Tunisia\'s incredible natural diversity.',
      icon: Icons.landscape_rounded,
      gradient: [Color(0xFF1B6B93), Color(0xFF2A9D8F)],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Page View
          PageView.builder(
            controller: _controller,
            itemCount: _pages.length,
            onPageChanged: (i) => setState(() => _currentPage = i),
            itemBuilder: (context, index) {
              final page = _pages[index];
              return Stack(
                fit: StackFit.expand,
                children: [
                  // Background Image
                  Image.network(
                    page.image,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: page.gradient),
                      ),
                    ),
                  ),

                  // Gradient Overlay
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.black.withOpacity(0.7),
                          Colors.black.withOpacity(0.3),
                          Colors.transparent,
                          Colors.black.withOpacity(0.5),
                        ],
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        stops: const [0, 0.3, 0.6, 1],
                      ),
                    ),
                  ),

                  // Content
                  Positioned(
                    bottom: 160,
                    left: 30,
                    right: 30,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Icon(page.icon, size: 36, color: Colors.white),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          page.title,
                          style: Theme.of(context)
                              .textTheme
                              .displayLarge
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          page.subtitle,
                          style:
                              Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    color: Colors.white70,
                                    height: 1.6,
                                  ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),

          // Skip Button
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            right: 20,
            child: TextButton(
              onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
              child: Text(
                'Skip',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),

          // Bottom Controls
          Positioned(
            bottom: 50,
            left: 30,
            right: 30,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Dot Indicator
                SmoothPageIndicator(
                  controller: _controller,
                  count: _pages.length,
                  effect: ExpandingDotsEffect(
                    dotColor: Colors.white30,
                    activeDotColor: AppColors.accent,
                    dotHeight: 8,
                    dotWidth: 8,
                    expansionFactor: 4,
                  ),
                ),

                // Next / Get Started Button
                GestureDetector(
                  onTap: () {
                    if (_currentPage < _pages.length - 1) {
                      _controller.nextPage(
                        duration: 400.ms,
                        curve: Curves.easeInOut,
                      );
                    } else {
                      Navigator.pushReplacementNamed(context, '/login');
                    }
                  },
                  child: AnimatedContainer(
                    duration: 300.ms,
                    padding: EdgeInsets.symmetric(
                      horizontal: _currentPage == _pages.length - 1 ? 32 : 20,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.4),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (_currentPage == _pages.length - 1)
                          const Padding(
                            padding: EdgeInsets.only(right: 8),
                            child: Text(
                              'Get Started',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OnboardingPage {
  final String image;
  final String title;
  final String subtitle;
  final IconData icon;
  final List<Color> gradient;

  _OnboardingPage({
    required this.image,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.gradient,
  });
}
