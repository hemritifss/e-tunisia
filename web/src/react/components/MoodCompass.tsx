import React from 'react';
import { MOOD_LIST } from './mood-definitions';

/** The rail is a 5-up grid; the rest of the set lives behind the head link. */
const RAIL_COUNT = 5;

/**
 * Tunisia mood rail — five arch-cropped photographs that anchor the feed to a
 * vibe instead of a generic "Hot / New / Top" sort. Source of truth for moods
 * is `mood-definitions.ts`; this component just renders the strip. Clicking a
 * mood routes to /#/mood/<slug>; the head link opens the full mood index.
 */
export function MoodCompass() {
    return (
        <section className="mood-rail" aria-label="Pick a mood">
            <div className="mood-rail-head">
                <span className="mood-rail-title">What kind of day is it?</span>
                <a className="mood-rail-more" href="#/mood/">
                    All {MOOD_LIST.length} moods <span aria-hidden="true">&rarr;</span>
                </a>
            </div>
            <div className="mood-rail-grid" role="list">
                {MOOD_LIST.slice(0, RAIL_COUNT).map((m) => (
                    <a key={m.id} role="listitem" href={`#/mood/${m.id}`} className="mood-tile">
                        <span className="mood-tile-frame">
                            <img src={m.image} alt="" loading="lazy" />
                        </span>
                        <span className="mood-tile-label">{m.label}</span>
                        <span className="mood-tile-sub">{m.cities.slice(0, 2).join(' · ')}</span>
                    </a>
                ))}
            </div>
        </section>
    );
}
