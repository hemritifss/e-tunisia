import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';
import '../../models/place.dart';
import '../../services/api_service.dart';
import '../../widgets/place_card.dart';
import '../../providers/places_provider.dart';
import '../detail/place_detail_screen.dart';

class NearbyScreen extends StatefulWidget {
  const NearbyScreen({super.key});

  @override
  State<NearbyScreen> createState() => _NearbyScreenState();
}

class _NearbyScreenState extends State<NearbyScreen> {
  final _apiService = ApiService();
  bool _isLoading = true;
  bool _hasPermission = false;
  String? _errorMessage;
  List<Place> _nearbyPlaces = [];
  double _radius = 50.0; // km

  @override
  void initState() {
    super.initState();
    _fetchNearbyPlaces();
  }

  Future<void> _fetchNearbyPlaces() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1. Check permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _isLoading = false;
            _errorMessage = 'Location permissions are denied';
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _isLoading = false;
          _errorMessage =
              'Location permissions are permanently denied, we cannot request permissions.';
        });
        return;
      }

      setState(() => _hasPermission = true);

      // 2. Get current position
      Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium);

      // 3. Fetch nearby places
      final places = await _apiService.getNearbyPlaces(
        position.latitude,
        position.longitude,
        radius: _radius,
      );

      setState(() {
        _nearbyPlaces = places;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        // Mock fallback for browser/emulator where location might fail
        _fetchMockNearbyPlaces();
      });
    }
  }

  // Fallback if Geolocator fails (common on emulators/web without config)
  Future<void> _fetchMockNearbyPlaces() async {
    setState(() => _isLoading = true);
    try {
      // Tunis coordinates mock
      final places = await _apiService.getNearbyPlaces(
        36.8065,
        10.1815,
        radius: _radius,
      );
      setState(() {
        _nearbyPlaces = places;
        _isLoading = false;
        _errorMessage = 'Using default location (Tunis) - GPS restricted';
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load nearby places.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Nearby Explorations'),
        backgroundColor: AppColors.background,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: () => _fetchNearbyPlaces(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Radius Slider
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(bottom: BorderSide(color: AppColors.divider)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Search Radius',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                    Text('${_radius.toInt()} km',
                        style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold)),
                  ],
                ),
                Slider(
                  value: _radius,
                  min: 5,
                  max: 200,
                  divisions: 39,
                  activeColor: AppColors.primary,
                  inactiveColor: AppColors.primary.withOpacity(0.2),
                  onChanged: (value) {
                    setState(() => _radius = value);
                  },
                  onChangeEnd: (_) => _fetchNearbyPlaces(),
                ),
              ],
            ),
          ),

          if (_errorMessage != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.orange.withOpacity(0.5)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.orange),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(_errorMessage!,
                          style: const TextStyle(fontSize: 13)),
                    ),
                  ],
                ),
              ),
            ).animate().fadeIn(),

          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary))
                : _nearbyPlaces.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.location_off_rounded,
                                size: 60, color: AppColors.textLight),
                            const SizedBox(height: 16),
                            const Text('No places found within this radius.'),
                          ],
                        ),
                      ).animate().fadeIn()
                    : RefreshIndicator(
                        color: AppColors.primary,
                        onRefresh: _fetchNearbyPlaces,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(24),
                          physics: const AlwaysScrollableScrollPhysics(),
                          itemCount: _nearbyPlaces.length,
                          itemBuilder: (context, index) {
                            final place = _nearbyPlaces[index];
                            final isFavorite = context
                                .watch<PlacesProvider>()
                                .isFavorite(place.id);
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: PlaceCard(
                                place: place,
                                isFavorite: isFavorite,
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        PlaceDetailScreen(placeId: place.id),
                                  ),
                                ),
                                onFavorite: () => context
                                    .read<PlacesProvider>()
                                    .toggleFavorite(place.id),
                              ),
                            ).animate().fadeIn().slideY(
                                begin: 0.1, delay: (index * 50).ms);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
