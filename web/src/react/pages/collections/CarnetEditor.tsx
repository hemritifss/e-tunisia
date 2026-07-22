import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import {
    X, Search, Plus, Trash2, ArrowUp, ArrowDown, Check, MapPin,
    EyeOff, Globe, Lock, Stamp,
} from 'lucide-react';
import * as api from '../../../api';
import { goTo } from '../../../router';
import { showToast } from '../../../ui-utils';
import { track } from '../../../analytics';
import * as store from './store';
import type { Carnet, CarnetPlace, CarnetThemeKey } from './store';
import { THEMES, usePlan } from './bits';

interface Props {
    carnetId: string | null; // null → create
    onClose: () => void;
    onSaved: (carnetId: string) => void;
}

function placeToCarnet(p: any): CarnetPlace {
    return {
        id: String(p.id),
        name: p.name || 'Place',
        city: p.city || p.governorate || '',
        cover: p.coverImage || p.image || (p.images && p.images[0]) || '',
    };
}

export default function CarnetEditor({ carnetId, onClose, onSaved }: Props) {
    const { isPro } = usePlan();
    const existing: Carnet | undefined = carnetId ? store.getCarnet(carnetId) : undefined;

    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(existing?.title || '');
    const [description, setDescription] = useState(existing?.description || '');
    const [theme, setTheme] = useState<CarnetThemeKey | undefined>(existing?.theme);
    const [isPrivate, setIsPrivate] = useState(!!existing?.isPrivate);
    const [places, setPlaces] = useState<CarnetPlace[]>(existing?.places ? [...existing.places] : []);
    const [q, setQ] = useState('');

    const close = () => {
        setOpen(false);
        document.body.style.overflow = '';
        window.setTimeout(onClose, 200);
    };

    useEffect(() => {
        const raf = requestAnimationFrame(() => setOpen(true));
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', onKey);
        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { data: results, isFetching } = useQuery({
        queryKey: ['place-search', q],
        enabled: q.trim().length >= 2,
        queryFn: async () => {
            try {
                const res: any = await api.getPlaces({ search: q.trim(), limit: '24' });
                const arr: any[] = res?.data || (Array.isArray(res) ? res : []);
                return arr;
            } catch {
                return [] as any[];
            }
        },
        staleTime: 60_000,
    });

    const inBoard = useMemo(() => new Set(places.map((p) => p.id)), [places]);

    const addPlace = (p: any) => {
        const cp = placeToCarnet(p);
        if (inBoard.has(cp.id)) return;
        setPlaces((prev) => [...prev, cp]);
    };
    const removePlace = (id: string) => setPlaces((prev) => prev.filter((p) => p.id !== id));
    const setNote = (id: string, note: string) =>
        setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, note: note.slice(0, 200) } : p)));
    const move = (id: string, dir: -1 | 1) => setPlaces((prev) => {
        const next = [...prev];
        const i = next.findIndex((p) => p.id === id);
        const j = i + dir;
        if (i === -1 || j < 0 || j >= next.length) return prev;
        [next[i], next[j]] = [next[j], next[i]];
        return next;
    });

    const remove = () => {
        if (!carnetId) return;
        if (!window.confirm('Delete this carnet? This can’t be undone.')) return;
        store.deleteCarnet(carnetId);
        track('carnet_delete', { id: carnetId });
        showToast('Carnet deleted');
        close();
    };

    const togglePrivate = () => {
        if (!isPro) { showToast('Private carnets are a Pro perk', { type: 'error' }); goTo('/pro'); return; }
        setIsPrivate((v) => !v);
    };

    const save = () => {
        const name = title.trim();
        if (!name) { showToast('Give your carnet a title first', { type: 'error' }); return; }
        const payload = { title: name, description, theme, isPrivate: isPro ? isPrivate : false, places };
        let id = carnetId;
        if (carnetId) {
            store.updateCarnet(carnetId, payload);
        } else {
            if (store.atCarnetCap(isPro)) { showToast('Free plan holds 3 carnets — go Pro', { type: 'error' }); goTo('/pro'); return; }
            id = store.createCarnet(payload).id;
        }
        track(carnetId ? 'carnet_edit' : 'carnet_create', { id, places: places.length });
        showToast(carnetId ? 'Carnet updated' : 'Carnet created');
        close();
        if (id) window.setTimeout(() => onSaved(id!), 220);
    };

    return createPortal(
        <div className={`cn-scrim collections-scrim${open ? ' is-open' : ''}`}
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
            <div className="collections-sheet collections-editor" role="dialog" aria-modal="true" aria-label={carnetId ? 'Edit carnet' : 'New carnet'}>
                <button type="button" className="collections-sheet-close" onClick={close} aria-label="Close"><X size={18} /></button>

                <div className="collections-editor-head">
                    <span className="cn-kicker"><Stamp size={12} /> {carnetId ? 'Edit carnet' : 'New carnet'}</span>
                    <input
                        className="collections-editor-title" value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Name your carnet — “Cafés with a sea view”" aria-label="Carnet title" maxLength={80} autoFocus
                    />
                    <textarea
                        className="collections-editor-desc" value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="A line about what this board is for (optional)" aria-label="Carnet description" rows={2} maxLength={400}
                    />
                </div>

                <div className="collections-editor-themes" role="group" aria-label="Theme">
                    {THEMES.map((t) => (
                        <button
                            key={t.key} type="button"
                            className={`cn-chip${theme === t.key ? ' is-on' : ''}`}
                            onClick={() => setTheme(theme === t.key ? undefined : t.key)}
                            aria-pressed={theme === t.key}
                        >
                            <span aria-hidden="true">{t.emoji}</span> {t.label}
                        </button>
                    ))}
                    <button
                        type="button" className={`cn-chip collections-privacy${isPrivate ? ' is-on' : ''}`}
                        onClick={togglePrivate} aria-pressed={isPrivate}
                        title={isPro ? 'Toggle privacy' : 'Pro perk'}
                    >
                        {isPrivate ? <EyeOff size={13} /> : <Globe size={13} />} {isPrivate ? 'Private' : 'Public'}
                        {!isPro && <Lock size={11} className="collections-privacy-lock" />}
                    </button>
                </div>

                <div className="collections-editor-body">
                    <section className="collections-editor-picker">
                        <label className="collections-search">
                            <Search size={15} />
                            <input
                                type="search" value={q} onChange={(e) => setQ(e.target.value)}
                                placeholder="Search places to add…" aria-label="Search places to add"
                            />
                            {q && <button type="button" onClick={() => setQ('')} aria-label="Clear"><X size={14} /></button>}
                        </label>

                        <div className="collections-picker-results">
                            {q.trim().length < 2 && <p className="collections-picker-hint">Type at least 2 letters to find places.</p>}
                            {q.trim().length >= 2 && isFetching && <p className="collections-picker-hint">Searching…</p>}
                            {q.trim().length >= 2 && !isFetching && (results || []).length === 0 && (
                                <p className="collections-picker-hint">No places match “{q}”.</p>
                            )}
                            {(results || []).map((p: any) => {
                                const added = inBoard.has(String(p.id));
                                const cover = p.coverImage || p.image || (p.images && p.images[0]) || '';
                                return (
                                    <button
                                        key={p.id} type="button"
                                        className={`collections-picker-row${added ? ' is-added' : ''}`}
                                        onClick={() => addPlace(p)} disabled={added}
                                    >
                                        {cover ? <img src={api.getImageUrl(cover)} alt="" loading="lazy" /> : <span className="collections-place-blank" aria-hidden="true">📍</span>}
                                        <span className="collections-picker-text">
                                            <strong>{p.name}</strong>
                                            {(p.city || p.governorate) && <small>{p.city || p.governorate}</small>}
                                        </span>
                                        {added ? <Check size={16} className="collections-picker-added" /> : <Plus size={16} />}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="collections-editor-list">
                        <h3 className="cn-kicker"><MapPin size={12} /> {places.length} on this board</h3>
                        {places.length === 0 ? (
                            <p className="collections-picker-hint">Nothing here yet — search on the left and press <Plus size={12} /> to pin a place.</p>
                        ) : (
                            <ul className="collections-editor-places">
                                {places.map((p, i) => (
                                    <li key={p.id} className="collections-editor-place">
                                        <div className="collections-editor-place-top">
                                            {p.cover ? <img src={api.getImageUrl(p.cover)} alt="" loading="lazy" /> : <span className="collections-place-blank" aria-hidden="true">📍</span>}
                                            <span className="collections-picker-text">
                                                <strong>{p.name}</strong>
                                                {p.city && <small>{p.city}</small>}
                                            </span>
                                            <span className="collections-editor-place-controls">
                                                <button type="button" className="cn-icon-btn" onClick={() => move(p.id, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={14} /></button>
                                                <button type="button" className="cn-icon-btn" onClick={() => move(p.id, 1)} disabled={i === places.length - 1} aria-label="Move down"><ArrowDown size={14} /></button>
                                                <button type="button" className="cn-icon-btn cn-icon-btn--danger" onClick={() => removePlace(p.id)} aria-label="Remove"><Trash2 size={14} /></button>
                                            </span>
                                        </div>
                                        <input
                                            className="collections-editor-note" value={p.note || ''}
                                            onChange={(e) => setNote(p.id, e.target.value)}
                                            placeholder="Add a note — why it's here, best time to go…" aria-label={`Note for ${p.name}`} maxLength={200}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                <footer className="collections-editor-foot">
                    {carnetId && (
                        <button type="button" className="collections-textbtn collections-textbtn--danger collections-editor-delete" onClick={remove}>
                            <Trash2 size={14} /> Delete
                        </button>
                    )}
                    <button type="button" className="cn-btn cn-btn--quiet" onClick={close}>Cancel</button>
                    <button type="button" className="cn-btn" onClick={save}><Check size={16} /> {carnetId ? 'Save carnet' : 'Create carnet'}</button>
                </footer>
            </div>
        </div>,
        document.body,
    );
}
