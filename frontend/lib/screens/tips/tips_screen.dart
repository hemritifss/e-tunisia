import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';

class TipsScreen extends StatefulWidget {
  const TipsScreen({super.key});

  @override
  State<TipsScreen> createState() => _TipsScreenState();
}

class _TipsScreenState extends State<TipsScreen> {
  List<dynamic> tips = [];
  bool isLoading = true;
  String selectedCategory = 'all';

  final categories = [
    {'key': 'all', 'label': '🌍 All'},
    {'key': 'food', 'label': '🍽️ Food'},
    {'key': 'transport', 'label': '🚌 Transport'},
    {'key': 'cultural', 'label': '🕌 Cultural'},
    {'key': 'safety', 'label': '🛡️ Safety'},
    {'key': 'money', 'label': '💰 Money'},
  ];

  @override
  void initState() {
    super.initState();
    _loadTips();
  }

  Future<void> _loadTips() async {
    setState(() => isLoading = true);
    try {
      final data = await ApiService().getTips(
        category: selectedCategory == 'all' ? null : selectedCategory,
      );
      setState(() {
        tips = data;
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
        title: const Text('Travel Tips'),
        centerTitle: true,
        elevation: 0,
      ),
      body: Column(
        children: [
          // ─── Category Chips ─────────────────
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: categories.length,
              itemBuilder: (context, i) {
                final cat = categories[i];
                final isSelected = selectedCategory == cat['key'];
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(cat['label'] as String),
                    selected: isSelected,
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                    onSelected: (_) {
                      setState(() => selectedCategory = cat['key'] as String);
                      _loadTips();
                    },
                  ),
                );
              },
            ),
          ),

          // ─── Tips List ─────────────────
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : tips.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.tips_and_updates_outlined,
                                size: 64, color: AppColors.textLight),
                            const SizedBox(height: 16),
                            Text('No tips yet',
                                style: TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 16)),
                            const SizedBox(height: 8),
                            Text('Be the first to share a tip!',
                                style: TextStyle(
                                    color: AppColors.textLight, fontSize: 14)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadTips,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: tips.length,
                          itemBuilder: (context, index) {
                            final tip = tips[index];
                            return _TipCard(tip: tip);
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateTipDialog(context),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Share Tip',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
    );
  }

  void _showCreateTipDialog(BuildContext context) {
    final titleCtrl = TextEditingController();
    final contentCtrl = TextEditingController();
    String category = 'general';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.fromLTRB(
          24,
          24,
          24,
          MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Share a Travel Tip',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            TextField(
              controller: titleCtrl,
              decoration: InputDecoration(
                labelText: 'Title',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: contentCtrl,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: 'Your tip...',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () async {
                  if (titleCtrl.text.isNotEmpty && contentCtrl.text.isNotEmpty) {
                    await ApiService().addTip(
                      titleCtrl.text,
                      contentCtrl.text,
                      category,
                    );
                    Navigator.pop(context);
                    _loadTips();
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Submit Tip',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TipCard extends StatefulWidget {
  final dynamic tip;
  const _TipCard({required this.tip});

  @override
  State<_TipCard> createState() => _TipCardState();
}

class _TipCardState extends State<_TipCard> {
  late int likes;

  @override
  void initState() {
    super.initState();
    likes = widget.tip['likes'] ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.primary.withOpacity(0.1),
                child: Text(
                  (widget.tip['author']?['fullName'] ?? 'U')[0].toUpperCase(),
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.tip['author']?['fullName'] ?? 'Anonymous',
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    Text(
                      widget.tip['category']?.toString().toUpperCase() ?? '',
                      style: TextStyle(
                          color: AppColors.textLight,
                          fontSize: 11,
                          fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            widget.tip['title'] ?? '',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
          ),
          const SizedBox(height: 6),
          Text(
            widget.tip['content'] ?? '',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
              height: 1.5,
            ),
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              GestureDetector(
                onTap: () async {
                  await ApiService().likeTip(widget.tip['id']);
                  setState(() => likes += 1);
                },
                child: Row(
                  children: [
                    Icon(Icons.favorite_border_rounded,
                        size: 20, color: AppColors.textLight),
                    const SizedBox(width: 4),
                    Text('$likes',
                        style: TextStyle(
                            color: AppColors.textSecondary, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
