import React, { useEffect, useRef, useState } from 'react';
import {
  Compass, Sparkles, Users, Award, ArrowRight, Camera, Check, UserPlus, UserCheck, PartyPopper,
  Waves, Landmark, UtensilsCrossed, Trees, Library, Mountain, Sun, PiggyBank, Moon,
} from 'lucide-react';
import * as api from '../../api';
import { requireAuth, showToast } from '../../ui-utils';
import { goTo } from '../../router';

// Migrated from vanilla pages/onboarding.ts — day-1 retention wizard.

interface Interest { id: string; label: string; Icon: React.ComponentType; tint: string; }

const INTERESTS: Interest[] = [
  { id: 'beaches', label: 'Beaches', Icon: Waves, tint: 'var(--cyan)' },
  { id: 'historical', label: 'Historical sites', Icon: Landmark, tint: 'var(--sand)' },
  { id: 'food', label: 'Food & drink', Icon: UtensilsCrossed, tint: 'var(--accent)' },
  { id: 'nature', label: 'Nature & parks', Icon: Trees, tint: 'var(--olive)' },
  { id: 'culture', label: 'Culture & arts', Icon: Library, tint: 'var(--violet)' },
  { id: 'adventure', label: 'Adventure', Icon: Mountain, tint: 'var(--gold)' },
  { id: 'desert', label: 'Sahara & deserts', Icon: Sun, tint: 'var(--amber)' },
  { id: 'photography', label: 'Photography', Icon: Camera, tint: 'var(--mediterranean)' },
  { id: 'budget', label: 'Budget travel', Icon: PiggyBank, tint: 'var(--success)' },
  { id: 'nightlife', label: 'Nightlife', Icon: Moon, tint: 'var(--rose)' },
];

const intTintStyle = (tint: string) => ({ ['--int-tint']: tint } as React.CSSProperties);

function avatarFallback(seedSrc: string) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seedSrc)}`;
}

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [suggested, setSuggested] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!requireAuth('start onboarding')) return;
      try {
        const m = await api.getMyProfile();
        if (cancelled) return;
        setMe(m);
        setFullName(m?.fullName || '');
        setBio(m?.bio || '');
        setCountry(m?.country || '');
        if (Array.isArray(m?.interests)) setInterests(new Set(m.interests));
        if (m?.onboardingComplete) {
          goTo('/');
          return;
        }
        try {
          const s = await api.getSuggestedUsers(10);
          if (!cancelled) setSuggested(s);
        } catch {
          /* suggestions are best-effort */
        }
      } catch {
        if (!cancelled) showToast('Could not load your account', { type: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleInterest = (id: string) =>
    setInterests((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleFollow = async (userId: string) => {
    const was = followed.has(userId);
    try {
      if (was) await api.unfollowUser(userId);
      else await api.followUser(userId);
      setFollowed((prev) => {
        const n = new Set(prev);
        was ? n.delete(userId) : n.add(userId);
        return n;
      });
    } catch (err: any) {
      showToast(err?.message || 'Could not follow', { type: 'error' });
    }
  };

  const onAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      showToast('Image too large (max 5MB)', { type: 'error' });
      return;
    }
    const r = new FileReader();
    r.onload = (ev) => setAvatarDataUrl((ev.target?.result as string) || null);
    r.readAsDataURL(f);
  };

  const onBack = () => setStep((s) => (s > 0 ? s - 1 : s));

  const onNext = async () => {
    if (busy) return;
    if (step === 1) {
      if (!fullName.trim()) {
        showToast('Name is required', { type: 'error' });
        return;
      }
      setBusy(true);
      try {
        const patch: any = { fullName: fullName.trim(), country: country.trim(), bio: bio.trim() };
        if (avatarDataUrl) patch.avatar = await api.uploadDataUrl(avatarDataUrl, 'avatars');
        await api.updateMyProfile(patch);
        (window as any).__userHydrated = false;
        window.dispatchEvent(new CustomEvent('etunisia:profile-updated'));
      } catch (e: any) {
        showToast(e?.message || 'Could not save profile', { type: 'error' });
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    if (step === 2) {
      if (interests.size < 3) {
        showToast('Pick at least 3 interests', { type: 'info' });
        return;
      }
      try {
        await api.updateMyProfile({ interests: Array.from(interests) } as any);
      } catch {
        /* best-effort */
      }
    }
    if (step === 3) {
      if (followed.size < 3) {
        const ok = window.confirm("You haven't followed 3 yet — that means an empty feed. Continue anyway?");
        if (!ok) return;
      }
      try {
        await api.updateMyProfile({ onboardingComplete: true } as any);
      } catch {
        /* best-effort */
      }
    }
    if (step < 4) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      goTo('/');
    }
  };

  const skip = async () => {
    try {
      await api.updateMyProfile({ onboardingComplete: true } as any);
    } catch {
      /* best-effort */
    }
    goTo('/');
  };

  const firstName = (fullName || 'there').split(' ')[0];
  const seed = fullName || me?.id || 'user';
  const currentAvatar = avatarDataUrl
    || (me?.avatar && (String(me.avatar).startsWith('http') || String(me.avatar).startsWith('data:')) ? me.avatar : avatarFallback(seed));
  const candidates = (suggested || []).filter((u) => !me || u.id !== me.id).slice(0, 8);

  return (
    <div className="onb-page page-enter" data-design="sleek" id="onb-root">
      <div className="onb-progress-wrap">
        <ol className="onb-progress" aria-label="Onboarding progress">
          {['Welcome', 'Profile', 'Interests', 'Connect'].map((label, i) => (
            <li key={label} className={`${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`.trim()}>
              <span className="dot" /><span className="label">{label}</span>
            </li>
          ))}
        </ol>
      </div>
      <main className="onb-shell">
        {loading ? (
          <div className="onb-loading"><div className="spinner" /><p>Setting things up…</p></div>
        ) : step === 0 ? (
          <section className="onb-card onb-welcome">
            <div className="onb-illustration onb-illustration-welcome" aria-hidden="true">
              <div className="onb-illustration-orbs"><span className="onb-illustration-orb" /><span className="onb-illustration-orb" /></div>
              <div className="onb-illustration-icon"><Compass /></div>
            </div>
            <h1>Ahlan wa sahlan, <span className="onb-name-highlight">{firstName}</span></h1>
            <p className="onb-sub">Welcome to e-Tunisia — the platform where locals share real Tunisia.<br />Let's set you up in under a minute.</p>
            <ul className="onb-perks">
              <li><span className="onb-perk-icon"><Sparkles /></span>Pick what you love so the feed feels personal</li>
              <li><span className="onb-perk-icon"><Users /></span>Follow other explorers — share tips, ask questions</li>
              <li><span className="onb-perk-icon"><Award /></span>Earn XP, badges, and credits as you go</li>
            </ul>
            <div className="onb-actions onb-actions-center">
              <button type="button" className="btn btn-primary btn-lg onb-cta-primary" onClick={onNext}>Let's go <ArrowRight /></button>
              <button type="button" className="btn btn-ghost" onClick={skip}>Skip for now</button>
            </div>
          </section>
        ) : step === 1 ? (
          <section className="onb-card">
            <header className="onb-step-head">
              <span className="onb-step-pill">Step 1 of 3</span>
              <h2>Make yourself recognisable</h2>
              <p className="text-muted">Real photo, real name, one-line bio — that's all it takes.</p>
            </header>
            <div className="onb-profile-row">
              <div className="onb-avatar-wrap">
                <img src={currentAvatar} alt="" className="onb-avatar" />
                <button className="onb-avatar-edit" aria-label="Change avatar" onClick={() => fileRef.current?.click()}><Camera /></button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatarFile} />
              </div>
              <div className="onb-profile-fields">
                <div className="input-group">
                  <label className="input-label">Display name</label>
                  <input className="input" type="text" maxLength={80} value={fullName} placeholder="Your name" onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Country</label>
                  <input className="input" type="text" maxLength={80} value={country} placeholder="e.g. Tunisia" onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">One-line bio <span className="text-muted">(optional)</span></label>
              <textarea className="input" rows={2} maxLength={320} value={bio} placeholder="Where you've been, what you love to share…" onChange={(e) => setBio(e.target.value)} />
            </div>
            <div className="onb-actions">
              <button className="btn btn-ghost" onClick={onBack}>Back</button>
              <button className="btn btn-primary" onClick={onNext} disabled={busy}>{busy ? 'Saving…' : <>Continue <ArrowRight /></>}</button>
            </div>
          </section>
        ) : step === 2 ? (
          <section className="onb-card">
            <header className="onb-step-head">
              <span className="onb-step-pill">Step 2 of 3</span>
              <h2>What are you into?</h2>
              <p className="text-muted">Pick 3 or more — we'll match places, posts, and people to what you love.</p>
            </header>
            <div className="onb-interest-grid">
              {INTERESTS.map((i) => {
                const selected = interests.has(i.id);
                const Icon = i.Icon;
                return (
                  <button
                    key={i.id}
                    type="button"
                    className={`onb-interest${selected ? ' is-selected' : ''}`}
                    style={intTintStyle(i.tint)}
                    aria-pressed={selected}
                    onClick={() => toggleInterest(i.id)}
                  >
                    <span className="onb-interest-icon" aria-hidden="true"><Icon /></span>
                    <span className="onb-interest-label">{i.label}</span>
                    <span className="onb-interest-check" aria-hidden="true"><Check /></span>
                  </button>
                );
              })}
            </div>
            <div className="onb-actions">
              <button className="btn btn-ghost" onClick={onBack}>Back</button>
              <span className="onb-status text-muted">{interests.size === 0 ? 'Pick at least 3' : `${interests.size} selected`}</span>
              <button className="btn btn-primary" onClick={onNext}>Continue <ArrowRight /></button>
            </div>
          </section>
        ) : step === 3 ? (
          <section className="onb-card">
            <header className="onb-step-head">
              <span className="onb-step-pill">Step 3 of 3</span>
              <h2>Follow a few explorers</h2>
              <p className="text-muted">Tunisia's most active members — pick at least 3 to see their posts in your feed.</p>
            </header>
            <div className="onb-people-grid">
              {candidates.length === 0 ? (
                <div className="onb-empty">
                  <div className="onb-empty-icon" aria-hidden="true"><Users /></div>
                  <p>No suggestions yet — we'll set you up with a discovery feed.</p>
                </div>
              ) : (
                candidates.map((u) => {
                  const avatar = u.avatar && (String(u.avatar).startsWith('http') || String(u.avatar).startsWith('data:')) ? u.avatar : avatarFallback(u.fullName || u.id);
                  const isFollowed = followed.has(u.id);
                  return (
                    <article key={u.id} className={`onb-person${isFollowed ? ' is-followed' : ''}`} data-user={u.id}>
                      <span
                        className="onb-person-avatar-wrap"
                        data-user-id={u.id}
                        data-user-name={u.fullName || ''}
                        data-user-avatar={avatar}
                        data-user-handle={u.handle || ''}
                        data-user-plan={u.plan || ''}
                      >
                        <img src={avatar} alt="" loading="lazy" />
                      </span>
                      <div className="onb-person-info">
                        <strong>{u.fullName}</strong>
                        <span className="onb-person-sub">{u.bio || u.country || `Level ${u.level || 1} Explorer`}</span>
                      </div>
                      <button type="button" className={`onb-follow-btn${isFollowed ? ' is-followed' : ''}`} aria-pressed={isFollowed} onClick={() => toggleFollow(u.id)}>
                        {isFollowed ? <UserCheck /> : <UserPlus />}
                        <span>{isFollowed ? 'Following' : 'Follow'}</span>
                      </button>
                    </article>
                  );
                })
              )}
            </div>
            <div className="onb-actions">
              <button className="btn btn-ghost" onClick={onBack}>Back</button>
              <span className="onb-status text-muted">{followed.size === 0 ? 'Pick at least 3' : `${followed.size} selected`}</span>
              <button className="btn btn-primary" onClick={onNext}>Finish <ArrowRight /></button>
            </div>
          </section>
        ) : (
          <section className="onb-card onb-done">
            <div className="onb-illustration onb-illustration-done" aria-hidden="true">
              <div className="onb-illustration-orbs"><span className="onb-illustration-orb" /><span className="onb-illustration-orb" /></div>
              <div className="onb-illustration-icon onb-illustration-icon-done"><PartyPopper /></div>
            </div>
            <h2>You're all set!</h2>
            <p className="onb-sub">Your feed is ready. Add your first post any time from the home page.</p>
            <div className="onb-actions onb-actions-center">
              <a className="btn btn-primary btn-lg onb-cta-primary" href="#/">Open my feed <ArrowRight /></a>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
