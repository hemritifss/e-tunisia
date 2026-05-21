import React, { useState } from 'react';
import { Sparkles, Check, Crown, Briefcase, Loader2 } from 'lucide-react';
import { useUserPlan } from '../hooks/useUserPlan';
import { api } from '../../shared/api';

type Tier = 'free' | 'premium' | 'business';
type Cycle = 'monthly' | 'yearly' | 'lifetime';

const showToast = (opts: any) => (window as any).showToast?.(opts);

interface PlanCard {
    id: Tier;
    label: string;
    tagline: string;
    accent: string;          // CSS var for the accent color
    icon: React.ReactNode;
    monthly: string;
    yearly: string;
    lifetime?: string;
    features: string[];
    hint?: string;
}

const PLANS: PlanCard[] = [
    {
        id: 'free',
        label: 'Free',
        tagline: 'Everything you need to start exploring.',
        accent: 'var(--text-tertiary)',
        icon: <Sparkles size={20} />,
        monthly: '0 TND',
        yearly: '0 TND',
        features: [
            'Public Tunisia Passport at /u/your-handle',
            'Plan up to 3 trips',
            'Save up to 20 places',
            'Follow other travelers',
            'Endorse + be endorsed',
        ],
    },
    {
        id: 'premium',
        label: 'Pro Traveler',
        tagline: 'For people who actually want to go.',
        accent: 'var(--gold)',
        icon: <Crown size={20} />,
        monthly: '9 TND / mo',
        yearly: '79 TND / yr',
        lifetime: '299 TND once',
        features: [
            'Everything in Free',
            'Unlimited trip plans',
            'Unlimited saved places',
            'Custom passport themes',
            'Passport analytics — who viewed you',
            '✦ Pro badge on every surface',
            'Priority in suggestion feeds',
        ],
        hint: 'Most popular',
    },
    {
        id: 'business',
        label: 'Business',
        tagline: 'For Tunisian hosts, hotels, and tour operators.',
        accent: 'var(--mediterranean)',
        icon: <Briefcase size={20} />,
        monthly: '49 TND / mo',
        yearly: '459 TND / yr',
        features: [
            'Everything in Pro',
            'Verified business badge ✓',
            'Owner dashboard with analytics',
            'Boost listings to the top of Explore',
            'Multi-language listings',
            'Response-time reputation metric',
            'Priority inquiry routing',
        ],
    },
];

export default function ProUpgradePage() {
    const { plan, refetch } = useUserPlan();
    const [cycle, setCycle] = useState<Cycle>('yearly');
    const [busy, setBusy] = useState<Tier | null>(null);

    const isAnon = typeof window !== 'undefined' && !localStorage.getItem('auth_token');

    const activate = async (tier: Tier) => {
        if (tier === 'free' || busy || isAnon) return;
        setBusy(tier);
        try {
            await (api as any).upgradePlanTo(tier, cycle);
            showToast({
                title: tier === 'premium' ? 'Pro unlocked' : 'Business activated',
                message: tier === 'premium'
                    ? 'Your passport gets the ✦ Pro badge. Caps lifted. Enjoy.'
                    : 'Your business surfaces will start showing the ✓ Verified chip.',
                type: 'achievement',
            });
            refetch();
        } catch (err: any) {
            showToast({ message: err?.message || 'Upgrade failed — please try again.', type: 'error' });
        } finally {
            setBusy(null);
        }
    };

    const cancel = async () => {
        setBusy('free');
        try {
            await (api as any).cancelPlan();
            showToast({ message: "Subscription cancelled. You're back on Free.", type: 'info' });
            refetch();
        } catch (err: any) {
            showToast({ message: err?.message || 'Cancel failed — please try again.', type: 'error' });
        } finally {
            setBusy(null);
        }
    };

    return (
        <main className="pro-page">
            <section className="pro-page-hero">
                <div className="pro-page-hero-bg" />
                <span className="pro-page-kicker"><Sparkles size={12} /> Membership</span>
                <h1>Travel deeper. Build louder.</h1>
                <p>One subscription. Two tiers. Both unlock more of Tunisia than free ever will.</p>
                <div className="pro-page-cycle" role="tablist" aria-label="Billing cycle">
                    {(['monthly', 'yearly', 'lifetime'] as Cycle[]).map((c) => (
                        <button
                            key={c}
                            role="tab"
                            aria-selected={cycle === c}
                            className={cycle === c ? 'active' : ''}
                            onClick={() => setCycle(c)}
                        >
                            {c === 'monthly' ? 'Monthly' : c === 'yearly' ? 'Yearly · save 30%' : 'Lifetime'}
                        </button>
                    ))}
                </div>
            </section>

            <section className="pro-page-grid">
                {PLANS.map((p) => {
                    const isCurrent = plan === p.id;
                    const price = cycle === 'lifetime'
                        ? (p.lifetime || p.yearly)
                        : cycle === 'yearly' ? p.yearly : p.monthly;
                    return (
                        <article
                            key={p.id}
                            className={`pro-plan-card pro-plan-${p.id} ${isCurrent ? 'is-current' : ''}`}
                            style={{ '--plan-accent': p.accent } as React.CSSProperties}
                        >
                            {p.hint && <span className="pro-plan-hint">{p.hint}</span>}
                            <header>
                                <span className="pro-plan-icon">{p.icon}</span>
                                <strong>{p.label}</strong>
                            </header>
                            <p className="pro-plan-tagline">{p.tagline}</p>
                            <div className="pro-plan-price">
                                <span>{price}</span>
                                {cycle === 'lifetime' && p.id !== 'free' && <em>one-time payment</em>}
                            </div>
                            <ul className="pro-plan-features">
                                {p.features.map((f) => (
                                    <li key={f}><Check size={14} /> <span>{f}</span></li>
                                ))}
                            </ul>
                            <footer>
                                {isCurrent ? (
                                    p.id === 'free' ? (
                                        <button className="btn ghost block" disabled>Current plan</button>
                                    ) : (
                                        <button className="btn ghost block" onClick={cancel} disabled={busy === 'free'}>
                                            {busy === 'free' ? <><Loader2 size={14} className="spin" /> Cancelling…</> : 'Cancel subscription'}
                                        </button>
                                    )
                                ) : p.id === 'free' ? (
                                    <button className="btn ghost block" disabled>Default</button>
                                ) : isAnon ? (
                                    <a className="btn primary block" href="#/register">Sign in to upgrade →</a>
                                ) : (
                                    <button
                                        className="btn primary block"
                                        onClick={() => activate(p.id)}
                                        disabled={busy === p.id}
                                    >
                                        {busy === p.id ? <><Loader2 size={14} className="spin" /> Activating…</> : `Get ${p.label}`}
                                    </button>
                                )}
                            </footer>
                        </article>
                    );
                })}
            </section>

            <section className="pro-page-fineprint">
                <p>
                    Pricing is in TND. Cancel anytime — your subscription stays active until the
                    end of the period. No refunds for partial months, sorry.
                </p>
            </section>
        </main>
    );
}
