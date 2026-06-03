import React from 'react';

// Lightweight legal pages for /privacy and /terms. One component, two flavors via
// the `kind` prop (passed from the router). Content is a sensible starting
// template — have it reviewed before launch.

interface Section { h: string; p: string; }

const UPDATED = 'June 2026';

const PRIVACY: Section[] = [
  { h: 'Overview', p: 'e-Tunisia ("we", "us") helps travelers discover authentic places in Tunisia and connects them with local businesses. This policy explains what we collect, why, and the choices you have.' },
  { h: 'Information we collect', p: 'Account details you provide (name, email, country, optional handle and avatar), content you create (posts, reels, reviews, trips, comments), and usage data such as pages viewed and places saved. If you grant permission, we use approximate location to show nearby places.' },
  { h: 'How we use it', p: 'To run the platform: show and rank content, power search and recommendations, enable bookings and messaging, keep the community safe, and improve the product. We do not sell your personal data.' },
  { h: 'Sharing', p: 'We share data only with service providers that help us operate (hosting, storage, payments), with local businesses when you contact or book them, and where required by law. Public content you post (e.g. reviews, reels) is visible to others by design.' },
  { h: 'Your choices & rights', p: 'You can edit or delete your content, update your profile, and request a copy or deletion of your account data by emailing support@etunisia.com. Some records may be retained where legally required.' },
  { h: 'Cookies & local storage', p: 'We use cookies and browser storage to keep you signed in, remember preferences (theme, saved items), and measure basic usage. You can clear these in your browser at any time.' },
  { h: 'Security & retention', p: 'We apply reasonable safeguards to protect your data and retain it only as long as needed to provide the service or meet legal obligations.' },
  { h: 'Children', p: 'e-Tunisia is not intended for children under 13 (or the minimum age in your country). We do not knowingly collect their data.' },
  { h: 'Changes', p: 'We may update this policy; material changes will be announced in-app. Continued use means you accept the updated policy.' },
  { h: 'Contact', p: 'Questions? Email support@etunisia.com.' },
];

const TERMS: Section[] = [
  { h: 'Acceptance', p: 'By using e-Tunisia you agree to these Terms. If you do not agree, please do not use the platform.' },
  { h: 'Eligibility', p: 'You must be at least 13 (or the minimum age in your country) and able to form a binding agreement to use e-Tunisia.' },
  { h: 'Your account', p: 'You are responsible for your account and for keeping your credentials secure. Provide accurate information and notify us of any unauthorized use.' },
  { h: 'Acceptable use', p: 'Be respectful. Do not post illegal, hateful, misleading, or infringing content, spam, or anything that endangers others. We use moderation and may remove content or suspend accounts that break these rules.' },
  { h: 'Your content', p: 'You keep ownership of what you post. By posting, you grant e-Tunisia a non-exclusive license to host, display, and distribute that content within the platform so the service can function.' },
  { h: 'Bookings & payments', p: 'e-Tunisia helps travelers discover and contact local businesses. Where bookings or payments are offered, the agreement for the experience is between you and the business; we are not a party to it and are not responsible for what they provide.' },
  { h: 'Partners & businesses', p: 'Businesses that list on e-Tunisia agree to provide accurate information and honor what they advertise. Verification badges indicate review, not a guarantee.' },
  { h: 'Intellectual property', p: 'The e-Tunisia name, logo, and platform are our property. You may not copy or misuse them without permission.' },
  { h: 'Disclaimers', p: 'The platform is provided "as is". We do not guarantee that listings, recommendations, or availability are error-free or always available.' },
  { h: 'Limitation of liability', p: 'To the extent permitted by law, e-Tunisia is not liable for indirect or consequential damages arising from your use of the platform or interactions with businesses.' },
  { h: 'Termination', p: 'You may stop using e-Tunisia at any time. We may suspend or terminate accounts that violate these Terms.' },
  { h: 'Governing law', p: 'These Terms are governed by the laws of Tunisia. Changes will be announced in-app; continued use means acceptance.' },
  { h: 'Contact', p: 'Questions about these Terms? Email support@etunisia.com.' },
];

export default function LegalPage({ kind = 'privacy' }: { kind?: 'privacy' | 'terms' }) {
  const isPrivacy = kind === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
  const sections = isPrivacy ? PRIVACY : TERMS;

  return (
    <div className="max-w-3xl mx-auto px-5 py-10 page-enter">
      <a href="#/" className="text-sm text-muted-foreground hover:text-foreground">← Back home</a>
      <h1 className="text-3xl font-bold mt-4 mb-1">{title}</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: {UPDATED}</p>

      <div className="space-y-7">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold mb-1.5">{s.h}</h2>
            <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>

      <p className="mt-10 text-xs text-muted-foreground/70">
        This is a general template provided for convenience and is not legal advice. Please have it reviewed before relying on it.
      </p>

      <div className="mt-6 flex gap-4 text-sm">
        <a href={isPrivacy ? '#/terms' : '#/privacy'} className="text-brand hover:underline">
          {isPrivacy ? 'Read our Terms of Service →' : 'Read our Privacy Policy →'}
        </a>
      </div>
    </div>
  );
}
