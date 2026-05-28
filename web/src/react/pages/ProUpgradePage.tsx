import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Check, Crown, Briefcase, Loader2, CreditCard, Landmark, Banknote, PartyPopper, Settings, Wallet } from 'lucide-react';
import { useUserPlan } from '../hooks/useUserPlan';
import { api } from '../../shared/api';
import { goTo, currentRoute } from '../../router';

type Tier = 'free' | 'premium' | 'business';
type Cycle = 'monthly' | 'yearly';
type PayMethod = 'card' | 'flouci' | 'bank' | 'cash';

const showToast = (opts: any) => (window as any).showToast?.(opts);

const ICONS: Record<string, React.ReactNode> = {
    free: <Sparkles size={20} />,
    premium: <Crown size={20} />,
    business: <Briefcase size={20} />,
};

interface CatalogPlan {
    id: Tier;
    name: string;
    tagline: string;
    tint: string;
    monthly: number;
    yearly: number;
    features: string[];
    ctaLabel: string;
    featured?: boolean;
}
interface Catalog { currency: string; plans: CatalogPlan[]; }

// Mirrors backend plan-catalog.ts so the page still renders if /billing/plans is unreachable.
const FALLBACK: Catalog = {
    currency: 'TND',
    plans: [
        {
            id: 'free', name: 'Free', tagline: 'Everything you need to start exploring', tint: 'var(--text-secondary)',
            monthly: 0, yearly: 0, ctaLabel: 'Current plan',
            features: ['Browse every place & hidden gem', 'Read & write reviews', 'Up to 3 saved trip plans', 'Up to 20 saved places', 'Mood discovery, leaderboards & activity feed'],
        },
        {
            id: 'premium', name: 'Pro Traveler', tagline: 'For active explorers & creators', tint: 'var(--gold)',
            monthly: 14.9, yearly: 149, ctaLabel: 'Upgrade to Pro', featured: true,
            features: ['Everything in Free', 'Unlimited trip plans & saves', 'Gold Pro badge across the app', 'Custom passport themes', 'Passport analytics — who viewed you', 'Priority in suggestion feeds', 'Ad-free experience & early event access'],
        },
        {
            id: 'business', name: 'Verified Business', tagline: 'For riads, restaurants, tours & agencies', tint: 'var(--violet)',
            monthly: 74.9, yearly: 749, ctaLabel: 'Go Business',
            features: ['Everything in Pro', 'Verified business badge', 'Owner dashboard & inquiry analytics', 'Boost listings into featured slots', 'Multi-language listings (FR / AR / EN)', 'Reply to reviews as the business', 'Priority partner support'],
        },
    ],
};

function fmtPrice(n: number, currency: string): string {
    if (!n) return 'Free';
    const hasFraction = Math.round(n * 100) % 100 !== 0;
    return `${n.toLocaleString(undefined, { minimumFractionDigits: hasFraction ? 2 : 0, maximumFractionDigits: 2 })} ${currency}`;
}

const METHODS: { id: PayMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'card', label: 'Card', icon: <CreditCard size={14} /> },
    { id: 'flouci', label: 'Flouci', icon: <Wallet size={14} /> },
    { id: 'bank', label: 'Bank transfer', icon: <Landmark size={14} /> },
    { id: 'cash', label: 'Cash (office)', icon: <Banknote size={14} /> },
];

export default function ProUpgradePage() {
    const { plan, offline, refetch } = useUserPlan() as any;
    const [cycle, setCycle] = useState<Cycle>('yearly');
    const [method, setMethod] = useState<PayMethod>('card');
    const [busy, setBusy] = useState<Tier | 'manage' | null>(null);

    const isAnon = typeof window !== 'undefined' && !localStorage.getItem('etunisia_token');
    const isWelcome = typeof window !== 'undefined' && currentRoute().includes('/premium/welcome');

    const { data: catalog } = useQuery<Catalog>({
        queryKey: ['plan-catalog'],
        queryFn: async () => {
            try { return (await api.getPlans()) as Catalog; } catch { return FALLBACK; }
        },
        staleTime: 30 * 60_000,
        initialData: FALLBACK,
    });
    const currency = catalog?.currency || 'TND';
    const plans = catalog?.plans || FALLBACK.plans;

    // On the welcome screen, make sure the plan badge reflects the just-completed purchase.
    useEffect(() => {
        if (isWelcome) {
            refetch();
            showToast({ title: 'Welcome aboard', message: 'Your plan is active. Enjoy the upgrades.', type: 'achievement' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWelcome]);

    const activate = async (tier: Tier) => {
        if (tier === 'free' || busy || isAnon) return;
        if (offline) {
            showToast({ title: 'Billing offline', message: "The billing service isn't running. Restart the backend (cd backend && npm run start:dev) and try again.", type: 'error', duration: 7000 });
            return;
        }
        setBusy(tier);
        try {
            if (method === 'card' || method === 'flouci') {
                const res: any = method === 'card'
                    ? await api.startCheckout(tier, cycle)
                    : await api.startFlouciCheckout(tier, cycle);
                if (res?.mock) {
                    // No keys configured — backend already flipped the plan. Celebrate + go to welcome.
                    refetch();
                    goTo(`/premium/welcome?plan=${tier}`);
                } else if (res?.url) {
                    window.location.href = res.url; // Stripe / Flouci hosted checkout
                } else {
                    throw new Error('Checkout did not return a URL.');
                }
            } else {
                await api.manualUpgrade(tier, cycle, method as 'bank' | 'cash');
                showToast({
                    title: 'Payment instructions sent',
                    message: method === 'bank'
                        ? "We've logged your bank-transfer request — your plan activates once we confirm the transfer."
                        : "We've logged your cash request — pay at the office and your plan activates on confirmation.",
                    type: 'info',
                    duration: 7000,
                });
            }
        } catch (err: any) {
            const status = err?.status;
            const msg = status === 404
                ? 'Billing service offline. Restart the backend (Ctrl+C → npm run start:dev) and try again.'
                : (err?.message || 'Upgrade failed — please try again.');
            showToast({ message: msg, type: 'error', duration: status === 404 ? 7000 : 4200 });
        } finally {
            setBusy(null);
        }
    };

    const cancel = async () => {
        setBusy('free');
        try {
            await api.cancelPlan();
            showToast({ message: "Subscription cancelled. You're back on Free.", type: 'info' });
            refetch();
        } catch (err: any) {
            showToast({ message: err?.message || 'Cancel failed — please try again.', type: 'error' });
        } finally {
            setBusy(null);
        }
    };

    const manageBilling = async () => {
        setBusy('manage');
        try {
            const res: any = await api.openBillingPortal();
            if (res?.url) window.location.href = res.url;
        } catch (err: any) {
            showToast({ message: err?.message || 'Billing portal is unavailable in mock mode.', type: 'info' });
        } finally {
            setBusy(null);
        }
    };

    // ─── Post-checkout celebration ───────────────────────────────────────────────
    if (isWelcome) {
        const current = plans.find((p) => p.id === plan) || plans.find((p) => p.id === 'premium')!;
        return (
            <main className="pro-page">
                <section className="pro-page-hero">
                    <div className="pro-page-hero-bg" />
                    <span className="pro-page-kicker"><PartyPopper size={12} /> You're in</span>
                    <h1>Welcome to {current.name}.</h1>
                    <p>Your plan is active. Your new perks are live across the app — the badge, the lifted caps, all of it.</p>
                    <div className="pro-page-cycle" style={{ marginTop: 'var(--space-4)' }}>
                        <a className="btn primary" href="#/">Back to feed</a>
                        {plan !== 'free' && (
                            <button onClick={manageBilling} disabled={busy === 'manage'}>
                                {busy === 'manage' ? <><Loader2 size={14} className="spin" /> Opening…</> : <><Settings size={14} /> Manage billing</>}
                            </button>
                        )}
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="pro-page">
            {offline && (
                <div className="pro-offline-banner">
                    <strong>Billing service offline</strong>
                    <span>
                        Routes are compiled but your running backend predates them. Restart
                        with <code>cd backend &amp;&amp; npm run start:dev</code> — this banner
                        will disappear and activate buttons will work.
                    </span>
                    <button onClick={() => refetch()}>Recheck</button>
                </div>
            )}
            <section className="pro-page-hero">
                <div className="pro-page-hero-bg" />
                <span className="pro-page-kicker"><Sparkles size={12} /> Membership</span>
                <h1>Travel deeper. Build louder.</h1>
                <p>One subscription. Two tiers. Both unlock more of Tunisia than free ever will.</p>
                <div className="pro-page-cycle" role="tablist" aria-label="Billing cycle">
                    {(['monthly', 'yearly'] as Cycle[]).map((c) => (
                        <button
                            key={c}
                            role="tab"
                            aria-selected={cycle === c}
                            className={cycle === c ? 'active' : ''}
                            onClick={() => setCycle(c)}
                        >
                            {c === 'monthly' ? 'Monthly' : 'Yearly · save ~17%'}
                        </button>
                    ))}
                </div>
                <div className="pro-page-cycle" role="radiogroup" aria-label="Payment method" style={{ marginTop: 'var(--space-2)' }}>
                    {METHODS.map((m) => (
                        <button
                            key={m.id}
                            role="radio"
                            aria-checked={method === m.id}
                            className={method === m.id ? 'active' : ''}
                            onClick={() => setMethod(m.id)}
                        >
                            {m.icon} {m.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="pro-page-grid">
                {plans.map((p) => {
                    const isCurrent = plan === p.id;
                    const amount = cycle === 'yearly' ? p.yearly : p.monthly;
                    const priceLabel = p.id === 'free' ? 'Free' : `${fmtPrice(amount, currency)} / ${cycle === 'yearly' ? 'yr' : 'mo'}`;
                    return (
                        <article
                            key={p.id}
                            className={`pro-plan-card pro-plan-${p.id} ${isCurrent ? 'is-current' : ''}`}
                            style={{ '--plan-accent': p.tint } as React.CSSProperties}
                        >
                            {p.featured && <span className="pro-plan-hint">Most popular</span>}
                            <header>
                                <span className="pro-plan-icon">{ICONS[p.id]}</span>
                                <strong>{p.name}</strong>
                            </header>
                            <p className="pro-plan-tagline">{p.tagline}</p>
                            <div className="pro-plan-price">
                                <span>{priceLabel}</span>
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
                                        <div className="pro-plan-current-actions">
                                            <button className="btn ghost block" onClick={manageBilling} disabled={busy === 'manage'}>
                                                {busy === 'manage' ? <><Loader2 size={14} className="spin" /> Opening…</> : <><Settings size={14} /> Manage billing</>}
                                            </button>
                                            <button className="btn ghost block" onClick={cancel} disabled={busy === 'free'}>
                                                {busy === 'free' ? <><Loader2 size={14} className="spin" /> Cancelling…</> : 'Cancel subscription'}
                                            </button>
                                        </div>
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
                                        {busy === p.id
                                            ? <><Loader2 size={14} className="spin" /> {method === 'card' || method === 'flouci' ? 'Redirecting…' : 'Submitting…'}</>
                                            : method === 'card' || method === 'flouci' ? `${p.ctaLabel} →` : `${p.ctaLabel} · pay by ${method}`}
                                    </button>
                                )}
                            </footer>
                        </article>
                    );
                })}
            </section>

            <section className="pro-page-fineprint">
                <p>
                    Prices shown in {currency}. Card payments are processed securely by Stripe.
                    Bank transfer & cash are confirmed manually by our team — your plan activates
                    once payment clears. Cancel anytime; your subscription stays active until the
                    end of the period.
                </p>
            </section>
        </main>
    );
}
