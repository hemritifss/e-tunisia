import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stamp, Check } from 'lucide-react';
import * as api from '../../api';
import { requireAuth, showToast, isLoggedIn } from '../../ui-utils';
import { track } from '../../analytics';
import { useT } from '../../i18n/useT';

/**
 * "Kont houni" — the one-tap first rung of the contribution ladder.
 * Stamps the place into the visitor's passport (+5 XP on first-ever visit),
 * optimistic toggle, works anywhere a placeId exists (place page, map panel).
 */
export function KontHouniButton({ placeId, compact = false }: { placeId: string; compact?: boolean }) {
    const t = useT();
    const qc = useQueryClient();

    const { data: ids } = useQuery({
        queryKey: ['visited-ids'],
        queryFn: () => api.getVisitedIds(),
        enabled: isLoggedIn(),
        staleTime: 60_000,
    });
    const visited = Array.isArray(ids) && ids.includes(placeId);

    const m = useMutation({
        mutationFn: () => api.toggleVisited(placeId),
        onMutate: async () => {
            await qc.cancelQueries({ queryKey: ['visited-ids'] });
            const prev = qc.getQueryData<string[]>(['visited-ids']);
            qc.setQueryData<string[]>(['visited-ids'], (old = []) =>
                visited ? old.filter((x) => x !== placeId) : [...old, placeId]);
            return { prev };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.prev) qc.setQueryData(['visited-ids'], ctx.prev);
            showToast(t('visit.failed'), { type: 'error' });
        },
        onSuccess: (serverIds) => {
            const arr = Array.isArray(serverIds) ? serverIds : [];
            qc.setQueryData(['visited-ids'], arr);
            if (arr.includes(placeId)) {
                track('visit', { placeId });
                showToast(t('visit.stamped'));
            } else {
                showToast(t('visit.unstamped'));
            }
        },
    });

    const onClick = () => {
        if (!requireAuth('stamp places into your passport')) return;
        m.mutate();
    };

    return (
        <button
            type="button"
            className={`kont-houni${visited ? ' is-visited' : ''}${compact ? ' is-compact' : ''}`}
            aria-pressed={visited}
            onClick={onClick}
            disabled={m.isPending}
        >
            {visited ? <Check size={15} /> : <Stamp size={15} />}
            <span>{visited ? t('visit.visited') : t('visit.kontHouni')}</span>
        </button>
    );
}
