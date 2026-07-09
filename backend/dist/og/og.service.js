"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OgService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OgService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const https = require("https");
const satori_1 = require("satori");
const resvg_js_1 = require("@resvg/resvg-js");
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