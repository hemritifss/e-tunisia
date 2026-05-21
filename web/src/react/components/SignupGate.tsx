import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../shared/api';
import { Check, X, Loader2 } from 'lucide-react';

interface Props {
    open: boolean;
    onClose(): void;
    initialHandle?: string;
    onSuccess(user: { id: string; handle: string; fullName?: string }): void;
}

export function SignupGate({ open, onClose, initialHandle, onSuccess }: Props) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [handle, setHandle] = useState(initialHandle || '');
    const [hStatus, setHStatus] = useState<'idle' | 'checking' | 'ok' | 'bad'>('idle');
    const [hReason, setHReason] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timer = useRef<number | null>(null);

    useEffect(() => {
        if (initialHandle && !handle) setHandle(initialHandle);
    }, [initialHandle]);

    useEffect(() => {
        if (!handle) { setHStatus('idle'); setHReason(null); return; }
        setHStatus('checking');
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(async () => {
            try {
                const r: any = await api.checkHandle(handle);
                if (r?.available) { setHStatus('ok'); setHReason(null); }
                else { setHStatus('bad'); setHReason(r?.reason || 'taken'); }
            } catch {
                setHStatus('idle');
            }
        }, 350);
        return () => { if (timer.current) window.clearTimeout(timer.current); };
    }, [handle]);

    if (!open) return null;

    const canSubmit = fullName.trim() && email.includes('@') && password.length >= 6 && hStatus === 'ok' && !submitting;

    const submit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password, handle: handle.toLowerCase() }),
            }).then(r => r.json());
            const payload: any = (res && res.data) ? res.data : res;
            if (payload?.accessToken && payload?.user) {
                // Use the same keys the rest of the app uses (apiService.isLoggedIn checks
                // etunisia_token + etunisia_user). Using auth_token here left the new user
                // looking 'logged out' to every other surface — broke the /#/pro page,
                // the welcome strip, hydrateCurrentUser, etc.
                localStorage.setItem('etunisia_token', payload.accessToken);
                localStorage.setItem('etunisia_user', JSON.stringify(payload.user));
                onSuccess({ id: payload.user.id, handle: payload.user.handle, fullName: payload.user.fullName });
            } else {
                setError(res?.message || payload?.message || 'Signup failed');
            }
        } catch (e: any) {
            setError(e?.message || 'Network error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="signup-gate-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="signup-gate">
                <button className="signup-gate-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
                <h2>Claim your Tunisia Passport</h2>
                <p className="signup-gate-sub">Free. 30 seconds. Public profile, badges, trip planner — all in one.</p>

                <label>
                    <span>Full name</span>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
                </label>
                <label>
                    <span>Email</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label>
                    <span>Password</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </label>
                <label>
                    <span>Your handle</span>
                    <div className="signup-gate-handle-row">
                        <span className="signup-gate-handle-at">@</span>
                        <input
                            value={handle}
                            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30))}
                            placeholder="e.g. amine_t"
                        />
                        <div className="signup-gate-handle-status">
                            {hStatus === 'checking' && <Loader2 size={16} className="spin" />}
                            {hStatus === 'ok' && <Check size={16} color="#0ea34c" />}
                            {hStatus === 'bad' && <X size={16} color="#d33" />}
                        </div>
                    </div>
                    {hStatus === 'bad' && (
                        <small className="signup-gate-hint">
                            {hReason === 'reserved' ? "That handle is reserved." :
                             hReason === 'taken' ? "That handle is taken." :
                             hReason === 'format' ? "3–30 chars, lowercase letters/numbers/_, must start with a letter." :
                             "Try a different handle."}
                        </small>
                    )}
                </label>

                {error && <div className="signup-gate-error">{error}</div>}

                <button className="btn primary block" disabled={!canSubmit} onClick={submit}>
                    {submitting ? 'Creating…' : 'Create my passport'}
                </button>

                <small className="signup-gate-tos">By signing up you agree to our terms & privacy.</small>
            </div>
        </div>
    );
}
