import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/theme.dart';
import '../models/sponsor.dart';
import '../services/api_service.dart';

class SponsorCard extends StatelessWidget {
  final Sponsor sponsor;

  const SponsorCard({super.key, required this.sponsor});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        ApiService().trackSponsorClick(sponsor.id).catchError((_) {});
        if (sponsor.website != null && sponsor.website!.isNotEmpty) {
          final uri = Uri.tryParse(sponsor.website!);
          if (uri != null && await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
        }
      },
      child: Container(
        width: 160,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: _tierColor.withOpacity(0.2),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: _tierColor.withOpacity(0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Tier badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: _tierColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _tierLabel,
                style: TextStyle(color: _tierColor, fontWeight: FontWeight.w700, fontSize: 9, letterSpacing: 0.5),
              ),
            ),
            const SizedBox(height: 10),

            // Logo
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: AppColors.background,
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: sponsor.logo != null
                    ? Image.network(
                        sponsor.logo!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Center(
                          child: Text(sponsor.name[0], style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: _tierColor)),
                        ),
                      )
                    : Center(
                        child: Text(sponsor.name[0], style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: _tierColor)),
                      ),
              ),
            ),
            const SizedBox(height: 10),

            Text(
              sponsor.name,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Color get _tierColor {
    switch (sponsor.tier) {
      case 'gold': return const Color(0xFFD4AF37);
      case 'silver': return const Color(0xFF9E9E9E);
      default: return const Color(0xFFCD7F32);
    }
  }

  String get _tierLabel {
    switch (sponsor.tier) {
      case 'gold': return '🥇 GOLD';
      case 'silver': return '🥈 SILVER';
      default: return '🥉 BRONZE';
    }
  }
}
