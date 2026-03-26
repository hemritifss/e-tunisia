import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';

class PremiumScreen extends StatelessWidget {
  const PremiumScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF1A1A2E), Color(0xFF16213E), Color(0xFF0F3460)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                // ─── Header ─────────────────
                Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_ios_rounded,
                          color: Colors.white),
                    ),
                    const Spacer(),
                  ],
                ),
                const SizedBox(height: 16),
                const Icon(Icons.workspace_premium_rounded,
                    size: 64, color: Color(0xFFFFD700)),
                const SizedBox(height: 16),
                const Text(
                  'Go Premium',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Unlock the full e-Tunisia experience',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 36),

                // ─── Free Plan ─────────────────
                _PlanCard(
                  title: 'Free',
                  price: '0',
                  period: 'forever',
                  color: Colors.grey,
                  features: const [
                    'Browse all places',
                    'Read reviews',
                    'Save favorites',
                    'Basic search',
                  ],
                  isCurrentPlan: true,
                  onUpgrade: null,
                ),
                const SizedBox(height: 16),

                // ─── Premium Plan ─────────────────
                _PlanCard(
                  title: 'Premium',
                  price: '10',
                  period: '/month',
                  color: const Color(0xFFF59E0B),
                  features: const [
                    'Everything in Free',
                    'Premium itineraries & guides',
                    'Offline map access',
                    'Ad-free experience',
                    'Priority support',
                    'Exclusive tips & insider content',
                    'Early event access',
                  ],
                  isCurrentPlan: false,
                  isBestValue: true,
                  onUpgrade: () => _upgrade(context, 'premium'),
                ),
                const SizedBox(height: 12),

                // ─── Annual Plan ─────────────────
                _PlanCard(
                  title: 'Premium Annual',
                  price: '100',
                  period: '/year (save 17%)',
                  color: const Color(0xFF2AC19D),
                  features: const [
                    'All Premium features',
                    '2 months free!',
                    'Founding member badge',
                  ],
                  isCurrentPlan: false,
                  onUpgrade: () => _upgrade(context, 'premium'),
                ),
                const SizedBox(height: 16),

                // ─── Business Plan ─────────────────
                _PlanCard(
                  title: 'Business',
                  price: '49',
                  period: '/month',
                  color: const Color(0xFF8B5CF6),
                  features: const [
                    'Everything in Premium',
                    'Boosted place listing',
                    'Business analytics dashboard',
                    'Verified badge ✓',
                    'Featured homepage placement',
                    'API access & integrations',
                    'Dedicated account manager',
                  ],
                  isCurrentPlan: false,
                  onUpgrade: () => _upgrade(context, 'business'),
                ),
                const SizedBox(height: 32),

                // ─── Revenue Streams Info ─────────────────
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '💡 How We Earn',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _RevenueItem(
                        icon: '💳',
                        title: 'Subscriptions',
                        desc: 'Premium & Business plans',
                      ),
                      _RevenueItem(
                        icon: '📍',
                        title: 'Sponsored Listings',
                        desc: 'Boosted visibility for businesses',
                      ),
                      _RevenueItem(
                        icon: '🎫',
                        title: 'Event Tickets',
                        desc: '5% commission on paid events',
                      ),
                      _RevenueItem(
                        icon: '💸',
                        title: 'Creator Tips',
                        desc: 'Tip creators, 10% platform cut',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _upgrade(BuildContext context, String plan) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _PaymentSheet(plan: plan),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final String title;
  final String price;
  final String period;
  final Color color;
  final List<String> features;
  final bool isCurrentPlan;
  final bool isBestValue;
  final VoidCallback? onUpgrade;

  const _PlanCard({
    required this.title,
    required this.price,
    required this.period,
    required this.color,
    required this.features,
    required this.isCurrentPlan,
    this.isBestValue = false,
    this.onUpgrade,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.06),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isBestValue ? color : Colors.white.withOpacity(0.1),
          width: isBestValue ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(title,
                  style: TextStyle(
                    color: color,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  )),
              if (isBestValue) ...[
                const SizedBox(width: 10),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text('BEST VALUE',
                      style: TextStyle(
                        color: color,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      )),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          RichText(
            text: TextSpan(children: [
              TextSpan(
                text: '$price TND',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                ),
              ),
              TextSpan(
                text: period,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.5),
                  fontSize: 14,
                ),
              ),
            ]),
          ),
          const SizedBox(height: 16),
          ...features.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Icon(Icons.check_circle_rounded,
                        color: color, size: 18),
                    const SizedBox(width: 10),
                    Text(f,
                        style: TextStyle(
                            color: Colors.white.withOpacity(0.85),
                            fontSize: 14)),
                  ],
                ),
              )),
          const SizedBox(height: 16),
          if (isCurrentPlan)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Center(
                child: Text('Current Plan',
                    style: TextStyle(
                        color: Colors.white54, fontWeight: FontWeight.w600)),
              ),
            )
          else
            GestureDetector(
              onTap: onUpgrade,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [color, color.withOpacity(0.7)],
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: Text('Upgrade Now',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 16)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _RevenueItem extends StatelessWidget {
  final String icon;
  final String title;
  final String desc;

  const _RevenueItem({
    required this.icon,
    required this.title,
    required this.desc,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 14)),
              Text(desc,
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.5), fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }
}

class _PaymentSheet extends StatefulWidget {
  final String plan;
  const _PaymentSheet({required this.plan});

  @override
  State<_PaymentSheet> createState() => _PaymentSheetState();
}

class _PaymentSheetState extends State<_PaymentSheet> {
  String selectedMethod = 'card';
  bool isProcessing = false;

  @override
  Widget build(BuildContext context) {
    final price = widget.plan == 'premium' ? '29' : '99';
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Upgrade to ${widget.plan.toUpperCase()}',
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text('$price TND / month',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 16)),
          const SizedBox(height: 24),
          const Text('Payment Method',
              style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          _MethodTile('Card Payment', Icons.credit_card, 'card',
              selectedMethod, (v) => setState(() => selectedMethod = v)),
          _MethodTile('Bank Transfer', Icons.account_balance, 'bank',
              selectedMethod, (v) => setState(() => selectedMethod = v)),
          _MethodTile('Cash (Office)', Icons.payments, 'cash',
              selectedMethod, (v) => setState(() => selectedMethod = v)),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: isProcessing ? null : _processPayment,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              child: isProcessing
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Confirm Payment',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 16)),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _MethodTile(String label, IconData icon, String value,
      String selected, ValueChanged<String> onChanged) {
    return GestureDetector(
      onTap: () => onChanged(value),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected == value
                ? AppColors.primary
                : AppColors.divider,
            width: selected == value ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon,
                color:
                    selected == value ? AppColors.primary : AppColors.textLight),
            const SizedBox(width: 12),
            Text(label,
                style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: selected == value
                        ? AppColors.primary
                        : AppColors.textPrimary)),
            const Spacer(),
            if (selected == value)
              Icon(Icons.check_circle, color: AppColors.primary, size: 22),
          ],
        ),
      ),
    );
  }

  void _processPayment() async {
    setState(() => isProcessing = true);
    try {
      await ApiService().upgradePlan(widget.plan, selectedMethod);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🎉 Upgraded to ${widget.plan}!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
    setState(() => isProcessing = false);
  }
}
