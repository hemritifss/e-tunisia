import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { PassportDto } from '../users/dto/passport.dto';

/**
 * Display data for the "Which Tunisian city are you?" quiz result cards
 * (GROWTH §7). Single backend source of truth for the shared OG preview — the
 * web quiz owns the questions/scoring; this only needs the result copy + colours.
 */
export interface QuizArchetype { city: string; tagline: string; traits: string[]; gradient: string; }

/** Everything the shared carnet postcard layout needs; place/post/trip fill it. */
interface PostcardOpts {
    photo: string | null;   // base64 data URI, or null → paper placeholder
    title: string;          // Fraunces headline
    caption: string;        // Caveat line under the photo print
    stampBig: string;       // postage-stamp centre (e.g. "N°14")
    stampAr?: string;       // Arabic under it (rendered only if Kufi loaded)
    postmarkCity: string;   // circular postmark label
    metaLeft: string;       // city, or "— @handle"
    starsN?: number;        // if set, a drawn 5-star row
    metaRight?: string;     // review count, author name, …
    footer: string;         // "e-tunisia · /place/xxxx"
}
export const QUIZ_ARCHETYPES: Record<string, QuizArchetype> = {
    'sidi-bou-said': { city: 'Sidi Bou Saïd', tagline: 'The dreamer', traits: ['Artistic', 'Romantic', 'Calm-in-the-chaos'], gradient: 'linear-gradient(135deg,#0b3d91 0%,#2f6fd0 55%,#6f9fe0 100%)' },
    tunis: { city: 'Tunis', tagline: 'The connector', traits: ['Ambitious', 'Social', 'Always-in-motion'], gradient: 'linear-gradient(135deg,#7a1f2b 0%,#c0492f 55%,#e7b64a 100%)' },
    djerba: { city: 'Djerba', tagline: 'The easy soul', traits: ['Easygoing', 'Warm', 'Unbothered'], gradient: 'linear-gradient(135deg,#0f8a8a 0%,#2bc4c4 55%,#7fded1 100%)' },
    douz: { city: 'Douz', tagline: 'The free spirit', traits: ['Adventurous', 'Fearless', 'Free'], gradient: 'linear-gradient(135deg,#a5561e 0%,#e0902f 55%,#f0c877 100%)' },
    tozeur: { city: 'Tozeur', tagline: 'The mystic', traits: ['Mysterious', 'Old-soul', 'Magnetic'], gradient: 'linear-gradient(135deg,#6b3b12 0%,#b4762a 55%,#dcb877 100%)' },
    hammamet: { city: 'Hammamet', tagline: 'The good time', traits: ['Fun', 'Magnetic', 'Sun-chaser'], gradient: 'linear-gradient(135deg,#0a7d6b 0%,#f26d6d 55%,#ffcf6e 100%)' },
    kairouan: { city: 'Kairouan', tagline: 'The old soul', traits: ['Grounded', 'Loyal', 'Wise'], gradient: 'linear-gradient(135deg,#5a3d2b 0%,#a5794a 55%,#d4b788 100%)' },
    tabarka: { city: 'Tabarka', tagline: 'The nature lover', traits: ['Down-to-earth', 'Creative', 'Wild-at-heart'], gradient: 'linear-gradient(135deg,#14532d 0%,#2f8f57 55%,#7cc48f 100%)' },
};

/**
 * Renders the shareable "Tunisia Passport" postcard.
 *
 * Pure-JS toolchain: satori produces SVG, resvg rasterises to PNG.
 * Fonts are vendored via the `@fontsource/inter` dependency and read from
 * node_modules at boot — zero network dependency (the old gstatic hash URLs
 * rotated and started 404ing, silently blanking every share card).
 */
@Injectable()
export class OgService implements OnModuleInit {
    private readonly logger = new Logger(OgService.name);
    private regular: Buffer | null = null;
    private bold: Buffer | null = null;
    // Carnet display faces for the postcard — best-effort; any that fail to
    // load are simply omitted from that card (never break rendering).
    private fraunces: Buffer | null = null;
    private caveat: Buffer | null = null;
    private kufi: Buffer | null = null;

    async onModuleInit() {
        try {
            this.regular = await this.loadFont(
                'inter-latin-400-normal.woff',
                'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff',
            );
            this.bold = await this.loadFont(
                'inter-latin-700-normal.woff',
                'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff',
            );
        } catch (err) {
            this.logger.warn(`Font preload failed; OG cards will fall back to a static image: ${(err as Error).message}`);
        }
        // Carnet faces — each guarded so one failure doesn't sink the others.
        // NB: Arabic (Noto Kufi) is deliberately NOT loaded — satori's bundled
        // opentype.js crashes on its required-ligature tables. The postcard
        // degrades to a clean Latin card (every Arabic string is guarded on
        // `this.kufi`, which stays null). Revisit if satori fixes the shaper.
        const carnet: Array<['fraunces' | 'caveat', string, string]> = [
            ['fraunces', 'fraunces-latin-600-normal.woff', 'https://cdn.jsdelivr.net/npm/@fontsource/fraunces@5.2.5/files/fraunces-latin-600-normal.woff'],
            ['caveat', 'caveat-latin-400-normal.woff', 'https://cdn.jsdelivr.net/npm/@fontsource/caveat@5.2.5/files/caveat-latin-400-normal.woff'],
        ];
        for (const [prop, file, url] of carnet) {
            try { this[prop] = await this.loadFont(file, url); }
            catch (err) { this.logger.warn(`Carnet font ${file} failed to load: ${(err as Error).message}`); }
        }
    }

    /**
     * Load a vendored font: node_modules first (offline, deterministic), then a
     * pinned jsDelivr URL as a last resort, cached on disk next to the build.
     */
    private async loadFont(fontsourceFile: string, cdnUrl: string): Promise<Buffer> {
        // 1) Vendored copy in node_modules — the reliable path.
        try {
            const pkg = require.resolve('@fontsource/inter/package.json');
            const vendored = path.join(path.dirname(pkg), 'files', fontsourceFile);
            if (fs.existsSync(vendored)) return fs.promises.readFile(vendored);
        } catch { /* package missing — fall through to CDN */ }

        // 2) Disk cache next to the build output.
        const dir = path.join(__dirname, 'fonts');
        const file = path.join(dir, fontsourceFile);
        if (fs.existsSync(file)) return fs.promises.readFile(file);

        // 3) Pinned CDN (version-locked, so it won't rotate like gstatic did).
        await fs.promises.mkdir(dir, { recursive: true });
        const buf = await this.fetchBinary(cdnUrl);
        await fs.promises.writeFile(file, buf);
        return buf;
    }

    private fetchBinary(url: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const req = https.get(url, { headers: { 'User-Agent': 'e-tunisia-og/1.0' } }, (res) => {
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    this.fetchBinary(res.headers.location).then(resolve, reject);
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`Font fetch ${url} → HTTP ${res.statusCode}`));
                    return;
                }
                const chunks: Buffer[] = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => resolve(Buffer.concat(chunks)));
                res.on('error', reject);
            });
            req.on('error', reject);
            req.setTimeout(8000, () => req.destroy(new Error('Font fetch timed out')));
        });
    }

    isReady(): boolean {
        return !!(this.regular && this.bold);
    }

    /** Returns a 1200×630 PNG postcard for the given passport. */
    async renderPassportCard(p: PassportDto): Promise<Buffer> {
        if (!this.regular || !this.bold) {
            throw new Error('OG fonts not loaded');
        }
        const initials = (p.fullName || p.handle)
            .split(/\s+/)
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
        const cities = (p.visitedCities || []).slice(0, 6);
        const stats = p.stats;

        const isFounder = !!p.founderNumber;
        const node: any = {
            type: 'div',
            props: {
                style: {
                    width: 1200,
                    height: 630,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'linear-gradient(135deg, #0b1e3f 0%, #1a3a73 45%, #d4623a 100%)',
                    color: '#fff',
                    padding: '64px',
                    fontFamily: 'Inter',
                    position: 'relative',
                    // Founders get the permanent gold-trimmed edition.
                    border: isFounder ? '8px solid rgba(222,184,80,0.92)' : undefined,
                },
                children: [
                    // Founder ribbon — top-right, above everything.
                    isFounder
                        ? {
                            type: 'div',
                            props: {
                                style: {
                                    position: 'absolute',
                                    top: 36,
                                    right: 48,
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '10px 24px',
                                    borderRadius: 999,
                                    background: 'rgba(222,184,80,0.16)',
                                    border: '2px solid rgba(222,184,80,0.9)',
                                    color: '#f3dc8e',
                                    fontSize: 24,
                                    fontWeight: 700,
                                    letterSpacing: 3,
                                },
                                children: `FOUNDER #${String(p.founderNumber).padStart(4, '0')}`,
                            },
                        }
                        : null,
                    // top row: avatar/initials + handle + name
                    {
                        type: 'div',
                        props: {
                            style: { display: 'flex', alignItems: 'center', gap: 24 },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            width: 96,
                                            height: 96,
                                            borderRadius: 999,
                                            background: 'rgba(255,255,255,0.18)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 40,
                                            fontWeight: 700,
                                            border: '4px solid rgba(255,255,255,0.4)',
                                        },
                                        children: initials,
                                    },
                                },
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', flexDirection: 'column' },
                                        children: [
                                            { type: 'div', props: { style: { fontSize: 24, opacity: 0.75 }, children: `@${p.handle}` } },
                                            { type: 'div', props: { style: { fontSize: 56, fontWeight: 700, marginTop: 4, lineHeight: 1.05 }, children: p.fullName } },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                    // headline
                    {
                        type: 'div',
                        props: {
                            style: { marginTop: 36, fontSize: 30, opacity: 0.92 },
                            children: `Tunisia Passport  ·  ${p.passportLevel}`,
                        },
                    },
                    // stats row
                    {
                        type: 'div',
                        props: {
                            style: { display: 'flex', gap: 24, marginTop: 36 },
                            children: [
                                statTile(stats.citiesVisited, 'cities'),
                                statTile(stats.tripsPlanned, 'trips'),
                                statTile(stats.reviewsCount, 'reviews'),
                                statTile(stats.savesCount, 'saves'),
                            ],
                        },
                    },
                    // cities strip
                    cities.length
                        ? {
                            type: 'div',
                            props: {
                                style: { marginTop: 36, fontSize: 24, opacity: 0.88 },
                                children: cities.join('  ·  '),
                            },
                        }
                        : null,
                    // brand bottom-right
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute',
                                bottom: 32,
                                right: 48,
                                fontSize: 22,
                                opacity: 0.7,
                            },
                            children: `e-tunisia · /u/${p.handle}`,
                        },
                    },
                ].filter(Boolean),
            },
        };

        const svg = await satori(node, {
            width: 1200,
            height: 630,
            fonts: [
                { name: 'Inter', data: this.regular, weight: 400, style: 'normal' },
                { name: 'Inter', data: this.bold, weight: 700, style: 'normal' },
            ],
        });
        const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
        return Buffer.from(png);
    }

    /** 1200×630 "You are <City>" quiz result card. Typographic (no emoji — only
     *  Inter is loaded, so emoji would render as tofu). */
    async renderCityQuizCard(a: QuizArchetype): Promise<Buffer> {
        if (!this.regular || !this.bold) throw new Error('OG fonts not loaded');
        const node: any = {
            type: 'div',
            props: {
                style: {
                    width: 1200, height: 630, display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', textAlign: 'center',
                    background: a.gradient, color: '#fff', padding: '72px', fontFamily: 'Inter',
                    position: 'relative',
                },
                children: [
                    { type: 'div', props: { style: { fontSize: 26, letterSpacing: 6, opacity: 0.85, fontWeight: 700 }, children: 'WHICH TUNISIAN CITY ARE YOU?' } },
                    { type: 'div', props: { style: { fontSize: 30, marginTop: 28, opacity: 0.9 }, children: 'You are' } },
                    { type: 'div', props: { style: { fontSize: 108, fontWeight: 700, lineHeight: 1.02, marginTop: 4, textShadow: '0 3px 18px rgba(0,0,0,0.28)' }, children: a.city } },
                    { type: 'div', props: { style: { fontSize: 40, fontWeight: 700, marginTop: 8, opacity: 0.96 }, children: a.tagline } },
                    {
                        type: 'div',
                        props: {
                            style: { display: 'flex', gap: 16, marginTop: 34 },
                            children: a.traits.map((tr) => ({
                                type: 'div',
                                props: {
                                    style: {
                                        fontSize: 26, fontWeight: 600, padding: '12px 28px', borderRadius: 999,
                                        background: 'rgba(255,255,255,0.20)', border: '2px solid rgba(255,255,255,0.4)',
                                    },
                                    children: tr,
                                },
                            })),
                        },
                    },
                    { type: 'div', props: { style: { position: 'absolute', bottom: 40, fontSize: 24, fontWeight: 600, opacity: 0.8 }, children: 'e-tunisia · take the quiz' } },
                ],
            },
        };
        const svg = await satori(node, {
            width: 1200, height: 630,
            fonts: [
                { name: 'Inter', data: this.regular, weight: 400, style: 'normal' },
                { name: 'Inter', data: this.bold, weight: 700, style: 'normal' },
            ],
        });
        const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
        return Buffer.from(png);
    }

    /** 1200×630 "Summer in Tunisia — Wrapped" card. Typographic (no emoji). */
    async renderWrappedCard(w: {
        fullName: string; periodLabel: string; personalityLabel: string;
        stats: { checkIns: number; citiesCount: number; governoratesCount: number; reviews: number };
    }): Promise<Buffer> {
        if (!this.regular || !this.bold) throw new Error('OG fonts not loaded');
        const node: any = {
            type: 'div',
            props: {
                style: {
                    width: 1200, height: 630, display: 'flex', flexDirection: 'column',
                    background: 'linear-gradient(135deg,#0b1e3f 0%,#1a6a8a 50%,#d4623a 100%)',
                    color: '#fff', padding: '60px 64px', fontFamily: 'Inter', position: 'relative',
                },
                children: [
                    { type: 'div', props: { style: { fontSize: 26, letterSpacing: 5, opacity: 0.85, fontWeight: 700 }, children: `${w.periodLabel.toUpperCase()} · IN TUNISIA` } },
                    { type: 'div', props: { style: { fontSize: 64, fontWeight: 700, marginTop: 10, lineHeight: 1.05 }, children: w.fullName } },
                    { type: 'div', props: { style: { fontSize: 40, fontWeight: 700, marginTop: 6, opacity: 0.95 }, children: w.personalityLabel } },
                    {
                        type: 'div',
                        props: {
                            style: { display: 'flex', gap: 20, marginTop: 40 },
                            children: [
                                statTile(w.stats.checkIns, 'check-ins'),
                                statTile(w.stats.citiesCount, 'cities'),
                                statTile(w.stats.governoratesCount, 'governorates'),
                                statTile(w.stats.reviews, 'reviews'),
                            ],
                        },
                    },
                    { type: 'div', props: { style: { position: 'absolute', bottom: 36, right: 64, fontSize: 24, fontWeight: 600, opacity: 0.8 }, children: 'e-tunisia · your Wrapped' } },
                ],
            },
        };
        const svg = await satori(node, {
            width: 1200, height: 630,
            fonts: [
                { name: 'Inter', data: this.regular, weight: 400, style: 'normal' },
                { name: 'Inter', data: this.bold, weight: 700, style: 'normal' },
            ],
        });
        const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
        return Buffer.from(png);
    }

    /** 1200×630 live-leaderboard card for the Mapping Weekend. Typographic. */
    async renderMappingCard(m: {
        title: string; statusLabel: string;
        leaders: Array<{ governorate: string; points: number }>;
        totals: { contributors: number; gems: number };
    }): Promise<Buffer> {
        if (!this.regular || !this.bold) throw new Error('OG fonts not loaded');
        const medals = ['1.', '2.', '3.'];
        const node: any = {
            type: 'div',
            props: {
                style: {
                    width: 1200, height: 630, display: 'flex', flexDirection: 'column',
                    background: 'linear-gradient(135deg,#1a6a8a 0%,#0b3d5c 55%,#d4623a 100%)',
                    color: '#fff', padding: '56px 64px', fontFamily: 'Inter', position: 'relative',
                },
                children: [
                    { type: 'div', props: { style: { fontSize: 24, letterSpacing: 4, opacity: 0.85, fontWeight: 700 }, children: m.statusLabel.toUpperCase() } },
                    { type: 'div', props: { style: { fontSize: 52, fontWeight: 800, marginTop: 8, lineHeight: 1.05 }, children: m.title } },
                    {
                        type: 'div',
                        props: {
                            style: { display: 'flex', flexDirection: 'column', gap: 14, marginTop: 34 },
                            children: (m.leaders.length ? m.leaders : [{ governorate: 'Be the first', points: 0 }]).slice(0, 3).map((g, i) => ({
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)',
                                        borderRadius: 16, padding: '16px 28px', fontSize: 34, fontWeight: 700,
                                    },
                                    children: [
                                        { type: 'div', props: { style: { display: 'flex', gap: 18 }, children: `${medals[i] || ''} ${g.governorate}` } },
                                        { type: 'div', props: { children: `${g.points} pts` } },
                                    ],
                                },
                            })),
                        },
                    },
                    { type: 'div', props: { style: { position: 'absolute', bottom: 40, left: 64, fontSize: 24, fontWeight: 600, opacity: 0.85 }, children: `${m.totals.contributors} mappers · ${m.totals.gems} gems · e-tunisia` } },
                ],
            },
        };
        const svg = await satori(node, {
            width: 1200, height: 630,
            fonts: [
                { name: 'Inter', data: this.regular, weight: 400, style: 'normal' },
                { name: 'Inter', data: this.bold, weight: 700, style: 'normal' },
            ],
        });
        const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
        return Buffer.from(png);
    }

    /** Fetch a remote image and return it as a base64 data URI, or null. */
    private async fetchImageDataUri(url?: string | null): Promise<string | null> {
        if (!url || !/^https?:\/\//i.test(url)) return null;
        try {
            const { buf, mime } = await this.fetchImage(url);
            if (buf.length > 6_000_000) return null; // guard against giant originals
            return `data:${mime};base64,${buf.toString('base64')}`;
        } catch { return null; }
    }

    private fetchImage(url: string): Promise<{ buf: Buffer; mime: string }> {
        const mod = url.startsWith('http://') ? require('http') : https;
        // Wikimedia (a common cover-image host) 429s generic UAs — its policy
        // wants a descriptive agent with a contact URL.
        const ua = 'e-Tunisia/1.0 (https://etunisia.com; og-cards@etunisia.com)';
        return new Promise((resolve, reject) => {
            const req = mod.get(url, { headers: { 'User-Agent': ua } }, (res: any) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    this.fetchImage(res.headers.location).then(resolve, reject); return;
                }
                if (res.statusCode !== 200) { reject(new Error(`img ${url} → ${res.statusCode}`)); return; }
                const mime = (res.headers['content-type'] || 'image/jpeg').split(';')[0];
                const chunks: Buffer[] = [];
                res.on('data', (c: Buffer) => chunks.push(c));
                res.on('end', () => resolve({ buf: Buffer.concat(chunks), mime }));
                res.on('error', reject);
            });
            req.on('error', reject);
            req.setTimeout(9000, () => req.destroy(new Error('img fetch timed out')));
        });
    }

    /**
     * The shared carnet postcard (UNIQUENESS §6.4): a photo pasted as a print,
     * a city postmark, a governorate postage stamp, the title in Fraunces, and
     * the dual-script wordmark — a branded artifact for every social feed.
     * Place, post and trip shares all compose their opts and render through here.
     */
    private buildPostcard(o: PostcardOpts): any {
        const display = this.fraunces ? 'Fraunces' : 'Inter';
        const hand = this.caveat ? 'Caveat' : 'Inter';
        const PAPER = '#f1e7d3', MATTE = '#fbf6ec', INK = '#2b2620', SOFT = '#6f6455',
              TERRA = '#c0492f', RULE = '#d7cbb2', GOLD = '#cba24a';

        return {
            type: 'div',
            props: {
                style: {
                    width: 1200, height: 630, display: 'flex', background: PAPER,
                    fontFamily: 'Inter', color: INK, padding: 40, position: 'relative',
                },
                children: [
                    // double-rule postcard border
                    { type: 'div', props: { style: { position: 'absolute', top: 22, left: 22, right: 22, bottom: 22, border: `2px solid ${RULE}` } } },
                    { type: 'div', props: { style: { position: 'absolute', top: 27, left: 27, right: 27, bottom: 27, border: `1px solid ${RULE}` } } },

                    // ── left: the photo print, tilted ──
                    {
                        type: 'div',
                        props: {
                            style: { display: 'flex', width: 620, height: 550, alignItems: 'center', justifyContent: 'center', marginLeft: 20, marginTop: 20 },
                            children: [{
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex', flexDirection: 'column', background: MATTE,
                                        padding: 16, paddingBottom: 54, transform: 'rotate(-2.2deg)',
                                        boxShadow: '0 14px 30px rgba(43,38,32,0.22)', border: `1px solid ${RULE}`,
                                    },
                                    children: [
                                        o.photo
                                            ? { type: 'img', props: { src: o.photo, width: 540, height: 405, style: { objectFit: 'cover' } } }
                                            : { type: 'div', props: { style: { width: 540, height: 405, background: '#e7dcc6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SOFT, fontSize: 26 }, children: o.title } },
                                        { type: 'div', props: { style: { display: 'flex', marginTop: 16, fontFamily: hand, fontSize: 34, color: SOFT }, children: o.caption } },
                                    ],
                                },
                            }],
                        },
                    },

                    // ── right: the written side ──
                    {
                        type: 'div',
                        props: {
                            style: { display: 'flex', flexDirection: 'column', flex: 1, paddingLeft: 34, paddingRight: 26, paddingTop: 44, paddingBottom: 40 },
                            children: [
                                // wordmark
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', alignItems: 'baseline', gap: 12 },
                                        children: [
                                            { type: 'div', props: { style: { fontFamily: display, fontSize: 34, color: INK }, children: 'e-Tunisia' } },
                                            ...(this.kufi ? [{ type: 'div', props: { style: { fontFamily: 'Kufi', fontSize: 22, color: TERRA }, children: 'تونس' } }] : []),
                                        ],
                                    },
                                },
                                { type: 'div', props: { style: { marginTop: 6, fontSize: 15, letterSpacing: 3, color: SOFT }, children: 'CARNET DE VOYAGE' } },

                                // stamp + postmark cluster
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', alignItems: 'center', gap: 18, marginTop: 30 },
                                        children: [
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 96, height: 116, background: MATTE, border: `2px solid ${TERRA}`, transform: 'rotate(3deg)', padding: 6 },
                                                    children: [
                                                        { type: 'div', props: { style: { display: 'flex', fontSize: 13, letterSpacing: 2, color: SOFT }, children: 'TUNISIE' } },
                                                        { type: 'div', props: { style: { display: 'flex', fontFamily: display, fontSize: 40, color: TERRA, lineHeight: 1 }, children: o.stampBig } },
                                                        ...(this.kufi && o.stampAr ? [{ type: 'div', props: { style: { fontFamily: 'Kufi', fontSize: 15, color: INK }, children: o.stampAr } }] : []),
                                                    ],
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 96, height: 96, borderRadius: 999, border: `2px solid ${SOFT}`, color: SOFT, transform: 'rotate(-8deg)' },
                                                    children: [
                                                        { type: 'div', props: { style: { fontSize: 16, letterSpacing: 1 }, children: o.postmarkCity.toUpperCase().slice(0, 9) } },
                                                        { type: 'div', props: { style: { fontSize: 13, marginTop: 2 }, children: String(new Date().getFullYear()) } },
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                },

                                // title — font size steps down as the title grows so it never
                                // overflows into the meta line below
                                { type: 'div', props: { style: { display: 'flex', fontFamily: display, fontSize: titleSize(o.title), lineHeight: 1.04, color: INK, marginTop: 26 }, children: o.title } },
                                // meta row
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', alignItems: 'center', gap: 14, marginTop: 16, fontSize: 24, color: SOFT },
                                        children: [
                                            { type: 'div', props: { style: { display: 'flex' }, children: o.metaLeft } },
                                            o.starsN != null ? { type: 'img', props: { src: starsSvgDataUri(o.starsN, GOLD, RULE), width: 132, height: 24 } } : null,
                                            o.metaRight ? { type: 'div', props: { style: { display: 'flex', fontSize: 20, color: SOFT }, children: o.metaRight } } : null,
                                        ].filter(Boolean),
                                    },
                                },

                                // spacer + footer url
                                { type: 'div', props: { style: { display: 'flex', flex: 1 } } },
                                { type: 'div', props: { style: { display: 'flex', fontSize: 20, color: SOFT }, children: o.footer } },
                            ],
                        },
                    },
                ],
            },
        };
    }

    /** satori → resvg → PNG, with whatever carnet faces loaded. */
    private async rasterize(node: any): Promise<Buffer> {
        const fonts: any[] = [
            { name: 'Inter', data: this.regular, weight: 400, style: 'normal' },
            { name: 'Inter', data: this.bold, weight: 700, style: 'normal' },
        ];
        if (this.fraunces) fonts.push({ name: 'Fraunces', data: this.fraunces, weight: 600, style: 'normal' });
        if (this.caveat) fonts.push({ name: 'Caveat', data: this.caveat, weight: 400, style: 'normal' });
        if (this.kufi) fonts.push({ name: 'Kufi', data: this.kufi, weight: 700, style: 'normal' });
        const svg = await satori(node, { width: 1200, height: 630, fonts });
        return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
    }

    /** Place share → carnet postcard. */
    async renderPlacePostcard(p: {
        id: string; name: string; city?: string; governorate?: string;
        rating?: number; reviewCount?: number; imageUrl?: string | null;
    }): Promise<Buffer> {
        if (!this.regular || !this.bold) throw new Error('OG fonts not loaded');
        const gov = p.governorate ? GOV_LOOKUP[normGov(p.governorate)] : undefined;
        return this.rasterize(this.buildPostcard({
            photo: await this.fetchImageDataUri(p.imageUrl),
            title: p.name,
            caption: `${p.city || 'Tunisia'} — wish you were here`,
            stampBig: gov ? `N°${gov.n}` : 'N°',
            stampAr: gov?.ar,
            postmarkCity: p.city || 'TUNIS',
            metaLeft: p.city || 'Tunisia',
            starsN: Math.max(0, Math.min(5, Math.round(p.rating || 0))),
            metaRight: p.reviewCount ? `${p.reviewCount} reviews` : undefined,
            footer: `e-tunisia · /place/${p.id.slice(0, 8)}`,
        }));
    }

    /** Post share → "a postcard from a traveler": their photo, their words in
     *  Caveat, their handle as the sender. Feed posts are the highest-reach
     *  share surface, so every one becomes a brand artifact. */
    async renderPostPostcard(p: {
        id: string; title?: string; body?: string; location?: string;
        authorName?: string; authorHandle?: string; imageUrl?: string | null;
    }): Promise<Buffer> {
        if (!this.regular || !this.bold) throw new Error('OG fonts not loaded');
        const city = (p.location || '').split(',')[0].trim();
        const gov = city ? GOV_LOOKUP[normGov(city)] : undefined;
        const raw = (p.title || p.body || 'A moment from Tunisia').trim();
        const title = raw.length > 62 ? raw.slice(0, 60).replace(/\s+\S*$/, '') + '…' : raw;
        return this.rasterize(this.buildPostcard({
            photo: await this.fetchImageDataUri(p.imageUrl),
            title,
            caption: city ? `greetings from ${city}` : 'greetings from Tunisia',
            stampBig: gov ? `N°${gov.n}` : 'TN',
            stampAr: gov?.ar,
            postmarkCity: city || 'TUNIS',
            metaLeft: p.authorHandle ? `— @${p.authorHandle}` : (p.authorName || 'a traveler'),
            metaRight: p.authorHandle && p.authorName ? p.authorName : undefined,
            footer: `e-tunisia · /post/${p.id.slice(0, 8)}`,
        }));
    }

    /** Trip share → the route as a postcard: cover photo, the first→last-city
     *  route as its caption, and "N days · M stops" as the meta. */
    async renderTripPostcard(t: {
        slug: string; title: string; days: number;
        stops: Array<{ placeCity?: string; placeCover?: string }>;
    }): Promise<Buffer> {
        if (!this.regular || !this.bold) throw new Error('OG fonts not loaded');
        const cities = Array.from(new Set((t.stops || []).map((s) => s.placeCity).filter(Boolean))) as string[];
        const cover = (t.stops || []).map((s) => s.placeCover).find(Boolean) || null;
        const startCity = cities[0] || 'Tunisia';
        const gov = GOV_LOOKUP[normGov(startCity)];
        // "to", not "→": Caveat has no arrow glyph (it renders as tofu), and a
        // handwritten postcard would say "Tunis to Djerba" anyway.
        const route = cities.length >= 2 ? `${cities[0]} to ${cities[cities.length - 1]}` : `${t.days} days in Tunisia`;
        const stopCount = (t.stops || []).length;
        return this.rasterize(this.buildPostcard({
            photo: await this.fetchImageDataUri(cover),
            title: t.title,
            caption: route,
            stampBig: gov ? `N°${gov.n}` : 'TN',
            stampAr: gov?.ar,
            postmarkCity: startCity,
            metaLeft: `${t.days} ${t.days === 1 ? 'day' : 'days'}`,
            metaRight: `${stopCount} ${stopCount === 1 ? 'stop' : 'stops'}`,
            footer: `e-tunisia · /trip/${t.slug}`,
        }));
    }
}

/** name → { issue number, Arabic } for the postage stamp. Accent-insensitive key. */
const GOV_LOOKUP: Record<string, { n: number; ar: string }> = {
    'tunis': { n: 1, ar: 'تونس' }, 'ariana': { n: 2, ar: 'أريانة' }, 'ben arous': { n: 3, ar: 'بن عروس' },
    'manouba': { n: 4, ar: 'منوبة' }, 'nabeul': { n: 5, ar: 'نابل' }, 'zaghouan': { n: 6, ar: 'زغوان' },
    'bizerte': { n: 7, ar: 'بنزرت' }, 'beja': { n: 8, ar: 'باجة' }, 'jendouba': { n: 9, ar: 'جندوبة' },
    'le kef': { n: 10, ar: 'الكاف' }, 'kef': { n: 10, ar: 'الكاف' }, 'siliana': { n: 11, ar: 'سليانة' },
    'sousse': { n: 12, ar: 'سوسة' }, 'monastir': { n: 13, ar: 'المنستير' }, 'mahdia': { n: 14, ar: 'المهدية' },
    'sfax': { n: 15, ar: 'صفاقس' }, 'kairouan': { n: 16, ar: 'القيروان' }, 'kasserine': { n: 17, ar: 'القصرين' },
    'sidi bouzid': { n: 18, ar: 'سيدي بوزيد' }, 'gabes': { n: 19, ar: 'قابس' }, 'medenine': { n: 20, ar: 'مدنين' },
    'tataouine': { n: 21, ar: 'تطاوين' }, 'gafsa': { n: 22, ar: 'قفصة' }, 'tozeur': { n: 23, ar: 'توزر' },
    'kebili': { n: 24, ar: 'قبلي' },
};
function normGov(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, '').trim();
}

/** Fraunces title size, stepped down by length so long titles don't overflow. */
function titleSize(t: string): number {
    const n = t.length;
    if (n <= 20) return 62;
    if (n <= 34) return 50;
    if (n <= 50) return 40;
    return 32;
}

/** A row of 5 stars (n filled) as an SVG data URI — font-independent, so it
 *  never renders as tofu when the loaded faces lack the ★ glyph. */
function starsSvgDataUri(n: number, fill: string, empty: string): string {
    const star = 'M12 2l2.9 6 6.6.5-5 4.3 1.6 6.4L12 16.3 5.9 19.2 7.5 12.8 2.5 8.5 9.1 8z';
    let s = `<svg xmlns='http://www.w3.org/2000/svg' width='110' height='20' viewBox='0 0 110 20'>`;
    for (let i = 0; i < 5; i++) {
        s += `<g transform='translate(${i * 22}, -2)'><path d='${star}' fill='${i < n ? fill : 'none'}' stroke='${i < n ? fill : empty}' stroke-width='1.4'/></g>`;
    }
    s += `</svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(s).toString('base64')}`;
}

function statTile(n: number, label: string) {
    return {
        type: 'div',
        props: {
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 24,
                padding: '20px 36px',
                minWidth: 160,
            },
            children: [
                { type: 'div', props: { style: { fontSize: 56, fontWeight: 700, lineHeight: 1.0 }, children: String(n) } },
                { type: 'div', props: { style: { fontSize: 20, opacity: 0.8, marginTop: 6 }, children: label } },
            ],
        },
    };
}
