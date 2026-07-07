import { Controller, Get, Header, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Post } from '../posts/post.entity';

/**
 * Crawler-visible link previews.
 *
 * Social crawlers (WhatsApp, Facebook, X, LinkedIn, Telegram) never execute
 * JavaScript, so OG tags set client-side by the SPA are invisible to them.
 * These routes serve real server-rendered meta for anything shared out of the
 * app, then bounce human visitors straight to the pretty SPA URL.
 *
 * Share links point here (e.g. <api>/api/v1/og/u/amine); the existing
 * /users/by-handle/:handle/og.png postcard becomes the preview image.
 */
@Controller('og')
export class OgController {
    constructor(
        private readonly config: ConfigService,
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(Place) private readonly places: Repository<Place>,
        @InjectRepository(Post) private readonly posts: Repository<Post>,
    ) {}

    private webOrigin(): string {
        return (this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173').replace(/\/+$/, '');
    }

    private apiOrigin(req: Request): string {
        const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || req.protocol || 'http';
        return `${proto}://${req.get('host')}`;
    }

    /** Make relative upload paths absolute; leave full URLs untouched. */
    private absolutize(image: string | null | undefined, req: Request): string | null {
        if (!image) return null;
        if (/^https?:\/\//i.test(image)) return image;
        return `${this.apiOrigin(req)}${image.startsWith('/') ? '' : '/'}${image}`;
    }

    @Get('u/:handle')
    @Header('Content-Type', 'text/html; charset=utf-8')
    @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    async user(@Param('handle') rawHandle: string, @Req() req: Request, @Res() res: Response) {
        const handle = (rawHandle || '').toLowerCase();
        const user = await this.users.findOne({ where: { handle } }).catch(() => null);
        const name = user?.fullName || `@${handle}`;
        res.send(renderOgHtml({
            title: `${name} — Tunisia Travel Passport`,
            description: (user as any)?.bio
                || `Follow ${name}'s journey across Tunisia — stamps, reviews and trips on e-Tunisia.`,
            image: `${this.apiOrigin(req)}/api/v1/users/by-handle/${encodeURIComponent(handle)}/og.png`,
            canonical: `${this.webOrigin()}/u/${encodeURIComponent(handle)}`,
            largeCard: true,
        }));
    }

    @Get('place/:id')
    @Header('Content-Type', 'text/html; charset=utf-8')
    @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    async place(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
        const place = await this.places.findOne({ where: { id } }).catch(() => null);
        res.send(renderOgHtml({
            title: place ? `${place.name} — ${place.city}, Tunisia` : 'Discover Tunisia',
            description: (place as any)?.description?.slice(0, 200)
                || 'Places, tips and reviews from travelers across Tunisia.',
            image: this.absolutize(place?.coverImage || place?.images?.[0], req),
            canonical: `${this.webOrigin()}/place/${encodeURIComponent(id)}`,
            largeCard: true,
        }));
    }

    @Get('post/:id')
    @Header('Content-Type', 'text/html; charset=utf-8')
    @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    async post(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
        const post = await this.posts.findOne({ where: { id } }).catch(() => null);
        const author = post?.author?.fullName;
        res.send(renderOgHtml({
            title: post?.title || (author ? `${author} on e-Tunisia` : 'A moment from Tunisia'),
            description: post?.body?.slice(0, 200) || 'Shared on e-Tunisia — Tunisia, told by the people who live it.',
            image: this.absolutize(post?.images?.[0] || post?.author?.avatar, req),
            canonical: `${this.webOrigin()}/post/${encodeURIComponent(id)}`,
            largeCard: !!post?.images?.length,
        }));
    }
}

function esc(s: string): string {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderOgHtml(o: {
    title: string;
    description: string;
    image: string | null;
    canonical: string;
    largeCard: boolean;
}): string {
    const image = o.image ? `
    <meta property="og:image" content="${esc(o.image)}" />
    <meta name="twitter:image" content="${esc(o.image)}" />` : '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>${esc(o.title)}</title>
    <meta name="description" content="${esc(o.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="e-Tunisia" />
    <meta property="og:title" content="${esc(o.title)}" />
    <meta property="og:description" content="${esc(o.description)}" />
    <meta property="og:url" content="${esc(o.canonical)}" />${image}
    <meta name="twitter:card" content="${o.largeCard ? 'summary_large_image' : 'summary'}" />
    <meta name="twitter:title" content="${esc(o.title)}" />
    <meta name="twitter:description" content="${esc(o.description)}" />
    <link rel="canonical" href="${esc(o.canonical)}" />
    <!-- Humans get bounced to the app; crawlers only read the tags above. -->
    <meta http-equiv="refresh" content="0;url=${esc(o.canonical)}" />
    <script>location.replace(${JSON.stringify(o.canonical)});</script>
</head>
<body>
    <p>Redirecting to <a href="${esc(o.canonical)}">${esc(o.canonical)}</a>…</p>
</body>
</html>`;
}
