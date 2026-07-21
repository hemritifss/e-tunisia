export type AnchorKind = 'sight' | 'ruins' | 'medina' | 'museum' | 'nature' | 'beach' | 'desert' | 'food' | 'viewpoint' | 'craft';
export declare const DWELL_BY_KIND: Record<AnchorKind, number>;
export interface CircuitAnchor {
    prefer?: string[];
    city: string;
    governorate: string;
    tags?: string[];
    kind: AnchorKind;
    why: string;
    priority: 1 | 2 | 3;
    minutes?: number;
    slot?: 'morning' | 'midday' | 'afternoon' | 'evening';
}
export interface CircuitTemplate {
    slug: string;
    title: string;
    tagline: string;
    summary: string;
    theme: 'heritage' | 'desert' | 'coast' | 'culture' | 'nature' | 'food' | 'city';
    region: 'north' | 'centre' | 'south' | 'nationwide';
    difficulty: 'easy' | 'moderate' | 'challenging';
    defaultDays: number;
    dayRange: [number, number];
    bestMonths: number[];
    avoidMonths?: {
        months: number[];
        reason: string;
    };
    carFree: boolean;
    stayBandTnd: number;
    knowHow: string[];
    packing: string[];
    anchors: CircuitAnchor[];
}
export declare const CIRCUIT_TEMPLATES: CircuitTemplate[];
export declare const CIRCUIT_BY_SLUG: Map<string, CircuitTemplate>;
