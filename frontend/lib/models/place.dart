import 'category.dart';
import 'review.dart';

class Place {
  final String id;
  final String name;
  final String? nameAr;
  final String? nameFr;
  final String slug;
  final String description;
  final String? descriptionAr;
  final String? descriptionFr;
  final String address;
  final String city;
  final String governorate;
  final double latitude;
  final double longitude;
  final List<String> images;
  final String? coverImage;
  final String? videoUrl;
  final String? website;
  final String? phone;
  final String? openingHours;
  final String? priceRange;
  final double rating;
  final int reviewCount;
  final int viewCount;
  final List<String> tags;
  final bool isFeatured;
  final bool isBoosted;
  final String? categoryId;
  final Category? category;
  final List<Review> reviews;
  final DateTime createdAt;

  Place({
    required this.id,
    required this.name,
    this.nameAr,
    this.nameFr,
    required this.slug,
    required this.description,
    this.descriptionAr,
    this.descriptionFr,
    required this.address,
    required this.city,
    required this.governorate,
    required this.latitude,
    required this.longitude,
    this.images = const [],
    this.coverImage,
    this.videoUrl,
    this.website,
    this.phone,
    this.openingHours,
    this.priceRange,
    this.rating = 0,
    this.reviewCount = 0,
    this.viewCount = 0,
    this.tags = const [],
    this.isFeatured = false,
    this.isBoosted = false,
    this.categoryId,
    this.category,
    this.reviews = const [],
    required this.createdAt,
  });

  String get displayImage =>
      coverImage ?? (images.isNotEmpty ? images.first : '');

  factory Place.fromJson(Map<String, dynamic> json) {
    return Place(
      id: json['id'],
      name: json['name'] ?? '',
      nameAr: json['nameAr'],
      nameFr: json['nameFr'],
      slug: json['slug'] ?? '',
      description: json['description'] ?? '',
      descriptionAr: json['descriptionAr'],
      descriptionFr: json['descriptionFr'],
      address: json['address'] ?? '',
      city: json['city'] ?? '',
      governorate: json['governorate'] ?? '',
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      images: json['images'] != null
          ? List<String>.from(json['images'])
          : [],
      coverImage: json['coverImage'],
      videoUrl: json['videoUrl'],
      website: json['website'],
      phone: json['phone'],
      openingHours: json['openingHours'],
      priceRange: json['priceRange'],
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: json['reviewCount'] ?? 0,
      viewCount: json['viewCount'] ?? 0,
      tags: json['tags'] != null ? List<String>.from(json['tags']) : [],
      isFeatured: json['isFeatured'] ?? false,
      isBoosted: json['isBoosted'] ?? false,
      categoryId: json['categoryId'],
      category: json['category'] != null
          ? Category.fromJson(json['category'])
          : null,
      reviews: json['reviews'] != null
          ? (json['reviews'] as List).map((r) => Review.fromJson(r)).toList()
          : [],
      createdAt: DateTime.parse(
          json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}