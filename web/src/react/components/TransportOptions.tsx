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
 */
export function TransportOptions({
  from, to, fromCity, toCity,
}: { from: [number, number]; to: [number, number]; fromCity?: string; toCity?: string }) {
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
