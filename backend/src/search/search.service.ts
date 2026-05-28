import { Injectable, OnModuleInit } from '@nestjs/common';
const MeiliSearch = require('meilisearch').MeiliSearch;
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from '../places/place.entity';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: any;
  private isReady = false;

  constructor(
    @InjectRepository(Place) private placesRepo: Repository<Place>,
    @InjectRepository(Post) private postsRepo: Repository<Post>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {
    const host = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
    const apiKey = process.env.MEILISEARCH_API_KEY || '';
    if (host) {
      this.client = new MeiliSearch({ host, apiKey });
    }
  }

  async onModuleInit() {
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
    const q = `%${query}%`;

    const [places, posts, users] = await Promise.all([
      this.placesRepo.find({ where: [
        { name: q as any }, { city: q as any }, { description: q as any },
      ], take: limit }),
      this.postsRepo.find({ where: [
        { title: q as any }, { body: q as any },
      ], take: limit }),
      this.usersRepo.find({ where: [
        { fullName: q as any }, { handle: q as any },
      ], take: limit }),
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
