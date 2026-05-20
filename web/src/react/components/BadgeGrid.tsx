import React from 'react';
import { BADGES, BADGE_DISPLAY_ORDER, BadgeDisplay } from './badge-definitions';
import { Lock } from 'lucide-react';

interface Props { earned: string[]; }

export function BadgeGrid({ earned }: Props) {
    const earnedSet = new Set(earned || []);
    return (
        <div className="passport-badges">
            {BADGE_DISPLAY_ORDER.map((id) => {
                const b: BadgeDisplay = BADGES[id];
                const isEarned = earnedSet.has(id);
                return (
                    <div
                        key={id}
                        className={`passport-badge ${isEarned ? 'earned' : 'locked'}`}
                        style={isEarned ? ({ '--badge-accent': b.accent } as React.CSSProperties) : undefined}
                        title={`${b.label} — ${b.description}`}
                    >
                        <div className="passport-badge-icon">
                            {isEarned ? <span>{b.emoji}</span> : <Lock size={18} />}
                        </div>
                        <div className="passport-badge-label">{b.label}</div>
                    </div>
                );
            })}
        </div>
    );
}
