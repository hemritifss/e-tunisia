import 'package:flutter/foundation.dart';
import '../models/ad.dart';
import '../services/api_service.dart';

class AdsProvider with ChangeNotifier {
  List<AdModel> _homeAds = [];
  List<AdModel> _detailAds = [];
  List<AdModel> _feedAds = [];
  List<AdModel> _searchAds = [];
  bool _isLoading = false;

  List<AdModel> get homeAds => _homeAds;
  List<AdModel> get detailAds => _detailAds;
  List<AdModel> get feedAds => _feedAds;
  List<AdModel> get searchAds => _searchAds;
  bool get isLoading => _isLoading;

  Future<void> loadAds() async {
    if (_isLoading) return;
    _isLoading = true;
    notifyListeners();
    try {
      final data = await ApiService().getAds();
      final allAds = data.map((j) => AdModel.fromJson(j)).toList();
      _homeAds = allAds.where((a) => a.placement == 'home').toList();
      _detailAds = allAds.where((a) => a.placement == 'detail').toList();
      _feedAds = allAds.where((a) => a.placement == 'feed').toList();
      _searchAds = allAds.where((a) => a.placement == 'search').toList();
    } catch (e) {
      debugPrint('Error loading ads: $e');
    }
    _isLoading = false;
    notifyListeners();
  }
}
