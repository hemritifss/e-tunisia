import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { adminGet, ADMIN_FORBIDDEN } from './admin-api';

const showToast = (o: any) => (window as any).showToast?.(o);

export interface QueueColumn {
    header: string;
    render: (row: any) => React.ReactNode;
}

export interface QueueAction {
    label: string | ((row: any) => string);
    icon?: React.ReactNode;
    variant?: 'default' | 'danger' | 'primary';
    confirm?: string | ((row: any) => string);
    /** Hide the action for rows where this returns false. */
    show?: (row: any) => boolean;
    run: (row: any) => Promise<any>;
}

export interface QueueFilter {
    key: string;
    label: string;
    query?: Record<string, string>;
}

export interface QueueConfig {
    key: string;
    title: string;
    subtitle?: string;
    endpoint: string;
    paginated?: boolean;
    columns: QueueColumn[];
    actions?: QueueAction[];
    filters?: QueueFilter[];
    rowKey?: (row: any) => string;
}

export function AdminLocked() {
    return (
        <div className="admin-locked-card">
            <Lock size={40} />
            <h1>Admins only</h1>
            <p>Your account doesn't have admin privileges — if you think that's wrong, email <a href="mailto:support@etunisia.com">support@etunisia.com</a>.</p>
            <a className="btn primary" href="#/">Back to feed</a>
        </div>
    );
}

export default function AdminQueue({ config }: { config: QueueConfig }) {
    const [rows, setRows] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [filterIdx, setFilterIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);

    const keyOf = (row: any) => (config.rowKey ? config.rowKey(row) : row.id);

    const load = useCallback(async () => {
        setLoading(true);
        const f = config.filters?.[filterIdx];
        const params = new URLSearchParams();
        if (config.paginated) { params.set('page', String(page)); params.set('limit', '20'); }
        if (f?.query) Object.entries(f.query).forEach(([k, v]) => params.set(k, v));
        const qs = params.toString();
        const res = await adminGet(`${config.endpoint}${qs ? `?${qs}` : ''}`);
        if (res === ADMIN_FORBIDDEN) { setForbidden(true); setLoading(false); return; }
        if (res == null) { setRows([]); setMeta(null); setLoading(false); return; }
        if (Array.isArray(res)) { setRows(res); setMeta(null); }
        else if ((res as any).data && Array.isArray((res as any).data)) { setRows((res as any).data); setMeta((res as any).meta || null); }
        else { setRows([]); setMeta(null); }
        setLoading(false);
    }, [config, page, filterIdx]);

    useEffect(() => { load(); }, [load]);

    const runAction = async (a: QueueAction, row: any) => {
        const id = keyOf(row);
        const label = typeof a.label === 'function' ? a.label(row) : a.label;
        const confirmMsg = typeof a.confirm === 'function' ? a.confirm(row) : a.confirm;
        if (confirmMsg && !window.confirm(confirmMsg)) return;
        setBusy(`${id}:${label}`);
        try {
            await a.run(row);
            showToast({ message: `${label} — done`, type: 'success' });
            await load();
        } catch (e: any) {
            showToast({ message: e?.message || 'Action failed', type: 'error' });
        } finally {
            setBusy(null);
        }
    };

    if (forbidden) return <AdminLocked />;

    return (
        <div className="admin-queue-view">
            {config.filters && (
                <div className="admin-filterbar">
                    {config.filters.map((f, i) => (
                        <button key={f.key} className={i === filterIdx ? 'active' : ''} onClick={() => { setFilterIdx(i); setPage(1); }}>
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            {loading && rows.length === 0 ? (
                <div className="admin-table-skel">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="admin-row-skel" />)}</div>
            ) : rows.length === 0 ? (
                <div className="admin-empty">Nothing here yet.</div>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                {config.columns.map((c) => <th key={c.header}>{c.header}</th>)}
                                {config.actions && <th aria-label="Actions" />}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const id = keyOf(row);
                                const acts = (config.actions || []).filter((a) => !a.show || a.show(row));
                                return (
                                    <tr key={id}>
                                        {config.columns.map((c) => <td key={c.header}>{c.render(row)}</td>)}
                                        {config.actions && (
                                            <td className="admin-actions-cell">
                                                {acts.map((a) => {
                                                    const label = typeof a.label === 'function' ? a.label(row) : a.label;
                                                    const bk = `${id}:${label}`;
                                                    return (
                                                        <button
                                                            key={label}
                                                            className={`admin-act ${a.variant || ''}`}
                                                            disabled={busy === bk}
                                                            onClick={() => runAction(a, row)}
                                                        >
                                                            {busy === bk ? <Loader2 size={13} className="spin" /> : a.icon}
                                                            <span>{label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {meta && meta.totalPages > 1 && (
                <div className="admin-pager">
                    <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={14} /> Prev</button>
                    <span>Page {meta.page} / {meta.totalPages}</span>
                    <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight size={14} /></button>
                </div>
            )}
        </div>
    );
}
