import '../../styles/louage.css';
import React, { useEffect, useMemo, useState } from 'react';
import { Bus, ArrowLeftRight, MapPin, Info } from 'lucide-react';
import { CITIES } from '../../city-filter';
import { TransportOptions } from '../components/TransportOptions';
import { track } from '../../analytics';

// GROWTH §7 magnet page: "Tunis → Douz: how, how long, how much?" is asked
// constantly and has no good answer online. Zero-login, one URL per route
// (?from=&to=) so every answer is shareable and rankable.

const POPULAR: Array<[string, string]> = [
  ['Tunis', 'Sousse'], ['Tunis', 'Douz'], ['Sousse', 'Djerba'],
  ['Tunis', 'Tabarka'], ['Sfax', 'Djerba'], ['Tunis', 'Kairouan'],
];

function cityByName(name: string | null) {
  if (!name) return null;
  return CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase()) || null;
}

export default function LouagePage() {
  const params = new URLSearchParams(location.search || location.hash.split('?')[1] || '');
  const [from, setFrom] = useState(() => cityByName(params.get('from'))?.name || 'Tunis');
  const [to, setTo] = useState(() => cityByName(params.get('to'))?.name || 'Sousse');

  const a = useMemo(() => cityByName(from), [from]);
  const b = useMemo(() => cityByName(to), [to]);

  // Keep the URL shareable — every from/to pair is its own link.
  useEffect(() => {
    try {
      const url = `${location.pathname.startsWith('/louage') ? '/louage' : location.pathname}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      history.replaceState(null, '', url);
    } catch { /* ignore */ }
    track('louage_lookup', { from, to });
  }, [from, to]);

  const swap = () => { setFrom(to); setTo(from); };

  return (
    <div className="louage-page cn-grain page-enter">
      <header className="louage-header">
        <span className="louage-kicker"><Bus size={13} /> Getting around Tunisia</span>
        <h1>Louage, bus &amp; train — <em>{from} to {to}</em></h1>
        <p>How to get there, how long it takes, and roughly what it costs. No account needed.</p>
      </header>

      <div className="louage-controls">
        <label className="louage-select">
          <MapPin size={14} />
          <select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From city">
            {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </label>
        <button className="louage-swap" type="button" onClick={swap} aria-label="Swap cities">
          <ArrowLeftRight size={16} />
        </button>
        <label className="louage-select">
          <MapPin size={14} />
          <select value={to} onChange={(e) => setTo(e.target.value)} aria-label="To city">
            {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </label>
      </div>

      {a && b && a.name !== b.name ? (
        <TransportOptions from={[a.lng, a.lat]} to={[b.lng, b.lat]} fromCity={a.name} toCity={b.name} ticket />
      ) : (
        <p className="louage-hint">Pick two different cities to see the options.</p>
      )}

      <section className="louage-popular">
        <h2>Popular routes</h2>
        <div className="louage-popular-row">
          {POPULAR.map(([f, t]) => (
            <button
              key={f + t}
              type="button"
              className={`louage-chip ${from === f && to === t ? 'is-active' : ''}`}
              onClick={() => { setFrom(f); setTo(t); }}
            >
              {f} → {t}
            </button>
          ))}
        </div>
      </section>

      <section className="louage-explainer">
        <h2><Info size={15} /> How louages work</h2>
        <ul>
          <li><strong>Louages</strong> are shared 8-seat minibuses — the backbone of intercity travel. They leave from the <em>louage station</em> as soon as all seats fill, no timetable.</li>
          <li>Fares are <strong>fixed per seat</strong> and cheap; pay the driver or the station kiosk. Estimates above are per person.</li>
          <li>White with a <span className="lt-swatch" style={{ ['--stripe' as any]: 'oklch(55% 0.19 25)' }} aria-hidden="true" /><strong>red stripe</strong> = intercity; <span className="lt-swatch" style={{ ['--stripe' as any]: 'oklch(52% 0.14 250)' }} aria-hidden="true" /><strong>blue stripe</strong> = regional (within a governorate); <span className="lt-swatch" style={{ ['--stripe' as any]: 'oklch(78% 0.14 90)' }} aria-hidden="true" /><strong>yellow stripe</strong> = rural.</li>
          <li>Buses (SNTRI) are cheaper and scheduled; the <strong>train (SNCFT)</strong> is comfortable on the coastal line (Tunis–Sousse–Sfax).</li>
          <li>Times and prices are estimates — traffic and season matter. Confirm at the station for long desert routes.</li>
        </ul>
        <p className="louage-cta">Planning a full trip? <a href="#/ai-planner">Let the AI planner build your day-by-day route →</a></p>
      </section>
    </div>
  );
}
