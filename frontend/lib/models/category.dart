class Category {
  final String id;
  final String name;
  final String nameAr;
  final String nameFr;
  final String? description;
  final String? icon;
  final String? image;
  final String? color;
  final int sortOrder;
  final int placeCount;

  Category({
    required this.id,
    required this.name,
    required this.nameAr,
    required this.nameFr,
    this.description,
    this.icon,
    this.image,
    this.color,
    this.sortOrder = 0,
    this.placeCount = 0,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'],
      name: json['name'] ?? '',
      nameAr: json['nameAr'] ?? '',
      nameFr: json['nameFr'] ?? '',
      description: json['description'],
      icon: json['icon'],
      image: json['image'],
      color: json['color'],
      sortOrder: json['sortOrder'] ?? 0,
      placeCount: (json['places'] as List?)?.length ?? 0,
    );
  }
}