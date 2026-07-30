import React from 'react';
import { Image as ImageIcon, MapPin, Smile } from 'lucide-react';
import { Avatar } from './Avatar';
import { useT } from '../../i18n/useT';

interface Props {
  user: { fullName?: string; avatar?: string | null; handle?: string | null } | null;
}

/**
 * Top-of-feed composer, collapsed to a single rule. It is a launcher, not a
 * form: every control dispatches the existing 'etunisia:open-post-modal' event
 * and the modal handles the actual composition.
 */
export function ComposeBox({ user }: Props) {
  const t = useT();
  const open = (detail?: any) =>
    document.dispatchEvent(new CustomEvent('etunisia:open-post-modal', { detail }));

  return (
    <section className="compose-line" aria-label="Create a post">
      <button type="button" className="compose-line-trigger" onClick={() => open()}>
        <Avatar src={user?.avatar || undefined} fallback={user?.fullName} size="sm" />
        <span>{t('compose.prompt')}?</span>
      </button>
      <div className="compose-line-icons">
        <button
          type="button"
          className="compose-line-icon"
          onClick={() => open({ focusPhotos: true })}
          title={t('compose.photo')}
          aria-label={t('compose.photo')}
        >
          <ImageIcon size={18} />
        </button>
        <button
          type="button"
          className="compose-line-icon"
          onClick={() => open({ focusLocation: true })}
          title={t('compose.checkin')}
          aria-label={t('compose.checkin')}
        >
          <MapPin size={18} />
        </button>
        <button
          type="button"
          className="compose-line-icon"
          onClick={() => open({ focusFeeling: true })}
          title={t('compose.feeling')}
          aria-label={t('compose.feeling')}
        >
          <Smile size={18} />
        </button>
      </div>
    </section>
  );
}
