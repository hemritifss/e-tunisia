import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Compass,
  Loader2,
  Download,
  Share2,
  Check,
  Clock,
  Utensils,
  Car,
  Crown,
  Luggage,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { api } from '../../shared/api';
import { useUIStore } from '../stores/ui-store';
import { track } from '../../analytics';

interface GroundedPlace {
  id: string;
  name: string;
  city?: string | null;
  category?: string | null;
  rating?: number | null;
  description?: string;
  url?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  itinerary?: any;
  /** Real places the concierge pulled from the DB — rendered as clickable chips. */
  places?: GroundedPlace[];
  /** Render an Upgrade-to-Pro CTA (shown when the daily AI limit is hit). */
  upgrade?: boolean;
  /** Reveal this reply word-by-word (fresh concierge replies feel alive; welcome/errors don't). */
  stream?: boolean;
}

/** The concierge's human name — keep in sync with backend CONCIERGE_NAME. */
const CONCIERGE_NAME = 'Skander';

/** Three bouncing dots — the "Skander is typing…" indicator while we wait on the reply. */
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label={`${CONCIERGE_NAME} is typing`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-brand/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </span>
  );
}

/**
 * Reveals text word-by-word so a reply "types out" as you read it — the human,
 * alive feel — instead of dumping the whole wall at once. Runs once per message.
 */
function StreamingText({ text, onTick }: { text: string; onTick?: () => void }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    const tokens = text.split(/(\s+)/); // keep the whitespace so spacing survives
    let i = 0;
    setShown('');
    const timer = setInterval(() => {
      i += 1;
      setShown(tokens.slice(0, i).join(''));
      onTick?.();
      if (i >= tokens.length) clearInterval(timer);
    }, 26);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <>
      {(shown || ' ').split('\n').map((line, i) => (
        <p key={i} className={i > 0 ? 'mt-1' : ''}>
          {line}
        </p>
      ))}
    </>
  );
}

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  places: Array<{
    id: string;
    name: string;
    description: string;
    duration: string;
    price?: number;
    image?: string;
  }>;
  meals: string[];
  transport: string;
  estimatedCost: number;
}

export default function AITravelPlanner() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `3aslema! I'm ${CONCIERGE_NAME} 👋 — think of me as your friend in Tunisia who knows all the good spots, not just the touristy ones.\n\nTell me what you're after — a hidden beach, the best couscous, a 5-day plan — or just say what mood you're in. Yalla, where do we start?`,
      suggestions: ['Plan a 5-day trip', 'Best hidden beaches?', 'Food tour in Tunis?', 'Sahara desert experience?'],
    },
  ]);
  const [input, setInput] = useState('');
  const [showPlanner, setShowPlanner] = useState(false);
  const [surprising, setSurprising] = useState(false);
  const [plannerPrefs, setPlannerPrefs] = useState({
    duration: 3,
    budget: 500,
    travelers: 2,
    interests: [] as string[],
    travelStyle: 'balanced',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const showToast = useUIStore((s) => s.showToast);

  const interestOptions = [
    { id: 'culture', label: 'Culture & History', icon: '🏛️' },
    { id: 'food', label: 'Food & Drink', icon: '🍽️' },
    { id: 'nature', label: 'Nature & Outdoors', icon: '🌿' },
    { id: 'beaches', label: 'Beaches', icon: '🏖️' },
    { id: 'adventure', label: 'Adventure', icon: '🏔️' },
    { id: 'relaxation', label: 'Relaxation', icon: '🧘' },
  ];

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const chatMessages = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      chatMessages.push({ role: 'user' as const, content: userMessage });

      const token = localStorage.getItem('etunisia_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: chatMessages }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Errors are wrapped as { success:false, error: { message, details } }; the
        // structured ForbiddenException payload lands on error.message (an object).
        const e = data?.error ?? data;
        const payload = e?.message && typeof e.message === 'object' ? e.message : e?.details ?? e;
        const err: any = new Error(
          (typeof e?.message === 'string' ? e.message : payload?.message) || 'AI request failed',
        );
        err.code = payload?.code;
        throw err;
      }
      return data;
    },
  });

  const itineraryMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('etunisia_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/ai/itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(plannerPrefs),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const e = data?.error ?? data;
        const payload = e?.message && typeof e.message === 'object' ? e.message : e?.details ?? e;
        const err: any = new Error(
          (typeof e?.message === 'string' ? e.message : payload?.message) || 'Itinerary failed',
        );
        err.code = payload?.code;
        throw err;
      }
      return data;
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const data = await chatMutation.mutateAsync(userMsg.content);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || data.data?.reply || 'I\'m thinking about that…',
        suggestions: data.suggestions || data.data?.suggestions,
        places: data.places || data.data?.places,
        stream: true,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      if (err?.code === 'ai_quota_reached') {
        setMessages((prev) => [
          ...prev,
          {
            id: `quota-${Date.now()}`,
            role: 'assistant',
            content: err.message || 'You\'ve reached today\'s AI limit. Upgrade to keep planning!',
            upgrade: true,
          },
        ]);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I\'m having trouble connecting right now. Try again in a moment!',
        },
      ]);
    }
  };

  const handleGenerateItinerary = async () => {
    try {
      const data = await itineraryMutation.mutateAsync();
      const itinerary = data.data || data;
      if (!itinerary?.days?.length) {
        showToast('Failed to generate itinerary', 'error');
        return;
      }

      const msg: Message = {
        id: `itinerary-${Date.now()}`,
        role: 'assistant',
        content: `✨ I've created your personalized **${itinerary.duration}-day Tunisia adventure**!\n\n**${itinerary.title}**\n${itinerary.description}\n\n💰 Estimated total: **${itinerary.totalEstimatedCost} ${itinerary.currency}**`,
        itinerary,
      };

      setMessages((prev) => [...prev, msg]);
      setShowPlanner(false);
      track('trip_plan', { days: itinerary.duration });
      showToast('Itinerary generated!', 'success');
    } catch (err: any) {
      if (err?.code === 'ai_quota_reached') {
        setShowPlanner(false);
        setMessages((prev) => [...prev, {
          id: `quota-${Date.now()}`,
          role: 'assistant',
          content: err.message || 'You\'ve reached today\'s AI limit. Upgrade to keep planning!',
          upgrade: true,
        }]);
        return;
      }
      showToast('Failed to generate itinerary', 'error');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // 🎲 Surprise me — a one-tap spontaneous day plan grounded in real places.
  const handleSurprise = async () => {
    if (surprising) return;
    setSurprising(true);
    try {
      const token = localStorage.getItem('etunisia_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/ai/surprise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const e = data?.error ?? data;
        const payload = e?.message && typeof e.message === 'object' ? e.message : e?.details ?? e;
        if (payload?.code === 'ai_quota_reached') {
          setMessages((prev) => [...prev, {
            id: `quota-${Date.now()}`,
            role: 'assistant',
            content: payload.message || 'You\'ve reached today\'s AI limit. Upgrade to keep planning!',
            upgrade: true,
          }]);
          return;
        }
        throw new Error('surprise failed');
      }
      const body = data.data || data;
      setMessages((prev) => [...prev, {
        id: `surprise-${Date.now()}`,
        role: 'assistant',
        content: `🎲 ${body.blurb || 'Here\'s a spontaneous idea for you!'}`,
        places: body.places,
        stream: true,
      }]);
    } catch {
      showToast('Couldn\'t surprise you right now — try again!', 'error');
    } finally {
      setSurprising(false);
    }
  };

  // 🧳 Save the generated itinerary into "My Trips" (only real DB places become stops).
  const handleSaveTrip = async (it: any) => {
    if (!it) return;
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const stops: { placeId: string; dayIndex?: number }[] = [];
    (it.days || []).forEach((d: any, di: number) => {
      (d.places || []).forEach((p: any) => {
        if (typeof p.id === 'string' && uuidRe.test(p.id)) {
          stops.push({ placeId: p.id, dayIndex: typeof d.day === 'number' ? d.day - 1 : di });
        }
      });
    });
    try {
      const r: any = await api.saveTrip({
        title: it.title || 'My Tunisia trip',
        travelers: plannerPrefs.travelers,
        currency: it.currency || 'TND',
        days: it.duration || (it.days?.length ?? 1),
        isPublic: false,
        stops,
      });
      const slug = r?.slug || r?.data?.slug;
      showToast(
        stops.length ? 'Saved to My Trips! 🧳' : 'Saved! (places will link once the AI grounds them)',
        'success',
      );
      if (slug) window.location.hash = `#/trip/${slug}`;
    } catch (err: any) {
      showToast(err?.message || 'Could not save your trip — try again!', 'error');
    }
  };

  // ─── Itinerary export (zero-dep: print-to-PDF via hidden iframe + share/clipboard) ───
  const itineraryToText = (it: any): string => {
    const lines: string[] = [it.title];
    if (it.description) lines.push(it.description);
    lines.push(`Estimated total: ${it.totalEstimatedCost} ${it.currency || 'TND'}`, '');
    (it.days || []).forEach((d: any) => {
      lines.push(`Day ${d.day}: ${d.title}`);
      if (d.description) lines.push(d.description);
      (d.places || []).forEach((p: any) => lines.push(`  • ${p.name}${p.duration ? ` — ${p.duration}` : ''}`));
      if (d.meals?.length) lines.push(`  Meals: ${d.meals.join('; ')}`);
      if (d.transport) lines.push(`  Transport: ${d.transport}`);
      lines.push(`  Day cost: ${d.estimatedCost} TND`, '');
    });
    if (it.tips?.length) {
      lines.push('Pro tips:');
      it.tips.forEach((t: string) => lines.push(`  • ${t}`));
    }
    return lines.join('\n');
  };

  const itineraryToHtml = (it: any): string => {
    const esc = (s: any) =>
      String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
    const days = (it.days || [])
      .map(
        (d: any) => `
        <section class="day">
          <h2>Day ${esc(d.day)}: ${esc(d.title)}</h2>
          <p>${esc(d.description)}</p>
          <ul>${(d.places || []).map((p: any) => `<li><strong>${esc(p.name)}</strong>${p.duration ? ` — ${esc(p.duration)}` : ''}</li>`).join('')}</ul>
          <p class="meta">${(d.meals || []).length ? `🍽️ ${esc((d.meals || []).join(', '))}<br/>` : ''}${d.transport ? `🚗 ${esc(d.transport)}<br/>` : ''}💰 ${esc(d.estimatedCost)} TND</p>
        </section>`,
      )
      .join('');
    const tips = (it.tips || []).length
      ? `<section class="tips"><h2>💡 Pro Tips</h2><ul>${it.tips.map((t: string) => `<li>${esc(t)}</li>`).join('')}</ul></section>`
      : '';
    return `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(it.title)}</title>
      <style>
        body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1D2E4A;max-width:720px;margin:32px auto;padding:0 20px;line-height:1.5}
        h1{font-size:24px;margin-bottom:4px}
        .sub{color:#5B6B82;margin:0 0 16px}
        .day{border-left:3px solid #1E5FA8;padding-left:14px;margin:18px 0}
        h2{font-size:16px;margin:0 0 6px}
        ul{margin:6px 0;padding-left:18px}
        .meta{color:#5B6B82;font-size:13px}
        .tips{background:#F2EBDD;padding:12px 16px;border-radius:10px;margin-top:20px}
        @media print{body{margin:0}}
      </style></head>
      <body>
        <h1>${esc(it.title)}</h1>
        <p class="sub">${esc(it.description)} · <strong>${esc(it.totalEstimatedCost)} ${esc(it.currency || 'TND')}</strong></p>
        ${days}${tips}
      </body></html>`;
  };

  const handleDownloadItinerary = (it: any) => {
    if (!it) return;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }
    doc.open();
    doc.write(itineraryToHtml(it));
    doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        /* print blocked — nothing else to do */
      }
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {
          /* already gone */
        }
      }, 1000);
    }, 300);
  };

  const handleShareItinerary = async (it: any) => {
    if (!it) return;
    const text = itineraryToText(it);
    try {
      if (navigator.share) {
        await navigator.share({ title: it.title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast('Itinerary copied to clipboard', 'success');
    } catch {
      /* user dismissed the share sheet — ignore */
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-80px)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-black/5 dark:border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-mediterranean flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-semibold">{CONCIERGE_NAME}</h1>
          <p className="text-xs text-muted-foreground">Your Tunisia concierge · powered by Claude</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          isLoading={surprising}
          onClick={handleSurprise}
        >
          🎲 Surprise me
        </Button>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Compass size={14} />}
          onClick={() => setShowPlanner(!showPlanner)}
        >
          Plan Trip
        </Button>
      </div>

      {/* Trip Planner Panel */}
      <AnimatePresence>
        {showPlanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-black/5 dark:border-white/5"
          >
            <div className="p-4 space-y-4 bg-surface-elevated">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground" />
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={plannerPrefs.duration}
                      onChange={(e) => setPlannerPrefs({ ...plannerPrefs, duration: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-surface text-sm"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Budget</label>
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-muted-foreground" />
                    <input
                      type="number"
                      min={100}
                      step={50}
                      value={plannerPrefs.budget}
                      onChange={(e) => setPlannerPrefs({ ...plannerPrefs, budget: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-surface text-sm"
                    />
                    <span className="text-sm text-muted-foreground">TND</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Travelers</label>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-muted-foreground" />
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={plannerPrefs.travelers}
                      onChange={(e) => setPlannerPrefs({ ...plannerPrefs, travelers: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-surface text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => {
                        setPlannerPrefs((prev) => ({
                          ...prev,
                          interests: prev.interests.includes(interest.id)
                            ? prev.interests.filter((i) => i !== interest.id)
                            : [...prev.interests, interest.id],
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        plannerPrefs.interests.includes(interest.id)
                          ? 'bg-brand text-white'
                          : 'bg-black/5 dark:bg-white/5 hover:bg-black/10'
                      }`}
                    >
                      {interest.icon} {interest.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                isLoading={itineraryMutation.isPending}
                leftIcon={<Sparkles size={16} />}
                onClick={handleGenerateItinerary}
              >
                Generate My Itinerary
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant'
                  ? 'bg-brand/10 text-brand'
                  : 'bg-mediterranean/10 text-mediterranean'
              }`}
            >
              {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div
                className={`inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-surface-elevated border border-black/5 dark:border-white/5'
                    : 'bg-brand text-white'
                }`}
              >
                {msg.role === 'assistant' && msg.stream ? (
                  <StreamingText text={msg.content} onTick={scrollToBottom} />
                ) : (
                  msg.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-1' : ''}>
                      {line}
                    </p>
                  ))
                )}
              </div>

              {/* Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 text-xs rounded-full bg-black/5 dark:bg-white/5 hover:bg-brand/10 hover:text-brand transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Grounded places — real listings the concierge pulled from the DB */}
              {msg.places && msg.places.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.places.map((p) => (
                    <a
                      key={p.id}
                      href={`#/place/${p.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-brand/5 text-brand border border-brand/15 hover:bg-brand/10 transition-colors"
                    >
                      <MapPin size={12} />
                      <span className="font-medium">{p.name}</span>
                      {p.city && <span className="text-brand/60">· {p.city}</span>}
                    </a>
                  ))}
                </div>
              )}

              {/* Daily AI limit reached → upgrade */}
              {msg.upgrade && (
                <div className="mt-2">
                  <a
                    href="#/pro"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-gradient-to-br from-brand to-mediterranean text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    <Crown size={14} /> Upgrade to Pro
                  </a>
                </div>
              )}

              {/* Itinerary Card */}
              {msg.itinerary && (
                <div className="mt-3 space-y-3">
                  {msg.itinerary.days?.map((day: ItineraryDay) => (
                    <Card key={day.day} variant="elevated" className="text-left">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center font-bold">
                            {day.day}
                          </span>
                          <h4 className="font-medium text-sm">{day.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{day.description}</p>
                        <div className="space-y-2">
                          {day.places?.map((place: any) => {
                            const isRealPlace =
                              typeof place.id === 'string' &&
                              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(place.id);
                            const inner = (
                              <>
                                <MapPin size={14} className="text-brand mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-medium">{place.name}</span>
                                  <span className="text-muted-foreground"> — {place.duration}</span>
                                </div>
                              </>
                            );
                            return isRealPlace ? (
                              <a
                                key={place.id}
                                href={`#/place/${place.id}`}
                                className="flex items-start gap-2 text-sm hover:text-brand transition-colors"
                              >
                                {inner}
                              </a>
                            ) : (
                              <div key={place.id} className="flex items-start gap-2 text-sm">
                                {inner}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Utensils size={12} />
                            {day.meals?.length} meals
                          </span>
                          <span className="flex items-center gap-1">
                            <Car size={12} />
                            {day.transport}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wallet size={12} />
                            {day.estimatedCost} TND
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Tips */}
                  {msg.itinerary.tips?.length > 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                      <h5 className="text-sm font-medium mb-2">💡 Pro Tips</h5>
                      <ul className="space-y-1">
                        {msg.itinerary.tips.map((tip: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Check size={12} className="mt-1 shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Luggage size={14} />}
                      onClick={() => handleSaveTrip(msg.itinerary)}
                    >
                      Save to My Trips
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download size={14} />}
                      onClick={() => handleDownloadItinerary(msg.itinerary)}
                    >
                      Save as PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Share2 size={14} />}
                      onClick={() => handleShareItinerary(msg.itinerary)}
                    >
                      Share
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* "Skander is typing…" while we wait on a reply */}
        {(chatMutation.isPending || surprising) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-brand/10 text-brand">
              <Bot size={16} />
            </div>
            <div className="inline-block px-4 py-2.5 rounded-2xl bg-surface-elevated border border-black/5 dark:border-white/5">
              <TypingDots />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-black/5 dark:border-white/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about Tunisia or plan your trip…"
            aria-label="Ask Skander about Tunisia or plan your trip"
            enterKeyHint="send"
            className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 text-sm"
          />
          <Button
            variant="primary"
            size="icon"
            disabled={!input.trim() || chatMutation.isPending}
            onClick={handleSend}
            aria-label={chatMutation.isPending ? 'Sending…' : 'Send message'}
          >
            {chatMutation.isPending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
