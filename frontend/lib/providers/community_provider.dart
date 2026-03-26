import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../services/api_service.dart';

class CommunityProvider extends ChangeNotifier {
  final _api = ApiService();

  List<Map<String, dynamic>> _events = [];
  List<Map<String, dynamic>> _tips = [];
  List<Map<String, dynamic>> _itineraries = [];
  List<Map<String, dynamic>> _collections = [];
  List<Map<String, dynamic>> _activityFeed = [];
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get events => _events;
  List<Map<String, dynamic>> get tips => _tips;
  List<Map<String, dynamic>> get itineraries => _itineraries;
  List<Map<String, dynamic>> get collections => _collections;
  List<Map<String, dynamic>> get activityFeed => _activityFeed;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadCommunityData() async {
    _isLoading = true;
    notifyListeners();

    try {
      final results = await Future.wait([
        _fetchJson('${ApiConfig.baseUrl}${ApiConfig.events}'),
        _fetchJson('${ApiConfig.baseUrl}${ApiConfig.tips}'),
        _fetchJson('${ApiConfig.baseUrl}${ApiConfig.itineraries}'),
        _fetchJson('${ApiConfig.baseUrl}${ApiConfig.collections}'),
      ]);

      _events = List<Map<String, dynamic>>.from(results[0]);
      _tips = List<Map<String, dynamic>>.from(results[1]);
      _itineraries = List<Map<String, dynamic>>.from(results[2]);
      _collections = List<Map<String, dynamic>>.from(results[3]);
      _buildActivityFeed();
      _error = null;
    } catch (e) {
      _error = 'Failed to load community data';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<List<dynamic>> _fetchJson(String url) async {
    final res = await http.get(Uri.parse(url), headers: {
      'Content-Type': 'application/json',
    });
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as List;
    }
    return [];
  }

  void _buildActivityFeed() {
    _activityFeed = [];

    // Convert events to feed items
    for (final e in _events) {
      _activityFeed.add({
        'type': 'event',
        'title': e['title'] ?? '',
        'subtitle': e['location'] ?? e['category'] ?? '',
        'description': e['description'] ?? '',
        'icon': 'event',
        'color': 0xFF6C5CE7,
        'date': e['startDate'] ?? e['createdAt'] ?? '',
        'isFree': e['isFree'] ?? false,
        'attendeeCount': e['attendeeCount'] ?? 0,
        'data': e,
      });
    }

    // Convert tips to feed items
    for (final t in _tips) {
      _activityFeed.add({
        'type': 'tip',
        'title': t['title'] ?? '',
        'subtitle': t['category'] ?? 'general',
        'description': t['content'] ?? '',
        'icon': 'lightbulb',
        'color': 0xFFFF9F43,
        'date': t['createdAt'] ?? '',
        'likes': t['likes'] ?? 0,
        'data': t,
      });
    }

    // Convert itineraries to feed items
    for (final i in _itineraries) {
      _activityFeed.add({
        'type': 'itinerary',
        'title': i['title'] ?? '',
        'subtitle': '${i['duration'] ?? 1} days • ${i['difficulty'] ?? 'easy'}',
        'description': i['description'] ?? '',
        'icon': 'route',
        'color': 0xFF00B894,
        'date': i['createdAt'] ?? '',
        'likeCount': i['likeCount'] ?? 0,
        'viewCount': i['viewCount'] ?? 0,
        'data': i,
      });
    }

    // Sort by date (newest first)
    _activityFeed.sort((a, b) {
      final dateA = DateTime.tryParse(a['date'] ?? '') ?? DateTime(2000);
      final dateB = DateTime.tryParse(b['date'] ?? '') ?? DateTime(2000);
      return dateB.compareTo(dateA);
    });
  }
}
