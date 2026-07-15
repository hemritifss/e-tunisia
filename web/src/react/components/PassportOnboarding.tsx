import React, { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { readDraft, clearDraft } from '../../passport-draft';
import { MapPin } from 'lucide-react';
import { goTo } from '../../router';
import { renderStampSVG } from '../../stamp';

interface Props { handle: string; fullName: string; onDone(): void; }

const INTEREST_OPTIONS = ['Beach', 'Desert', 'Culture', 'Food', 'Adventure', 'Nightlife', 'Photography', 'History'];

export function PassportOnboarding({ handle, fullName, onDone }: Props) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [country, setCountry] = useState('Tunisia');
    const [interests, setInterests] = useState<string[]>([]);

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
        window.setTimeout(() => {
            goTo(`/u/${handle}`);
            onDone();
        }, 2600);
    };

    // The ceremony (UNIQUENESS §6.11): onboarding ends with the user's first
    // real stamp — the carnet being opened. It thunks onto the card itself
    // rather than the full-screen slam (which is for check-ins, where nothing
    // sits centre-screen to collide with).
    const firstStamp = renderStampSVG({
        top: 'CARNET OUVERT',
        title: fullName.split(' ')[0] || handle,
        bottom: `${new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} · TUNISIE`,
    });

    return (
        <div className="passport-onb">
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
                        <div
                            className="passport-onb-stamp"
                            aria-hidden="true"
                            dangerouslySetInnerHTML={{ __html: firstStamp }}
                        />
                        <h2>Your carnet is open.</h2>
                        <p className="passport-onb-hand">page one — the rest of Tunisia is yours to fill.</p>
                        <p className="passport-onb-taking">Taking you to your passport…</p>
                    </div>
                )}
            </div>
        </div>
    );
}

