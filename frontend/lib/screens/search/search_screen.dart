import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/places_provider.dart';
import '../../widgets/place_card.dart';
import '../detail/place_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchC = TextEditingController();
  final _focusNode = FocusNode();

  final _recentSearches = [
    'Sidi Bou Said',
    'Couscous',
    'Djerba beaches',
    'El Jem',
    'Medina Tunis',
  ];

  final _trendingTags = [
    '🏛️ Historical',
    '🍽️ Food',
    '🏖️ Beaches',
    '🎨 Artisanat',
    '🏜️ Sahara',
    '🕌 Mosques',
  ];

  @override
  void initState() {
    super.initState();
    _focusNode.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PlacesProvider>();

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Search Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.divider),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new_rounded,
                          size: 18),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _searchC,
                      focusNode: _focusNode,
                      onChanged: (val) {
                        if (val.length > 2) {
                          provider.searchPlaces(val);
                        }
                        setState(() {});
                      },
                      decoration: InputDecoration(
                        hintText: 'Search Tunisia...',
                        prefixIcon: const Icon(Icons.search_rounded),
                        suffixIcon: _searchC.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.close_rounded),
                                onPressed: () {
                                  _searchC.clear();
                                  setState(() {});
                                },
                              )
                            : null,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 14),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Content
            Expanded(
              child: _searchC.text.isEmpty
                  ? _buildSuggestions()
                  : _buildResults(provider),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestions() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Recent Searches',
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          ...List.generate(_recentSearches.length, (i) {
            return ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.history_rounded,
                  color: AppColors.textLight),
              title: Text(_recentSearches[i]),
              trailing: const Icon(Icons.north_west_rounded,
                  size: 16, color: AppColors.textLight),
              onTap: () {
                _searchC.text = _recentSearches[i];
                setState(() {});
                context.read<PlacesProvider>().searchPlaces(_recentSearches[i]);
              },
            ).animate().fadeIn(delay: (i * 60).ms);
          }),

          const SizedBox(height: 24),

          Text('Trending 🔥',
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _trendingTags.map((tag) {
              return GestureDetector(
                onTap: () {
                  _searchC.text = tag.replaceAll(RegExp(r'[^\w\s]'), '').trim();
                  setState(() {});
                  context.read<PlacesProvider>().searchPlaces(_searchC.text);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: AppColors.primary.withOpacity(0.15)),
                  ),
                  child: Text(
                    tag,
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildResults(PlacesProvider provider) {
    if (provider.isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    if (provider.searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off_rounded,
                size: 64, color: AppColors.textLight),
            const SizedBox(height: 16),
            Text('No results found',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text('Try different keywords',
                style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: provider.searchResults.length,
      itemBuilder: (context, i) {
        final place = provider.searchResults[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: PlaceCard(
            place: place,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PlaceDetailScreen(placeId: place.id),
              ),
            ),
            isFavorite: provider.isFavorite(place.id),
            onFavorite: () => provider.toggleFavorite(place.id),
          ),
        ).animate().fadeIn(delay: (i * 80).ms).slideY(begin: 0.1);
      },
    );
  }
}