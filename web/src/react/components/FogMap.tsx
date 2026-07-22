import React, { useMemo, useState } from 'react';
import { GOV_SHAPES } from './tunisia-governorates';
import { GOVERNORATES, governoratesFromCities } from '../../governorates';

// Parchment fog-of-exploration map (UNIQUENESS IDEAS A1).
// The whole country starts as blank parchment with pencil hatching; a
// check-in "inks in" that governorate — terracotta fill, its name, and a
// tiny denomination number appear. The map becomes a scratch-map you colour
// by travelling, 1:1 with the governorate stamp album. Reduced motion fills
// instantly (no ink-bleed keyframe). Purely presentational — no network.

interface Props {
    visited: string[]; // visited city names
    emptyCta?: { label: string; href: string };
}

const GOV_BY_ID = Object.fromEntries(GOVERNORATES.map((g) => [g.id, g]));
// Small northern governorates: show the number only (names would collide).
const TINY = new Set(['tunis', 'ariana', 'ben-arous', 'manouba', 'zaghouan', 'monastir']);

export function FogMap({ visited, emptyCta }: Props) {
    const visitedGovs = useMemo(() => governoratesFromCities(visited), [visited]);
    const [hover, setHover] = useState<string | null>(null);
    const count = visitedGovs.size;
    const pct = Math.round((count / 24) * 100);

    return (
        <div className="fog-map" data-design="carnet">
            <div className="fog-map-head">
                <span className="fog-map-kicker">The National Map</span>
                <span className="fog-map-count">
                    <strong>{count}</strong> / 24 governorates inked
                </span>
            </div>

            <div className="fog-map-frame">
                <svg viewBox="0 0 100 160" className="fog-map-svg" role="img"
                     aria-label={`Map of Tunisia — ${count} of 24 governorates explored`}>
                    <defs>
                        {/* pencil hatch for unvisited (fog) regions */}
                        <pattern id="fog-hatch" width="2.4" height="2.4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="2.4" className="fog-hatch-line" />
                        </pattern>
                    </defs>

                    {GOVERNORATES.map((g) => {
                        const shape = GOV_SHAPES[g.id];
                        if (!shape) return null;
                        const inked = visitedGovs.has(g.id);
                        const isHover = hover === g.id;
                        return (
                            <g
                                key={g.id}
                                className={`fog-region${inked ? ' is-inked' : ''}${isHover ? ' is-hover' : ''}`}
                                onMouseEnter={() => setHover(g.id)}
                                onMouseLeave={() => setHover((h) => (h === g.id ? null : h))}
                            >
                                {/* fog layer (hatched parchment) — fades as region inks in */}
                                <path d={shape.d} className="fog-region-fog" />
                                {/* ink layer — clipped in via opacity when visited */}
                                <path d={shape.d} className="fog-region-ink" />
                                <path d={shape.d} className="fog-region-edge" />
                            </g>
                        );
                    })}

                    {/* labels on top so ink fills never cover them */}
                    {GOVERNORATES.map((g) => {
                        const shape = GOV_SHAPES[g.id];
                        if (!shape) return null;
                        const inked = visitedGovs.has(g.id);
                        const tiny = TINY.has(g.id);
                        return (
                            <g key={`l-${g.id}`} className={`fog-label${inked ? ' is-inked' : ''}`} pointerEvents="none">
                                {(!tiny || inked || hover === g.id) && (
                                    <text x={shape.cx} y={shape.cy} textAnchor="middle" className="fog-label-name">
                                        {g.name}
                                    </text>
                                )}
                                {inked && (
                                    <text x={shape.cx} y={shape.cy + 3} textAnchor="middle" className="fog-label-no">
                                        Nº {g.n}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {hover && GOV_BY_ID[hover] && (
                    <div className="fog-map-tip" aria-hidden="true">
                        <strong>{GOV_BY_ID[hover].name}</strong>
                        <span>{GOV_BY_ID[hover].nameAr}</span>
                        <em>{visitedGovs.has(hover) ? 'Inked · Nº ' + GOV_BY_ID[hover].n : 'Still fog — go check in'}</em>
                    </div>
                )}
            </div>

            {count === 0 && emptyCta ? (
                <a className="fog-map-empty" href={emptyCta.href}>
                    <span>The whole country is still fog.</span>
                    <strong>{emptyCta.label} →</strong>
                </a>
            ) : (
                <div className="fog-map-bar" aria-hidden="true">
                    <span style={{ width: `${pct}%` }} />
                </div>
            )}
        </div>
    );
}
