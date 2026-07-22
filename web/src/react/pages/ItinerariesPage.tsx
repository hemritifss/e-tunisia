import '../../styles/itineraries.css';
import React, { useEffect, useState } from 'react';
import { currentPath, onRouteChange } from '../../router';
import { isLoggedIn } from '../../api';
import PublicMasthead from '../components/public/PublicMasthead';
import PublicFooter from '../components/public/PublicFooter';
import CircuitsDirectory from './itineraries/CircuitsDirectory';
import CircuitDetail from './itineraries/CircuitDetail';

/**
 * `#/itineraries` — the circuit book.
 *
 * Was: five hardcoded brochures with an Unsplash cover and a "Save" button
 * that only fired a toast. Now: curated routes hydrated from the live place
 * catalog, remixable to the traveller's days/pace/transport/budget, and
 * exportable into the real trip cart. See design-system/pages/itineraries.md.
 */

function slugFromPath(): string | null {
  const m = currentPath().match(/^\/itineraries\/([a-z0-9-]{2,64})\/?$/i);
  return m ? m[1] : null;
}

export default function ItinerariesPage() {
  const [slug, setSlug] = useState(slugFromPath);
  useEffect(() => onRouteChange(() => setSlug(slugFromPath())), []);
  return (
    <>
      {!isLoggedIn() && <PublicMasthead active="itineraries" />}
      {slug ? <CircuitDetail key={slug} slug={slug} /> : <CircuitsDirectory />}
      {!isLoggedIn() && <PublicFooter />}
    </>
  );
}
