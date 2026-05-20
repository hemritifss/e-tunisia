import React, { useEffect, useState } from 'react';
import { api, getImageUrl } from '../../shared/api';
import { X } from 'lucide-react';

interface Props {
    handle: string;
    mode: 'followers' | 'following';
    onClose(): void;
}

interface FollowEntry {
    id: string;
    handle: string;
    fullName: string;
    avatar: string | null;
    country: string | null;
}

export function FollowList({ handle, mode, onClose }: Props) {
    const [items, setItems] = useState<FollowEntry[] | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const fetcher = mode === 'followers' ? api.listFollowers : api.listFollowing;
        fetcher(handle)
            .then((res: any) => {
                const list = Array.isArray(res) ? res : (res?.data ?? []);
                setItems(list);
            })
            .catch((e: any) => setErr(e?.message || 'Failed to load'));
    }, [handle, mode]);

    return (
        <div className="passport-share-sheet" role="dialog" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="passport-share-sheet-inner follow-list-sheet">
                <button className="passport-share-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
                <h4>{mode === 'followers' ? `Followers of @${handle}` : `@${handle} is following`}</h4>
                {!items && !err && <div className="passport-tab-skel" />}
                {err && <div className="passport-empty">{err}</div>}
                {items && items.length === 0 && (
                    <div className="passport-empty">
                        {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                    </div>
                )}
                {items && items.length > 0 && (
                    <ul className="follow-list">
                        {items.map((u) => (
                            <li key={u.id}>
                                <a className="follow-list-row" href={`#/u/${u.handle}`} onClick={onClose}>
                                    {u.avatar ? (
                                        <img src={getImageUrl(u.avatar)} alt="" />
                                    ) : (
                                        <span className="follow-list-avatar-fallback">{(u.fullName || '?').slice(0, 1).toUpperCase()}</span>
                                    )}
                                    <div className="follow-list-meta">
                                        <strong>{u.fullName}</strong>
                                        <span>@{u.handle}{u.country ? ` · ${u.country}` : ''}</span>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
