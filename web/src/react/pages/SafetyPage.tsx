import '../../styles/safety.css';
import React from 'react';
import {
  Shield, Phone, Cross, Landmark, Car, Wifi, CalendarDays, Info,
  AlertTriangle, Banknote, Droplets, Sun,
} from 'lucide-react';

// Tier 2.8 — Safety & essentials. Static, accurate reference content; the numbers
// below are Tunisia's standard nationwide emergency lines.

const EMERGENCY = [
  { label: 'Police (Police Secours)', num: '197', note: 'Crime, theft, general emergencies' },
  { label: 'Ambulance (SAMU)', num: '190', note: 'Medical emergencies' },
  { label: 'Fire & Rescue (Protection Civile)', num: '198', note: 'Fire, accidents, rescue' },
  { label: 'National Guard (Garde Nationale)', num: '193', note: 'Rural areas & highways' },
];

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="safety-section">
      <h2 className="safety-section-title">{icon} {title}</h2>
      {children}
    </section>
  );
}

export default function SafetyPage() {
  return (
    <div className="safety-page page-enter" data-design="sleek">
      <header className="safety-header">
        <span className="safety-kicker"><Shield size={13} /> Travel essentials</span>
        <h1>Stay safe in Tunisia</h1>
        <p>The numbers, norms, and practical know-how worth saving before you go.</p>
      </header>

      <Section icon={<Phone size={17} />} title="Emergency numbers">
        <div className="safety-emergency-grid">
          {EMERGENCY.map((e) => (
            <a key={e.num} className="safety-emergency" href={`tel:${e.num}`}>
              <span className="safety-emergency-num">{e.num}</span>
              <span className="safety-emergency-label">{e.label}</span>
              <span className="safety-emergency-note">{e.note}</span>
            </a>
          ))}
        </div>
        <p className="safety-note"><Info size={13} /> Save these offline — the pan-European 112 is not reliable in Tunisia; the local lines above are.</p>
      </Section>

      <Section icon={<Cross size={17} />} title="Health & pharmacies">
        <ul className="safety-list">
          <li>Every town has a <strong>pharmacie de nuit / de garde</strong> (night/on-duty pharmacy) — the rota is posted on every pharmacy door and in local papers.</li>
          <li>Private clinics (<em>cliniques</em>) in Tunis, Sousse and Sfax offer fast, good care; bring travel insurance and pay upfront, then claim.</li>
          <li>Pharmacists are well trained and dispense many medicines without a prescription — a good first stop for minor issues.</li>
          <li>Tap water is chlorinated and generally safe in cities, but most travelers prefer bottled water (<em>eau minérale</em>) to avoid an upset stomach.</li>
        </ul>
      </Section>

      <Section icon={<Landmark size={17} />} title="Embassies & consulates">
        <ul className="safety-list">
          <li>Most embassies are in <strong>Tunis</strong> (city centre and Berges du Lac). Save your own embassy's address and 24h emergency line before travelling.</li>
          <li>Register with your embassy's traveler program (e.g. STEP, Elefand) so they can reach you in a crisis.</li>
          <li>For a lost passport: file a police report (197), then contact your embassy for an emergency travel document.</li>
        </ul>
      </Section>

      <Section icon={<Car size={17} />} title="Taxis & getting around">
        <ul className="safety-list">
          <li><strong>Yellow taxis</strong> are metered — insist on the <em>compteur</em>. A short city ride is a few dinars; a <strong>+50% night surcharge</strong> applies after ~21:00 (the meter switches to “2”).</li>
          <li><strong>Louages</strong> (shared minibuses) are the cheap, fast way between cities — fixed per-seat fares, leave when full from the louage station.</li>
          <li>Agree the fare before boarding only for unmetered/long trips. From Tunis-Carthage airport to the centre is a short, cheap metered ride.</li>
          <li>Bolt operates in Tunis and a few cities — handy for a fixed, cashless price.</li>
        </ul>
      </Section>

      <Section icon={<Banknote size={17} />} title="Money & tipping">
        <ul className="safety-list">
          <li>Currency is the <strong>Tunisian dinar (TND)</strong>. It's a <strong>closed currency</strong> — you can't legally take dinars out, so spend or reconvert before you fly (keep exchange receipts).</li>
          <li>Cards work in hotels, malls and larger restaurants; carry cash for medinas, cafés, louages and small shops.</li>
          <li>Tipping ~5–10% is appreciated in restaurants; round up for taxis and café staff.</li>
        </ul>
      </Section>

      <Section icon={<Wifi size={17} />} title="Connectivity & eSIM">
        <ul className="safety-list">
          <li>A local SIM (<strong>Ooredoo, Orange, Tunisie Telecom</strong>) is cheap and easy — buy at the airport or any operator shop, bring your <strong>passport</strong> to register. Data bundles are inexpensive.</li>
          <li>Prefer an <strong>eSIM</strong>? Providers like Airalo sell Tunisia data plans you can activate before you land — no shop visit.</li>
          <li>WiFi is common in hotels and cafés; coverage is strong in cities and along the coast, patchier in the deep south.</li>
        </ul>
      </Section>

      <Section icon={<CalendarDays size={17} />} title="Ramadan & public holidays">
        <ul className="safety-list">
          <li>During <strong>Ramadan</strong> (dates shift ~11 days earlier each year), many cafés and restaurants close during daylight and reopen at sunset (<em>iftar</em>); hours are reduced. Eating discreetly in public is polite.</li>
          <li>Fixed holidays include Independence Day (20 Mar), Martyrs' Day (9 Apr), Labour Day (1 May), Republic Day (25 Jul), Women's Day (13 Aug), Revolution Day (17 Dec/14 Jan). Eid al-Fitr and Eid al-Adha move with the lunar calendar.</li>
          <li>On holidays and Fridays around midday prayer, some shops and offices close — plan visits and transport accordingly.</li>
        </ul>
      </Section>

      <Section icon={<AlertTriangle size={17} />} title="Good to know">
        <ul className="safety-list">
          <li>Tunisia is generally safe and welcoming for travelers. As anywhere, watch for petty theft in crowded medinas and on busy transport.</li>
          <li>Dress modestly at mosques and religious sites (shoulders and knees covered); some sites ask women to cover their hair.</li>
          <li>Check your government's current travel advisory for the remote southern and western border zones before heading there.</li>
          <li className="safety-inline-icons"><Sun size={13} /> Summer sun is intense — water, shade and sunscreen. <Droplets size={13} /> Carry a bottle on desert and medina walks.</li>
        </ul>
      </Section>

      <p className="safety-disclaimer">
        Details like fares, hours and holiday dates can change — treat this as a starting point and confirm anything time-sensitive locally.
      </p>
    </div>
  );
}
