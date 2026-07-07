import { useSyncExternalStore } from 'react';
import { getCity, CITY_EVENT } from '../../city-filter';

function subscribe(onChange: () => void): () => void {
    window.addEventListener(CITY_EVENT, onChange);
    return () => window.removeEventListener(CITY_EVENT, onChange);
}

/** Reactive read of the global city filter (null = all Tunisia). */
export function useCity(): string | null {
    return useSyncExternalStore(subscribe, getCity, getCity);
}
