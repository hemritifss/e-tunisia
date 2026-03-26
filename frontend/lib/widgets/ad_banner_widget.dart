import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/theme.dart';
import '../models/ad.dart';
import '../services/api_service.dart';

class AdBannerWidget extends StatelessWidget {
  final AdModel ad;

  const AdBannerWidget({super.key, required this.ad});

  @override
  Widget build(BuildContext context) {
    // Track impression on build
    ApiService().trackAdImpression(ad.id).catchError((_) {});

    return GestureDetector(
      onTap: () async {
        ApiService().trackAdClick(ad.id).catchError((_) {});
        if (ad.targetUrl != null && ad.targetUrl!.isNotEmpty) {
          final uri = Uri.tryParse(ad.targetUrl!);
          if (uri != null && await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
        }
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 15,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            children: [
              // Background image
              SizedBox(
                height: 140,
                width: double.infinity,
                child: ad.imageUrl != null
                    ? Image.network(
                        ad.imageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: AppColors.primary.withOpacity(0.1),
                          child: const Center(child: Icon(Icons.image_rounded, size: 32, color: AppColors.primary)),
                        ),
                      )
                    : Container(
                        color: AppColors.primary.withOpacity(0.1),
                      ),
              ),

              // Gradient overlay
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Colors.black.withOpacity(0.65)],
                    ),
                  ),
                ),
              ),

              // Content overlay
              Positioned(
                bottom: 12,
                left: 14,
                right: 14,
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            ad.title,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (ad.advertiserName != null)
                            Text(
                              ad.advertiserName!,
                              style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 11),
                            ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Ad',
                        style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ).animate().fadeIn().slideY(begin: 0.05),
    );
  }
}
