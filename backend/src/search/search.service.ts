import { Injectable, OnModuleInit } from '@nestjs/common';
const MeiliSearch = require('meilisearch').MeiliSearch;
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from '../places/place.entity';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';
import { applyFuzzy, ensureFuzzySearch } from '../common/fuzzy-search';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: any;
  private isReady = false;
  /** Connection is Postgres — enables ILIKE and the trigram fallback path. */
  private isPg = false;
  /** pg_trgm/unaccent installed — the DB fallback can do typo/accent-tolerant search. */
  private fuzzyReady = false;

  constructor(
    @InjectRepository(Place) private placesRepo: Repository<Place>,
    @InjectRepository(Post) private postsRepo: Repository<Post>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {
    // Only wire Meilisearch when explicitly configured; otherwise search()
    // falls back to DB queries. Guard the constructor too — the meilisearch
    // package export shape varies across versions (can be undefined here).
    const host = process.env.MEILISEARCH_HOST;
    const apiKey = process.env.MEILISEARCH_API_KEY || '';
    if (host && typeof MeiliSearch === 'function') {
      try {
        this.client = new MeiliSearch({ host, apiKey });
      } catch {
        this.client = undefined;
      }
    }
  }

  async onModuleInit() {
    // Prepare the DB fuzzy fallback regardless of whether Meilisearch is configured.
    this.isPg = this.placesRepo.manager.connection.options.type === 'postgres';
    this.fuzzyReady = await ensureFuzzySearch(this.placesRepo);

    if (!this.client) return;
    try {
      await this.client.health();
      this.isReady = true;
      await this.ensureIndexes();
    } catch {
      this.isReady = false;
    }
  }

  private async ensureIndexes() {
    const indexes = ['places', 'posts', 'users'];
    for (const uid of indexes) {
      try {
        await this.client.getIndex(uid);
      } catch {
        await this.client.createIndex(uid, { primaryKey: 'id' });
      }
    }
    // Configure searchable attributes
    await this.client.index('places').updateSearchableAttributes(['name', 'description', 'city', 'category']);
    await this.client.index('posts').updateSearchableAttributes(['title', 'body', 'category', 'location']);
    await this.client.index('users').updateSearchableAttributes(['fullName', 'handle', 'bio']);
  }

  async indexPlace(place: Place) {
    if (!this.isReady) return;
    await this.client.index('places').addDocuments([{
      id: place.id,
      name: place.name,
      description: place.description,
      city: place.city,
      category: place.category,
      slug: place.slug,
      image: place.images?.[0],
      rating: place.rating,
    }]);
  }

  async indexPost(post: Post) {
    if (!this.isReady) return;
    await this.client.index('posts').addDocuments([{
      id: post.id,
      title: post.title,
      body: post.body,
      category: post.category,
      location: post.location,
      authorId: post.authorId,
      createdAt: post.createdAt,
    }]);
  }

  async indexUser(user: User) {
    if (!this.isReady) return;
    await this.client.index('users').addDocuments([{
      id: user.id,
      fullName: user.fullName,
      handle: user.handle,
      bio: user.bio,
      avatar: user.avatar,
    }]);
  }

  async search(query: string, options?: { filters?: string; limit?: number; offset?: number }) {
    if (!this.isReady) {
      // Fallback to database search if Meilisearch is unavailable
      return this.databaseFallbackSearch(query, options);
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const [places, posts, users] = await Promise.all([
      this.client.index('places').search(query, { limit, offset }),
      this.client.index('posts').search(query, { limit, offset }),
      this.client.index('users').search(query, { limit, offset }),
    ]);

    return {
      places: places.hits,
      posts: posts.hits,
      users: users.hits,
      total: places.estimatedTotalHits + posts.estimatedTotalHits + users.estimatedTotalHits,
    };
  }

  private async databaseFallbackSearch(query: string, options?: { limit?: number }) {
    const limit = options?.limit || 20;

    // Typo/accent-tolerant on Postgres (trigram); plain substring elsewhere. Closest
    // matches first when the fuzzy path is available.
    const placeQb = this.placesRepo.createQueryBuilder('place').take(limit);
    const placeRank = applyFuzzy(placeQb, this.isPg, this.fuzzyReady, {
      like: ['place.name', 'place.nameFr', 'place.nameAr', 'place.city', 'place.description'],
      fuzzy: ['place.name', 'place.nameFr', 'place.nameAr', 'place.city'],
    }, query, 'p');
    if (placeRank) placeQb.orderBy(placeRank, 'DESC');

    const postQb = this.postsRepo.createQueryBuilder('post').take(limit);
    const postRank = applyFuzzy(postQb, this.isPg, this.fuzzyReady, {
      like: ['post.title', 'post.body'],
      fuzzy: ['post.title'],
    }, query, 'po');
    if (postRank) postQb.orderBy(postRank, 'DESC');

    // Public endpoint — select only safe, displayable fields (never password).
    const userQb = this.usersRepo.createQueryBuilder('user')
      .select([
        'user.id', 'user.fullName', 'user.handle', 'user.avatar',
        'user.bio', 'user.country', 'user.plan', 'user.role', 'user.followersCount',
      ])
      .take(limit);
    const userRank = applyFuzzy(userQb, this.isPg, this.fuzzyReady, {
      like: ['user.fullName', 'user.handle'],
      fuzzy: ['user.fullName', 'user.handle'],
    }, query, 'u');
    if (userRank) userQb.orderBy(userRank, 'DESC');

    const [places, posts, users] = await Promise.all([
      placeQb.getMany(),
      postQb.getMany(),
      userQb.getMany(),
    ]);

    return { places, posts, users, total: places.length + posts.length + users.length };
  }

  async reindexAll() {
    if (!this.isReady) return { message: 'Meilisearch not available' };

    const [places, posts, users] = await Promise.all([
      this.placesRepo.find(),
      this.postsRepo.find(),
      this.usersRepo.find(),
    ]);

    await Promise.all([
      this.client.index('places').addDocuments(places.map((p) => ({
        id: p.id, name: p.name, description: p.description,
        city: p.city, category: p.category, slug: p.slug,
        image: p.images?.[0], rating: p.rating,
      }))),
      this.client.index('posts').addDocuments(posts.map((p) => ({
        id: p.id, title: p.title, body: p.body,
        category: p.category, location: p.location,
        authorId: p.authorId, createdAt: p.createdAt,
      }))),
      this.client.index('users').addDocuments(users.map((u) => ({
        id: u.id, fullName: u.fullName, handle: u.handle,
        bio: u.bio, avatar: u.avatar,
      }))),
    ]);

    return { message: 'Reindexed', places: places.length, posts: posts.length, users: users.length };
  }
}
