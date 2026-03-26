import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  List<dynamic> users = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    setState(() => isLoading = true);
    try {
      final data = await ApiService().adminGetUsers();
      setState(() {
        users = data['data'] ?? [];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Users'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : users.isEmpty
              ? const Center(child: Text('No users found'))
              : RefreshIndicator(
                  onRefresh: _loadUsers,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: users.length,
                    itemBuilder: (context, index) {
                      final user = users[index];
                      final isActive = user['isActive'] ?? true;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: CircleAvatar(
                            backgroundColor: isActive
                                ? AppColors.primary.withOpacity(0.1)
                                : Colors.red.withOpacity(0.1),
                            child: Text(
                              (user['fullName'] ?? 'U')[0].toUpperCase(),
                              style: TextStyle(
                                color: isActive
                                    ? AppColors.primary
                                    : Colors.red,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          title: Text(
                            user['fullName'] ?? 'Unknown',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(user['email'] ?? ''),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  _RoleBadge(role: user['role'] ?? 'user'),
                                  const SizedBox(width: 8),
                                  _PlanBadge(plan: user['plan'] ?? 'free'),
                                  if (!isActive) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.red.withOpacity(0.1),
                                        borderRadius:
                                            BorderRadius.circular(8),
                                      ),
                                      child: const Text('BANNED',
                                          style: TextStyle(
                                              color: Colors.red,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700)),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                          trailing: PopupMenuButton<String>(
                            onSelected: (action) =>
                                _handleAction(action, user['id']),
                            itemBuilder: (_) => [
                              if (isActive)
                                const PopupMenuItem(
                                    value: 'ban', child: Text('🚫 Ban User'))
                              else
                                const PopupMenuItem(
                                    value: 'unban',
                                    child: Text('✅ Unban User')),
                              const PopupMenuItem(
                                  value: 'promote',
                                  child: Text('⭐ Make Creator')),
                              const PopupMenuItem(
                                  value: 'admin',
                                  child: Text('🛡️ Make Admin')),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  void _handleAction(String action, String userId) async {
    try {
      switch (action) {
        case 'ban':
          await ApiService().adminBanUser(userId);
          break;
        case 'unban':
          await ApiService().adminUnbanUser(userId);
          break;
        case 'promote':
          await ApiService().adminUpdateUser(userId, {'role': 'creator'});
          break;
        case 'admin':
          await ApiService().adminUpdateUser(userId, {'role': 'admin'});
          break;
      }
      _loadUsers();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Action failed: $e')),
        );
      }
    }
  }
}

class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});

  @override
  Widget build(BuildContext context) {
    final colors = {
      'admin': Colors.purple,
      'creator': Colors.orange,
      'user': Colors.grey,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: (colors[role] ?? Colors.grey).withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        role.toUpperCase(),
        style: TextStyle(
          color: colors[role] ?? Colors.grey,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _PlanBadge extends StatelessWidget {
  final String plan;
  const _PlanBadge({required this.plan});

  @override
  Widget build(BuildContext context) {
    final colors = {
      'premium': const Color(0xFFF59E0B),
      'business': const Color(0xFF8B5CF6),
      'free': Colors.grey,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: (colors[plan] ?? Colors.grey).withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        plan.toUpperCase(),
        style: TextStyle(
          color: colors[plan] ?? Colors.grey,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
