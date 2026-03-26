import 'package:flutter/material.dart';
import '../models/place.dart';
import '../models/category.dart';
import '../services/api_service.dart';

class PlacesProvider extends ChangeNotifier {
  final _api = ApiService();

  List<Place> _featured = [];
  List<Place> _popular = [];
  List<Place> _searchResults = [];
  List<Category> _categories = [];
  List<String> _favoriteIds = [];
  List<String> _visitedIds = [];
  Place? _selectedPlace;
  bool _isLoading = false;
  String? _error;

  List<Place> get featured => _featured;
  List<Place> get popular => _popular;
  List<Place> get searchResults => _searchResults;
  List<Category> get categories => _categories;
  List<String> get favoriteIds => _favoriteIds;
  List<String> get visitedIds => _visitedIds;
  Place? get selectedPlace => _selectedPlace;
  bool get isLoading => _isLoading;
  String? get error => _error;

  bool isFavorite(String placeId) => _favoriteIds.contains(placeId);
  bool isVisited(String placeId) => _visitedIds.contains(placeId);

  Future<void> loadHomeData() async {
    _isLoading = true;
    notifyListeners();

    try {
      final results = await Future.wait([
        _api.getFeatured(),
        _api.getPopular(),
        _api.getCategories(),
      ]);

      _featured = results[0] as List<Place>;
      _popular = results[1] as List<Place>;
      _categories = results[2] as List<Category>;
      _error = null;
    } catch (e) {
      _error = 'Failed to load data';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadPlace(String id) async {
    _isLoading = true;
    notifyListeners();

    try {
      _selectedPlace = await _api.getPlace(id);
      _error = null;
    } catch (e) {
      _error = 'Failed to load place';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> searchPlaces(String query, {String? categoryId}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await _api.getPlaces(
        search: query,
        categoryId: categoryId,
      );
      _searchResults = result['places'] as List<Place>;
      _error = null;
    } catch (e) {
      _error = 'Search failed';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> toggleFavorite(String placeId) async {
    // Optimistic update
    if (_favoriteIds.contains(placeId)) {
      _favoriteIds.remove(placeId);
    } else {
      _favoriteIds.add(placeId);
    }
    notifyListeners();

    try {
      _favoriteIds = await _api.toggleFavorite(placeId);
    } catch (_) {}
    notifyListeners();
  }

  Future<void> toggleVisited(String placeId) async {
    // Optimistic update
    if (_visitedIds.contains(placeId)) {
      _visitedIds.remove(placeId);
    } else {
      _visitedIds.add(placeId);
    }
    notifyListeners();

    try {
      _visitedIds = await _api.toggleVisited(placeId);
    } catch (_) {}
    notifyListeners();
  }
}