import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, Compass, AlertCircle, Star } from 'lucide-react';
import * as api from '../../api';
import { ListSkeleton } from '../components/RouteSkeleton';
import { PageHeader } from '../components/PageHeader';

// Migrated from vanilla pages/inquiries.ts — quote/booking requests the user sent.

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function InquiryCard({ i }: { i: any }) {
  const place = i.place || {};
  const isBooked = i.status === 'booked';

  const dateRange = i.dateFrom || i.dateTo
    ? `${fmtDate(i.dateFrom)}${i.dateTo ? ' → ' + fmtDate(i.dateTo) : ''}`
    : 'Dates flexible';
  const partyTxt = `${i.partySize || 1} ${i.partySize === 1 ? 'traveler' : 'travelers'}`;
  const cityTxt = place.city ? `${place.city} · ` : '';
  const budgetTxt = i.budget ? ` · ${i.budget} ${i.currency || 'TND'}` : '';

  const inner = (
    <>
      {place.coverImage ? (
        <img className="inquiry-card-thumb" src={api.getImageUrl(place.coverImage)} loading="lazy" alt="" />
      ) : (
        <div className="inquiry-card-thumb" />
      )}
      <div className="inquiry-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3 className="inquiry-card-title">{place.name || 'Place'}</h3>
          <span className={`inquiry-status-pill ${String(i.status || 'new')}`}>{i.status || 'new'}</span>
        </div>
        <div className="inquiry-card-meta">{`${cityTxt}${partyTxt} · ${dateRange}${budgetTxt}`}</div>
        <p className="inquiry-card-msg">{i.message || ''}</p>
        <div className="inquiry-card-meta" style={{ marginTop: 4 }}>Sent {timeAgo(i.createdAt)}</div>
        {isBooked && place.id && (
          <div className="inquiry-card-cta">
            <a className="btn btn-primary btn-sm" href={`#/place/${place.id}?review=1&inquiry=${i.id}`}>
              <Star /> Leave a verified review
            </a>
            <a className="btn btn-ghost btn-sm" href={`#/place/${place.id}`}>Open place</a>
          </div>
        )}
      </div>
    </>
  );

  // Booked cards are a <div> so the inline review buttons don't trigger card nav.
  return isBooked ? (
    <div className="inquiry-card">{inner}</div>
  ) : (
    <a className="inquiry-card" href={`#/place/${place.id || ''}`}>{inner}</a>
  );
}

export default function InquiriesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-inquiries'],
    queryFn: async () => {
      const res = await api.listMyInquiries(1, 50);
      return Array.isArray(res?.data) ? res.data : [];
    },
  });

  return (
    <div className="inquiries-page page-enter" data-design="sleek" id="inquiries-root">
      <PageHeader
        eyebrow={<><Send size={13} /> Requests · carnet de demandes</>}
        title="My Inquiries"
        subtitle="Quote and booking requests you've sent to places."
      />
      <div className="inquiry-list">
        {isLoading ? (
          <ListSkeleton count={4} label="Loading your inquiries" rowHeight={96} />
        ) : isError ? (
          <div className="empty-state">
            <AlertCircle style={{ width: '3rem', height: '3rem', color: 'var(--text-muted)' }} />
            <h3>Couldn't load inquiries</h3>
            <p>Sign in and try again.</p>
            <a href="#/login" className="btn btn-primary">Sign in</a>
          </div>
        ) : (data || []).length === 0 ? (
          <div className="empty-state">
            <Send style={{ width: '3rem', height: '3rem', color: 'var(--text-muted)' }} />
            <h3>No inquiries yet</h3>
            <p>Find a place you like and tap <strong>Request a quote</strong> — hosts usually reply within 24h.</p>
            <a href="#/explore" className="btn btn-primary"><Compass /> Browse places</a>
          </div>
        ) : (
          (data || []).map((i) => <InquiryCard key={i.id} i={i} />)
        )}
      </div>
    </div>
  );
}
