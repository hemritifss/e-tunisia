/** Small shared pieces of the circuits UI. Carnet dialect throughout. */

import React from 'react';
import {
    Landmark, Mountain, Building2, Palette, Trees, Waves, Sun, UtensilsCrossed, Eye, Hammer,
} from 'lucide-react';
import type { CircuitKind, CircuitSummary } from '../../../api';
import { MONTHS_SHORT, seasonFor } from './plan';

export const KIND_ICON: Record<CircuitKind, React.ComponentType<{ size?: number }>> = {
    sight: Landmark,
    ruins: Landmark,
    medina: Building2,
    museum: Palette,
    nature: Trees,
    beach: Waves,
    desert: Sun,
    food: UtensilsCrossed,
    viewpoint: Eye,
    craft: Hammer,
};

export const KIND_LABEL: Record<CircuitKind, string> = {
    sight: 'Landmark',
    ruins: 'Ruins',
    medina: 'Medina',
    museum: 'Museum',
    nature: 'Nature',
    beach: 'Coast',
    desert: 'Desert',
    food: 'Table',
    viewpoint: 'Viewpoint',
    craft: 'Workshop',
};

export const THEME_LABEL: Record<CircuitSummary['theme'], string> = {
    heritage: 'Heritage',
    desert: 'Desert',
    coast: 'Coast',
    culture: 'Culture',
    nature: 'Nature',
    food: 'Food',
    city: 'City break',
};

export const REGION_LABEL: Record<CircuitSummary['region'], string> = {
    north: 'North',
    centre: 'Centre',
    south: 'South',
    nationwide: 'Whole country',
};

export function KindIcon({ kind, size = 14 }: { kind: CircuitKind; size?: number }) {
    const Icon = KIND_ICON[kind] || Landmark;
    return <Icon size={size} />;
}

/**
 * Twelve cells, one per month: filled = prime season, struck = actively bad.
 * The traveller's own month is ringed, so "is now a good time" is answered
 * without reading a sentence.
 */
export function SeasonStrip({ circuit, month }: { circuit: CircuitSummary; month: number }) {
    return (
        <div className="ci-season" role="img" aria-label={seasonFor(circuit, month).reason}>
            {MONTHS_SHORT.map((letter, i) => {
                const m = i + 1;
                const good = circuit.bestMonths.includes(m);
                const bad = circuit.avoidMonths?.months.includes(m);
                return (
                    <span
                        key={i}
                        className={`ci-season-cell${good ? ' is-good' : ''}${bad ? ' is-bad' : ''}${m === month ? ' is-now' : ''}`}
                    >
                        {letter}
                    </span>
                );
            })}
        </div>
    );
}

export function SeasonVerdictChip({ circuit, month }: { circuit: CircuitSummary; month: number }) {
    const s = seasonFor(circuit, month);
    return <span className={`ci-verdict ci-verdict--${s.verdict}`} title={s.reason}>{s.label}</span>;
}

/** A boxed number with a caption — the page's only "stat" primitive. */
export function Stat({ value, label, hint }: { value: React.ReactNode; label: string; hint?: string }) {
    return (
        <div className="ci-stat" title={hint}>
            <span className="ci-stat-value cn-num">{value}</span>
            <span className="ci-stat-label">{label}</span>
        </div>
    );
}
