import '../../styles/gems.css';
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Gem, Camera, MapPin, LocateFixed, Send, CheckCircle2, Share2, ArrowRight, Loader2 } from 'lucide-react';
import * as api from '../../api';
import { requireAuth, showToast } from '../../ui-utils';
import { goTo, absoluteUrl } from '../../router';
import { track } from '../../analytics';

// The contribution ladder's top rung (GROWTH.md §3), kept dead simple:
// photo → pin → one line. AI enriches server-side; 2 friends confirm → it's live,
// credited "Discovered by you" forever.

type Phase = 'form' | 'submitting' | 'done' | 'duplicate';

export default function SubmitGemPage() {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null); // data URL preview
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [result, setResult] = useState<api.GemSubmitResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => { requireAuth('share a hidden gem'); }, []);

  // Mini map with a draggable pin — the heart of the flow.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { center: [34.8, 9.5], zoom: 6, zoomControl: true, attributionControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19 }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => placePin(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 120);
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  const placePin = (lat: number, lng: number, fly = false) => {
    const map = mapRef.current;
    if (!map) return;
    setCoords({ lat, lng });
    if (!markerRef.current) {
      const m = L.marker([lat, lng], { draggable: true });
      m.on('dragend', () => { const p = m.getLatLng(); setCoords({ lat: p.lat, lng: p.lng }); });
      m.addTo(map);
      markerRef.current = m;
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (fly) map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { showToast('Location not available on this device', { type: 'error' }); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); placePin(pos.coords.latitude, pos.coords.longitude, true); },
      () => { setLocating(false); showToast('Could not get your location — tap the map to drop the pin', { type: 'error' }); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { showToast('Photo too large (max 8MB)', { type: 'error' }); return; }
    const r = new FileReader();
    r.onload = (ev) => setPhoto((ev.target?.result as string) || null);
    r.readAsDataURL(f);
  };

  const submit = async () => {
    if (phase === 'submitting') return;
    if (name.trim().length < 2) { showToast('Give your gem a name', { type: 'info' }); return; }
    if (note.trim().length < 5) { showToast('One line: why is it special?', { type: 'info' }); return; }
    if (!coords) { showToast('Drop the pin where it is', { type: 'info' }); return; }
    setPhase('submitting');
    try {
      // Upload the photo first (if any) so the gem lands with its cover.
      const images: string[] = [];
      if (photo) {
        try { images.push(await api.uploadDataUrl(photo, 'gems')); }
        catch { showToast('Photo upload failed — submitting without it', { type: 'info' }); }
      }
      const res = await api.submitGem({
        name: name.trim(), description: note.trim(),
        latitude: coords.lat, longitude: coords.lng, images,
      });
      setResult(res);
      track('gem_submit', { duplicate: res.duplicate });
      setPhase(res.duplicate ? 'duplicate' : 'done');
    } catch (err: any) {
      setPhase('form');
      showToast(err?.message || 'Could not submit — try again', { type: 'error' });
    }
  };

  const shareGem = async () => {
    if (!result?.place?.id) return;
    const url = absoluteUrl(`/place/${result.place.id}`);
    const data = { title: result.place.name, text: 'I found a hidden gem — confirm it so it goes on the map!', url };
    if ((navigator as any).share) { try { await (navigator as any).share(data); return; } catch { /* cancelled */ } }
    try { await navigator.clipboard.writeText(url); showToast('Link copied — send it to 2 friends!'); } catch { /* ignore */ }
  };

  if (phase === 'done' && result) {
    return (
      <div className="gem-page page-enter">
        <div className="gem-success">
          <div className="gem-success-icon"><CheckCircle2 size={34} /></div>
          <h1>“{result.place.name}” is submitted 💎</h1>
          <p>
            It goes live on the map once <strong>{result.needsConfirmations || 2} people confirm it</strong> —
            and it will say <strong>“Discovered by you”</strong> forever.
          </p>
          <div className="gem-success-actions">
            <button className="btn btn-primary" onClick={shareGem}><Share2 /> Ask friends to confirm</button>
            <a className="btn btn-outline" href={`#/place/${result.place.id}`}>View my gem <ArrowRight /></a>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'duplicate' && result) {
    return (
      <div className="gem-page page-enter">
        <div className="gem-success">
          <div className="gem-success-icon gem-dup-icon"><MapPin size={34} /></div>
          <h1>Already on the map!</h1>
          <p><strong>{result.place.name}</strong> is right there — even better: confirm it and earn XP.</p>
          <div className="gem-success-actions">
            <a className="btn btn-primary" href={`#/place/${result.place.id}`}>Open it <ArrowRight /></a>
            <button className="btn btn-outline" onClick={() => setPhase('form')}>Submit a different spot</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gem-page page-enter">
      <header className="gem-header">
        <span className="gem-kicker"><Gem size={13} /> Put it on the map</span>
        <h1>Share a hidden gem</h1>
        <p>A photo, a pin, one line. The community confirms it — and it's credited to you forever.</p>
      </header>

      <div className="gem-form">
        <label className={`gem-photo ${photo ? 'has-photo' : ''}`} onClick={() => fileRef.current?.click()}>
          {photo ? <img src={photo} alt="Your gem" /> : (
            <span className="gem-photo-empty"><Camera size={22} /> Add a photo</span>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} />
        </label>

        <div className="gem-fields">
          <input
            className="input" type="text" maxLength={120} value={name}
            placeholder="What's it called? (e.g. Plage el Bekalta)"
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="input" rows={2} maxLength={300} value={note}
            placeholder="One line: why is it special? (go at sunset, park at the mosque…)"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="gem-map-wrap">
          <div ref={mapEl} className="gem-map" aria-label="Drop a pin where the gem is" />
          <button className="btn btn-outline gem-locate" type="button" onClick={useMyLocation} disabled={locating}>
            {locating ? <Loader2 className="animate-spin" size={15} /> : <LocateFixed size={15} />}
            {coords ? 'Pin dropped — drag to adjust' : "I'm standing there now"}
          </button>
        </div>

        <button className="btn btn-primary gem-submit" type="button" onClick={submit} disabled={phase === 'submitting'}>
          {phase === 'submitting' ? <><Loader2 className="animate-spin" size={16} /> Submitting…</> : <><Send size={16} /> Submit my gem</>}
        </button>
        <p className="gem-fineprint">We'll auto-detect the city from your pin and polish the description. Duplicates are detected automatically.</p>
      </div>
    </div>
  );
}
