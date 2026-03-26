import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';
import '../models/place.dart';
import '../models/category.dart';
import '../models/review.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final _storage = const FlutterSecureStorage();

  Future<String?> get _token async => await _storage.read(key: 'token');

  Future<Map<String, String>> get _headers async {
    final token = await _token;
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ─── AUTH ──────────────────────────────────────────────
  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.login}'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      await _storage.write(key: 'token', value: data['accessToken']);
    }
    return {'statusCode': res.statusCode, ...data};
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.register}'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) {
      await _storage.write(key: 'token', value: data['accessToken']);
    }
    return {'statusCode': res.statusCode, ...data};
  }

  Future<void> logout() async {
    await _storage.delete(key: 'token');
  }

  Future<bool> isLoggedIn() async {
    final token = await _token;
    return token != null;
  }

  // ─── PLACES ──────────────────────────────────────────────
  Future<List<Place>> getFeatured() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.featured}'),
      headers: await _headers,
    );
    final list = jsonDecode(res.body) as List;
    return list.map((j) => Place.fromJson(j)).toList();
  }

  Future<List<Place>> getPopular() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.popular}'),
      headers: await _headers,
    );
    final list = jsonDecode(res.body) as List;
    return list.map((j) => Place.fromJson(j)).toList();
  }

  Future<Map<String, dynamic>> getPlaces({
    String? search,
    String? categoryId,
    String? city,
    int page = 1,
    int limit = 20,
    String sortBy = 'createdAt',
    String order = 'DESC',
  }) async {
    final params = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
      'sortBy': sortBy,
      'order': order,
      if (search != null) 'search': search,
      if (categoryId != null) 'categoryId': categoryId,
      if (city != null) 'city': city,
    };

    final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.places}')
        .replace(queryParameters: params);

    final res = await http.get(uri, headers: await _headers);
    final data = jsonDecode(res.body);
    return {
      'places': (data['data'] as List).map((j) => Place.fromJson(j)).toList(),
      'meta': data['meta'],
    };
  }

  Future<Place> getPlace(String id) async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.places}/$id'),
      headers: await _headers,
    );
    return Place.fromJson(jsonDecode(res.body));
  }

  Future<List<Place>> getNearbyPlaces(double lat, double lng, {double radius = 50}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.places}/nearby')
        .replace(queryParameters: {
      'lat': lat.toString(),
      'lng': lng.toString(),
      'radius': radius.toString(),
    });

    final res = await http.get(uri, headers: await _headers);
    final items = jsonDecode(res.body) as List;
    return items.map((j) => Place.fromJson(j)).toList();
  }

  Future<Place> getPlaceBySlug(String slug) async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.places}/slug/$slug'),
      headers: await _headers,
    );
    return Place.fromJson(jsonDecode(res.body));
  }

  // ─── CATEGORIES ──────────────────────────────────────
  Future<List<Category>> getCategories() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.categories}'),
      headers: await _headers,
    );
    final list = jsonDecode(res.body) as List;
    return list.map((j) => Category.fromJson(j)).toList();
  }

  // ─── REVIEWS ──────────────────────────────────────────
  Future<List<Review>> getReviews(String placeId) async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.reviews}/place/$placeId'),
      headers: await _headers,
    );
    final list = jsonDecode(res.body) as List;
    return list.map((j) => Review.fromJson(j)).toList();
  }

  Future<Review> addReview(
      String placeId, double rating, String comment) async {
    final res = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.reviews}/place/$placeId'),
      headers: await _headers,
      body: jsonEncode({'rating': rating, 'comment': comment}),
    );
    return Review.fromJson(jsonDecode(res.body));
  }

  // ─── FAVORITES ──────────────────────────────────────
  Future<List<String>> toggleFavorite(String placeId) async {
    final res = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.favorites}/$placeId'),
      headers: await _headers,
    );
    return List<String>.from(jsonDecode(res.body));
  }

  Future<List<Place>> getFavoritePlaces(List<String> ids) async {
    final res = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.places}/by-ids'),
      headers: await _headers,
      body: jsonEncode({'ids': ids}),
    );
    final list = jsonDecode(res.body) as List;
    return list.map((j) => Place.fromJson(j)).toList();
  }

  // ─── VISITED CHECKLIST ──────────────────────────────
  Future<List<String>> toggleVisited(String placeId) async {
    final res = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.visited}/$placeId'),
      headers: await _headers,
    );
    return List<String>.from(jsonDecode(res.body));
  }

  Future<List<Place>> getVisitedPlaces(List<String> ids) async {
    // Reuses the by-ids endpoint to fetch places
    final res = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.places}/by-ids'),
      headers: await _headers,
      body: jsonEncode({'ids': ids}),
    );
    final list = jsonDecode(res.body) as List;
    return list.map((j) => Place.fromJson(j)).toList();
  }

  // ─── ADMIN ──────────────────────────────────────────────
  Future<Map<String, dynamic>> getAdminStats() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.admin}/stats'),
      headers: await _headers,
    );
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> adminGetUsers({int page = 1, int limit = 20}) async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.admin}/users?page=$page&limit=$limit'),
      headers: await _headers,
    );
    return jsonDecode(res.body);
  }

  Future<void> adminUpdateUser(String userId, Map<String, dynamic> body) async {
    await http.patch(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.admin}/users/$userId'),
      headers: await _headers,
      body: jsonEncode(body),
    );
  }

  Future<void> adminBanUser(String userId) async {
    await http.patch(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.admin}/users/$userId/ban'),
      headers: await _headers,
    );
  }

  Future<void> adminUnbanUser(String userId) async {
    await http.patch(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.admin}/users/$userId/unban'),
      headers: await _headers,
    );
  }

  Future<Map<String, dynamic>> adminGetPlaces({int page = 1, int limit = 20, bool pendingOnly = false}) async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.admin}/places?page=$page&limit=$limit&pendingOnly=$pendingOnly'),
      headers: await _headers,
    );
    return jsonDecode(res.body);
  }

  Future<void> adminApprovePlace(String placeId) async {
    await http.patch(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.admin}/places/$placeId/approve'),
      headers: await _headers,
    );
  }

  Future<void> adminToggleFeature(String placeId) async {
    await http.patch(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.admin}/places/$placeId/feature'),
      headers: await _headers,
    );
  }

  Future<void> adminDeletePlace(String placeId) async {
    await http.delete(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.admin}/places/$placeId'),
      headers: await _headers,
    );
  }

  // ─── SUBSCRIPTIONS ──────────────────────────────────────
  Future<Map<String, dynamic>?> getMySubscription() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.subscriptions}/my'),
      headers: await _headers,
    );
    if (res.statusCode == 200 && res.body.isNotEmpty) {
      return jsonDecode(res.body);
    }
    return null;
  }

  Future<void> upgradePlan(String plan, String paymentMethod, {String? reference}) async {
    await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.subscriptions}/upgrade'),
      headers: await _headers,
      body: jsonEncode({
        'plan': plan,
        'paymentMethod': paymentMethod,
        if (reference != null) 'reference': reference,
      }),
    );
  }

  // ─── TIPS ──────────────────────────────────────────────
  Future<List<dynamic>> getTips({String? category}) async {
    final url = category != null
        ? '${ApiConfig.baseUrl}${ApiConfig.tips}?category=$category'
        : '${ApiConfig.baseUrl}${ApiConfig.tips}';
    final res = await http.get(Uri.parse(url), headers: await _headers);
    return jsonDecode(res.body) as List;
  }

  Future<void> addTip(String title, String content, String category) async {
    await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.tips}'),
      headers: await _headers,
      body: jsonEncode({'title': title, 'content': content, 'category': category}),
    );
  }

  Future<void> likeTip(String tipId) async {
    await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.tips}/$tipId/like'),
      headers: await _headers,
    );
  }

  // ─── EVENTS ──────────────────────────────────────────────
  Future<List<dynamic>> getEvents({String? category}) async {
    final url = category != null
        ? '${ApiConfig.baseUrl}${ApiConfig.events}?category=$category'
        : '${ApiConfig.baseUrl}${ApiConfig.events}';
    final res = await http.get(Uri.parse(url), headers: await _headers);
    return jsonDecode(res.body) as List;
  }

  Future<void> attendEvent(String eventId) async {
    await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.events}/$eventId/attend'),
      headers: await _headers,
    );
  }

  // ─── ITINERARIES ──────────────────────────────────────
  Future<List<dynamic>> getItineraries() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.itineraries}'),
      headers: await _headers,
    );
    return jsonDecode(res.body) as List;
  }

  // ─── COLLECTIONS ──────────────────────────────────────
  Future<List<dynamic>> getCollections() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.collections}'),
      headers: await _headers,
    );
    return jsonDecode(res.body) as List;
  }

  // ─── SPONSORS ──────────────────────────────────────────
  Future<List<dynamic>> getSponsors() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.sponsors}'),
      headers: await _headers,
    );
    return jsonDecode(res.body) as List;
  }

  Future<void> trackSponsorClick(String sponsorId) async {
    await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.sponsors}/$sponsorId/click'),
      headers: await _headers,
    );
  }

  // ─── ADS ──────────────────────────────────────────────
  Future<List<dynamic>> getAds({String? placement}) async {
    final url = placement != null
        ? '${ApiConfig.baseUrl}${ApiConfig.ads}?placement=$placement'
        : '${ApiConfig.baseUrl}${ApiConfig.ads}';
    final res = await http.get(Uri.parse(url), headers: await _headers);
    return jsonDecode(res.body) as List;
  }

  Future<void> trackAdImpression(String adId) async {
    await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.ads}/$adId/impression'),
      headers: await _headers,
    );
  }

  Future<void> trackAdClick(String adId) async {
    await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.ads}/$adId/click'),
      headers: await _headers,
    );
  }

  // ─── GAMIFICATION ──────────────────────────────────────
  Future<List<dynamic>> getAllBadges() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.gamification}/badges'),
      headers: await _headers,
    );
    return jsonDecode(res.body) as List;
  }

  Future<List<dynamic>> getMyBadges() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.gamification}/my-badges'),
      headers: await _headers,
    );
    return jsonDecode(res.body) as List;
  }

  Future<Map<String, dynamic>> getMyPoints() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.gamification}/my-points'),
      headers: await _headers,
    );
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> getMyRank() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.gamification}/my-rank'),
      headers: await _headers,
    );
    return jsonDecode(res.body);
  }

  Future<List<dynamic>> getLeaderboard({int limit = 20}) async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.gamification}/leaderboard?limit=$limit'),
      headers: await _headers,
    );
    return jsonDecode(res.body) as List;
  }

  // ─── NOTIFICATIONS ──────────────────────────────────────
  Future<List<dynamic>> getNotifications() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.notifications}'),
      headers: await _headers,
    );
    return jsonDecode(res.body) as List;
  }

  Future<Map<String, dynamic>> getUnreadCount() async {
    final res = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.notifications}/unread-count'),
      headers: await _headers,
    );
    return jsonDecode(res.body);
  }

  Future<void> markNotificationRead(String id) async {
    await http.patch(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.notifications}/$id/read'),
      headers: await _headers,
    );
  }

  Future<void> markAllNotificationsRead() async {
    await http.patch(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.notifications}/read-all'),
      headers: await _headers,
    );
  }

  // ─── CONTACT ──────────────────────────────────────────
  Future<void> submitContactForm(Map<String, dynamic> data) async {
    await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.contact}'),
      headers: await _headers,
      body: jsonEncode(data),
    );
  }
}