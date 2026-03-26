import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/category.dart';

class CategoryChip extends StatelessWidget {
  final Category category;
  final VoidCallback onTap;

  const CategoryChip({
    super.key,
    required this.category,
    required this.onTap,
  });

  Color get _color {
    if (category.color != null) {
      try {
        return Color(
            int.parse(category.color!.replaceFirst('#', '0xFF')));
      } catch (_) {}
    }
    return AppColors.primary;
  }

  IconData get _icon {
    switch (category.icon) {
      case 'castle': return Icons.castle_rounded;
      case 'restaurant': return Icons.restaurant_rounded;
      case 'beach_access': return Icons.beach_access_rounded;
      case 'palette': return Icons.palette_rounded;
      case 'celebration': return Icons.celebration_rounded;
      case 'hotel': return Icons.hotel_rounded;
      default: return Icons.place_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              color: _color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: _color.withOpacity(0.15)),
            ),
            child: Icon(_icon, color: _color, size: 30),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: 80,
            child: Text(
              category.name,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}