import { useSyncExternalStore } from 'react';
import { getCurrency, CURRENCY_EVENT, formatMoney } from '../../currency';

function subscribe(onChange: () => void): () => void {
    window.addEventListener(CURRENCY_EVENT, onChange);
    return () => window.removeEventListener(CURRENCY_EVENT, onChange);
}

/** Reactive read of the active display currency code (e.g. 'TND', 'EUR'). */
export function useCurrency(): string {
    return useSyncExternalStore(subscribe, getCurrency, getCurrency);
}

/**
 * Reactive TND→display money formatter. Re-renders when the currency (or its
 * daily rate) changes. Pass an amount stored in TND.
 */
export function useMoney(): (tnd: number, opts?: { decimals?: number }) => string {
    useCurrency(); // subscribe so components re-render on change
    return formatMoney;
}
