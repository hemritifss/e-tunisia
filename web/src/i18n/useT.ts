import { useSyncExternalStore } from 'react';
import { getLocale, t, LOCALE_EVENT } from './index';

function subscribe(onChange: () => void): () => void {
    window.addEventListener(LOCALE_EVENT, onChange);
    return () => window.removeEventListener(LOCALE_EVENT, onChange);
}

/**
 * React binding for the i18n core: returns t() and re-renders the component
 * when the locale changes.
 */
export function useT(): typeof t {
    useSyncExternalStore(subscribe, getLocale, getLocale);
    return t;
}
