import React from 'react';
import { TUNISIA_CITIES, TUNISIA_OUTLINE_PATH } from './tunisia-cities';

interface Props {
    visited: string[];
    emptyCta?: { label: string; href: string };
}

export function TunisiaMap({ visited, emptyCta }: Props) {
    const visitedSet = new Set((visited || []).map((c) => c.toLowerCase()));
    const hasAny = visitedSet.size > 0;

    return (
        <div className="passport-map">
            <svg viewBox="0 0 100 160" className="passport-map-svg" role="img" aria-label="Tunisia map">
                <defs>
                    <radialGradient id="passport-map-glow" cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="rgba(212, 98, 58, 0.35)" />
                        <stop offset="100%" stopColor="rgba(212, 98, 58, 0)" />
                    </radialGradient>
                </defs>
                <path d={TUNISIA_OUTLINE_PATH} className="passport-map-outline" />
                {TUNISIA_CITIES.map((c) => {
                    const isVisited = visitedSet.has(c.name.toLowerCase());
                    return (
                        <g key={c.name} className={isVisited ? 'passport-city visited' : 'passport-city'}>
                            <circle cx={c.x} cy={c.y} r={isVisited ? 2.2 : 1.4} />
                            <text x={c.x + 2.6} y={c.y + 1.2}>{c.name}</text>
                        </g>
                    );
                })}
            </svg>
            {!hasAny && emptyCta && (
                <a className="passport-map-empty" href={emptyCta.href}>
                    <span>Your map is empty.</span>
                    <strong>{emptyCta.label} →</strong>
                </a>
            )}
        </div>
    );
}
