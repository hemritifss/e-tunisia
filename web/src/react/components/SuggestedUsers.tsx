import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserCheck } from 'lucide-react';
import { api } from '../../shared/api';
import { useAuthStore } from '../stores/auth-store';

interface SuggestedUser {
  id: string;
  fullName: string;
  avatar: string | null;
  country: string | null;
  bio: string | null;
  level: number;
  points: number;
}

export function SuggestedUsers() {
  const queryClient = useQueryClient();
  const isAuth = useAuthStore((s) => !!s.token) || !!localStorage.getItem('etunisia_token');
  const me = useAuthStore((s) => s.user);
  const [followed, setFollowed] = React.useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['suggested-users'],
    queryFn: () =>
      fetch('/api/v1/users/suggest/list?limit=8', {
        headers: localStorage.getItem('etunisia_token')
          ? { Authorization: `Bearer ${localStorage.getItem('etunisia_token')}` }
          : {},
      }).then(r => r.json()).then(r => (r?.data || [])) as Promise<SuggestedUser[]>,
    staleTime: 5 * 60_000,
  });

  const followMut = useMutation({
    mutationFn: (userId: string) =>
      fetch(`/api/v1/social/follow/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('etunisia_token')}` },
      }).then(r => {
        if (!r.ok && r.status !== 409) throw new Error('Failed');
      }),
    onSuccess: (_d, userId) => {
      setFollowed(prev => new Set(prev).add(userId));
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const candidates = (data || []).filter(u => !me || u.id !== me.id).slice(0, 5);

  if (isLoading || candidates.length === 0) return null;

  return (
    <aside className="suggested-users-card">
      <header className="suggested-users-head">
        <h3>Who to follow</h3>
        <span className="text-xs text-muted-foreground">Tunisia's most active explorers</span>
      </header>
      <ul className="suggested-users-list">
        {candidates.map(u => {
          const avatar = u.avatar
            ? u.avatar
            : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(u.fullName)}`;
          const isFollowed = followed.has(u.id);
          return (
            <li key={u.id} className="suggested-user-row">
              <a className="suggested-user-link" href={`#/user/${u.id}`}>
                <img src={avatar} alt={u.fullName} />
                <div>
                  <strong>{u.fullName}</strong>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {u.bio || u.country || `Level ${u.level || 1} Explorer`}
                  </span>
                </div>
              </a>
              {isAuth ? (
                <button
                  className={`suggested-follow-btn ${isFollowed ? 'is-followed' : ''}`}
                  disabled={isFollowed || followMut.isPending}
                  onClick={() => followMut.mutate(u.id)}
                  aria-label={isFollowed ? 'Following' : 'Follow'}
                >
                  {isFollowed ? <UserCheck size={14} /> : <UserPlus size={14} />}
                  {isFollowed ? 'Following' : 'Follow'}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
