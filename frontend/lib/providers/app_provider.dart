import 'package:flutter/material.dart';

class AppProvider extends ChangeNotifier {
  int _currentNavIndex = 0;
  bool _isDarkMode = false;
  String _language = 'en';

  int get currentNavIndex => _currentNavIndex;
  bool get isDarkMode => _isDarkMode;
  String get language => _language;

  void setNavIndex(int index) {
    _currentNavIndex = index;
    notifyListeners();
  }

  void toggleTheme() {
    _isDarkMode = !_isDarkMode;
    notifyListeners();
  }

  void setLanguage(String lang) {
    _language = lang;
    notifyListeners();
  }
}