import 'package:flutter/material.dart' hide Badge;
import '../models/badge.dart';
import '../services/api_service.dart';

class GamificationProvider extends ChangeNotifier {
  final _api = ApiService();

  List<Badge> _allBadges = [];
  List<String> _earnedBadgeIds = [];
  int _points = 0;
  int _level = 1;
  int _nextLevelPoints = 100;
  int _rank = 0;
  List<Map<String, dynamic>> _leaderboard = [];
  bool _isLoading = false;

  List<Badge> get allBadges => _allBadges;
  List<Badge> get earnedBadges => _allBadges.where((b) => b.isEarned).toList();
  int get earnedCount => _earnedBadgeIds.length;
  int get totalBadges => _allBadges.length;
  int get points => _points;
  int get level => _level;
  int get nextLevelPoints => _nextLevelPoints;
  int get rank => _rank;
  List<Map<String, dynamic>> get leaderboard => _leaderboard;
  bool get isLoading => _isLoading;

  double get levelProgress {
    if (_nextLevelPoints <= 0) return 1.0;
    final prevThreshold = _getPrevThreshold(_nextLevelPoints);
    final range = _nextLevelPoints - prevThreshold;
    if (range <= 0) return 1.0;
    return ((_points - prevThreshold) / range).clamp(0.0, 1.0);
  }

  int _getPrevThreshold(int nextThreshold) {
    const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000];
    for (int i = thresholds.length - 1; i >= 0; i--) {
      if (thresholds[i] < nextThreshold) return thresholds[i];
    }
    return 0;
  }

  Future<void> loadAll() async {
    _isLoading = true;
    notifyListeners();

    try {
      final results = await Future.wait([
        _api.getAllBadges(),
        _api.getMyPoints(),
        _api.getLeaderboard(limit: 10),
      ]);

      final allBadgesJson = results[0] as List;
      final pointsData = results[1] as Map<String, dynamic>;
      _leaderboard = List<Map<String, dynamic>>.from(results[2] as List);

      _allBadges = allBadgesJson.map((j) => Badge.fromJson(j)).toList();
      _points = pointsData['points'] ?? 0;
      _level = pointsData['level'] ?? 1;
      _nextLevelPoints = pointsData['nextLevelPoints'] ?? 100;

      // Try to load earned badges
      try {
        final earned = await _api.getMyBadges();
        _earnedBadgeIds = earned.map<String>((e) => (e['badgeId'] ?? e['badge']?['id'] ?? '').toString()).toList();
        _allBadges = _allBadges.map((b) {
          if (_earnedBadgeIds.contains(b.id)) {
            return b.copyWith(isEarned: true);
          }
          return b;
        }).toList();
      } catch (_) {}

      // Try to load rank
      try {
        final rankData = await _api.getMyRank();
        _rank = rankData['rank'] ?? 0;
      } catch (_) {}
    } catch (_) {}

    _isLoading = false;
    notifyListeners();
  }
}
