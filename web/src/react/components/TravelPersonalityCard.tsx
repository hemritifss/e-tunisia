import React, { useState } from 'react';
import { Sparkles, Share2, Loader2 } from 'lucide-react';
import { api } from '../../shared/api';
import { useUIStore } from '../stores/ui-store';
import { useT } from '../../i18n/useT';

interface Personality {
  type: string;
  emoji: string;
  description: string;
  traits: string[];
  mock?: boolean;
}

/**
 * Fun, shareable "travel personality" card (GET /ai/personality). Lazy — only
 * calls the AI when the user taps Reveal, so it costs nothing on profile load.
 */
export function TravelPersonalityCard() {
  const t = useT();
  const [p, setP] = useState<Personality | null>(null);
  const [loading, setLoading] = useState(false);
  const showToast = useUIStore((s) => s.showToast);

  const reveal = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const r: any = await api.aiPersonality();
      if (r?.type) setP(r);
    } catch {
      showToast(t('personality.revealFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const share = async () => {
    if (!p) return;
    const text = `${t('personality.shareText')}: ${p.emoji} ${p.type} — ${p.description}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: t('personality.shareTitle'), text });
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast(t('personality.copied'), 'success');
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <section className="mx-4 my-4 rounded-2xl border border-black/5 dark:border-white/10 bg-surface-elevated p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-brand" />
        <h2 className="font-semibold text-sm">{t('personality.title')}</h2>
      </div>

      {!p ? (
        <button
          onClick={reveal}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-medium bg-brand/10 text-brand hover:bg-brand/15 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> {t('personality.reading')}</>
          ) : (
            <>{t('personality.reveal')}</>
          )}
        </button>
      ) : (
        <div className="text-center">
          <div className="text-5xl mb-1 leading-none">{p.emoji}</div>
          <strong className="block text-lg">{p.type}</strong>
          <p className="text-sm text-muted-foreground mt-1 mb-3">{p.description}</p>
          {p.traits?.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {p.traits.map((t) => (
                <span key={t} className="px-2.5 py-1 text-xs rounded-full bg-black/5 dark:bg-white/10">{t}</span>
              ))}
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <button
              onClick={share}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm rounded-xl bg-gradient-to-br from-brand to-mediterranean text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Share2 size={14} /> {t('personality.share')}
            </button>
            <button
              onClick={reveal}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-60"
            >
              {t('personality.tryAgain')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
