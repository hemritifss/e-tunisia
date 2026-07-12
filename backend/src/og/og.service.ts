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
