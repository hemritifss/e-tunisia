import React from 'react';
import { Image as ImageIcon, MapPin, Smile, Sparkles } from 'lucide-react';
import { Avatar } from './Avatar';
import { useT } from '../../i18n/useT';

interface Props {
  user: { fullName?: string; avatar?: string | null; handle?: string | null } | null;
}

/**
 * Top-of-feed composer. The single most-tapped action surface for logged-in
 * users on the home page — so it gets the premium treatment: gradient mesh
 * background, font-display placeholder, avatar with shadow-glow, three
 * tinted action chips. Each click dispatches the existing
 * 'etunisia:open-post-modal' event so the modal handles the actual form.
 */
export function ComposeBox({ user }: Props) {
  const t = useT();
  const open = (detail?: any) =>
    document.dispatchEvent(new CustomEvent('etunisia:open-post-modal', { detail }));
  // Only personalize when we actually know the name — "What's on your mind, there?"
  // with a bold fallback reads broken while the profile is still hydrating.
  const firstName = user?.fullName?.trim() ? user.fullName.trim().split(' ')[0] : null;

  return (
    <section className="compose-v2" aria-label="Create a post">
      <div className="compose-v2-row">
        <a
          className="compose-v2-avatar-link"
          href={user?.handle ? `#/u/${user.handle}` : '#/profile'}
          title="Your travel profile"
        >
          <Avatar src={user?.avatar || undefined} fallback={user?.fullName} size="md" />
        </a>
        <button className="compose-v2-trigger" onClick={() => open()}>
          {firstName ? (
            <>
              <span>{t('compose.prompt')}, </span>
              <strong>{firstName}</strong>
              <span>?</span>
            </>
          ) : (
            <span>{t('compose.prompt')}?</span>
          )}
          <Sparkles size={14} className="compose-v2-sparkle" />
        </button>
      </div>

      <div className="compose-v2-actions">
        <button
          className="compose-v2-chip compose-v2-chip-photo"
          onClick={() => open({ focusPhotos: true })}
        >
          <ImageIcon size={16} />
          <span>{t('compose.photo')}</span>
        </button>
        <button
          className="compose-v2-chip compose-v2-chip-location"
          onClick={() => open({ focusLocation: true })}
        >
          <MapPin size={16} />
          <span>{t('compose.checkin')}</span>
        </button>
        <button
          className="compose-v2-chip compose-v2-chip-mood"
          onClick={() => open({ focusFeeling: true })}
        >
          <Smile size={16} />
          <span>{t('compose.feeling')}</span>
        </button>
      </div>
    </section>
  );
}
