class ApiConfig {
  //static const String baseUrl = 'http://10.0.2.2:3000/api/v1'; // Android emulator
   static const String baseUrl = 'http://localhost:3000/api/v1'; // iOS simulator
  // static const String baseUrl = 'https://api.etunisia.com/api/v1'; // Production

  static const String auth = '/auth';
  static const String login = '$auth/login';
  static const String register = '$auth/register';

  static const String users = '/users';
  static const String profile = '$users/me';
  static const String favorites = '$users/favorites';
  static const String visited = '$users/visited';

  static const String places = '/places';
  static const String featured = '$places/featured';
  static const String popular = '$places/popular';
  static const String nearby = '$places/nearby';

  static const String categories = '/categories';
  static const String reviews = '/reviews';
  static const String media = '/media';

  // New endpoints
  static const String admin = '/admin';
  static const String subscriptions = '/subscriptions';
  static const String tips = '/tips';
  static const String events = '/events';
  static const String itineraries = '/itineraries';
  static const String collections = '/collections';

  static const Duration timeout = Duration(seconds: 30);
}