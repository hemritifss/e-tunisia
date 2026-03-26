class NotificationModel {
  final String id;
  final String title;
  final String body;
  final String type; // event, tip, badge, sponsor, system, promo
  final bool isRead;
  final Map<String, dynamic>? data;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    this.type = 'system',
    this.isRead = false,
    this.data,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'],
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      type: json['type'] ?? 'system',
      isRead: json['isRead'] ?? false,
      data: json['data'],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  String get icon {
    switch (type) {
      case 'event': return '🎪';
      case 'tip': return '💡';
      case 'badge': return '🏅';
      case 'sponsor': return '🤝';
      case 'promo': return '💎';
      default: return '🔔';
    }
  }
}
