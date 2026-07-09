import React, { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { readDraft, clearDraft } from '../../passport-draft';
import { MapPin, Star } from 'lucide-react';
import { goTo } from '../../router';

interface Props { handle: string; fullName: string; onDone(): void; }

const INTEREST_OPTIONS = ['Beach', 'Desert', 'Culture', 'Food', 'Adventure', 'Nightlife', 'Photography', 'History'];

export function PassportOnboarding({ handle, fullName, onDone }: Props) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [country, setCountry] = useState('Tunisia');
    const [interests, setInterests] = useState<string[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        const d = readDraft();
        if (d.interests.length) setInterests(d.interests.slice(0, 8));
    }, []);

    const toggle = (i: string) => setInterests((cur) => cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i]);

    const finish = async () => {
        const draft = readDraft();
        try {
            await api.seedPassport({
                visitedCities: draft.visitedCities,
                interests: Array.from(new Set([...interests, ...draft.interests])),
            });
            // Also update country via the standard profile endpoint.
            if (country && country !== 'Tunisia') {
                await fetch('/api/v1/users/me', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('etunisia_token') || ''}`,
                    },
                    body: JSON.stringify({ country }),
                }).catch(() => {});
            }
        } catch {}
        clearDraft();
        setStep(3);
        setShowConfetti(true);
        window.setTimeout(() => {
            goTo(`/u/${handle}`);
            onDone();
        }, 2200);
    };

    return (
        <div className="passport-onb">
            {showConfetti && <Confetti />}
            <div className="passport-onb-card">
                {step === 1 && (
                    <>
                        <div className="passport-onb-step">Step 1 of 2</div>
                        <h2 className="passport-onb-welcome-h">
                            <span className="passport-onb-welcome-icon" aria-hidden="true"><MapPin size={20} /></span>
                            Welcome, {fullName.split(' ')[0] || 'traveler'}
                        </h2>
                        <p>Where are you from? We'll show it on your passport.</p>
                        <input className="passport-onb-input" value={country} onChange={(e) => setCountry(e.target.value)} />
                        <button className="btn primary block" onClick={() => setStep(2)}>Next</button>
                    </>
                )}
                {step === 2 && (
                    <>
                        <div className="passport-onb-step">Step 2 of 2</div>
                        <h2>What kind of trip do you dream about?</h2>
                        <p>Pick a few — we'll tailor your feed.</p>
                        <div className="passport-onb-chips">
                            {INTEREST_OPTIONS.map((i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`passport-chip ${interests.includes(i) ? 'on' : ''}`}
                                    onClick={() => toggle(i)}
                                >{i}</button>
                            ))}
                        </div>
                        <button className="btn primary block" onClick={finish}>Create my passport</button>
                    </>
                )}
                {step === 3 && (
                    <div className="passport-onb-celebrate">
                        <div className="passport-onb-badge" aria-hidden="true">
                            <Star size={32} strokeWidth={1.75} fill="currentColor" />
                        </div>
                        <h2>You earned <em>New Explorer</em></h2>
                        <p>Your passport is live. Taking you there…</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/** Lightweight CSS-only confetti.
 *  Colors are OKLCH literals matching the brand tokens (terracotta /
 *  mediterranean / gold / cyan / violet). Inline because each piece sets
 *  its background via the `style` attribute — CSS vars would resolve but
 *  add an extra reflow per piece, so we keep them flat. */
function Confetti() {
    const pieces = Array.from({ length: 60 });
    const colors = [
        'oklch(55% 0.16 30)',   // --terracotta
        'oklch(52% 0.14 240)',  // --mediterranean
        'oklch(78% 0.17 80)',   // --gold
        'oklch(72% 0.18 200)',  // --cyan
        'oklch(58% 0.2 290)',   // --violet
    ];
    return (
        <div className="confetti" aria-hidden>
            {pieces.map((_, i) => {
                const left = Math.random() * 100;
                const delay = Math.random() * 0.6;
                const dur = 1.4 + Math.random() * 1.4;
                const bg = colors[i % colors.length];
                return (
                    <span
                        key={i}
                        style={{
                            left: `${left}%`,
                            animationDelay: `${delay}s`,
                            animationDuration: `${dur}s`,
                            background: bg,
                        }}
                    />
                );
            })}
        </div>
    );
}
