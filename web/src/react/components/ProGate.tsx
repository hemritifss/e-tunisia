import React from 'react';
import { useUserPlan } from '../hooks/useUserPlan';
import { Sparkles } from 'lucide-react';

interface Props {
    /** Feature key — controls the upgrade copy. */
    feature: 'unlimited-trips' | 'unlimited-saves' | 'passport-themes' | 'passport-analytics' | 'boost' | 'multi-lang' | 'owner-dashboard';
    /** What to render when the user already has access. */
    children: React.ReactNode;
    /** Optional override copy. */
    title?: string;
    /** Optional override description. */
    description?: string;
    /** Render mode: 'card' (full card) or 'inline' (small pill). Default: 'card'. */
    mode?: 'card' | 'inline';
    /** If 'tease', show the children behind a glass overlay so users see what they'd unlock. */
    tease?: boolean;
}

const COPY: Record<Props['feature'], { title: string; sub: string }> = {
    'unlimited-trips':     { title: 'Plan unlimited trips with Pro',         sub: 'Free is capped at 3 saved trip plans. Pro removes the cap.' },
    'unlimited-saves':     { title: 'Save unlimited places with Pro',        sub: "You've hit the 20-save cap. Pro travelers don't have one." },
    'passport-themes':     { title: 'Make your passport yours · Pro',        sub: 'Choose between Sahara, Mediterranean, or Medina themes.' },
    'passport-analytics':  { title: 'See who visited your passport · Pro',   sub: 'Weekly viewers, referring source, top visitor cities.' },
    'boost':               { title: 'Boost this listing · Verified Business', sub: 'Featured placement across mood pages and search for 7 days.' },
    'multi-lang':          { title: 'Reach travelers in 3 languages · Business', sub: 'Edit your listing in English, French, and Arabic.' },
    'owner-dashboard':     { title: 'Owner dashboard · Verified Business',   sub: 'Inquiry queue, response-time SLA, conversion analytics.' },
};

const featureToCap: Record<Props['feature'], keyof ReturnType<typeof useUserPlan>['caps']> = {
    'unlimited-trips': 'maxTrips',
    'unlimited-saves': 'maxSaves',
    'passport-themes': 'customThemes',
    'passport-analytics': 'passportAnalytics',
    'boost': 'canBoost',
    'multi-lang': 'multiLangListings',
    'owner-dashboard': 'ownerDashboard',
};

export function ProGate({ feature, children, title, description, mode = 'card', tease = false }: Props) {
    const { caps } = useUserPlan();
    const capKey = featureToCap[feature];
    const v = (caps as any)[capKey];
    // Unlimited (null) or truthy => user has access
    const hasAccess = v === null || v === true;
    if (hasAccess) return <>{children}</>;

    const copy = COPY[feature];
    const headline = title || copy.title;
    const subtitle = description || copy.sub;
    const isBusinessFeature = feature === 'boost' || feature === 'multi-lang' || feature === 'owner-dashboard';

    if (mode === 'inline') {
        return (
            <a className={`pro-gate-pill ${isBusinessFeature ? 'is-business' : 'is-pro'}`} href="#/premium" title={headline}>
                <Sparkles size={12} /> {isBusinessFeature ? 'Verified Business' : 'Pro'}
            </a>
        );
    }

    if (tease) {
        return (
            <div className={`pro-gate-tease ${isBusinessFeature ? 'is-business' : 'is-pro'}`}>
                <div className="pro-gate-tease-inner" aria-hidden>{children}</div>
                <a className="pro-gate-tease-overlay" href="#/premium">
                    <div className="pro-gate-tease-emoji">{isBusinessFeature ? '✓' : '✦'}</div>
                    <strong>{headline}</strong>
                    <p>{subtitle}</p>
                    <span className="btn primary sm">{isBusinessFeature ? 'Upgrade to Business →' : 'Try Pro →'}</span>
                </a>
            </div>
        );
    }

    return (
        <a className={`pro-gate-card ${isBusinessFeature ? 'is-business' : 'is-pro'}`} href="#/premium">
            <div className="pro-gate-card-icon">
                <Sparkles size={20} />
            </div>
            <div className="pro-gate-card-body">
                <strong>{headline}</strong>
                <span>{subtitle}</span>
            </div>
            <span className="pro-gate-card-cta">{isBusinessFeature ? 'Upgrade →' : 'Try Pro →'}</span>
        </a>
    );
}
