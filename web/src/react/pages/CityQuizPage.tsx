import '../../styles/city-quiz.css';
import React, { useEffect, useMemo, useState } from 'react';
import { Share2, RotateCcw, MapPin, Sparkles, Check } from 'lucide-react';
import { setCity } from '../../city-filter';
import { ogShareUrl } from '../../shared/api';
import { goTo, replace } from '../../router';
import { track } from '../../analytics';

// GROWTH §7 magnet page: "Which Tunisian city are you?" — a zero-login personality
// quiz. Every result is a shareable card (real OG image, like the passport) that
// deep-links back via ?r=<slug>, so a friend who sees "I'm Sidi Bou Saïd 💙" lands
// on the same quiz. Funnels into Explore (sets the city filter) + signup.

type Slug =
  | 'sidi-bou-said' | 'tunis' | 'djerba' | 'douz'
  | 'tozeur' | 'hammamet' | 'kairouan' | 'tabarka';

interface Archetype {
  slug: Slug;
  city: string;          // display name
  filterCity: string;    // must match a name in CITIES (city-filter.ts)
  emoji: string;
  tagline: string;
  blurb: string;
  traits: string[];
  gradient: string;      // result card background
}

// Ordered by tie-break priority (earlier wins an exact tie).
const ARCHETYPES: Archetype[] = [
  {
    slug: 'sidi-bou-said', city: 'Sidi Bou Saïd', filterCity: 'Sidi Bou Said', emoji: '💙',
    tagline: 'The dreamer',
    blurb: 'Blue doors, white walls and a coffee with a sea view. You find beauty in small, quiet things — and everyone secretly wants to slow down to your pace.',
    traits: ['Artistic', 'Romantic', 'Calm-in-the-chaos'],
    gradient: 'linear-gradient(135deg,#0b3d91 0%,#2f6fd0 55%,#eef3fb 100%)',
  },
  {
    slug: 'tunis', city: 'Tunis', filterCity: 'Tunis', emoji: '🏛️',
    tagline: 'The connector',
    blurb: 'Old medina energy meets big-city ambition. You move fast, know everyone, and somehow make tradition and hustle look effortless together.',
    traits: ['Ambitious', 'Social', 'Always-in-motion'],
    gradient: 'linear-gradient(135deg,#7a1f2b 0%,#c0492f 55%,#e7b64a 100%)',
  },
  {
    slug: 'djerba', city: 'Djerba', filterCity: 'Djerba', emoji: '🐠',
    tagline: 'The easy soul',
    blurb: 'Island time runs in your veins. Unbothered, warm and impossible to rush — you are the friend everyone calls when the world gets too loud.',
    traits: ['Easygoing', 'Warm', 'Unbothered'],
    gradient: 'linear-gradient(135deg,#0f8a8a 0%,#2bc4c4 55%,#eafaf6 100%)',
  },
  {
    slug: 'douz', city: 'Douz', filterCity: 'Douz', emoji: '🐪',
    tagline: 'The free spirit',
    blurb: 'Gateway to the Sahara. You chase horizons, say yes to the mad plan, and feel most alive under a sky full of stars with no plan at all.',
    traits: ['Adventurous', 'Fearless', 'Free'],
    gradient: 'linear-gradient(135deg,#a5561e 0%,#e0902f 55%,#f6dfa8 100%)',
  },
  {
    slug: 'tozeur', city: 'Tozeur', filterCity: 'Tozeur', emoji: '🌴',
    tagline: 'The mystic',
    blurb: 'An oasis of palms and ancient brick. There is a bit of magic to you — old-soul, a little mysterious, drawn to stories older than everyone in the room.',
    traits: ['Mysterious', 'Old-soul', 'Magnetic'],
    gradient: 'linear-gradient(135deg,#6b3b12 0%,#b4762a 55%,#e9c98a 100%)',
  },
  {
    slug: 'hammamet', city: 'Hammamet', filterCity: 'Hammamet', emoji: '🍹',
    tagline: 'The good time',
    blurb: 'Jasmine, beaches and nightlife. You are the plan — the one who turns any evening into a story people retell for years. Summer has a face, and it is yours.',
    traits: ['Fun', 'Magnetic', 'Sun-chaser'],
    gradient: 'linear-gradient(135deg,#0a7d6b 0%,#f26d6d 55%,#ffe08a 100%)',
  },
  {
    slug: 'kairouan', city: 'Kairouan', filterCity: 'Kairouan', emoji: '🕌',
    tagline: 'The old soul',
    blurb: 'The spiritual heart of the country. Rooted, thoughtful and quietly deep — people trust you, because you carry something that does not change with the wind.',
    traits: ['Grounded', 'Loyal', 'Wise'],
    gradient: 'linear-gradient(135deg,#5a3d2b 0%,#a5794a 55%,#ecdcc0 100%)',
  },
  {
    slug: 'tabarka', city: 'Tabarka', filterCity: 'Tabarka', emoji: '🌲',
    tagline: 'The nature lover',
    blurb: 'Where pine forests meet the sea and jazz drifts through the air. Down-to-earth and a little wild, you are happiest outdoors, coral below and music above.',
    traits: ['Down-to-earth', 'Creative', 'Wild-at-heart'],
    gradient: 'linear-gradient(135deg,#14532d 0%,#2f8f57 55%,#bfe3c4 100%)',
  },
];

const BY_SLUG: Record<string, Archetype> = Object.fromEntries(ARCHETYPES.map((a) => [a.slug, a]));

interface Option { label: string; emoji: string; score: Partial<Record<Slug, number>>; }
interface Question { q: string; options: Option[]; }

const QUESTIONS: Question[] = [
  {
    q: "It's a free Saturday. Where do you drift?",
    options: [
      { label: 'A rooftop café watching the sea', emoji: '☕', score: { 'sidi-bou-said': 2 } },
      { label: 'Losing myself in a buzzing old medina', emoji: '🛍️', score: { tunis: 2, kairouan: 1 } },
      { label: 'A hammock between two palm trees', emoji: '🌴', score: { djerba: 2, tozeur: 1 } },
      { label: 'Chasing the horizon somewhere wild', emoji: '🧭', score: { douz: 2, tabarka: 1 } },
      { label: 'Wherever the party is', emoji: '🎉', score: { hammamet: 2 } },
    ],
  },
  {
    q: 'Pick a colour that feels like you',
    options: [
      { label: 'Blue & white', emoji: '💙', score: { 'sidi-bou-said': 2 } },
      { label: 'Gold & sand', emoji: '🏜️', score: { douz: 2, tozeur: 1 } },
      { label: 'Turquoise', emoji: '🌊', score: { djerba: 2, hammamet: 1 } },
      { label: 'Deep forest green', emoji: '🌲', score: { tabarka: 2 } },
      { label: 'Terracotta & stone', emoji: '🧱', score: { kairouan: 2, tunis: 1 } },
    ],
  },
  {
    q: 'Your friends would say you are the ___ one',
    options: [
      { label: 'Dreamy, artistic', emoji: '🎨', score: { 'sidi-bou-said': 2, tozeur: 1 } },
      { label: 'Ambitious, driven', emoji: '🚀', score: { tunis: 2 } },
      { label: 'Calm, easygoing', emoji: '😌', score: { djerba: 2 } },
      { label: 'Adventurous, fearless', emoji: '🔥', score: { douz: 2 } },
      { label: 'Warm, social', emoji: '🤗', score: { hammamet: 2 } },
      { label: 'Deep, grounded', emoji: '🌿', score: { kairouan: 2, tabarka: 1 } },
    ],
  },
  {
    q: 'Dream home?',
    options: [
      { label: 'Whitewashed house with a blue door over the sea', emoji: '🚪', score: { 'sidi-bou-said': 2 } },
      { label: 'A loft in the heart of the city', emoji: '🏙️', score: { tunis: 2 } },
      { label: 'A beach bungalow, toes in the sand', emoji: '🏖️', score: { djerba: 2, hammamet: 1 } },
      { label: 'A traditional dar with a green courtyard', emoji: '🏛️', score: { kairouan: 2 } },
      { label: 'Something no one else has', emoji: '✨', score: { tozeur: 1, douz: 1, tabarka: 1 } },
    ],
  },
  {
    q: 'Choose a soundtrack',
    options: [
      { label: 'Soft malouf & oud', emoji: '🎻', score: { 'sidi-bou-said': 1, kairouan: 2 } },
      { label: "Whatever's trending, loud", emoji: '🔊', score: { tunis: 1, hammamet: 2 } },
      { label: 'Waves, wind, silence', emoji: '🌬️', score: { djerba: 2, douz: 1 } },
      { label: 'Jazz under the pines', emoji: '🎷', score: { tabarka: 2 } },
      { label: 'Something ancient and hypnotic', emoji: '🪘', score: { tozeur: 2 } },
    ],
  },
  {
    q: "What can't you resist?",
    options: [
      { label: 'A perfect espresso with a view', emoji: '☕', score: { 'sidi-bou-said': 2 } },
      { label: 'A brand-new opportunity', emoji: '💼', score: { tunis: 2 } },
      { label: 'Doing absolutely nothing, guilt-free', emoji: '🛋️', score: { djerba: 2 } },
      { label: 'Saying yes to a mad adventure', emoji: '🎢', score: { douz: 2 } },
      { label: 'A festival, a crowd, live music', emoji: '🎪', score: { hammamet: 1, tabarka: 1 } },
      { label: 'A story older than everyone in the room', emoji: '📜', score: { kairouan: 1, tozeur: 2 } },
    ],
  },
  {
    q: 'Your ideal end to the day',
    options: [
      { label: 'Sunset over blue rooftops', emoji: '🌇', score: { 'sidi-bou-said': 2 } },
      { label: 'City lights from a rooftop bar', emoji: '🍸', score: { tunis: 1, hammamet: 1 } },
      { label: 'Feet in warm water, no plans', emoji: '🩴', score: { djerba: 2 } },
      { label: 'Stars over endless dunes', emoji: '🌌', score: { douz: 2, tozeur: 1 } },
      { label: 'A fire, a forest, good friends', emoji: '🔥', score: { tabarka: 2 } },
      { label: 'A quiet moment of reflection', emoji: '🕯️', score: { kairouan: 2 } },
    ],
  },
];

function scoreToArchetype(answers: number[]): Archetype {
  const totals = new Map<Slug, number>();
  answers.forEach((optIdx, qi) => {
    const opt = QUESTIONS[qi]?.options[optIdx];
    if (!opt) return;
    for (const [slug, pts] of Object.entries(opt.score)) {
      totals.set(slug as Slug, (totals.get(slug as Slug) || 0) + (pts || 0));
    }
  });
  // Highest score wins; ties broken by ARCHETYPES order (stable, deterministic).
  let best = ARCHETYPES[0];
  let bestScore = -1;
  for (const a of ARCHETYPES) {
    const s = totals.get(a.slug) || 0;
    if (s > bestScore) { bestScore = s; best = a; }
  }
  return best;
}

function readResultParam(): Archetype | null {
  try {
    // Pathname router: the shared link lands as /city-quiz?r=slug (search). Keep a
    // hash fallback in case a legacy #/city-quiz?r=slug URL slips through pre-normalize.
    const params = new URLSearchParams(location.search || location.hash.split('?')[1] || '');
    const r = params.get('r');
    return r && BY_SLUG[r] ? BY_SLUG[r] : null;
  } catch { return null; }
}

export default function CityQuizPage() {
  // A shared link (?r=slug) jumps straight to that result.
  const [result, setResult] = useState<Archetype | null>(() => readResultParam());
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const shared = useMemo(() => !!readResultParam(), []);

  useEffect(() => {
    if (result) {
      track('city_quiz_result', { city: result.slug, shared });
      // Make the result deep-linkable without adding a history entry.
      replace(`/city-quiz?r=${result.slug}`);
    }
  }, [result, shared]);

  const pick = (optIdx: number) => {
    const next = [...answers.slice(0, step), optIdx];
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
    } else {
      setResult(scoreToArchetype(next));
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const restart = () => {
    setResult(null);
    setStep(0);
    setAnswers([]);
    setCopied(false);
    replace('/city-quiz');
  };

  const share = async (a: Archetype) => {
    const url = `${ogShareUrl(`city-quiz/${a.slug}`)}`;
    const text = `I'm ${a.city} ${a.emoji} — which Tunisian city are you?`;
    track('city_quiz_share', { city: a.slug });
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Which Tunisian city are you?', text, url });
        return;
      }
    } catch { /* user cancelled — fall through to copy */ }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* ignore */ }
  };

  const exploreCity = (a: Archetype) => {
    setCity(a.filterCity);
    track('city_quiz_explore', { city: a.slug });
    goTo('/explore');
  };

  // ── Result screen ──────────────────────────────────────────
  if (result) {
    return (
      <div className="quiz-page page-enter">
        <div className="quiz-result-card" style={{ background: result.gradient }}>
          <span className="quiz-result-kicker">You are</span>
          <div className="quiz-result-emoji">{result.emoji}</div>
          <h1 className="quiz-result-city">{result.city}</h1>
          <p className="quiz-result-tagline">{result.tagline}</p>
          <div className="quiz-result-traits">
            {result.traits.map((tr) => <span key={tr} className="quiz-trait">{tr}</span>)}
          </div>
          <p className="quiz-result-blurb">{result.blurb}</p>
          <div className="quiz-result-brand">🇹🇳 e-tunisia</div>
        </div>

        <div className="quiz-actions">
          <button className="btn primary" type="button" onClick={() => share(result)}>
            {copied ? <><Check size={16} /> Link copied</> : <><Share2 size={16} /> Share your result</>}
          </button>
          <button className="btn ghost" type="button" onClick={() => exploreCity(result)}>
            <MapPin size={16} /> Explore {result.city}
          </button>
          <button className="btn ghost" type="button" onClick={restart}>
            <RotateCcw size={16} /> Retake
          </button>
        </div>

        <div className="quiz-signup">
          <strong>Make it official.</strong>
          <span>Get your free Tunisia Passport, collect a stamp for every city you visit, and see how much of {result.city} you've really explored.</span>
          <a className="btn primary sm" href="#/register">Get my passport →</a>
        </div>
      </div>
    );
  }

  // ── Quiz flow ──────────────────────────────────────────────
  const question = QUESTIONS[step];
  const progress = Math.round((step / QUESTIONS.length) * 100);

  return (
    <div className="quiz-page page-enter">
      <header className="quiz-header">
        <span className="quiz-kicker"><Sparkles size={13} /> Just for fun · no account needed</span>
        <h1>Which Tunisian city are you?</h1>
        <p>Seven quick questions. One very Tunisian answer.</p>
      </header>

      <div className="quiz-progress" aria-hidden>
        <div className="quiz-progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="quiz-step-label">Question {step + 1} of {QUESTIONS.length}</div>

      <div className="quiz-card" key={step}>
        <h2 className="quiz-question">{question.q}</h2>
        <div className="quiz-options">
          {question.options.map((opt, i) => (
            <button key={opt.label} type="button" className="quiz-option" onClick={() => pick(i)}>
              <span className="quiz-option-emoji" aria-hidden>{opt.emoji}</span>
              <span className="quiz-option-label">{opt.label}</span>
            </button>
          ))}
        </div>
        {step > 0 && (
          <button className="quiz-back" type="button" onClick={back}>← Back</button>
        )}
      </div>
    </div>
  );
}
