import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';

class AdminPlacesScreen extends StatefulWidget {
  const AdminPlacesScreen({super.key});

  @override
  State<AdminPlacesScreen> createState() => _AdminPlacesScreenState();
}

class _AdminPlacesScreenState extends State<AdminPlacesScreen> {
  List<dynamic> places = [];
  bool isLoading = true;
  bool pendingOnly = false;

  @override
  void initState() {
    super.initState();
    _loadPlaces();
  }

  Future<void> _loadPlaces() async {
    setState(() => isLoading = true);
    try {
      final data = await ApiService().adminGetPlaces(pendingOnly: pendingOnly);
      setState(() {
        places = data['data'] ?? [];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Places'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          FilterChip(
            label: Text(pendingOnly ? 'Pending' : 'All',
                style: const TextStyle(color: Colors.white, fontSize: 12)),
            selected: pendingOnly,
            onSelected: (v) {
              setState(() => pendingOnly = v);
              _loadPlaces();
            },
            backgroundColor: Colors.white.withOpacity(0.2),
            selectedColor: Colors.white.withOpacity(0.35),
            checkmarkColor: Colors.white,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : places.isEmpty
              ? const Center(child: Text('No places found'))
              : RefreshIndicator(
                  onRefresh: _loadPlaces,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: places.length,
                    itemBuilder: (context, index) {
                      final place = places[index];
                      final isApproved = place['isApproved'] ?? true;
                      final isFeatured = place['isFeatured'] ?? false;
                      final isBoosted = place['isBoosted'] ?? false;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      place['name'] ?? 'Unknown',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ),
                                  if (isBoosted)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: Colors.orange.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Text('🔥 BOOSTED',
                                          style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: Colors.orange)),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '${place['city']}, ${place['governorate']}',
                                style: TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 13),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  if (!isApproved)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: Colors.red.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Text('PENDING',
                                          style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: Colors.red)),
                                    )
                                  else
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: Colors.green.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Text('APPROVED',
                                          style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: Colors.green)),
                                    ),
                                  const SizedBox(width: 8),
                                  if (isFeatured)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary
                                            .withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text('⭐ FEATURED',
                                          style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.primary)),
                                    ),
                                  const Spacer(),
                                  Row(
                                    children: [
                                      const Icon(Icons.star_rounded,
                                          size: 16, color: Colors.amber),
                                      const SizedBox(width: 2),
                                      Text(
                                        '${place['rating'] ?? 0}',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 13),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  if (!isApproved)
                                    _ActionButton(
                                      label: 'Approve',
                                      icon: Icons.check_circle_outline,
                                      color: Colors.green,
                                      onTap: () => _approvePlace(place['id']),
                                    ),
                                  const SizedBox(width: 8),
                                  _ActionButton(
                                    label: isFeatured
                                        ? 'Unfeature'
                                        : 'Feature',
                                    icon: Icons.star_outline_rounded,
                                    color: AppColors.primary,
                                    onTap: () =>
                                        _toggleFeature(place['id']),
                                  ),
                                  const SizedBox(width: 8),
                                  _ActionButton(
                                    label: 'Delete',
                                    icon: Icons.delete_outline_rounded,
                                    color: Colors.red,
                                    onTap: () => _deletePlace(place['id']),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  void _approvePlace(String id) async {
    await ApiService().adminApprovePlace(id);
    _loadPlaces();
  }

  void _toggleFeature(String id) async {
    await ApiService().adminToggleFeature(id);
    _loadPlaces();
  }

  void _deletePlace(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Place'),
        content: const Text('Are you sure? This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirmed == true) {
      await ApiService().adminDeletePlace(id);
      _loadPlaces();
    }
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 4),
            Text(label,
                style: TextStyle(
                    color: color,
                    fontSize: 12,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
