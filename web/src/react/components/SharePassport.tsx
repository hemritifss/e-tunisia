import React, { useEffect, useState } from 'react';
import { Share2, Copy, Check, X, Download, ImageIcon } from 'lucide-react';
import { ogShareUrl } from '../../shared/api';
import { track } from '../../analytics';
import { renderPassportCard, passportCardBlob, type PassportCardData } from './passport-card';

interface Props {
    handle: string;
    fullName: string;
    /** Extra passport facts — when present, the sheet renders a shareable card image. */
    level?: string;
    country?: string | null;
    citiesVisited?: number;
    tripsPlanned?: number;
    reviewsCount?: number;
    badgesCount?: number;
    founderNumber?: number | null;
}

export function SharePassport({ handle, fullName, level, country, citiesVisited, tripsPlanned, reviewsCount, badgesCount, founderNumber }: Props) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [cardUrl, setCardUrl] = useState<string | null>(null);
    // OG route: crawlers see real meta + postcard image; humans get redirected
    // to the pretty /u/<handle> page.
    const url = ogShareUrl(`u/${encodeURIComponent(handle)}`);
    const text = `Check out ${fullName}'s Tunisia journey 🇹🇳`;

    const cardData: PassportCardData = {
        fullName, handle, level, country,
        citiesVisited, tripsPlanned, reviewsCount, badgesCount,
        founderNumber,
        url,
    };

    // Render the card once the sheet opens (canvas work off the critical path).
    useEffect(() => {
        if (!open) return;
        let revoked: string | null = null;
        (async () => {
            try {
                const blob = await passportCardBlob(cardData);
                if (blob) {
                    revoked = URL.createObjectURL(blob);
                    setCardUrl(revoked);
                }
            } catch { /* card is progressive enhancement — links still work */ }
        })();
        return () => { if (revoked) URL.revokeObjectURL(revoked); setCardUrl(null); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

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

    const download = async () => {
        try {
            const canvas = await renderPassportCard(cardData);
            const a = document.createElement('a');
            a.download = `etunisia-passport-${handle}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        } catch {
            (window as any).showToast?.({ message: "Couldn't render the card.", type: 'error' });
        }
    };

    const native = async () => {
        track('share', { kind: 'passport' });
        const nav: any = navigator;
        // Prefer sharing the card as an image — WhatsApp/Instagram are image-first.
        try {
            const blob = await passportCardBlob(cardData);
            if (blob && nav.canShare) {
                const file = new File([blob], `etunisia-passport-${handle}.png`, { type: 'image/png' });
                if (nav.canShare({ files: [file] })) {
                    await nav.share({ title: text, text, files: [file] });
                    return;
                }
            }
        } catch { /* fall through to link share */ }
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
                        {cardUrl ? (
                            <div className="passport-share-card">
                                <img src={cardUrl} alt={`${fullName}'s passport card`} />
                                <button onClick={download} className="btn primary sm passport-share-download">
                                    <Download size={14} /> Download card
                                </button>
                            </div>
                        ) : (
                            <div className="passport-share-card passport-share-card-loading" aria-hidden="true">
                                <ImageIcon size={22} />
                            </div>
                        )}
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
