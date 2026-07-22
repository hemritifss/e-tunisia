import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import {
    X, MapPin, Heart, Bookmark, BookmarkCheck, Share2, Map as MapIcon,
    Route, Printer, Sparkles, Pencil, Stamp, Plus, BadgeCheck, Globe, EyeOff,
    Check, Copy,
} from 'lucide-react';
import * as api from '../../../api';
import { goTo } from '../../../router';
import { showToast } from '../../../ui-utils';
import { track } from '../../../analytics';
import * as tripCart from '../../../trip-cart';
import * as store from './store';
import type { CarnetPlace } from './store';
import {
    StampTag, CoverCollage, useVisitedIds, usePlan, THEME_BY_KEY, type CollectionView,
} from './bits';

interface Props {
    view: CollectionView;
    onClose: () => void;
    onEditCarnet: (id: string) => void;
    onOpenCarnet: (carnetId: string) => void;
}

interface Row {
    id: string;
    name: string;
    city: string;
    cover: string;
    note: string;
    visited: boolean;
    real: boolean;
}

export default function CollectionDetail({ view, onClose, onEditCarnet, onOpenCarnet }: Props) {
    const { isPro } = usePlan();
    const [open, setOpen] = useState(false);
    const [loved, setLoved] = useState(store.isLoved(view.id));
    const [saved, setSaved] = useState(store.isSaved(view.id));

    const close = () => {
        setOpen(false);
        document.body.style.overflow = '';
        window.setTimeout(onClose, 220);
    };

    useEffect(() => {
        const raf = requestAnimationFrame(() => setOpen(true));
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', onKey);
        track('collection_open', { id: view.id, kind: view.kind });
        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { data: visited } = useVisitedIds();

    const { data: hydrated } = useQuery({
        queryKey: ['collection-places', view.id, view.placeIds.join(',')],
        enabled: view.placeIds.length > 0,
        queryFn: async () => {
            try {
                const res = await api.getPlacesByIds(view.placeIds);
                return Array.isArray(res) ? res : (res as any)?.data || [];
            } catch {
                return [] as any[];
            }
        },
        staleTime: 5 * 60_000,
    });

    const rows = useMemo<Row[]>(() => {
        const storedById = new Map<string, CarnetPlace>(
            view.kind === 'carnet' ? (view.raw.places as CarnetPlace[]).map((p) => [p.id, p]) : [],
        );
        const byId = new Map((hydrated || []).map((h: any) => [String(h.id), h]));
        return view.placeIds.map((id) => {
            const h: any = byId.get(id);
            const s = storedById.get(id);
            return {
                id,
                name: h?.name || s?.name || 'Place',
                city: h?.city || h?.governorate || s?.city || '',
                cover: h?.coverImage || h?.image || (h?.images && h.images[0]) || s?.cover || '',
                note: s?.note || '',
                visited: !!visited?.has(id),
                real: !!h,
            };
        });
    }, [view, hydrated, visited]);

    const done = rows.filter((r) => r.visited).length;
    const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;

    // ── actions ──
    const toggleLove = () => { setLoved(store.toggleLove(view.id)); };
    const toggleSave = () => {
        const now = store.toggleSave(view.id);
        setSaved(now);
        showToast(now ? 'Saved to your carnet shelf' : 'Removed from shelf');
    };

    const addAllToTrip = () => {
        const real = rows.filter((r) => r.real || view.kind === 'carnet');
        if (!real.length) { showToast('No places to add yet', { type: 'error' }); return; }
        real.forEach((r) => tripCart.addStop({ placeId: r.id, placeName: r.name, placeCity: r.city, placeCover: r.cover, dayIndex: 0 }));
        showToast(`${real.length} place${real.length === 1 ? '' : 's'} added to your trip`);
        track('collection_to_trip', { id: view.id, count: real.length });
    };

    const viewOnMap = () => { close(); goTo('/map'); };

    const share = async () => {
        const url = `${location.origin}/collections?c=${encodeURIComponent(view.id)}`;
        const payload = { title: `${view.title} · e-Tunisia`, text: view.description || 'A collection of places in Tunisia', url };
        try {
            if (navigator.share) { await navigator.share(payload); return; }
            throw new Error('no share');
        } catch {
            try { await navigator.clipboard.writeText(url); showToast('Link copied — paste it anywhere'); }
            catch { showToast('Could not copy the link', { type: 'error' }); }
        }
        track('collection_share', { id: view.id });
    };

    const remix = () => {
        const carnet = store.remixInto({
            id: view.id, title: view.title, description: view.description,
            cover: view.cover, theme: view.theme, placeIds: view.placeIds,
        });
        showToast('Copied into your carnets — make it yours');
        track('collection_remix', { from: view.id });
        close();
        window.setTimeout(() => onOpenCarnet(carnet.id), 240);
    };

    const exportPdf = () => {
        if (!isPro) { showToast('Exporting a carnet is a Pro perk', { type: 'error' }); goTo('/pro'); return; }
        printCollection(view, rows);
        track('collection_export', { id: view.id });
    };

    const stampGlyph = view.theme ? THEME_BY_KEY[view.theme]?.emoji : '📓';

    return createPortal(
        <div className={`cn-scrim collections-scrim${open ? ' is-open' : ''}`}
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
            <div className="collections-sheet" role="dialog" aria-modal="true" aria-label={view.title}>
                <button type="button" className="collections-sheet-close" onClick={close} aria-label="Close">
                    <X size={18} />
                </button>

                <div className="collections-sheet-cover">
                    <CoverCollage cover={view.cover} covers={view.placeCovers} theme={view.theme} alt="" />
                    <div className="collections-sheet-cover-veil" aria-hidden="true" />
                    <div className="collections-sheet-badges">
                        {view.isBusiness && <span className="collections-badge collections-badge--brand"><BadgeCheck size={12} /> Official</span>}
                        {view.isPremium && <span className="collections-badge collections-badge--pro">Pro</span>}
                        {view.kind === 'carnet' && (
                            <span className="collections-badge">{view.isPrivate ? <><EyeOff size={12} /> Private</> : <><Globe size={12} /> Public</>}</span>
                        )}
                    </div>
                    <h2 className="collections-sheet-title">{view.title}</h2>
                </div>

                <div className="collections-sheet-body">
                    <div className="collections-sheet-meta">
                        <StampTag theme={view.theme} />
                        <span><MapPin size={13} /> {view.count} place{view.count === 1 ? '' : 's'}</span>
                        {view.likeCount > 0 && <span><Heart size={13} /> {view.likeCount}</span>}
                        {view.ownerName && <span className="collections-sheet-owner">by {view.ownerName}</span>}
                    </div>

                    {view.description && <p className="collections-sheet-desc">{view.description}</p>}

                    {done > 0 && (
                        <div className="collections-sheet-progress" title={`${done} of ${rows.length} stamped`}>
                            <Stamp size={14} />
                            <span className="collections-progress-bar"><span style={{ width: `${pct}%` }} /></span>
                            <span className="cn-num">{done}/{rows.length} stamped</span>
                        </div>
                    )}

                    <div className="collections-sheet-actions">
                        <button type="button" className="cn-btn" onClick={addAllToTrip}><Route size={15} /> Add all to trip</button>
                        <button type="button" className="cn-btn cn-btn--quiet" onClick={viewOnMap}><MapIcon size={15} /> Map</button>
                        <button type="button" className="cn-btn cn-btn--quiet" onClick={share}><Share2 size={15} /> Share</button>
                        {view.kind === 'curated' ? (
                            <>
                                <button type="button" className={`cn-icon-btn cn-icon-btn--lg${loved ? ' is-on' : ''}`} onClick={toggleLove} aria-pressed={loved} aria-label="Love" title="Love">
                                    <Heart size={16} fill={loved ? 'currentColor' : 'none'} />
                                </button>
                                <button type="button" className={`cn-icon-btn cn-icon-btn--lg${saved ? ' is-on' : ''}`} onClick={toggleSave} aria-pressed={saved} aria-label="Save" title="Save to shelf">
                                    {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                                </button>
                            </>
                        ) : (
                            <button type="button" className="cn-btn cn-btn--quiet" onClick={() => { close(); onEditCarnet(view.id); }}><Pencil size={15} /> Edit</button>
                        )}
                    </div>

                    <div className="collections-sheet-actions collections-sheet-actions--minor">
                        {view.kind === 'curated'
                            ? <button type="button" className="collections-textbtn" onClick={remix}><Copy size={13} /> Make it mine</button>
                            : <button type="button" className="collections-textbtn" onClick={() => { close(); onEditCarnet(view.id); }}><Plus size={13} /> Add places</button>}
                        <button type="button" className="collections-textbtn" onClick={exportPdf}>
                            <Printer size={13} /> Export {!isPro && <span className="collections-prolock">Pro</span>}
                        </button>
                        {view.kind === 'carnet' && <CollabControl carnet={view} isPro={isPro} />}
                    </div>

                    <hr className="cn-rule" />

                    <div className="collections-sheet-places-head">
                        <h3 className="cn-kicker"><MapPin size={12} /> {view.count} place{view.count === 1 ? '' : 's'} in this collection</h3>
                    </div>

                    {rows.length === 0 ? (
                        <div className="collections-sheet-emptyplaces">
                            <span aria-hidden="true" className="collections-sheet-emptystamp">{stampGlyph}</span>
                            <p>{view.kind === 'carnet' ? "This carnet is still blank." : 'No places listed yet.'}</p>
                            {view.kind === 'carnet' && (
                                <button type="button" className="cn-btn" onClick={() => { close(); onEditCarnet(view.id); }}><Plus size={15} /> Add places</button>
                            )}
                        </div>
                    ) : (
                        <ul className="collections-sheet-places">
                            {rows.map((r) => (
                                <li key={r.id} className="collections-place">
                                    <button
                                        type="button" className="collections-place-main"
                                        onClick={() => { if (r.real) { close(); goTo(`/place/${r.id}`); } }}
                                        disabled={!r.real} title={r.real ? 'Open place' : 'Place details load when connected'}
                                    >
                                        {r.cover
                                            ? <img src={api.getImageUrl(r.cover)} alt="" loading="lazy" />
                                            : <span className="collections-place-blank" aria-hidden="true">{stampGlyph}</span>}
                                        <span className="collections-place-text">
                                            <strong>{r.name}</strong>
                                            {r.city && <small>{r.city}</small>}
                                            {r.note && <em className="collections-place-note">“{r.note}”</em>}
                                        </span>
                                        {r.visited && <span className="collections-place-stamp" title="You've been here"><Check size={13} /></span>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {view.kind === 'curated' && (
                        <p className="collections-sheet-foot">
                            <Sparkles size={13} /> An editor's set — <button type="button" className="collections-textbtn" onClick={remix}>copy it into your carnets</button> to reorder, add notes and make it yours.
                        </p>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}

// ── collaborators (Pro, carnet only) ─────────────────────────────────────────

function CollabControl({ carnet, isPro }: { carnet: CollectionView; isPro: boolean }) {
    const [openInput, setOpenInput] = useState(false);
    const [val, setVal] = useState('');
    const list = carnet.collaborators || [];

    const add = () => {
        const handle = val.trim();
        if (!handle) return;
        store.updateCarnet(carnet.id, { collaborators: [...list, handle].slice(0, 12) });
        setVal(''); setOpenInput(false);
        showToast(`Invited ${handle} to co-curate`);
    };

    if (!isPro) {
        return (
            <button type="button" className="collections-textbtn" onClick={() => goTo('/pro')}>
                <Sparkles size={13} /> Collaborate <span className="collections-prolock">Pro</span>
            </button>
        );
    }
    if (!openInput) {
        return (
            <button type="button" className="collections-textbtn" onClick={() => setOpenInput(true)}>
                <Sparkles size={13} /> Invite {list.length > 0 ? `(${list.length})` : ''}
            </button>
        );
    }
    return (
        <span className="collections-collab-input">
            <input
                autoFocus className="cn-input" value={val} onChange={(e) => setVal(e.target.value)}
                placeholder="@handle or email" aria-label="Invite a collaborator"
                onKeyDown={(e) => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setOpenInput(false); }}
            />
            <button type="button" className="cn-icon-btn" onClick={add} aria-label="Send invite"><Check size={15} /></button>
        </span>
    );
}

// ── printable export (Pro) ───────────────────────────────────────────────────

function printCollection(view: CollectionView, rows: Row[]) {
    const esc = (s: string) => (s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));
    const items = rows.map((r, i) => `
        <li>
            <span class="n">${i + 1}</span>
            <span class="t"><b>${esc(r.name)}</b>${r.city ? `<small>${esc(r.city)}</small>` : ''}${r.note ? `<em>“${esc(r.note)}”</em>` : ''}</span>
        </li>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(view.title)} — e-Tunisia carnet</title>
        <style>
            @page { margin: 22mm; }
            body { font-family: Georgia, 'Times New Roman', serif; color: #23201c; }
            .k { font: 600 11px/1.4 ui-monospace, monospace; letter-spacing: .18em; text-transform: uppercase; color: #9a8f80; }
            h1 { font-size: 30px; margin: 4px 0 6px; }
            p.d { color: #5a5148; max-width: 60ch; }
            hr { border: 0; border-top: 1px solid #d9d2c7; margin: 18px 0; }
            ol { list-style: none; padding: 0; }
            li { display: flex; gap: 12px; padding: 9px 0; border-bottom: 1px dotted #d9d2c7; }
            .n { font: 600 13px ui-monospace, monospace; color: #b8541f; min-width: 22px; }
            .t b { display: block; font-size: 16px; }
            .t small { color: #7a7167; } .t em { display: block; color: #5a5148; }
            footer { margin-top: 24px; font: 12px ui-monospace, monospace; color: #9a8f80; }
        </style></head><body>
        <div class="k">Carnet de collections · e-Tunisia</div>
        <h1>${esc(view.title)}</h1>
        ${view.description ? `<p class="d">${esc(view.description)}</p>` : ''}
        <hr/>
        <ol>${items}</ol>
        <footer>${rows.length} places · printed ${new Date().toLocaleDateString()}</footer>
        </body></html>`;
    const w = window.open('', '_blank', 'width=780,height=900');
    if (!w) { showToast('Allow pop-ups to export your carnet', { type: 'error' }); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    window.setTimeout(() => { try { w.print(); } catch { /* user can print manually */ } }, 350);
}
