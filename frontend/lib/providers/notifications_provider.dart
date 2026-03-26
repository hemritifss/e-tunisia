import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';

class NotificationsProvider extends ChangeNotifier {
  final _api = ApiService();

  List<NotificationModel> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;

  List<NotificationModel> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;

  Future<void> loadNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      final list = await _api.getNotifications();
      _notifications = list.map((j) => NotificationModel.fromJson(j)).toList();
      _unreadCount = _notifications.where((n) => !n.isRead).length;
    } catch (_) {
      // Silently handle - notifications are non-critical
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadUnreadCount() async {
    try {
      final result = await _api.getUnreadCount();
      _unreadCount = result['unreadCount'] ?? 0;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> markRead(String id) async {
    final idx = _notifications.indexWhere((n) => n.id == id);
    if (idx >= 0) {
      _notifications[idx] = NotificationModel(
        id: _notifications[idx].id,
        title: _notifications[idx].title,
        body: _notifications[idx].body,
        type: _notifications[idx].type,
        isRead: true,
        data: _notifications[idx].data,
        createdAt: _notifications[idx].createdAt,
      );
      _unreadCount = _notifications.where((n) => !n.isRead).length;
      notifyListeners();
    }
    try {
      await _api.markNotificationRead(id);
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    for (int i = 0; i < _notifications.length; i++) {
      _notifications[i] = NotificationModel(
        id: _notifications[i].id,
        title: _notifications[i].title,
        body: _notifications[i].body,
        type: _notifications[i].type,
        isRead: true,
        data: _notifications[i].data,
        createdAt: _notifications[i].createdAt,
      );
    }
    _unreadCount = 0;
    notifyListeners();
    try {
      await _api.markAllNotificationsRead();
    } catch (_) {}
  }
}
