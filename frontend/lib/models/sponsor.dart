class Sponsor {
  final String id;
  final String name;
  final String? logo;
  final String? description;
  final String? website;
  final String tier; // gold, silver, bronze
  final bool isActive;
  final int clickCount;
  final int impressionCount;

  Sponsor({
    required this.id,
    required this.name,
    this.logo,
    this.description,
    this.website,
    this.tier = 'bronze',
    this.isActive = true,
    this.clickCount = 0,
    this.impressionCount = 0,
  });

  factory Sponsor.fromJson(Map<String, dynamic> json) {
    return Sponsor(
      id: json['id'],
      name: json['name'] ?? '',
      logo: json['logo'],
      description: json['description'],
      website: json['website'],
      tier: json['tier'] ?? 'bronze',
      isActive: json['isActive'] ?? true,
      clickCount: json['clickCount'] ?? 0,
      impressionCount: json['impressionCount'] ?? 0,
    );
  }
}
