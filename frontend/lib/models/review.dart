import 'user.dart';

class Review {
  final String id;
  final double rating;
  final String comment;
  final List<String> images;
  final User? user;
  final String placeId;
  final DateTime createdAt;

  Review({
    required this.id,
    required this.rating,
    required this.comment,
    this.images = const [],
    this.user,
    required this.placeId,
    required this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'],
      rating: (json['rating'] as num).toDouble(),
      comment: json['comment'] ?? '',
      images: json['images'] != null ? List<String>.from(json['images']) : [],
      user: json['user'] != null ? User.fromJson(json['user']) : null,
      placeId: json['placeId'] ?? '',
      createdAt: DateTime.parse(
          json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}