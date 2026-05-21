import React from 'react';

/**
 * Tunisia mood compass — a horizontal strip of large emoji-led pills
 * that anchor the feed to a vibe instead of a generic "Hot / New / Top" sort.
 * Clicking a mood routes to the existing /#/explore filter, so the whole
 * destination catalogue acts as the result page.
 */
interface Mood {
    id: string;
    emoji: string;
    label: string;
    sub: string;
    href: string;
    tint: string;     // gradient stops used in the active pill background
}

const MOODS: Mood[] = [
    { id: 'beach',     emoji: '🏖', label: 'Beach',    sub: "Hammamet · Djerba",  href: '#/explore?mood=beach',    tint: '#56cfe1' },
    { id: 'desert',    emoji: '🐪', label: 'Desert',   sub: 'Tozeur · Matmata',   href: '#/explore?mood=desert',   tint: '#d4623a' },
    { id: 'medina',    emoji: '🕌', label: 'Medina',   sub: 'Tunis · Kairouan',   href: '#/explore?mood=medina',   tint: '#e4b07e' },
    { id: 'food',      emoji: '🍲', label: 'Food',     sub: 'Sfax · Sousse',      href: '#/explore?mood=food',     tint: '#f4c542' },
    { id: 'adventure', emoji: '🏔', label: 'Adventure', sub: 'Atlas · Tabarka',   href: '#/explore?mood=adventure', tint: '#7a8c5a' },
    { id: 'culture',   emoji: '🎭', label: 'Culture',  sub: 'Carthage · Dougga',  href: '#/explore?mood=culture',  tint: '#a371f7' },
];

export function MoodCompass() {
    return (
        <section className="mood-compass" aria-label="Pick a mood">
            <div className="mood-compass-head">
                <strong>How are you feeling today?</strong>
                <span>Tap a mood to discover Tunisia your way</span>
            </div>
            <div className="mood-compass-track" role="list">
                {MOODS.map((m) => (
                    <a
                        key={m.id}
                        role="listitem"
                        href={m.href}
                        className="mood-pill"
                        style={{ '--mood-tint': m.tint } as React.CSSProperties}
                    >
                        <span className="mood-pill-emoji">{m.emoji}</span>
                        <div className="mood-pill-text">
                            <strong>{m.label}</strong>
                            <span>{m.sub}</span>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
