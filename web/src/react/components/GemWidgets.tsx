import '../../styles/gems.css';
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Gem, Map as MapIcon, CheckCircle2, ShieldQuestion } from 'lucide-react';
import * as api from '../../api';
import { requireAuth, showToast } from '../../ui-utils';
import { track } from '../../analytics';

/**
 * City completeness bars — the completeness game (GROWTH.md §4).
 * "Kairouan is 34% mapped — 12 gems missing." Every card is a call to contribute.
 */
export function CityCompleteness({ limit = 10 }: { limit?: number }) {
  const { data } = useQuery({
    queryKey: ['gem-completeness'],
    queryFn: () => api.getCompleteness().catch(() => null),
    staleTime: 5 * 60_000,
  });
  if (!data || !data.length) return null;
  return (
    <section className="cmpl-strip" aria-label="How mapped is Tunisia">
      <div className="cmpl-head">
        <h3><MapIcon size={15} /> Help map Tunisia</h3>
        <a href="#/submit-gem">Add a hidden gem →</a>
      </div>
      <div className="cmpl-row">
        {data.slice(0, limit).map((g) => (
          <a className="cmpl-card" key={g.governorate} href="#/submit-gem" aria-label={`${g.governorate}: ${g.pct}% mapped`}>
            <span className="cmpl-gov">{g.governorate}</span>
            <div className="cmpl-track"><div className="cmpl-fill" style={{ width: `${Math.max(3, g.pct)}%` }} /></div>
            <span className="cmpl-meta">
              <span>{g.pct}% mapped</span>
              {g.missing > 0 && <span className="cmpl-missing">{g.missing} missing</span>}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

/**
 * Confirm-a-gem block for the place page (contribution ladder rung 2).
 * Pending community gems show 0/2 → live progress; approved places offer a
 * lightweight "still worth it" confirmation. +10 XP, once per user per place.
 */
export function GemConfirmBlock({ placeId }: { placeId: string }) {
  const queryClient = useQueryClient();
  const { data: status } = useQuery({
    queryKey: ['gem-status', placeId],
    queryFn: () => api.getGemStatus(placeId).catch(() => null),
    enabled: !!placeId,
  });
  const [busy, setBusy] = React.useState(false);
  if (!status) return null;

  const confirm = async () => {
    if (!requireAuth('confirm this gem') || busy) return;
    setBusy(true);
    try {
      const res = await api.confirmGem(placeId);
      track('gem_confirm', { placeId, wentLive: res.wentLive });
      showToast(res.wentLive ? '🎉 This gem is now LIVE on the map!' : '+10 XP — thanks for confirming!');
      queryClient.invalidateQueries({ queryKey: ['gem-status', placeId] });
    } catch (err: any) {
      showToast(err?.message || 'Could not confirm', { type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  if (status.pending) {
    return (
      <div className="gem-confirm">
        <h3 className="gem-confirm-title"><Gem size={16} /> Community gem — almost on the map</h3>
        <p>{status.isMine
          ? 'Share this page — it goes live once 2 people confirm it.'
          : 'Been here? Confirm it and it goes live on the map.'}</p>
        <div className="gem-confirm-progress" aria-label={`${status.confirmations} of ${status.needed} confirmations`}>
          {Array.from({ length: status.needed }).map((_, i) => (
            <span key={i} className={`gem-confirm-dot ${i < status.confirmations ? 'is-filled' : ''}`} />
          ))}
          <span className="gem-confirm-count">{status.confirmations}/{status.needed} confirmations</span>
        </div>
        {status.confirmedByMe ? (
          <span className="gem-confirm-done"><CheckCircle2 size={15} /> You confirmed this gem</span>
        ) : !status.isMine && (
          <button className="btn btn-primary" type="button" onClick={confirm} disabled={busy}>
            <ShieldQuestion size={15} /> {busy ? 'Confirming…' : 'Yes, this place is real — confirm (+10 XP)'}
          </button>
        )}
      </div>
    );
  }

  // Live places: light verification loop (seeded gems become verification bait).
  if (status.confirmedByMe || status.isMine) return null;
  return (
    <div className="gem-confirm">
      <h3 className="gem-confirm-title"><ShieldQuestion size={16} /> Been here?</h3>
      <p>Confirm it still exists and it's still worth it — keeps the map honest.</p>
      <button className="btn btn-outline" type="button" onClick={confirm} disabled={busy}>
        <CheckCircle2 size={15} /> {busy ? 'Confirming…' : 'Confirm this place (+10 XP)'}
      </button>
    </div>
  );
}
