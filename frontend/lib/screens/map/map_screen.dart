import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../providers/places_provider.dart';
import '../../models/place.dart';
import '../detail/place_detail_screen.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  Place? _selectedPlace;

  // Tunisia center coordinates
  static const _tunisiaCenter = LatLng(34.5, 9.5);

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PlacesProvider>();
    final allPlaces = {...provider.featured, ...provider.popular}.toList();

    return Scaffold(
      body: Stack(
        children: [
          // ─── MAP ───────────────────────────────────────
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _tunisiaCenter,
              initialZoom: 7.0,
              minZoom: 5,
              maxZoom: 18,
              onTap: (_, __) => setState(() => _selectedPlace = null),
            ),
            children: [
              // OpenStreetMap tiles
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.etunisia.app',
                maxZoom: 19,
              ),

              // Place markers
              MarkerLayer(
                markers: allPlaces.map((place) {
                  final isSelected = _selectedPlace?.id == place.id;
                  return Marker(
                    point: LatLng(place.latitude, place.longitude),
                    width: isSelected ? 52 : 40,
                    height: isSelected ? 52 : 40,
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _selectedPlace = place);
                        _mapController.move(
                          LatLng(place.latitude, place.longitude),
                          _mapController.camera.zoom < 10
                              ? 12.0
                              : _mapController.camera.zoom,
                        );
                      },
                      child: AnimatedContainer(
                        duration: 200.ms,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.surface,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.primary.withOpacity(0.6),
                            width: isSelected ? 3 : 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: isSelected
                                  ? AppColors.primary.withOpacity(0.4)
                                  : Colors.black.withOpacity(0.15),
                              blurRadius: isSelected ? 12 : 6,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Icon(
                          Icons.place_rounded,
                          color: isSelected
                              ? Colors.white
                              : AppColors.primary,
                          size: isSelected ? 28 : 22,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),

          // ─── HEADER ────────────────────────────────────
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(
                24,
                MediaQuery.of(context).padding.top + 12,
                24,
                16,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.background,
                    AppColors.background.withOpacity(0),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Row(
                children: [
                  Text(
                    'Map View 📍',
                    style: Theme.of(context).textTheme.headlineLarge,
                  ),
                  const Spacer(),
                  _mapActionButton(
                    Icons.my_location_rounded,
                    () => _mapController.move(_tunisiaCenter, 7),
                  ),
                ],
              ),
            ),
          ),

          // ─── SELECTED PLACE CARD ───────────────────────
          if (_selectedPlace != null)
            Positioned(
              bottom: 24,
              left: 20,
              right: 20,
              child: _PlacePreviewCard(
                place: _selectedPlace!,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) =>
                        PlaceDetailScreen(placeId: _selectedPlace!.id),
                  ),
                ),
                onClose: () => setState(() => _selectedPlace = null),
              ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.3),
            ),

          // ─── PLACE COUNT PILL ──────────────────────────
          if (_selectedPlace == null)
            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      )
                    ],
                  ),
                  child: Text(
                    '${allPlaces.length} places on the map',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _mapActionButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.divider),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Icon(icon, size: 20, color: AppColors.primary),
      ),
    );
  }
}

// ─── Place Preview Card ──────────────────────────────────
class _PlacePreviewCard extends StatelessWidget {
  final Place place;
  final VoidCallback onTap;
  final VoidCallback onClose;

  const _PlacePreviewCard({
    required this.place,
    required this.onTap,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 120,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.12),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            // Image
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(20)),
              child: SizedBox(
                width: 120,
                height: 120,
                child: CachedNetworkImage(
                  imageUrl: place.displayImage,
                  fit: BoxFit.cover,
                  placeholder: (_, __) =>
                      Container(color: AppColors.shimmerBase),
                  errorWidget: (_, __, ___) => Container(
                    color: AppColors.secondary,
                    child: const Icon(Icons.landscape,
                        color: Colors.white54, size: 32),
                  ),
                ),
              ),
            ),

            // Info
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      place.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.location_on_rounded,
                            color: AppColors.textLight, size: 13),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            place.city,
                            style: const TextStyle(
                              color: AppColors.textLight,
                              fontSize: 12,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded,
                            color: AppColors.accent, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          place.rating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (place.category != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              place.category!.name,
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Close & Navigate
            Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      size: 18, color: AppColors.textLight),
                  onPressed: onClose,
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 8, bottom: 12),
                  child: Icon(Icons.arrow_forward_ios_rounded,
                      size: 14, color: AppColors.primary),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}