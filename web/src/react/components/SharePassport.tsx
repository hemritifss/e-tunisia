import React, { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
import { absoluteUrl } from '../../router';

interface Props { handle: string; fullName: string; }

export function SharePassport({ handle, fullName }: Props) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const url = absoluteUrl(`/u/${handle}`);
    const text = `Check out ${fullName}'s Tunisia journey 🇹🇳`;

    const copy = async () => {
        const showToast = (opts: any) => (window as any).showToast?.(opts);
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
            showToast({ message: 'Passport link copied. Share away.', type: 'success', emoji: '🔗' });
        } catch {
            showToast({ message: "Couldn't copy — select the URL manually.", type: 'error' });
        }
    };

    const native = async () => {
        const nav: any = navigator;
        if (nav.share) {
            try { await nav.share({ title: text, url }); return; } catch {}
        }
        setOpen(true);
    };

    return (
        <>
            <button className="btn ghost passport-share" onClick={native}>
                <Share2 size={16} /> Share passport
            </button>
            {open && (
                <div className="passport-share-sheet" role="dialog" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
                    <div className="passport-share-sheet-inner">
                        <button className="passport-share-close" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
                        <h4>Share this passport</h4>
                        <div className="passport-share-row">
                            <code>{url}</code>
                            <button onClick={copy} className="btn primary sm">
                                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                            </button>
                        </div>
                        <div className="passport-share-grid">
                            <a target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}>X / Twitter</a>
                            <a target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>Facebook</a>
                            <a target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`}>WhatsApp</a>
                            <a target="_blank" rel="noreferrer" href={`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`}>Email</a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
