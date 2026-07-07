import '../../styles/tips.css';
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Landmark, Bus, Banknote, ShieldCheck, Utensils, Compass, Plus, X, Heart, Share2, Send } from 'lucide-react';
import * as api from '../../api';
import { tips as mockTips } from '../../data';
import { shareUrl, isFlagged, toggleFlag, requireAuth } from '../../ui-utils';
import { absoluteUrl } from '../../router';

// Migrated from vanilla pages/tips.ts — filters + like/share cards + submit modal.

interface CategoryMeta {
  id: string;
  label: string;
  Icon: React.ComponentType;
  tint: string;
}

const CATEGORIES: CategoryMeta[] = [
  { id: 'all', label: 'All Tips', Icon: Sparkles, tint: 'var(--text-secondary)' },
  { id: 'cultural', label: 'Cultural', Icon: Landmark, tint: 'var(--coral)' },
  { id: 'transport', label: 'Transport', Icon: Bus, tint: 'var(--mediterranean)' },
  { id: 'money', label: 'Money', Icon: Banknote, tint: 'var(--olive)' },
  { id: 'safety', label: 'Safety', Icon: ShieldCheck, tint: 'var(--gold)' },
  { id: 'food', label: 'Food', Icon: Utensils, tint: 'var(--accent)' },
  { id: 'general', label: 'General', Icon: Compass, tint: 'var(--violet)' },
];

const CAT_BY_ID: Record<string, CategoryMeta> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const catMeta = (cat: string): CategoryMeta => CAT_BY_ID[(cat || '').toLowerCase()] || CAT_BY_ID.general;
const tintStyle = (tint: string) => ({ ['--cat-tint']: tint } as React.CSSProperties);

function timeAgo(iso: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TipCard({ tip }: { tip: any }) {
  const meta = catMeta(tip.category);
  const Icon = meta.Icon;
  const date = timeAgo(tip.createdAt);
  const initiallyLiked = !!tip.liked || isFlagged('tip:' + tip.id + ':like');
  const baseLikes = Number(tip.likes) || 0;

  const [liked, setLiked] = useState(initiallyLiked);
  const [celebrating, setCelebrating] = useState(false);
  const displayLikes = baseLikes + (liked && !tip.liked ? 1 : 0) - (!liked && tip.liked ? 1 : 0);

  const authorName = tip.author?.name || tip.userName || 'Anonymous';
  const authorId = tip.author?.id || '';
  const authorAvatar = api.getImageUrl(tip.author?.avatar)
    || `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(authorName)}`;

  const onLike = () => {
    if (!requireAuth('like tips')) return;
    const nowLiked = toggleFlag('tip:' + tip.id + ':like');
    setLiked(nowLiked);
    if (nowLiked) {
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), 600);
    }
    try {
      api.likeTip(tip.id);
    } catch {
      /* best-effort */
    }
  };

  const onShare = () => {
    shareUrl({ title: tip.title || 'Travel tip from e-Tunisia', url: absoluteUrl('/tips') });
  };

  return (
    <article className="tip2-card reveal-on-scroll" data-tip-id={tip.id} style={tintStyle(meta.tint)}>
      <header className="tip2-header">
        <span
          className="tip2-avatar-wrap"
          {...(authorId ? { 'data-user-id': authorId, 'data-user-name': authorName, 'data-user-avatar': authorAvatar } : {})}
        >
          <img src={authorAvatar} alt="" loading="lazy" className="tip2-avatar" />
        </span>
        <div className="tip2-meta">
          <strong className="tip2-author">{authorName}</strong>
          {date && <span className="tip2-date">{date}</span>}
        </div>
        <span className="tip2-badge"><Icon /> {meta.label}</span>
      </header>
      <h3 className="tip2-title">{tip.title}</h3>
      <p className="tip2-content">{tip.content}</p>
      <footer className="tip2-footer">
        <button
          type="button"
          className={`tip2-like-btn ${liked ? 'is-liked' : ''} ${celebrating ? 'is-celebrating' : ''}`}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike this tip' : 'Like this tip'}
          onClick={onLike}
        >
          <Heart />
          <span data-likes>{displayLikes}</span>
        </button>
        <button type="button" className="tip2-share-btn" onClick={onShare}>
          <Share2 /> <span>Share</span>
        </button>
      </footer>
    </article>
  );
}

export default function TipsPage() {
  const queryClient = useQueryClient();
  const [cat, setCat] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  // Submit form state
  const [formCat, setFormCat] = useState('cultural');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: allTips } = useQuery({
    queryKey: ['tips'],
    queryFn: async () => {
      try {
        const t = await api.getTips();
        if (t?.length) return t;
      } catch {
        /* fall through */
      }
      return mockTips as any[];
    },
  });

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [modalOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) setModalOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const openModal = () => {
    if (!requireAuth('share tips')) return;
    setModalOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const c = content.trim();
    if (!t || !c) return;
    const newTip = {
      id: 'tip_' + Date.now(),
      title: t,
      content: c,
      category: formCat,
      likes: 0,
      liked: false,
      author: { name: 'You' },
      createdAt: new Date().toISOString(),
    };
    queryClient.setQueryData<any[]>(['tips'], (old) => [newTip, ...(old || [])]);
    setCat('all');
    setTitle('');
    setContent('');
    setModalOpen(false);
    try {
      api.addTip(t, c, formCat);
    } catch {
      /* best-effort */
    }
  };

  const list = !allTips
    ? []
    : cat === 'all'
      ? allTips
      : allTips.filter((t) => (t.category || '').toLowerCase() === cat);
  const activeLabel = CAT_BY_ID[cat]?.label || 'matching';

  return (
    <div className="tips-page page-enter">
      <section className="tips2-hero">
        <div className="tips2-hero-gradient" aria-hidden="true" />
        <div className="tips2-hero-mesh" aria-hidden="true" />
        <div className="tips2-hero-orbs" aria-hidden="true">
          <span className="tips2-hero-orb" />
          <span className="tips2-hero-orb" />
        </div>
        <div className="tips2-hero-content">
          <span className="tips2-eyebrow"><Sparkles /> Community wisdom</span>
          <h1>Travel <span className="tips2-accent">smarter</span></h1>
          <p>Insider knowledge from experienced travelers and locals. Real tips, tested in the real Tunisia.</p>
          <button type="button" className="tips2-share-cta" onClick={openModal}>
            <Plus /> Share your tip
          </button>
        </div>
      </section>

      <nav className="tips2-categories-wrapper" aria-label="Tip category filter">
        <div className="tips2-categories" role="tablist">
          {CATEGORIES.filter((c) => c.id !== 'general').map((c) => {
            const active = c.id === cat;
            const Icon = c.Icon;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                className={`tips2-tag${active ? ' active' : ''}`}
                style={tintStyle(c.tint)}
                aria-selected={active}
                onClick={() => setCat(c.id)}
              >
                <span className="tips2-tag-icon"><Icon /></span>
                {c.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="tips2-grid">
        {list.length === 0 ? (
          <div className="tips2-empty">
            <div className="tips2-empty-icon"><Sparkles /></div>
            <h3>No {activeLabel.toLowerCase()} tips yet</h3>
            <p>Be the first to share one — your tip helps the next traveler.</p>
            <div className="tips2-empty-actions">
              <button type="button" className="btn btn-primary" onClick={openModal}><Plus /> Share your tip</button>
              <button type="button" className="btn btn-outline" onClick={() => setCat('all')}><Compass /> Show all tips</button>
            </div>
          </div>
        ) : (
          list.map((t) => <TipCard key={t.id} tip={t} />)
        )}
      </div>

      <div className={`tips2-modal ${modalOpen ? 'active' : ''}`} role="dialog" aria-modal="true" aria-labelledby="tips-modal-title">
        <div className="tips2-modal-overlay" onClick={() => setModalOpen(false)} />
        <div className="tips2-modal-content">
          <header className="tips2-modal-header">
            <h3 id="tips-modal-title">Share your tip</h3>
            <button type="button" className="tips2-modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>
              <X />
            </button>
          </header>
          <form className="tips2-modal-form" onSubmit={submit}>
            <div className="tips2-modal-field">
              <label htmlFor="tip-category" className="tips2-modal-label">Category</label>
              <select id="tip-category" className="tips2-modal-input" required value={formCat} onChange={(e) => setFormCat(e.target.value)}>
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="tips2-modal-field">
              <label htmlFor="tip-title" className="tips2-modal-label">Title</label>
              <input
                type="text"
                id="tip-title"
                className="tips2-modal-input"
                placeholder="e.g. How to haggle in the Medina"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="tips2-modal-field">
              <label htmlFor="tip-content" className="tips2-modal-label">Your tip</label>
              <textarea
                id="tip-content"
                className="tips2-modal-input"
                rows={5}
                placeholder="Share your experience and advice…"
                required
                maxLength={1000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <span className="tips2-modal-helper">{content.length} / 1000</span>
            </div>
            <button type="submit" className="tips2-modal-submit"><Send /> Post tip</button>
          </form>
        </div>
      </div>
    </div>
  );
}
