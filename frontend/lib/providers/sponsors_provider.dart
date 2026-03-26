import 'package:flutter/foundation.dart';
import '../models/sponsor.dart';
import '../services/api_service.dart';

class SponsorsProvider with ChangeNotifier {
  List<Sponsor> _sponsors = [];
  bool _isLoading = false;

  List<Sponsor> get sponsors => _sponsors;
  bool get isLoading => _isLoading;

  Future<void> loadSponsors() async {
    if (_isLoading) return;
    _isLoading = true;
    notifyListeners();
    try {
      final data = await ApiService().getSponsors();
      _sponsors = data.map((j) => Sponsor.fromJson(j)).toList();
    } catch (e) {
      debugPrint('Error loading sponsors: $e');
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> clickSponsor(String id) async {
    try {
      await ApiService().trackSponsorClick(id);
    } catch (e) {
      debugPrint('Error tracking sponsor click: $e');
    }
  }
}
