class AdModel {
  final String id;
  final String title;
  final String? imageUrl;
  final String? targetUrl;
  final String? advertiserName;
  final String placement;
  final String? description;
  final bool isActive;

  AdModel({
    required this.id,
    required this.title,
    this.imageUrl,
    this.targetUrl,
    this.advertiserName,
    this.placement = 'home',
    this.description,
    this.isActive = true,
  });

  factory AdModel.fromJson(Map<String, dynamic> json) {
    return AdModel(
      id: json['id'],
      title: json['title'] ?? '',
      imageUrl: json['imageUrl'],
      targetUrl: json['targetUrl'],
      advertiserName: json['advertiserName'],
      placement: json['placement'] ?? 'home',
      description: json['description'],
      isActive: json['isActive'] ?? true,
    );
  }
}
