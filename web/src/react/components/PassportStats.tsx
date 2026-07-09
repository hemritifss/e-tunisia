import React from 'react';
import { Map, Compass, Star, Bookmark } from 'lucide-react';

interface Props {
    citiesVisited: number;
    tripsPlanned: number;
    reviewsCount: number;
    savesCount: number;
}

export function PassportStats(p: Props) {
    return (
        <div className="passport-stats">
            <div className="passport-stat"><Map size={18} /><div><strong>{p.citiesVisited}</strong><span>Cities</span></div></div>
            <div className="passport-stat"><Compass size={18} /><div><strong>{p.tripsPlanned}</strong><span>Trips</span></div></div>
            <div className="passport-stat"><Star size={18} /><div><strong>{p.reviewsCount}</strong><span>Reviews</span></div></div>
            <div className="passport-stat"><Bookmark size={18} /><div><strong>{p.savesCount}</strong><span>Saves</span></div></div>
        </div>
    );
}
