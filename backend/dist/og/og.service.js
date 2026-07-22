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
        this.fraunces = null;
        this.caveat = null;
        this.kufi = null;
    }
    async onModuleInit() {
        try {
            this.regular = await this.loadFont('inter-latin-400-normal.woff', 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff');
            this.bold = await this.loadFont('inter-latin-700-normal.woff', 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff');
        }
        catch (err) {
            this.logger.warn(`Font preload failed; OG cards will fall back to a static image: ${err.message}`);
        }
        const carnet = [
            ['fraunces', 'fraunces-latin-600-normal.woff', 'https://cdn.jsdelivr.net/npm/@fontsource/fraunces@5.2.5/files/fraunces-latin-600-normal.woff'],
            ['caveat', 'caveat-latin-400-normal.woff', 'https://cdn.jsdelivr.net/npm/@fontsource/caveat@5.2.5/files/caveat-latin-400-normal.woff'],
        ];
        for (const [prop, file, url] of carnet) {
            try {
                this[prop] = await this.loadFont(file, url);
            }
            catch (err) {
                this.logger.warn(`Carnet font ${file} failed to load: ${err.message}`);
            }
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
    async renderMappingCard(m) {
        if (!this.regular || !this.bold)
            throw new Error('OG fonts not loaded');
        const medals = ['1.', '2.', '3.'];
        const node = {
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
    async fetchImageDataUri(url) {
        if (!url || !/^https?:\/\//i.test(url))
            return null;
        try {
            const { buf, mime } = await this.fetchImage(url);
            if (buf.length > 6_000_000)
                return null;
            return `data:${mime};base64,${buf.toString('base64')}`;
        }
        catch {
            return null;
        }
    }
    fetchImage(url) {
        const mod = url.startsWith('http://') ? require('http') : https;
        const ua = 'e-Tunisia/1.0 (https://etunisia.com; og-cards@etunisia.com)';
        return new Promise((resolve, reject) => {
            const req = mod.get(url, { headers: { 'User-Agent': ua } }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    this.fetchImage(res.headers.location).then(resolve, reject);
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`img ${url} → ${res.statusCode}`));
                    return;
                }
                const mime = (res.headers['content-type'] || 'image/jpeg').split(';')[0];
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => resolve({ buf: Buffer.concat(chunks), mime }));
                res.on('error', reject);
            });
            req.on('error', reject);
            req.setTimeout(9000, () => req.destroy(new Error('img fetch timed out')));
        });
    }
    buildPostcard(o) {
        const display = this.fraunces ? 'Fraunces' : 'Inter';
        const hand = this.caveat ? 'Caveat' : 'Inter';
        const PAPER = '#f1e7d3', MATTE = '#fbf6ec', INK = '#2b2620', SOFT = '#6f6455', TERRA = '#c0492f', RULE = '#d7cbb2', GOLD = '#cba24a';
        return {
            type: 'div',
            props: {
                style: {
                    width: 1200, height: 630, display: 'flex', background: PAPER,
                    fontFamily: 'Inter', color: INK, padding: 40, position: 'relative',
                },
                children: [
                    { type: 'div', props: { style: { position: 'absolute', top: 22, left: 22, right: 22, bottom: 22, border: `2px solid ${RULE}` } } },
                    { type: 'div', props: { style: { position: 'absolute', top: 27, left: 27, right: 27, bottom: 27, border: `1px solid ${RULE}` } } },
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
                    {
                        type: 'div',
                        props: {
                            style: { display: 'flex', flexDirection: 'column', flex: 1, paddingLeft: 34, paddingRight: 26, paddingTop: 44, paddingBottom: 40 },
                            children: [
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
                                { type: 'div', props: { style: { display: 'flex', fontFamily: display, fontSize: titleSize(o.title), lineHeight: 1.04, color: INK, marginTop: 26 }, children: o.title } },
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
                                { type: 'div', props: { style: { display: 'flex', flex: 1 } } },
                                { type: 'div', props: { style: { display: 'flex', fontSize: 20, color: SOFT }, children: o.footer } },
                            ],
                        },
                    },
                ],
            },
        };
    }
    async rasterize(node) {
        const fonts = [
            { name: 'Inter', data: this.regular, weight: 400, style: 'normal' },
            { name: 'Inter', data: this.bold, weight: 700, style: 'normal' },
        ];
        if (this.fraunces)
            fonts.push({ name: 'Fraunces', data: this.fraunces, weight: 600, style: 'normal' });
        if (this.caveat)
            fonts.push({ name: 'Caveat', data: this.caveat, weight: 400, style: 'normal' });
        if (this.kufi)
            fonts.push({ name: 'Kufi', data: this.kufi, weight: 700, style: 'normal' });
        const svg = await (0, satori_1.default)(node, { width: 1200, height: 630, fonts });
        return Buffer.from(new resvg_js_1.Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
    }
    async renderPlacePostcard(p) {
        if (!this.regular || !this.bold)
            throw new Error('OG fonts not loaded');
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
    async renderPostPostcard(p) {
        if (!this.regular || !this.bold)
            throw new Error('OG fonts not loaded');
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
    async renderTripPostcard(t) {
        if (!this.regular || !this.bold)
            throw new Error('OG fonts not loaded');
        const cities = Array.from(new Set((t.stops || []).map((s) => s.placeCity).filter(Boolean)));
        const cover = (t.stops || []).map((s) => s.placeCover).find(Boolean) || null;
        const startCity = cities[0] || 'Tunisia';
        const gov = GOV_LOOKUP[normGov(startCity)];
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
};
exports.OgService = OgService;
exports.OgService = OgService = OgService_1 = __decorate([
    (0, common_1.Injectable)()
], OgService);
const GOV_LOOKUP = {
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
function normGov(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, '').trim();
}
function titleSize(t) {
    const n = t.length;
    if (n <= 20)
        return 62;
    if (n <= 34)
        return 50;
    if (n <= 50)
        return 40;
    return 32;
}
function starsSvgDataUri(n, fill, empty) {
    const star = 'M12 2l2.9 6 6.6.5-5 4.3 1.6 6.4L12 16.3 5.9 19.2 7.5 12.8 2.5 8.5 9.1 8z';
    let s = `<svg xmlns='http://www.w3.org/2000/svg' width='110' height='20' viewBox='0 0 110 20'>`;
    for (let i = 0; i < 5; i++) {
        s += `<g transform='translate(${i * 22}, -2)'><path d='${star}' fill='${i < n ? fill : 'none'}' stroke='${i < n ? fill : empty}' stroke-width='1.4'/></g>`;
    }
    s += `</svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(s).toString('base64')}`;
}
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