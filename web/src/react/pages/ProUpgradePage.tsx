import React, { useEffect, useState } from 'react';
import {
    Sparkles, Check, Crown, Briefcase, Loader2, CreditCard, Landmark, Banknote,
    PartyPopper, Settings, Wallet, Coins, ChevronDown, ShieldCheck,
    Compass, BookMarked, Share2, BadgeCheck, TrendingUp, MessagesSquare,
    BarChart3, LayoutList, LifeBuoy, Users, Webhook, Zap,
} from 'lucide-react';
import { useUserPlan } from '../hooks/useUserPlan';
import { api } from '../../shared/api';
import { isLoggedIn } from '../../api';
import PublicMasthead from '../components/public/PublicMasthead';
import PublicFooter from '../components/public/PublicFooter';
import { goTo, currentRoute } from '../../router';
import { openTopupModal } from '../../topup-modal';
import { Tier, Cycle, fmtPrice, usePlanCatalog, planFeatureCount, CatalogPlan } from '../lib/plan-catalog';

type PayMethod = 'card' | 'flouci' | 'credits' | 'bank' | 'cash';

const showToast = (opts: any) => (window as any).showToast?.(opts);

const ICONS: Record<string, React.ReactNode> = {
    free: <Compass size={20} />,
    premium: <Crown size={20} />,
    business: <Briefcase size={20} />,
};

// Catalog stores icon *names* (so the data stays serializable); map them to glyphs here.
const GLYPHS: Record<string, React.ComponentType<{ size?: number }>> = {
    Compass, Sparkles, BookMarked, Share2, BadgeCheck, TrendingUp,
    MessagesSquare, BarChart3, LayoutList, LifeBuoy, Users, Webhook,
};
const Glyph = ({ name, size = 15 }: { name: string; size?: number }) => {
    const C = GLYPHS[name] || Sparkles;
    return <C size={size} />;
};

const METHODS: { id: PayMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'card', label: 'Card', icon: <CreditCard size={14} /> },
    { id: 'flouci', label: 'Flouci', icon: <Wallet size={14} /> },
    { id: 'credits', label: 'Credits', icon: <Coins size={14} /> },
    { id: 'bank', label: 'Bank transfer', icon: <Landmark size={14} /> },
    { id: 'cash', label: 'Cash (office)', icon: <Banknote size={14} /> },
];

// ─── One plan card (module-scoped so its expand state survives parent re-renders) ──
interface PlanCardProps {
    p: CatalogPlan;
    currentPlan: string;
    cycle: Cycle;
    method: PayMethod;
    busy: Tier | 'manage' | null;
    isAnon: boolean;
    currency: string;
    onActivate: (t: Tier) => void;
    onCancel: () => void;
    onManage: () => void;
}

function PlanCard({ p, currentPlan, cycle, method, busy, isAnon, currency, onActivate, onCancel, onManage }: PlanCardProps) {
    const [open, setOpen] = useState(false);
    const isCurrent = currentPlan === p.id;
    const amount = cycle === 'yearly' ? p.yearly : p.monthly;
    const total = planFeatureCount(p);
    const priceLabel = p.id === 'free' ? 'Free' : fmtPrice(amount, currency);
    const perLabel = p.id === 'free' ? 'forever' : cycle === 'yearly' ? 'per year' : 'per month';
    const monthlyEquiv = p.id !== 'free' && cycle === 'yearly' && p.yearly ? p.yearly / 12 : null;

    const cta = isCurrent ? (
        p.id === 'free' ? (
            <button className="btn ghost block" disabled>Current plan</button>
        ) : (
            <div className="pro-plan-current-actions">
                <button className="btn ghost block" onClick={onManage} disabled={busy === 'manage'}>
                    {busy === 'manage' ? <><Loader2 size={14} className="spin" /> Opening…</> : <><Settings size={14} /> Manage billing</>}
                </button>
                <button className="btn ghost block" onClick={onCancel} disabled={busy === 'free'}>
                    {busy === 'free' ? <><Loader2 size={14} className="spin" /> Cancelling…</> : 'Cancel subscription'}
                </button>
            </div>
        )
    ) : p.id === 'free' ? (
        <button className="btn ghost block" disabled>Default plan</button>
    ) : isAnon ? (
        <a className="btn primary block" href="#/register">Sign in to upgrade →</a>
    ) : (
        <button className="btn primary block" onClick={() => onActivate(p.id)} disabled={busy === p.id}>
            {busy === p.id
                ? <><Loader2 size={14} className="spin" /> {method === 'card' || method === 'flouci' ? 'Redirecting…' : method === 'credits' ? 'Paying…' : 'Submitting…'}</>
                : method === 'card' || method === 'flouci' ? `${p.ctaLabel} →` : method === 'credits' ? `${p.ctaLabel} · pay with credits` : `${p.ctaLabel} · pay by ${method}`}
        </button>
    );

    return (
        <article
            className={`pro-plan-card pro-plan-${p.id} ${isCurrent ? 'is-current' : ''} ${p.featured ? 'is-featured' : ''}`}
            style={{ '--plan-accent': p.tint } as React.CSSProperties}
        >
            {p.featured && <span className="pro-plan-hint"><Sparkles size={11} /> Most popular</span>}
            <header>
                <span className="pro-plan-icon">{ICONS[p.id]}</span>
                <div>
                    <strong>{p.name}</strong>
                    <p className="pro-plan-tagline">{p.tagline}</p>
                </div>
            </header>

            <div className="pro-plan-price">
                <span className="pro-plan-amount">{priceLabel}</span>
                <em>{perLabel}{monthlyEquiv ? ` · ${fmtPrice(monthlyEquiv, currency)}/mo` : ''}</em>
            </div>

            {cta}

            <ul className="pro-plan-features">
                {p.features.map((f) => (
                    <li key={f}><span className="pro-check"><Check size={11} strokeWidth={3} /></span> <span>{f}</span></li>
                ))}
            </ul>

            {/* Advanced-control teaser chips (Business) — full showcase lives below the grid. */}
            {!!p.advancedControls?.length && (
                <div className="pro-plan-controls" aria-label="Advanced controls">
                    {p.advancedControls.map((c) => (
                        <span key={c.title} className="pro-control-chip"><Glyph name={c.icon} size={13} /> {c.title.replace(' control center', '')}</span>
                    ))}
                </div>
            )}

            {/* Expandable full feature set, grouped so a 50-item list stays readable. */}
            {!!p.featureGroups?.length && total > p.features.length && (
                <div className="pro-plan-more">
                    <button
                        type="button"
                        className={`pro-more-toggle ${open ? 'is-open' : ''}`}
                        aria-expanded={open}
                        onClick={() => setOpen((v) => !v)}
                    >
                        <ChevronDown size={15} />
                        {open ? 'Hide the full list' : `See all ${total} features`}
                    </button>
                    {open && (
                        <div className="pro-plan-groups">
                            {p.featureGroups!.map((g) => (
                                <div key={g.label} className="pro-fgroup">
                                    <h4><span className="pro-fgroup-icon"><Glyph name={g.icon} /></span> {g.label}</h4>
                                    <ul>
                                        {g.items.map((it) => (
                                            <li key={it}><span className="pro-check"><Check size={11} strokeWidth={3} /></span> <span>{it}</span></li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}

export default function ProUpgradePage() {
    const { plan, offline, refetch } = useUserPlan() as any;
    const [cycle, setCycle] = useState<Cycle>('yearly');
    const [method, setMethod] = useState<PayMethod>('card');
    const [busy, setBusy] = useState<Tier | 'manage' | null>(null);
    const [balance, setBalance] = useState<number | null>(null);

    const isAnon = typeof window !== 'undefined' && !localStorage.getItem('etunisia_token');
    const isWelcome = typeof window !== 'undefined' && currentRoute().includes('/premium/welcome');

    const { data: catalog } = usePlanCatalog();
    const currency = catalog?.currency || 'TND';
    const plans = catalog?.plans || [];
    const business = plans.find((p) => p.id === 'business');

    const loadBalance = () => {
        api.getMyCredits().then((c: any) => setBalance(Number(c?.balance) || 0)).catch(() => setBalance(null));
    };
    // Keep the wallet balance handy so the "Credits" method can pre-check affordability.
    useEffect(() => {
        if (!isAnon) loadBalance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAnon]);

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
            } else if (method === 'credits') {
                const entry = plans.find((p) => p.id === tier);
                const amount = entry ? (cycle === 'yearly' ? entry.yearly : entry.monthly) : 0;
                // Pre-check the wallet; if short, open the top-up modal pre-filled with the shortfall.
                if (balance != null && balance < amount) {
                    const short = amount - balance;
                    showToast({ title: 'Not enough credits', message: `You're ${fmtPrice(short, currency)} short. Top up to pay with your wallet.`, type: 'info', duration: 6000 });
                    openTopupModal({
                        suggestedAmount: short,
                        reason: `You need ${fmtPrice(short, currency)} more for ${entry?.name || 'this plan'}.`,
                        onSuccess: loadBalance,
                    });
                    return;
                }
                try {
                    await api.payWithCredits(tier, cycle);
                    loadBalance();
                    refetch();
                    goTo(`/premium/welcome?plan=${tier}`);
                } catch (err: any) {
                    // Backend is authoritative; a 400 means the balance fell short — offer a top-up.
                    if (err?.status === 400) {
                        showToast({ title: 'Not enough credits', message: err?.message || 'Top up to pay with your wallet.', type: 'info', duration: 6000 });
                        openTopupModal({ reason: `Top up to pay for ${entry?.name || 'this plan'} with credits.`, onSuccess: loadBalance });
                    } else {
                        throw err;
                    }
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
            {!isLoggedIn() && <PublicMasthead active="pricing" />}
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
                <p>One subscription. Two upgrades. Both unlock far more of Tunisia than free ever will — from AI planning to a verified business presence.</p>
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
                {method === 'credits' && !isAnon && (
                    <div className="pro-credits-hint">
                        <Coins size={14} />
                        <span>Wallet balance: <strong>{balance == null ? '—' : fmtPrice(balance, currency)}</strong></span>
                        <button type="button" onClick={() => openTopupModal({ onSuccess: loadBalance })}>Top up</button>
                    </div>
                )}
            </section>

            <section className="pro-page-grid">
                {plans.map((p) => (
                    <PlanCard
                        key={p.id}
                        p={p}
                        currentPlan={plan}
                        cycle={cycle}
                        method={method}
                        busy={busy}
                        isAnon={isAnon}
                        currency={currency}
                        onActivate={activate}
                        onCancel={cancel}
                        onManage={manageBilling}
                    />
                ))}
            </section>

            {/* ─── Business power controls showcase ─────────────────────────────────── */}
            {!!business?.advancedControls?.length && (
                <section className="pro-controls-section">
                    <div className="pro-controls-head">
                        <span className="pro-page-kicker pro-kicker-dark"><Zap size={12} /> Business power controls</span>
                        <h2>Run it like an operation, not a listing.</h2>
                        <p>Verified Business unlocks two control centers no other plan touches — so a whole team can manage your presence and automate the busywork.</p>
                    </div>
                    <div className="pro-controls-grid">
                        {business.advancedControls.map((c) => (
                            <article key={c.title} className="pro-control-card">
                                <span className="pro-control-icon"><Glyph name={c.icon} size={22} /></span>
                                <h3>{c.title}</h3>
                                <p>{c.desc}</p>
                                <span className="pro-control-tag"><ShieldCheck size={12} /> Business only</span>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            <section className="pro-page-fineprint">
                <p>
                    Prices shown in {currency}. Card payments are processed securely by Stripe.
                    Bank transfer & cash are confirmed manually by our team — your plan activates
                    once payment clears. Cancel anytime; your subscription stays active until the
                    end of the period.
                </p>
            </section>
            {!isLoggedIn() && <PublicFooter />}
        </main>
    );
}
