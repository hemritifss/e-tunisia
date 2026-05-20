import React, { useState } from 'react';
import { api, getImageUrl } from '../../shared/api';
import { ENDORSEMENT_TOPICS, TOPIC_BY_ID } from './endorsement-topics';
import { Check, X, Loader2 } from 'lucide-react';

interface Props {
    handle: string;
    fullName: string;
    avatar?: string | null;
    initiallyEndorsed: string[];
    onClose(): void;
    onChange?(endorsedTopics: string[]): void;
}

export function EndorseModal({ handle, fullName, avatar, initiallyEndorsed, onClose, onChange }: Props) {
    const [endorsed, setEndorsed] = useState<string[]>(initiallyEndorsed);
    const [busyTopic, setBusyTopic] = useState<string | null>(null);

    const toggle = async (topicId: string) => {
        if (busyTopic) return;
        const wasOn = endorsed.includes(topicId);
        const next = wasOn ? endorsed.filter((t) => t !== topicId) : [...endorsed, topicId];
        setEndorsed(next); // optimistic
        setBusyTopic(topicId);
        try {
            if (wasOn) await api.unendorseHandle(handle, topicId);
            else await api.endorseHandle(handle, topicId);
            onChange?.(next);
        } catch {
            setEndorsed(endorsed); // rollback
        } finally {
            setBusyTopic(null);
        }
    };

    return (
        <div
            className="passport-share-sheet"
            role="dialog"
            aria-modal="true"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="passport-share-sheet-inner endorse-modal">
                <button className="passport-share-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
                <div className="endorse-modal-head">
                    {avatar
                        ? <img src={getImageUrl(avatar)} alt="" />
                        : <span className="follow-list-avatar-fallback">{(fullName || '?').slice(0, 1).toUpperCase()}</span>}
                    <div>
                        <h4>Endorse {fullName.split(' ')[0]}</h4>
                        <p>Pick the topics they're great at. Tap again to remove.</p>
                    </div>
                </div>
                <div className="endorse-topic-grid">
                    {ENDORSEMENT_TOPICS.map((t) => {
                        const isOn = endorsed.includes(t.id);
                        const isBusy = busyTopic === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                className={`endorse-topic ${isOn ? 'on' : ''}`}
                                onClick={() => toggle(t.id)}
                                disabled={isBusy}
                                aria-pressed={isOn}
                            >
                                <span className="endorse-topic-emoji">{t.emoji}</span>
                                <span className="endorse-topic-label">{t.label}</span>
                                <span className="endorse-topic-state">
                                    {isBusy ? <Loader2 size={14} className="spin" /> : isOn ? <Check size={14} /> : null}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <p className="endorse-modal-footer">
                    {endorsed.length === 0
                        ? 'No endorsements yet.'
                        : `${endorsed.length} endorsement${endorsed.length === 1 ? '' : 's'} from you.`}
                </p>
            </div>
        </div>
    );
}

/** Compact strip of top endorsements for the hero. */
export function TopEndorsementsStrip({ topEndorsements }: { topEndorsements: Array<{ topic: string; count: number }> }) {
    if (!topEndorsements?.length) return null;
    return (
        <div className="passport-endorse-strip">
            {topEndorsements.map((e) => {
                const meta = TOPIC_BY_ID[e.topic];
                if (!meta) return null;
                return (
                    <span key={e.topic} className="passport-endorse-chip" title={`${e.count} endorsement${e.count === 1 ? '' : 's'}`}>
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                        <strong>{e.count}</strong>
                    </span>
                );
            })}
        </div>
    );
}
