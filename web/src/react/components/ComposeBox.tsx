import React from 'react';
import { Image as ImageIcon, MapPin, Smile } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Avatar } from './Avatar';

interface Props {
  user: { fullName?: string; avatar?: string | null } | null;
}

export function ComposeBox({ user }: Props) {
  const open = () => document.dispatchEvent(new CustomEvent('etunisia:open-post-modal'));
  const openPhotos = () => {
    document.dispatchEvent(new CustomEvent('etunisia:open-post-modal', { detail: { focusPhotos: true } }));
  };
  const firstName = (user?.fullName || 'there').split(' ')[0];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar || undefined} fallback={user?.fullName} size="md" />
          <button
            onClick={open}
            className="flex-1 text-left px-4 py-2.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.10] text-muted-foreground transition-colors text-sm sm:text-base"
          >
            What's on your mind, <span className="font-medium text-foreground">{firstName}</span>?
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 grid grid-cols-3 gap-1">
          <button
            onClick={openPhotos}
            className="flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium text-muted-foreground"
          >
            <ImageIcon size={18} className="text-green-500" />
            <span className="hidden sm:inline">Photo</span>
          </button>
          <button
            onClick={open}
            className="flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium text-muted-foreground"
          >
            <MapPin size={18} className="text-rose-500" />
            <span className="hidden sm:inline">Check in</span>
          </button>
          <button
            onClick={open}
            className="flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium text-muted-foreground"
          >
            <Smile size={18} className="text-yellow-500" />
            <span className="hidden sm:inline">Feeling</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
