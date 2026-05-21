import React from 'react';
import { Image as ImageIcon, MapPin, Smile, Sparkles } from 'lucide-react';
import { Avatar } from './Avatar';

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
  const open = (detail?: any) =>
    document.dispatchEvent(new CustomEvent('etunisia:open-post-modal', { detail }));
  const firstName = (user?.fullName || 'there').split(' ')[0];

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
          <span>What's on your mind, </span>
          <strong>{firstName}</strong>
          <span>?</span>
          <Sparkles size={14} className="compose-v2-sparkle" />
        </button>
      </div>

      <div className="compose-v2-actions">
        <button
          className="compose-v2-chip compose-v2-chip-photo"
          onClick={() => open({ focusPhotos: true })}
        >
          <ImageIcon size={16} />
          <span>Photo</span>
        </button>
        <button
          className="compose-v2-chip compose-v2-chip-location"
          onClick={() => open({ focusLocation: true })}
        >
          <MapPin size={16} />
          <span>Check in</span>
        </button>
        <button
          className="compose-v2-chip compose-v2-chip-mood"
          onClick={() => open({ focusFeeling: true })}
        >
          <Smile size={16} />
          <span>Feeling</span>
        </button>
      </div>
    </section>
  );
}
