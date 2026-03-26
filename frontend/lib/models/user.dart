class User {
  final String id;
  final String fullName;
  final String email;
  final String? avatar;
  final String? phone;
  final String? country;
  final String role;
  final List<String> favoriteIds;
  final List<String> visitedPlaceIds;

  User({
    required this.id,
    required this.fullName,
    required this.email,
    this.avatar,
    this.phone,
    this.country,
    this.role = 'user',
    this.favoriteIds = const [],
    this.visitedPlaceIds = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      avatar: json['avatar'],
      phone: json['phone'],
      country: json['country'],
      role: json['role'] ?? 'user',
      favoriteIds: json['favoriteIds'] != null
          ? List<String>.from(json['favoriteIds'])
          : [],
      visitedPlaceIds: json['visitedPlaceIds'] != null
          ? List<String>.from(json['visitedPlaceIds'])
          : [],
    );
  }
}