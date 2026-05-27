import React from 'react';
import { MOOD_LIST } from './mood-definitions';

/**
 * Tunisia mood compass — a horizontal strip of large icon-led pills that
 * anchor the feed to a vibe instead of a generic "Hot / New / Top" sort.
 * Source of truth for moods is `mood-definitions.ts`; this component just
 * renders the strip. Clicking a mood routes to /#/mood/<slug>.
 */
export function MoodCompass() {
    return (
        <section className="mood-compass" aria-label="Pick a mood">
            <div className="mood-compass-head">
                <strong>How are you feeling today?</strong>
                <span>Tap a mood to discover Tunisia your way</span>
            </div>
            <div className="mood-compass-track" role="list">
                {MOOD_LIST.map((m) => {
                    const I = m.Icon;
                    const sub = m.cities.slice(0, 2).join(' · ');
                    return (
                        <a
                            key={m.id}
                            role="listitem"
                            href={`#/mood/${m.id}`}
                            className="mood-pill"
                            style={{ '--mood-tint': m.tint } as React.CSSProperties}
                        >
                            <span className="mood-pill-icon" aria-hidden="true">
                                <I size={20} strokeWidth={1.75} />
                            </span>
                            <div className="mood-pill-text">
                                <strong>{m.label}</strong>
                                <span>{sub}</span>
                            </div>
                        </a>
                    );
                })}
            </div>
        </section>
    );
}
