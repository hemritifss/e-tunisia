import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Heart, Share2, MapPin, Star, Send, Phone, MessageCircle, ExternalLink,
  Navigation, Map as MapIcon, Luggage, Pencil, Package, MessageSquare, ShieldCheck,
  CornerDownRight, Trash2, MessageSquareReply, X, CheckCircle2,
} from 'lucide-react';
import * as apiService from '../../api';
import { places as mockPlaces } from '../../data';
import { shareUrl, toggleSaved, isSaved, showToast } from '../../ui-utils';
import * as tripCart from '../../trip-cart';
import { Reveal } from '../components/Reveal';
import { currentPath, query as routeQuery, absoluteUrl, onRouteChange } from '../../router';
import { addVisitedCity, isAnonymous } from '../../passport-draft';

// Migrated from vanilla pages/place-detail.ts.

const mockComments = [
  { author: 'Sarah M.', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Sarah', text: 'Absolutely stunning place! The views are breathtaking.', rating: 5, timeAgo: '2d ago' },
  { author: 'Karim B.', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Karim', text: 'Great historical site. Would recommend visiting early morning to avoid crowds.', rating: 4, timeAgo: '5d ago' },
  { author: 'Leila T.', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Leila', text: 'Beautiful architecture and rich history. The guide was very knowledgeable.', rating: 5, timeAgo: '1w ago' },
];

function placeIdFromPath(): string {
  // Capture the full id incl. hyphens (UUIDs) — \w+ would truncate at the first '-'.
  const m = currentPath().match(/^\/place\/([^/?]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

function whatsappLink(phone: string): string {
  const digits = String(phone || '').replace(/\D+/g, '');
  if (!digits) return '#';
  const withCountry = digits.startsWith('216') ? digits : (digits.length === 8 ? '216' + digits : digits);
  return `https://wa.me/${withCountry}`;
}

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} className={`lucide-star ${i < rating ? 'filled' : ''}`} />
      ))}
    </>
  );
}

// ── Review item (with owner host-reply) ──
function ReviewItem({ r, place, me, placeId }: { r: any; place: any; me: any; placeId: string }) {
  const queryClient = useQueryClient();
  const isOwner = !!me?.id && place?.submittedBy === me.id;
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(r); // reflects host-reply changes

  const reviewerId = local.user?.id || local.userId || '';
  const avatar = local.avatar || local.user?.avatar || 'https://api.dicebear.com/9.x/thumbs/svg?seed=user';
  const author = local.author || local.user?.fullName || local.user?.name || 'Anonymous';
  const when = local.timeAgo || (local.createdAt ? new Date(local.createdAt).toLocaleDateString() : '');

  const postReply = async () => {
    const body = replyText.trim();
    if (body.length < 2) { showToast('Reply is too short', { type: 'error' }); return; }
    setBusy(true);
    try {
      const updated = await apiService.replyToReview(local.id, body);
      setLocal({ ...local, ...updated });
      setReplyOpen(false);
      showToast('Reply posted');
      queryClient.invalidateQueries({ queryKey: ['reviews', placeId] });
    } catch (err: any) {
      showToast(err?.message || 'Could not post reply', { type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const removeReply = async () => {
    if (!confirm('Remove your reply?')) return;
    try {
      const updated = await apiService.deleteReviewReply(local.id);
      setLocal({ ...local, ...updated, hostReply: null });
      showToast('Reply removed');
    } catch (err: any) {
      showToast(err?.message || 'Could not remove reply', { type: 'error' });
    }
  };

  return (
    <article className="place-review-item" data-review-id={local.id || ''}>
      <span
        className="place-review-avatar-wrap"
        {...(reviewerId ? { 'data-user-id': reviewerId, 'data-user-name': author, 'data-user-avatar': avatar, 'data-user-handle': local.user?.handle || '', 'data-user-plan': local.user?.plan || '' } : {})}
      >
        <img src={avatar} alt="" className="place-review-avatar" loading="lazy" />
      </span>
      <div className="place-review-body">
        <header className="place-review-header">
          <strong>{author}</strong>
          {local.verifiedInquiryId && (
            <span className="review-verified-badge" title="Posted by a traveler whose booking was confirmed by the host">
              <ShieldCheck /> Verified booking
            </span>
          )}
          <span className="place-review-when">{when}</span>
        </header>
        {local.rating ? <div className="place-review-stars" aria-label={`${local.rating} out of 5 stars`}><Stars rating={local.rating} /></div> : null}
        <p className="place-review-text">{local.text || local.comment || ''}</p>

        {local.hostReply ? (
          <div className="review-host-reply">
            <div className="review-host-reply-head">
              <CornerDownRight /> Response from the host{local.hostRepliedAt ? ` - ${new Date(local.hostRepliedAt).toLocaleDateString()}` : ''}
            </div>
            <p>{local.hostReply}</p>
            {isOwner && <button className="btn btn-ghost btn-sm" onClick={removeReply}><Trash2 /> Remove reply</button>}
          </div>
        ) : isOwner && !replyOpen ? (
          <button className="btn btn-outline btn-sm review-host-reply-btn" onClick={() => setReplyOpen(true)}>
            <MessageSquareReply /> Reply as host
          </button>
        ) : isOwner && replyOpen ? (
          <div className="review-host-reply-form">
            <textarea className="input" rows={2} maxLength={2000} placeholder="Thank the traveler, clarify, or follow up…" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReplyOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={postReply}>Post reply</button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

// ── Tour package card ──
function PackageCard({ place, placeId, pkg, onBook }: { place: any; placeId: string; pkg: any; onBook: (pkg: any) => void }) {
  const [inTrip, setInTrip] = useState(() => tripCart.inCart(placeId, pkg.id));
  const firstImage = Array.isArray(pkg.images) && pkg.images[0]
    ? apiService.getImageUrl(pkg.images[0])
    : (place.coverImage ? apiService.getImageUrl(place.coverImage) : '');
  const days = pkg.durationDays || 1;

  const toggleTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tripCart.inCart(placeId, pkg.id)) {
      tripCart.removeStop(placeId, pkg.id);
      setInTrip(false);
      showToast('Removed from trip');
    } else {
      tripCart.addStop({
        placeId, placeName: place.name, placeCity: place.city || place.location,
        placeCover: place.coverImage || (place.images && place.images[0]),
        packageId: pkg.id, packageTitle: pkg.title, pricePerPerson: pkg.pricePerPerson, currency: pkg.currency,
      });
      setInTrip(true);
      showToast('Added to trip');
    }
  };

  return (
    <div className="package-card">
      <div className="package-cover">
        {firstImage && <img src={firstImage} alt="" loading="lazy" />}
        {pkg.badge && <span className="package-badge">{pkg.badge}</span>}
      </div>
      <div className="package-body">
        <h3 className="package-title">{pkg.title}</h3>
        <div className="package-meta">{days} {days === 1 ? 'day' : 'days'} - {pkg.minPartySize || 1}-{pkg.maxPartySize || 12} travelers</div>
        <p className="package-desc">{pkg.description || ''}</p>
        {Array.isArray(pkg.includes) && pkg.includes.length > 0 && (
          <div className="package-chips">
            {pkg.includes.slice(0, 6).map((inc: string, i: number) => <span key={i} className="package-chip">{inc}</span>)}
          </div>
        )}
        <div className="package-footer">
          <div className="package-price"><strong>{pkg.pricePerPerson} {pkg.currency || 'TND'}</strong><span> / person</span></div>
          <div className="package-cta-wrap">
            <button className={`package-add-trip btn btn-ghost btn-sm ${inTrip ? 'is-added' : ''}`} type="button" title="Add to trip" aria-label="Add to trip" onClick={toggleTrip}>
              <Luggage />
            </button>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => onBook(pkg)}><Send /> Book this</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inquiry / "Request a quote" modal (portal) ──
function InquiryModal({ place, placeId, pkg, onClose }: { place: any; placeId: string; pkg: any | null; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  let prefName = '', prefEmail = '', prefPhone = '';
  try {
    const cached = localStorage.getItem('etunisia_user');
    if (cached) { const u = JSON.parse(cached); prefName = u?.fullName || u?.name || ''; prefEmail = u?.email || ''; prefPhone = u?.phone || ''; }
  } catch { /* ignore */ }

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: any = {
      name: String(fd.get('name') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      phone: String(fd.get('phone') || '').trim() || undefined,
      partySize: Number(fd.get('partySize') || 1),
      dateFrom: String(fd.get('dateFrom') || '') || undefined,
      dateTo: String(fd.get('dateTo') || '') || undefined,
      budget: fd.get('budget') ? Number(fd.get('budget')) : undefined,
      currency: String(fd.get('currency') || 'TND'),
      message: String(fd.get('message') || '').trim(),
      source: pkg ? `package:${pkg.id}` : 'place-detail',
    };
    if (pkg?.id) payload.packageId = pkg.id;
    setBusy(true);
    try {
      await apiService.submitPlaceInquiry(placeId, payload);
      setSentEmail(payload.email);
      setSent(true);
      showToast('Inquiry sent — keep an eye on your email');
    } catch (err: any) {
      setBusy(false);
      const msg = err?.message || (Array.isArray(err?.details) ? err.details.join(', ') : '') || 'Could not send — try again';
      showToast(msg, { type: 'error' });
    }
  };

  return createPortal(
    <div className="sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet inquiry-modal" role="dialog" aria-label="Request a quote">
        <header className="sheet-head">
          <div>
            <h3>{pkg ? 'Book this experience' : 'Request a quote'}</h3>
            <p className="inquiry-sub">
              {sent ? 'Request sent — the host will be in touch.' : pkg ? `${pkg.title} - ${pkg.pricePerPerson} ${pkg.currency || 'TND'} / person` : `${place?.name || 'this place'} — usually replies within 24h`}
            </p>
          </div>
          <button className="sheet-close" aria-label="Close" onClick={onClose}><X /></button>
        </header>
        {sent ? (
          <div className="inquiry-success">
            <div className="inquiry-success-icon"><CheckCircle2 /></div>
            <h3>Request sent!</h3>
            <p>The host will reach out at <strong>{sentEmail}</strong> shortly. You can track it under <a href="#/inquiries">My Inquiries</a>.</p>
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="inquiry-form" onSubmit={submit}>
            <div className="inquiry-row">
              <label><span>Your name *</span><input name="name" type="text" required maxLength={120} defaultValue={prefName} placeholder="Full name" /></label>
              <label><span>Email *</span><input name="email" type="email" required maxLength={200} defaultValue={prefEmail} placeholder="you@example.com" /></label>
            </div>
            <div className="inquiry-row">
              <label><span>Phone</span><input name="phone" type="tel" maxLength={40} defaultValue={prefPhone} placeholder="+216 …" /></label>
              <label><span>Travelers *</span><input name="partySize" type="number" min={pkg?.minPartySize || 1} max={pkg?.maxPartySize || 50} defaultValue={2} /></label>
            </div>
            <div className="inquiry-row">
              <label><span>From</span><input name="dateFrom" type="date" min={today} /></label>
              <label><span>To</span><input name="dateTo" type="date" min={today} /></label>
            </div>
            <div className="inquiry-row">
              <label><span>Budget</span><input name="budget" type="number" min={0} step={50} placeholder={pkg?.pricePerPerson && pkg?.minPartySize ? `Suggested: ${pkg.pricePerPerson * pkg.minPartySize}` : 'e.g. 800'} /></label>
              <label><span>Currency</span>
                <select name="currency" defaultValue={pkg?.currency || 'TND'}>
                  <option value="TND">TND</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                </select>
              </label>
            </div>
            <label className="inquiry-full">
              <span>What can they help you with? *</span>
              <textarea name="message" rows={4} required minLength={5} maxLength={2000} defaultValue={pkg ? `I'd like to book "${pkg.title}". Please share availability + next steps.` : ''} placeholder="Tell them about your trip — dates flexible? Group includes kids? Any must-do experiences?" />
            </label>
            <p className="inquiry-disclaimer"><ShieldCheck /> We share your contact only with this listing's host. By submitting you agree to be contacted about this trip.</p>
            <div className="inquiry-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}><Send /> {pkg ? 'Request booking' : 'Send request'}</button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default function PlaceDetailPage() {
  const queryClient = useQueryClient();
  const [placeId, setPlaceId] = useState(placeIdFromPath());
  useEffect(() => onRouteChange(() => setPlaceId(placeIdFromPath())), []);

  const placeQ = useQuery({
    queryKey: ['place', placeId],
    queryFn: async () => {
      try {
        const p = await apiService.getPlace(placeId);
        if (p) return p;
      } catch { /* fall through */ }
      return mockPlaces.find((p) => p.id === placeId) || { name: 'Place Not Found', description: 'This place could not be loaded.', category: '', location: '', rating: 0, reviewCount: 0 };
    },
  });
  const place = placeQ.data;

  const reviewsQ = useQuery({
    queryKey: ['reviews', placeId],
    queryFn: () => apiService.getReviews(placeId).catch(() => mockComments as any[]),
  });
  const reviews = reviewsQ.data ?? [];

  const meQ = useQuery({
    queryKey: ['me-placedetail'],
    queryFn: () => apiService.getMyProfile().catch(() => null),
    enabled: !!localStorage.getItem('etunisia_token'),
  });
  const me = meQ.data ?? null;

  const packagesQ = useQuery({
    queryKey: ['packages', placeId],
    queryFn: () => apiService.listPackagesForPlace(placeId).catch(() => [] as any[]),
    enabled: !!place && !placeQ.isLoading,
  });
  const packages = packagesQ.data ?? [];

  const [saved, setSaved] = useState(false);
  const [inTrip, setInTrip] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [inquiry, setInquiry] = useState<{ pkg: any | null } | null>(null);

  // Scroll-linked hero zoom (scrollytelling) — gated on reduced-motion.
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroScale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1, 1.12]);

  const dq = routeQuery();
  const verifyingInquiryId = dq.get('inquiry') || null;

  useEffect(() => {
    setSaved(isSaved('place:' + placeId));
    setInTrip(tripCart.inCart(placeId, null));
  }, [placeId]);

  // Anonymous-visitor passport seeding.
  useEffect(() => {
    if (place?.city && isAnonymous()) {
      try { addVisitedCity(place.city); } catch { /* ignore */ }
    }
  }, [place?.city]);

  // Deep-link ?review=1 auto-opens the review form.
  useEffect(() => {
    if (routeQuery().get('review') === '1') setReviewFormOpen(true);
  }, [placeId]);

  if (placeQ.isLoading || !place) {
    return (
      <div className="place-detail-page page-enter" id="place-detail-page" data-place-id={placeId}>
        <div className="place-detail-loading"><div className="spinner" /><p>Loading place details…</p></div>
      </div>
    );
  }

  const onSave = () => {
    const nowSaved = toggleSaved('place:' + placeId);
    setSaved(nowSaved);
    showToast(nowSaved ? 'Saved to favorites' : 'Removed from favorites');
    try { apiService.toggleFavorite(placeId); } catch { /* best-effort */ }
  };

  const onShare = () => shareUrl({ title: place.name || 'e-Tunisia', text: place.description || '', url: absoluteUrl(`/place/${placeId}`) });

  const onAddTrip = () => {
    if (tripCart.inCart(placeId, null)) {
      tripCart.removeStop(placeId, null);
      setInTrip(false);
      showToast('Removed from trip');
    } else {
      tripCart.addStop({ placeId, placeName: place.name, placeCity: place.city || place.location, placeCover: place.coverImage || (place.images && place.images[0]) });
      setInTrip(true);
      showToast('Added to trip');
    }
  };

  const submitReview = async () => {
    const text = reviewText.trim();
    if (!text || !selectedRating) { alert('Please add a rating and comment.'); return; }
    try {
      await apiService.addReview(placeId, selectedRating, text, { inquiryId: verifyingInquiryId });
      if (verifyingInquiryId) showToast('Verified review posted');
      queryClient.invalidateQueries({ queryKey: ['reviews', placeId] });
      setReviewText('');
      setSelectedRating(0);
      setReviewFormOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Could not post review', { type: 'error' });
    }
  };

  const cat = typeof place.category === 'object' && place.category ? place.category.name : (place.category || '');
  const cover = apiService.getImageUrl(place.coverImage || place.image || place.imageUrl || (place.images && place.images[0]) || '');

  const ratingValue = Number(place.rating) || 4.5;
  const reviewTotal = place.reviewCount || reviews.length;

  return (
    <div className="place-detail-page page-enter" id="place-detail-page" data-place-id={placeId}>
      <div className="place-detail-hero" ref={heroRef}>
        <motion.img src={cover} alt={place.name} className="place-detail-hero-img" style={{ scale: heroScale }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.background = 'linear-gradient(135deg, var(--terracotta-pale), var(--mediterranean-pale))'; }} />
        <div className="place-detail-hero-overlay" />
        <div className="place-detail-hero-actions">
          <a href="#/" className="btn-icon place-detail-back" aria-label="Back"><ArrowLeft /></a>
          <div className="place-detail-hero-right">
            <button className={`btn-icon place-detail-save ${saved ? 'saved' : ''}`} aria-label={saved ? 'Remove from favorites' : 'Save to favorites'} aria-pressed={saved} onClick={onSave}><Heart /></button>
            <button className="btn-icon" aria-label="Share" onClick={onShare}><Share2 /></button>
          </div>
        </div>
      </div>

      <div className="place-detail-body">
        <div className="place-detail-main">
          <div className="place-detail-info">
            <div className="place-detail-category">{cat}</div>
            <h1 className="place-detail-name">{place.name}</h1>
            <div className="place-detail-location"><MapPin /> {place.location || place.city || ''}</div>
            <div className="place-detail-rating">
              <div className="place-detail-stars"><Stars rating={Math.round(ratingValue)} /></div>
              <span className="place-detail-rating-value">{ratingValue.toFixed(1)}</span>
              <span className="place-detail-review-count">({reviewTotal} reviews)</span>
            </div>
            <p className="place-detail-description">{place.description || ''}</p>
          </div>

          {reviewFormOpen && (
            <div className="place-detail-review-form">
              <h3>Write a Review</h3>
              {verifyingInquiryId && (
                <div className="review-verified-hint"><ShieldCheck /><span> This review will show a Verified booking badge.</span></div>
              )}
              <div className="place-review-rating-input">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} className={`star-btn ${n <= selectedRating ? 'active' : ''}`} onClick={() => setSelectedRating(n)}><Star /></button>
                ))}
              </div>
              <textarea className="input" rows={3} placeholder="Share your experience…" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
              <button className="btn btn-primary" onClick={submitReview}>Submit Review</button>
            </div>
          )}

          {packages.length > 0 && (
            <Reveal className="place-detail-packages">
              <h2><Package /> Bookable experiences</h2>
              <div className="packages-grid">
                {packages.map((pkg: any) => (
                  <PackageCard key={pkg.id} place={place} placeId={placeId} pkg={pkg} onBook={(p) => setInquiry({ pkg: p })} />
                ))}
              </div>
            </Reveal>
          )}

          <Reveal className="place-detail-reviews">
            <h2><MessageSquare /> Reviews ({reviews.length})</h2>
            <div className="place-detail-review-list">
              {reviews.length === 0 && <p className="text-muted text-center">No reviews yet. Be the first!</p>}
              {reviews.map((r: any, i: number) => <ReviewItem key={r.id || i} r={r} place={place} me={me} placeId={placeId} />)}
            </div>
          </Reveal>
        </div>

        <aside className="place-detail-aside">
          <div className="place-detail-booking">
            <div className="pdb-rating">
              <div className="pdb-rating-score"><Star /> {ratingValue.toFixed(1)}</div>
              <span className="pdb-rating-count">{reviewTotal} review{reviewTotal === 1 ? '' : 's'}</span>
            </div>
            <button className="btn btn-primary pdb-cta" onClick={() => setInquiry({ pkg: null })}><Send /> Request a quote</button>
            <div className="pdb-actions">
              {place.phone && <a className="btn btn-outline" href={`tel:${place.phone}`}><Phone /> Call</a>}
              {place.phone && <a className="btn btn-outline" target="_blank" rel="noopener" href={whatsappLink(place.phone)}><MessageCircle /> WhatsApp</a>}
              {place.website && <a className="btn btn-outline" target="_blank" rel="noopener" href={place.website}><ExternalLink /> Website</a>}
              {place.latitude && place.longitude ? (
                <a className="btn btn-outline" target="_blank" rel="noopener" href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}><Navigation /> Directions</a>
              ) : (
                <button className="btn btn-outline" data-link="/map"><MapIcon /> View on Map</button>
              )}
              <button className={`btn btn-outline ${inTrip ? 'is-added' : ''}`} type="button" onClick={onAddTrip}><Luggage /> {inTrip ? 'Added to trip' : 'Add to trip'}</button>
              <button className="btn btn-ghost" onClick={() => setReviewFormOpen((o) => !o)}><Pencil /> Write a review</button>
            </div>
          </div>
        </aside>
      </div>

      {inquiry && <InquiryModal place={place} placeId={placeId} pkg={inquiry.pkg} onClose={() => setInquiry(null)} />}
    </div>
  );
}
