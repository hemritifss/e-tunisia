import React from 'react';
import { BADGES, BADGE_DISPLAY_ORDER, BadgeDisplay } from './badge-definitions';
import {
    Lock,
    Star,
    Footprints,
    Compass,
    Bookmark,
    Landmark,
    Sun,
    Waves,
    Award,
    type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
    star: Star,
    footprints: Footprints,
    compass: Compass,
    bookmark: Bookmark,
    landmark: Landmark,
    sun: Sun,
    waves: Waves,
};

function iconFor(name: string | undefined): LucideIcon {
    if (!name) return Award;
    return ICON_MAP[name] || Award;
}

interface Props { earned: string[]; }

export function BadgeGrid({ earned }: Props) {
    const earnedSet = new Set(earned || []);
    return (
        <div className="passport-badges">
            {BADGE_DISPLAY_ORDER.map((id) => {
                const b: BadgeDisplay = BADGES[id];
                const isEarned = earnedSet.has(id);
                const Icon = iconFor(b.icon);
                return (
                    <div
                        key={id}
                        className={`passport-badge ${isEarned ? 'is-earned' : 'is-locked'}`}
                        style={{ '--badge-tint': b.tint } as React.CSSProperties}
                        title={`${b.label} — ${b.description}`}
                        aria-label={`${b.label} — ${isEarned ? 'earned' : 'locked'}`}
                    >
                        <div className="passport-badge-icon">
                            {isEarned ? <Icon size={22} strokeWidth={1.75} /> : <Lock size={18} />}
                        </div>
                        <div className="passport-badge-label">{b.label}</div>
                    </div>
                );
            })}
        </div>
    );
}
