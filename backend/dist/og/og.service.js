"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OgService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OgService = exports.QUIZ_ARCHETYPES = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const https = require("https");
const satori_1 = require("satori");
const resvg_js_1 = require("@resvg/resvg-js");
exports.QUIZ_ARCHETYPES = {
    'sidi-bou-said': { city: 'Sidi Bou Saïd', tagline: 'The dreamer', traits: ['Artistic', 'Romantic', 'Calm-in-the-chaos'], gradient: 'linear-gradient(135deg,#0b3d91 0%,#2f6fd0 55%,#6f9fe0 100%)' },
    tunis: { city: 'Tunis', tagline: 'The connector', traits: ['Ambitious', 'Social', 'Always-in-motion'], gradient: 'linear-gradient(135deg,#7a1f2b 0%,#c0492f 55%,#e7b64a 100%)' },
    djerba: { city: 'Djerba', tagline: 'The easy soul', traits: ['Easygoing', 'Warm', 'Unbothered'], gradient: 'linear-gradient(135deg,#0f8a8a 0%,#2bc4c4 55%,#7fded1 100%)' },
    douz: { city: 'Douz', tagline: 'The free spirit', traits: ['Adventurous', 'Fearless', 'Free'], gradient: 'linear-gradient(135deg,#a5561e 0%,#e0902f 55%,#f0c877 100%)' },
    tozeur: { city: 'Tozeur', tagline: 'The mystic', traits: ['Mysterious', 'Old-soul', 'Magnetic'], gradient: 'linear-gradient(135deg,#6b3b12 0%,#b4762a 55%,#dcb877 100%)' },
    hammamet: { city: 'Hammamet', tagline: 'The good time', traits: ['Fun', 'Magnetic', 'Sun-chaser'], gradient: 'linear-gradient(135deg,#0a7d6b 0%,#f26d6d 55%,#ffcf6e 100%)' },
    kairouan: { city: 'Kairouan', tagline: 'The old soul', traits: ['Grounded', 'Loyal', 'Wise'], gradient: 'linear-gradient(135deg,#5a3d2b 0%,#a5794a 55%,#d4b788 100%)' },
    tabarka: { city: 'Tabarka', tagline: 'The nature lover', traits: ['Down-to-earth', 'Creative', 'Wild-at-heart'], gradient: 'linear-gradient(135deg,#14532d 0%,#2f8f57 55%,#7cc48f 100%)' },
};
let OgService = OgService_1 = class OgService {
    constructor() {
        this.logger = new common_1.Logger(OgService_1.name);
        this.regular = null;
        this.bold = null;
    }
    async onModuleInit() {
        try {
            this.regular = await this.loadFont('inter-latin-400-normal.woff', 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff');
            this.bold = await this.loadFont('inter-latin-700-normal.woff', 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff');
        }
        catch (err) {
            this.logger.warn(`Font preload failed; OG cards will fall back to a static image: ${err.message}`);
        }
    }
    async loadFont(fontsourceFile, cdnUrl) {
        try {
            const pkg = require.resolve('@fontsource/inter/package.json');
            const vendored = path.join(path.dirname(pkg), 'files', fontsourceFile);
            if (fs.existsSync(vendored))
                return fs.promises.readFile(vendored);
        }
        catch { }
        const dir = path.join(__dirname, 'fonts');
        const file = path.join(dir, fontsourceFile);
        if (fs.existsSync(file))
            return fs.promises.readFile(file);
        await fs.promises.mkdir(dir, { recursive: true });
        const buf = await this.fetchBinary(cdnUrl);
        await fs.promises.writeFile(file, buf);
        return buf;
    }
    fetchBinary(url) {
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
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => resolve(Buffer.concat(chunks)));
                res.on('error', reject);
            });
            req.on('error', reject);
            req.setTimeout(8000, () => req.destroy(new Error('Font fetch timed out')));
        });
    }
    isReady() {
        return !!(this.regular && this.bold);
    }
    async renderPassportCard(p) {
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
        const node = {
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
                    border: isFounder ? '8px solid rgba(222,184,80,0.92)' : undefined,
                },
                children: [
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
                    {
                        type: 'div',
                        props: {
                            style: { marginTop: 36, fontSize: 30, opacity: 0.92 },
                            children: `Tunisia Passport  ·  ${p.passportLevel}`,
                        },
                    },
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
                    cities.length
                        ? {
                            type: 'div',
                            props: {
                                style: { marginTop: 36, fontSize: 24, opacity: 0.88 },
                                children: cities.join('  ·  '),
                            },
                        }
                        : null,
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
        const svg = await (0, satori_1.default)(node, {
            width: 1200,
            height: 630,
            fonts: [
                { name: 'Inter', data: this.regular, weight: 400, style: 'normal' },
                { name: 'Inter', data: this.bold, weight: 700, style: 'normal' },
            ],
        });
        const png = new resvg_js_1.Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
        return Buffer.from(png);
    }
    async renderCityQuizCard(a) {
        if (!this.regular || !this.bold)
            throw new Error('OG fonts not loaded');
        const node = {
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
        const svg = await (0, satori_1.default)(node, {
            width: 1200, height: 630,
            fonts: [
                { name: 'Inter', data: this.regular, weight: 400, style: 'normal' },
                { name: 'Inter', data: this.bold, weight: 700, style: 'normal' },
            ],
        });
        const png = new resvg_js_1.Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
        return Buffer.from(png);
    }
    async renderWrappedCard(w) {
        if (!this.regular || !this.bold)
            throw new Error('OG fonts not loaded');
        const node = {
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
        const svg = await (0, satori_1.default)(node, {
            width: 1200, height: 630,
            fonts: [
                { name: 'Inter', data: this.regular, weight: 400, style: 'normal' },
                { name: 'Inter', data: this.bold, weight: 700, style: 'normal' },
            ],
        });
        const png = new resvg_js_1.Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
        return Buffer.from(png);
    }
};
exports.OgService = OgService;
exports.OgService = OgService = OgService_1 = __decorate([
    (0, common_1.Injectable)()
], OgService);
function statTile(n, label) {
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
//# sourceMappingURL=og.service.js.map