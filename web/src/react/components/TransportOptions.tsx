import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, Bus, TrainFront, Users, Footprints, ArrowRight } from 'lucide-react';
import { useMoney } from '../lib/useCurrency';

const ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  drive: Car, louage: Users, bus: Bus, train: TrainFront, walk: Footprints,
};

function fmtDur(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

interface Opt {
  mode: string; label: string; durationMin: number; note: string;
  cost?: { lowTnd: number; highTnd: number };
}

/**
 * "How do I get there?" — estimated louage / bus / train / drive / walk options
 * between two points (Tier 2.4). Costs flip with the display currency (2.10).
 *
 * `ticket` renders each option as a louage ticket stub (carnet Journal
 * dialect, UNIQUENESS §6.7) — used by the louage magnet page; the default
 * compact list stays for TripPage.
 */
export function TransportOptions({
  from, to, fromCity, toCity, ticket = false,
}: { from: [number, number]; to: [number, number]; fromCity?: string; toCity?: string; ticket?: boolean }) {
  const money = useMoney();
  const { data } = useQuery({
    queryKey: ['transport', from.join(','), to.join(','), fromCity, toCity],
    queryFn: () => {
      const qs = new URLSearchParams({ from: from.join(','), to: to.join(',') });
      if (fromCity) qs.set('fromCity', fromCity);
      if (toCity) qs.set('toCity', toCity);
      return fetch(`/api/v1/routing/transport?${qs.toString()}`).then((r) => r.json());
    },
    staleTime: 60 * 60_000,
  });

  const options: Opt[] = data?.options || [];
  if (!options.length) return null;

  if (ticket) {
    return (
      <div className="lt-rack">
        <div className="lt-rack-head">
          <span>{fromCity || 'Here'} ⇢ {toCity || 'there'}</span>
          {data?.distanceKm ? <span className="lt-rack-km">~{data.distanceKm} km by road</span> : null}
        </div>
        <ul className="lt-list">
          {options.map((o) => {
            const Icon = ICON[o.mode] || Car;
            const hasCost = o.cost && o.cost.highTnd > 0;
            const fareLabel = !hasCost ? 'no fare' : o.mode === 'drive' ? 'est. fuel' : 'per seat';
            return (
              <li key={o.mode} className={`lt-ticket lt-ticket--${o.mode}`}>
                <div className="lt-stub">
                  {hasCost ? (
                    <span className="lt-fare">{money(o.cost!.lowTnd)}<em> – {money(o.cost!.highTnd)}</em></span>
                  ) : (
                    <span className="lt-fare">{fmtDur(o.durationMin)}</span>
                  )}
                  <span className="lt-fare-label">{fareLabel}</span>
                  <span className="lt-stub-route">{fromCity || '·'} ⇢ {toCity || '·'}</span>
                </div>
                <div className="lt-body">
                  <div className="lt-mode">
                    <Icon size={15} />
                    <h3>{o.label}</h3>
                    <span className="lt-dur">{fmtDur(o.durationMin)}</span>
                  </div>
                  <p className="lt-note">{o.note}</p>
                </div>
                <div className="lt-barcode" aria-hidden="true" />
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="transport-options">
      <div className="transport-head">
        <ArrowRight size={13} /> {fromCity || 'Here'} → {toCity || 'there'}
        {data?.distanceKm ? <span className="transport-km"> · ~{data.distanceKm} km</span> : null}
      </div>
      <ul className="transport-list">
        {options.map((o) => {
          const Icon = ICON[o.mode] || Car;
          const hasCost = o.cost && o.cost.highTnd > 0;
          return (
            <li key={o.mode} className="transport-opt">
              <Icon size={15} />
              <span className="transport-opt-label">{o.label}</span>
              <span className="transport-opt-dur">{fmtDur(o.durationMin)}</span>
              {hasCost && (
                <span className="transport-opt-cost">{money(o.cost!.lowTnd)}–{money(o.cost!.highTnd)}</span>
              )}
              <span className="transport-opt-note">{o.note}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
