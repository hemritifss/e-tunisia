import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, UserX, Edit3, Camera, Save, UserCircle, Globe2, ShieldCheck, Star, TrendingUp, Sprout } from 'lucide-react';
import * as api from '../../api';
import { requireAuth, showToast } from '../../ui-utils';
import { goTo } from '../../router';

// Migrated from vanilla pages/profile-edit.ts — edit profile + avatar + completeness meter.

const METER_ICON: Record<string, React.ComponentType> = { star: Star, 'trending-up': TrendingUp, sprout: Sprout };

export default function ProfileEditPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [savedAvatar, setSavedAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { requireAuth('edit your profile'); }, []);

  const { data: me, isLoading } = useQuery({ queryKey: ['my-profile-edit'], queryFn: () => api.getMyProfile().catch(() => null) });

  useEffect(() => {
    if (me && !ready) {
      setFullName(me.fullName || ''); setBio(me.bio || ''); setCountry(me.country || '');
      setWebsite(me.website || ''); setPhone(me.phone || ''); setEmail(me.email || '');
      setSavedAvatar(me.avatar || null);
      setReady(true);
    }
  }, [me, ready]);

  if (isLoading) {
    return (
      <div className="profile-edit-v2 page-enter" id="profile-edit-root">
        <a href="#/profile" className="back-floating-btn" aria-label="Back to profile"><ArrowLeft /></a>
        <div className="edit-skeleton"><div className="sk-title skeleton-block" /><div className="sk-avatar-row"><div className="sk-avatar-preview skeleton-block" /><div className="sk-avatar-btn skeleton-block" /></div><div className="sk-field"><div className="sk-label skeleton-block" /><div className="sk-input skeleton-block" /></div><div className="sk-submit skeleton-block" /></div>
      </div>
    );
  }
  if (!me) {
    return (
      <div className="profile-edit-v2 page-enter" id="profile-edit-root">
        <a href="#/profile" className="back-floating-btn"><ArrowLeft /></a>
        <div className="pe-error"><div className="pe-error-icon"><UserX /></div><h3>Could not load your profile</h3><p>Try again in a moment, or return to your profile.</p><a href="#/profile" className="btn btn-primary"><ArrowLeft /> Back to profile</a></div>
      </div>
    );
  }

  const seed = encodeURIComponent(me.fullName || me.id);
  const currentAvatar = pendingAvatar || (savedAvatar ? api.getImageUrl(savedAvatar, 'avatar') : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { showToast('Image too large (max 5 MB)', { type: 'error' }); return; }
    const r = new FileReader();
    r.onload = (ev) => setPendingAvatar((ev.target?.result as string) || null);
    r.readAsDataURL(f);
  };

  // Completeness meter
  const checks = [
    { label: 'Full name', weight: 15, got: !!fullName.trim() },
    { label: 'Profile photo', weight: 25, got: !!(pendingAvatar || savedAvatar) },
    { label: 'Bio / headline', weight: 20, got: !!bio.trim() },
    { label: 'Country', weight: 15, got: !!country.trim() },
    { label: 'Website', weight: 15, got: !!website.trim() },
    { label: 'Phone', weight: 10, got: !!phone.trim() },
  ];
  const score = checks.reduce((s, c) => s + (c.got ? c.weight : 0), 0);
  const missing = checks.filter((c) => !c.got).map((c) => c.label);
  const tier = score >= 90 ? 'great' : score >= 60 ? 'good' : 'low';
  const tierLabel = tier === 'great' ? 'All-star' : tier === 'good' ? 'Strong' : 'Just starting';
  const tierIconName = tier === 'great' ? 'star' : tier === 'good' ? 'trending-up' : 'sprout';
  const MeterIcon = METER_ICON[tierIconName];

  const save = async () => {
    if (!fullName.trim()) { showToast('Name is required', { type: 'error' }); return; }
    setSaving(true);
    try {
      const patch: any = { fullName: fullName.trim(), country: country.trim(), phone: phone.trim(), bio: bio.trim(), website: website.trim() };
      if (pendingAvatar) patch.avatar = await api.uploadDataUrl(pendingAvatar, 'avatars');
      await api.updateMyProfile(patch);
      (window as any).__userHydrated = false;
      window.dispatchEvent(new CustomEvent('etunisia:profile-updated'));
      showToast('Profile updated');
      goTo('/profile');
    } catch (err: any) {
      showToast(err?.message || 'Could not save', { type: 'error' });
      setSaving(false);
    }
  };

  return (
    <div className="profile-edit-v2 page-enter" id="profile-edit-root">
      <header className="up-cover pe-cover">
        <div className="up-cover-gradient" aria-hidden="true" />
        <div className="up-cover-pattern" aria-hidden="true" />
        <div className="up-cover-orbs" aria-hidden="true"><span className="up-cover-orb" /><span className="up-cover-orb" /></div>
        <a href="#/profile" className="back-floating-btn" aria-label="Back to profile"><ArrowLeft /></a>
        <span className="pe-editing-chip" aria-live="polite"><Edit3 /> Editing profile</span>
      </header>

      <section className="up-identity">
        <div className="up-avatar-wrap">
          <img src={currentAvatar} alt="" className="up-avatar" />
          <button className="up-avatar-edit-overlay" aria-label="Change avatar" onClick={(e) => { e.preventDefault(); fileRef.current?.click(); }}><Camera /></button>
        </div>
        <div className="up-actions">
          <button className="btn btn-primary" disabled={saving} onClick={save}><Save /> {saving ? 'Saving…' : 'Save changes'}</button>
          <a className="btn btn-outline" href="#/profile">Cancel</a>
        </div>
      </section>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      <section className="pe-completeness">
        <div className="pe-meter-row">
          <div className="pe-meter-text">
            <span className="pe-meter-label">Profile strength</span>
            <strong className="pe-meter-value">
              <span className="pe-meter-pct">{score}%</span>
              <span className="pe-meter-tier" data-tier={tier}><MeterIcon /> {tierLabel}</span>
            </strong>
          </div>
          {missing.length > 0 && <span className="pe-meter-missing">Add: {missing.slice(0, 3).join(' · ')}</span>}
        </div>
        <div className="pe-meter-bar" data-tier={tier}><div className="pe-meter-fill" style={{ width: `${score}%` }} /></div>
      </section>

      <div className="pe-grid">
        <article className="pe-section-card">
          <header className="pe-section-head"><UserCircle /><div><h3>Basic info</h3><p>How you appear across e-Tunisia</p></div></header>
          <div className="pe-section-body">
            <div className="input-group">
              <label className="input-label">Full name <span className="input-required">*</span></label>
              <input className="input" type="text" maxLength={80} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <span className="input-hint">Shown on your posts, comments, and tips.</span>
            </div>
            <div className="input-group">
              <label className="input-label">Bio / Headline</label>
              <textarea className="input" rows={3} maxLength={320} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="One line about you — what you love, where you've been, what you write about…" />
              <span className="input-hint"><span>{bio.length}</span> / 320 characters · Shows on your profile + post cards.</span>
            </div>
          </div>
        </article>

        <article className="pe-section-card">
          <header className="pe-section-head"><Globe2 /><div><h3>Location &amp; links</h3><p>Helps the right people find you</p></div></header>
          <div className="pe-section-body">
            <div className="input-group"><label className="input-label">Country</label><input className="input" type="text" maxLength={80} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Tunisia" /></div>
            <div className="input-group"><label className="input-label">Website</label><input className="input" type="url" maxLength={200} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" /></div>
            <div className="input-group"><label className="input-label">Phone (optional)</label><input className="input" type="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+216 …" /></div>
          </div>
        </article>

        <article className="pe-section-card">
          <header className="pe-section-head"><ShieldCheck /><div><h3>Account</h3><p>Read-only — contact support to change</p></div></header>
          <div className="pe-section-body">
            <div className="input-group"><label className="input-label">Email</label><input className="input" value={email} disabled /></div>
          </div>
        </article>
      </div>

      <div className="pe-sticky-bar">
        <a className="btn btn-ghost" href="#/profile">Cancel</a>
        <button className="btn btn-primary" disabled={saving} onClick={save}><Save /> {saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </div>
  );
}
