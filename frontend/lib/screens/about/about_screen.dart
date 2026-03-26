import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.background, Color(0xFFF3E5D8)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ─── Header ─────────────────
                Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_ios_rounded),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          gradient: AppColors.sunsetGradient,
                          borderRadius: BorderRadius.circular(22),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Text('🇹🇳', style: TextStyle(fontSize: 36)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text('e-Tunisia', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 4),
                      Text('Discover Tunisia, Together', style: TextStyle(color: AppColors.textSecondary)),
                      const SizedBox(height: 4),
                      Text('Version 1.0.0 • INJAZ Company Program', style: TextStyle(color: AppColors.textLight, fontSize: 12)),
                    ],
                  ),
                ).animate().fadeIn().slideY(begin: -0.1),

                const SizedBox(height: 32),

                // ─── Mission ─────────────────
                _SectionCard(
                  icon: '🎯',
                  title: 'Our Mission',
                  child: const Text(
                    'e-Tunisia is a community-driven digital platform designed to promote Tunisian tourism through authentic local experiences. We connect travelers with the rich culture, cuisine, nature, and heritage of Tunisia — making discovery accessible, engaging, and unforgettable.',
                    style: TextStyle(height: 1.6, fontSize: 14),
                  ),
                ).animate().fadeIn(delay: 200.ms).slideX(begin: -0.05),

                const SizedBox(height: 16),

                // ─── Business Model ─────────────────
                _SectionCard(
                  icon: '💼',
                  title: 'Business Model',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Freemium + Multi-Revenue Model',
                        style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary, fontSize: 15),
                      ),
                      const SizedBox(height: 12),
                      _RevenueRow('💳', 'Subscriptions', '10 TND/month for Premium features'),
                      _RevenueRow('📢', 'Advertising', '0.5–1 TND per click/engagement'),
                      _RevenueRow('🤝', 'Sponsorships', '500–2,000 TND/month from local businesses'),
                      _RevenueRow('🎪', 'Events', '1,000–3,000 TND per event'),
                    ],
                  ),
                ).animate().fadeIn(delay: 300.ms).slideX(begin: -0.05),

                const SizedBox(height: 16),

                // ─── Financial Overview ─────────────────
                _SectionCard(
                  icon: '📊',
                  title: 'Financial Overview',
                  child: Column(
                    children: [
                      _FinancialRow('Monthly Revenue (est.)', '5,000 TND'),
                      _FinancialRow('Monthly Fixed Costs', '1,000 TND'),
                      _FinancialRow('Monthly Profit (est.)', '4,000 TND'),
                      const Divider(height: 20),
                      _FinancialRow('Annual Revenue (est.)', '60,000 TND'),
                      _FinancialRow('Initial Funding Range', '15,000–40,000 TND'),
                    ],
                  ),
                ).animate().fadeIn(delay: 400.ms).slideX(begin: -0.05),

                const SizedBox(height: 16),

                // ─── Funding Sources ─────────────────
                _SectionCard(
                  icon: '💰',
                  title: 'Funding Sources',
                  child: Column(
                    children: [
                      _FundingRow('Sponsorship', '5,000 – 10,000 TND'),
                      _FundingRow('Partnerships', '2,000 TND + in-kind'),
                      _FundingRow('Grants/Programs', '5,000 – 15,000 TND'),
                      _FundingRow('Public Funding', '5,000 – 20,000 TND'),
                      _FundingRow('Crowdfunding', '2,000 – 5,000 TND'),
                      _FundingRow('Donations', '1,000 – 3,000 TND'),
                    ],
                  ),
                ).animate().fadeIn(delay: 500.ms).slideX(begin: -0.05),

                const SizedBox(height: 16),

                // ─── Team ─────────────────
                _SectionCard(
                  icon: '👥',
                  title: 'The Team',
                  child: const Text(
                    'Built by a team of passionate young Tunisians through the INJAZ Company Program. Our team combines Marketing, HR, Sales, IT, and Finance departments working together to bring authentic Tunisian experiences to the world.',
                    style: TextStyle(height: 1.6, fontSize: 14),
                  ),
                ).animate().fadeIn(delay: 600.ms).slideX(begin: -0.05),

                const SizedBox(height: 16),

                // ─── Contact ─────────────────
                _SectionCard(
                  icon: '📧',
                  title: 'Contact Us',
                  child: Column(
                    children: [
                      _ContactRow(Icons.email_rounded, 'contact@etunisia.tn'),
                      _ContactRow(Icons.language_rounded, 'www.etunisia.tn'),
                      _ContactRow(Icons.location_on_rounded, 'Tunis, Tunisia'),
                    ],
                  ),
                ).animate().fadeIn(delay: 700.ms).slideX(begin: -0.05),

                const SizedBox(height: 32),

                Center(
                  child: Text(
                    '© 2026 e-Tunisia • INJAZ Company Program\nAll rights reserved',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.textLight, fontSize: 12, height: 1.6),
                  ),
                ).animate().fadeIn(delay: 800.ms),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String icon;
  final String title;
  final Widget child;

  const _SectionCard({required this.icon, required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.divider.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(icon, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 10),
              Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

Widget _RevenueRow(String emoji, String title, String desc) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(emoji, style: const TextStyle(fontSize: 18)),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              Text(desc, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            ],
          ),
        ),
      ],
    ),
  );
}

Widget _FinancialRow(String label, String value) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
      ],
    ),
  );
}

Widget _FundingRow(String source, String range) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
        ),
        const SizedBox(width: 10),
        Expanded(child: Text(source, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
        Text(range, style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 12)),
      ],
    ),
  );
}

Widget _ContactRow(IconData icon, String text) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Row(
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 12),
        Text(text, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
      ],
    ),
  );
}
