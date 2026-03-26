class Badge {
  final String id;
  final String name;
  final String description;
  final String icon;
  final String category;
  final int pointsRequired;
  final String? requirement;
  final bool isEarned;
  final DateTime? earnedAt;

  Badge({
    required this.id,
    required this.name,
    this.description = '',
    required this.icon,
    this.category = 'explorer',
    this.pointsRequired = 0,
    this.requirement,
    this.isEarned = false,
    this.earnedAt,
  });

  factory Badge.fromJson(Map<String, dynamic> json) {
    return Badge(
      id: json['id'],
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      icon: json['icon'] ?? '🏅',
      category: json['category'] ?? 'explorer',
      pointsRequired: json['pointsRequired'] ?? 0,
      requirement: json['requirement'],
    );
  }

  Badge copyWith({bool? isEarned, DateTime? earnedAt}) {
    return Badge(
      id: id,
      name: name,
      description: description,
      icon: icon,
      category: category,
      pointsRequired: pointsRequired,
      requirement: requirement,
      isEarned: isEarned ?? this.isEarned,
      earnedAt: earnedAt ?? this.earnedAt,
    );
  }
}
