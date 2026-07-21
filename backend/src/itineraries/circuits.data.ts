/**
 * CIRCUITS — curated Tunisian routes, hydrated from the live place catalog.
 *
 * A circuit template is editorial: it says "day 2 is Roman ruins in the
 * Téboursouk hills, budget two hours". It never hardcodes a place record.
 * `circuits.service` resolves each anchor against the real `places` table
 * (preferred slug first, then city + tags, then governorate), so every stop
 * a traveller sees has real coordinates, a real photo and a real page.
 *
 * That is the whole point: the old page shipped five Unsplash brochures that
 * led nowhere. These lead to the catalog, the map and the trip cart.
 */

/** What kind of stop this is — drives the default dwell time and the icon. */
export type AnchorKind =
    | 'sight' | 'ruins' | 'medina' | 'museum' | 'nature' | 'beach'
    | 'desert' | 'food' | 'viewpoint' | 'craft';

/** Default minutes on site when the place record has no `avgVisitMinutes`. */
export const DWELL_BY_KIND: Record<AnchorKind, number> = {
    sight: 90,
    ruins: 120,
    medina: 150,
    museum: 110,
    nature: 120,
    beach: 180,
    desert: 210,
    food: 75,
    viewpoint: 45,
    craft: 60,
};

export interface CircuitAnchor {
    /** Preferred catalog slugs, best first. Falls back to city/tag matching. */
    prefer?: string[];
    /** City to search when no preferred slug resolves. */
    city: string;
    /** Governorate — the widest fallback ring. */
    governorate: string;
    /** Any tag match boosts a candidate (case-insensitive). */
    tags?: string[];
    kind: AnchorKind;
    /** Editorial one-liner: why this stop earns its slot. */
    why: string;
    /** 1 = skeleton of the route, 3 = first thing to cut when days are short. */
    priority: 1 | 2 | 3;
    /** Override the kind's default dwell. */
    minutes?: number;
    /** Time-of-day the stop actually wants to be visited. */
    slot?: 'morning' | 'midday' | 'afternoon' | 'evening';
}

export interface CircuitTemplate {
    slug: string;
    title: string;
    /** Sub-line under the title in the card. */
    tagline: string;
    summary: string;
    theme: 'heritage' | 'desert' | 'coast' | 'culture' | 'nature' | 'food' | 'city';
    region: 'north' | 'centre' | 'south' | 'nationwide';
    difficulty: 'easy' | 'moderate' | 'challenging';
    /** Days the editorial version is written for. The remixer can reshape it. */
    defaultDays: number;
    /** Days the route still works in — [min, max]. */
    dayRange: [number, number];
    /** 1-indexed months this circuit is genuinely good in. */
    bestMonths: number[];
    /** Months to actively warn about, with the reason. */
    avoidMonths?: { months: number[]; reason: string };
    /** True when the whole route is reachable by louage / train / on foot. */
    carFree: boolean;
    /** Nightly lodging band per person in TND, mid-range. */
    stayBandTnd: number;
    /** Editorial notes shown in the "know before you go" panel. */
    knowHow: string[];
    /** Theme-specific packing list; merged with the universal one client-side. */
    packing: string[];
    anchors: CircuitAnchor[];
}

// ── The library ──────────────────────────────────────────────────────────

export const CIRCUIT_TEMPLATES: CircuitTemplate[] = [
    {
        slug: 'grand-tour',
        title: 'The Grand Tour',
        tagline: 'Tunis to the Sahara and back down the coast',
        summary:
            'The full length of the country in one loop: the capital and its Roman suburb, the Roman interior, the holy city, the amphitheatre, then down into the Sahara before returning along the Mediterranean. This is the route to take when it is your only trip to Tunisia.',
        theme: 'heritage',
        region: 'nationwide',
        difficulty: 'moderate',
        defaultDays: 10,
        dayRange: [7, 14],
        bestMonths: [3, 4, 5, 9, 10, 11],
        avoidMonths: { months: [7, 8], reason: 'The southern legs run 42 °C+ and the drives are long.' },
        carFree: false,
        stayBandTnd: 120,
        knowHow: [
            'Rent the car in Tunis and drop it in Tunis — one-way drops to Djerba carry a heavy fee.',
            'Fill the tank before Douz; stations thin out fast past Kébili.',
            'Friday midday is prayer time — mosques and some medina shops close for two hours.',
        ],
        packing: ['Sun hat', 'Refillable bottle (2 L)', 'Offline map pack', 'Cash — cards fail south of Gabès'],
        anchors: [
            { prefer: ['medina-tunis'], city: 'Tunis', governorate: 'Tunis', tags: ['Medina', 'UNESCO'], kind: 'medina', why: 'Start where the country started: 700 hectares of covered souk.', priority: 1, slot: 'morning' },
            { prefer: ['bardo-national-museum'], city: 'Le Bardo', governorate: 'Tunis', tags: ['Museum', 'Mosaics'], kind: 'museum', why: 'The largest Roman mosaic collection on earth — context for everything you will see next.', priority: 2, slot: 'afternoon' },
            { prefer: ['carthage-archaeological-site'], city: 'Carthage', governorate: 'Tunis', tags: ['UNESCO', 'Roman'], kind: 'ruins', why: 'Rome levelled it, then rebuilt on top. Both cities are still there.', priority: 1, slot: 'morning' },
            { prefer: ['sidi-bou-said'], city: 'Sidi Bou Said', governorate: 'Tunis', tags: ['Village', 'Scenic'], kind: 'viewpoint', why: 'Blue-and-white cliff village. Go late — the light does the work.', priority: 2, slot: 'evening' },
            { prefer: ['dougga-thugga'], city: 'Téboursouk', governorate: 'Béja', tags: ['UNESCO', 'Roman', 'Ruins'], kind: 'ruins', why: 'The best-preserved Roman town in North Africa, and you will have it nearly to yourself.', priority: 1, slot: 'morning' },
            { prefer: ['kairouan-great-mosque'], city: 'Kairouan', governorate: 'Kairouan', tags: ['UNESCO', 'Mosque', 'Islamic'], kind: 'sight', why: 'Islam’s fourth holy city; the mosque courtyard is a rainwater machine.', priority: 1, slot: 'morning' },
            { prefer: ['amphitheatre-el-jem'], city: 'El Jem', governorate: 'Mahdia', tags: ['UNESCO', 'Roman'], kind: 'ruins', why: 'A 35,000-seat amphitheatre in a town of 20,000. Walk the underground galleries.', priority: 1, slot: 'midday' },
            { prefer: ['matmata-troglodyte'], city: 'Matmata', governorate: 'Gabès', tags: ['Berber', 'Troglodyte'], kind: 'sight', why: 'Houses dug down, not built up — a working answer to 50 °C summers.', priority: 2, slot: 'afternoon' },
            { prefer: ['chott-el-jerid'], city: 'Tozeur', governorate: 'Tozeur', tags: ['Desert', 'Salt Lake'], kind: 'desert', why: 'Cross the salt flat at first light while the mirages are still running.', priority: 1, slot: 'morning' },
            { prefer: ['tozeur-oasis'], city: 'Tozeur', governorate: 'Tozeur', tags: ['Oasis', 'Palm Trees'], kind: 'nature', why: '200,000 palms on a grid of irrigation channels laid out in the 13th century.', priority: 2, slot: 'afternoon' },
            { city: 'Douz', governorate: 'Kebili', tags: ['Desert', 'Dunes'], kind: 'desert', why: 'The gate of the Sahara — dunes start where the last street ends.', priority: 2, slot: 'evening' },
            { prefer: ['djerba-island'], city: 'Houmt Souk', governorate: 'Medenine', tags: ['Island', 'Beach'], kind: 'beach', why: 'Wind down where Ulysses supposedly forgot to leave.', priority: 3, slot: 'midday' },
            { prefer: ['sousse'], city: 'Sousse', governorate: 'Sousse', tags: ['UNESCO', 'Medina', 'Beach'], kind: 'medina', why: 'A ribat you can climb for the whole coastline in one frame.', priority: 3, slot: 'afternoon' },
        ],
    },
    {
        slug: 'carthage-capital',
        title: 'Carthage & the Capital',
        tagline: 'Three days without ever needing a car',
        summary:
            'Tunis, its Roman suburb and the blue village on the cliff — all of it on the TGM light rail and on foot. The densest concentration of world heritage in the country, and the easiest circuit to run without driving.',
        theme: 'city',
        region: 'north',
        difficulty: 'easy',
        defaultDays: 3,
        dayRange: [2, 5],
        bestMonths: [3, 4, 5, 6, 9, 10, 11],
        carFree: true,
        stayBandTnd: 110,
        knowHow: [
            'The TGM from Tunis Marine reaches Carthage and Sidi Bou Said in ~30 min for under 1 TND.',
            'One ticket covers all seven Carthage archaeological sites — keep the stub.',
            'The Bardo closes Mondays. Plan around it or you will walk to a locked gate.',
        ],
        packing: ['Comfortable walking shoes', 'Light scarf for mosque visits', 'Transit change in coins'],
        anchors: [
            { prefer: ['medina-tunis'], city: 'Tunis', governorate: 'Tunis', tags: ['Medina', 'UNESCO'], kind: 'medina', why: 'Enter at Bab Bhar and get lost on purpose — every alley is a trade.', priority: 1, slot: 'morning' },
            { prefer: ['lablabi-street-food'], city: 'Tunis', governorate: 'Tunis', tags: ['Street Food', 'Breakfast'], kind: 'food', why: 'Bread torn into chickpea broth. The correct medina lunch.', priority: 2, slot: 'midday' },
            { prefer: ['marche-central-tunis'], city: 'Tunis', governorate: 'Tunis', tags: ['Market', 'Seafood'], kind: 'craft', why: 'Where the city actually shops — go before 11:00 or the fish is gone.', priority: 3, slot: 'morning' },
            { prefer: ['bardo-national-museum'], city: 'Le Bardo', governorate: 'Tunis', tags: ['Museum', 'Mosaics'], kind: 'museum', why: 'Give it three hours. The Virgil mosaic alone earns one.', priority: 1, slot: 'afternoon' },
            { prefer: ['carthage-archaeological-site'], city: 'Carthage', governorate: 'Tunis', tags: ['UNESCO', 'Punic', 'Roman'], kind: 'ruins', why: 'Byrsa hill first for the model of the Punic city, then the Antonine baths.', priority: 1, slot: 'morning' },
            { prefer: ['sidi-bou-said'], city: 'Sidi Bou Said', governorate: 'Tunis', tags: ['Village', 'Scenic'], kind: 'viewpoint', why: 'Climb to Café des Nattes, then down to the marina for sunset.', priority: 1, slot: 'evening' },
            { prefer: ['cafe-des-delices'], city: 'Sidi Bou Said', governorate: 'Tunis', tags: ['Cafe', 'Panoramic'], kind: 'food', why: 'Mint tea with pine nuts over the gulf. Touristy and worth it.', priority: 3, slot: 'evening' },
            { prefer: ['marche-central-tunis', 'dar-el-jeld'], city: 'Tunis', governorate: 'Tunis', tags: ['Fine Dining', 'Traditional'], kind: 'food', why: 'A merchant’s house turned dining room — book ahead.', priority: 3, slot: 'evening' },
        ],
    },
    {
        slug: 'sahara-ksour',
        title: 'Sahara & the Ksour',
        tagline: 'Salt flats, granaries and a night under the dunes',
        summary:
            'The south on its own terms: fortified Berber granaries, troglodyte villages, a salt lake wider than some countries, and dunes you sleep in. Long drives, enormous payoff.',
        theme: 'desert',
        region: 'south',
        difficulty: 'moderate',
        defaultDays: 5,
        dayRange: [4, 8],
        bestMonths: [10, 11, 12, 1, 2, 3],
        avoidMonths: { months: [6, 7, 8], reason: 'Daytime highs pass 45 °C and dune walking becomes dangerous.' },
        carFree: false,
        stayBandTnd: 95,
        knowHow: [
            'Desert camps take cash only. Draw money in Tozeur or Douz, not in the villages.',
            'Sand gets into everything — a cheap dry-bag for the camera is the best 20 TND you will spend.',
            'Night temperatures in the dunes drop near freezing in January. Bring a real layer.',
        ],
        packing: ['Chèche / head scarf', 'Headlamp', 'Dry-bag for camera', 'Warm layer for the desert night'],
        anchors: [
            { prefer: ['tozeur-oasis'], city: 'Tozeur', governorate: 'Tozeur', tags: ['Oasis', 'Palm Trees'], kind: 'nature', why: 'Walk the old brick quarter at golden hour — the patterns are load-bearing ornament.', priority: 1, slot: 'afternoon' },
            { prefer: ['chott-el-jerid'], city: 'Tozeur', governorate: 'Tozeur', tags: ['Desert', 'Salt Lake'], kind: 'desert', why: 'Seven thousand square kilometres of salt. Cross it early.', priority: 1, slot: 'morning' },
            { city: 'Tozeur', governorate: 'Tozeur', tags: ['Oasis', 'Mountain', 'Canyon'], kind: 'nature', why: 'The mountain oases — Chebika and Tamerza — hide waterfalls in bare rock.', priority: 2, slot: 'morning' },
            { city: 'Douz', governorate: 'Kebili', tags: ['Desert', 'Dunes', 'Camel'], kind: 'desert', why: 'Ride out an hour at dusk and the road noise simply stops.', priority: 1, slot: 'evening' },
            { prefer: ['matmata-troglodyte'], city: 'Matmata', governorate: 'Gabès', tags: ['Berber', 'Troglodyte'], kind: 'sight', why: 'Underground courtyards, still lived in, 20 °C cooler than the surface.', priority: 2, slot: 'midday' },
            { prefer: ['ksar-ouled-soltane'], city: 'Tataouine', governorate: 'Tataouine', tags: ['Ksar', 'Berber'], kind: 'ruins', why: 'Four storeys of vaulted grain cells around a courtyard. Come at low sun.', priority: 1, slot: 'afternoon' },
            { city: 'Tataouine', governorate: 'Tataouine', tags: ['Village', 'Berber', 'Hidden Gem'], kind: 'sight', why: 'The abandoned hill villages above the plain are the real find down here.', priority: 3, slot: 'morning' },
        ],
    },
    {
        slug: 'sahel-heritage',
        title: 'Sahel Heritage Run',
        tagline: 'Kairouan, El Jem, Sousse, Monastir',
        summary:
            'Four cities, four centuries of building in stone, inside a 120 km triangle. The tightest heritage-per-kilometre ratio in Tunisia — and every leg is on a good road or the Sahel metro.',
        theme: 'heritage',
        region: 'centre',
        difficulty: 'easy',
        defaultDays: 4,
        dayRange: [3, 6],
        bestMonths: [3, 4, 5, 6, 9, 10, 11],
        carFree: true,
        stayBandTnd: 100,
        knowHow: [
            'The Sahel metro links Sousse, Monastir and the airport for a couple of dinars.',
            'Kairouan sells the combined monument ticket only at the Aghlabid basins — buy it there first.',
            'El Jem is a stop on the Tunis–Sfax rail line; the amphitheatre is a five-minute walk from the platform.',
        ],
        packing: ['Modest layer for mosques', 'Sun hat', 'Rail timetable screenshot'],
        anchors: [
            { prefer: ['kairouan-great-mosque'], city: 'Kairouan', governorate: 'Kairouan', tags: ['UNESCO', 'Mosque'], kind: 'sight', why: 'Founded 670 CE. The columns were quarried from Roman Carthage.', priority: 1, slot: 'morning' },
            { city: 'Kairouan', governorate: 'Kairouan', tags: ['Medina', 'Souk', 'Artisanat'], kind: 'medina', why: 'Carpet workshops where the knot count is still argued over out loud.', priority: 2, slot: 'afternoon' },
            { prefer: ['amphitheatre-el-jem'], city: 'El Jem', governorate: 'Mahdia', tags: ['UNESCO', 'Roman'], kind: 'ruins', why: 'Go down into the beast pens before you climb the tiers.', priority: 1, slot: 'morning' },
            { prefer: ['sousse'], city: 'Sousse', governorate: 'Sousse', tags: ['UNESCO', 'Medina'], kind: 'medina', why: 'The ribat’s watchtower gives you the medina, the port and the coast at once.', priority: 1, slot: 'afternoon' },
            { prefer: ['monastir'], city: 'Monastir', governorate: 'Monastir', tags: ['Ribat', 'Beach'], kind: 'sight', why: 'The ribat played Jerusalem in Life of Brian. It also predates it by 800 years.', priority: 2, slot: 'morning' },
            { city: 'Mahdia', governorate: 'Mahdia', tags: ['Beach', 'Medina', 'Hidden Gem'], kind: 'beach', why: 'A cape medina with the best swimmable water on this coast.', priority: 3, slot: 'afternoon' },
        ],
    },
    {
        slug: 'cote-nord',
        title: 'North Coast & Kroumirie',
        tagline: 'Cork forest, coral coast, and the greenest Tunisia',
        summary:
            'The Tunisia that surprises people: oak forest, wild boar country, a lake that migrating flamingos plan their year around, and a coral coast with real diving. Cool when everywhere else is not.',
        theme: 'nature',
        region: 'north',
        difficulty: 'easy',
        defaultDays: 4,
        dayRange: [3, 6],
        bestMonths: [4, 5, 6, 7, 8, 9],
        avoidMonths: { months: [12, 1, 2], reason: 'Kroumirie gets genuine snow and the mountain roads turn slow.' },
        carFree: false,
        stayBandTnd: 105,
        knowHow: [
            'Ichkeul is best between November and February for the birds, but the walking is best in spring.',
            'Tabarka’s dive centres want a day’s notice in high season.',
            'Aïn Draham sits at 800 m — pack a jumper even in June.',
        ],
        packing: ['Light rain shell', 'Binoculars', 'Walking shoes with grip', 'Insect repellent'],
        anchors: [
            { city: 'Bizerte', governorate: 'Bizerte', tags: ['Port', 'Medina', 'Beach'], kind: 'medina', why: 'The old port is a working postcard: fishing boats, ochre walls, no ticket booth.', priority: 2, slot: 'morning' },
            { prefer: ['ichkeul-national-park'], city: 'Mateur', governorate: 'Bizerte', tags: ['UNESCO', 'Nature', 'Birds'], kind: 'nature', why: 'The last unspoiled link in a chain of North African lakes — 200,000 wintering birds.', priority: 1, slot: 'morning' },
            { prefer: ['tabarka'], city: 'Tabarka', governorate: 'Jendouba', tags: ['Beach', 'Diving', 'Coral'], kind: 'beach', why: 'Needle rocks offshore, Genoese fort onshore, coral in between.', priority: 1, slot: 'afternoon' },
            { prefer: ['ain-draham'], city: 'Aïn Draham', governorate: 'Jendouba', tags: ['Mountains', 'Forest', 'Hiking'], kind: 'nature', why: 'Red-roofed hill town in cork oak forest. It smells like nowhere else in the country.', priority: 2, slot: 'midday' },
            { city: 'Jendouba', governorate: 'Jendouba', tags: ['Roman', 'Ruins', 'Hidden Gem'], kind: 'ruins', why: 'Bulla Regia’s villas were built underground — mosaics still in place, still cool.', priority: 1, slot: 'morning' },
        ],
    },
    {
        slug: 'djerba-loop',
        title: 'Djerba & the Gulf',
        tagline: 'Island synagogue, potter village, desert edge',
        summary:
            'A slow island circuit with one foot on the mainland: the oldest synagogue in Africa, a village that has thrown pots for 2,000 years, street art in a Berber hamlet, and the troglodyte hills a short drive over the causeway.',
        theme: 'coast',
        region: 'south',
        difficulty: 'easy',
        defaultDays: 4,
        dayRange: [3, 7],
        bestMonths: [4, 5, 6, 9, 10, 11],
        carFree: false,
        stayBandTnd: 130,
        knowHow: [
            'The Roman causeway from Zarzis is free; the Ajim ferry costs a few dinars and takes cars.',
            'El Ghriba is busiest during the spring pilgrimage — expect security checks and no photos inside.',
            'Guellala potters fire in wood kilns most mornings; afternoons the workshops are shut.',
        ],
        packing: ['Reef shoes', 'Sun cream (island sun is deceptive)', 'Small bills for workshops'],
        anchors: [
            { prefer: ['djerba-island'], city: 'Houmt Souk', governorate: 'Medenine', tags: ['Island', 'Medina', 'Souk'], kind: 'medina', why: 'The fondouks around the fish auction are the best-preserved on the island.', priority: 1, slot: 'morning' },
            { city: 'Houmt Souk', governorate: 'Medenine', tags: ['Heritage', 'Synagogue', 'Hidden Gem'], kind: 'sight', why: 'El Ghriba has held continuous worship for well over a millennium.', priority: 1, slot: 'midday' },
            { prefer: ['guellala'], city: 'Guellala', governorate: 'Medenine', tags: ['Pottery', 'Artisanat', 'Craft'], kind: 'craft', why: 'Clay dug from the hill behind the village, fired the way it always was.', priority: 2, slot: 'morning' },
            { city: 'Medenine', governorate: 'Medenine', tags: ['Street Art', 'Village', 'Hidden Gem'], kind: 'sight', why: 'Erriadh’s Djerbahood walls: 150 murals across a whitewashed village.', priority: 2, slot: 'afternoon' },
            { prefer: ['matmata-troglodyte'], city: 'Matmata', governorate: 'Gabès', tags: ['Berber', 'Troglodyte'], kind: 'sight', why: 'One hour off the island and you are underground in a Berber courtyard.', priority: 3, slot: 'midday' },
            { city: 'Gabes', governorate: 'Gabès', tags: ['Oasis', 'Nature', 'Hidden Gem'], kind: 'nature', why: 'The only coastal oasis in the Mediterranean — palms, sea and henna in one frame.', priority: 3, slot: 'afternoon' },
        ],
    },
    {
        slug: 'cap-bon',
        title: 'Cap Bon Coastal',
        tagline: 'Pottery towns, thermal springs, and a Punic village',
        summary:
            'The peninsula that supplies Tunisia with citrus, ceramics and weekend beaches. Short hops, warm water, and the country’s best-preserved Punic site at the far end.',
        theme: 'coast',
        region: 'north',
        difficulty: 'easy',
        defaultDays: 3,
        dayRange: [2, 5],
        bestMonths: [5, 6, 7, 8, 9, 10],
        carFree: false,
        stayBandTnd: 115,
        knowHow: [
            'Nabeul’s pottery market runs on Friday mornings — the rest of the week is showroom prices.',
            'Korbous’s hot spring runs straight into the sea; go at low tide for a bearable mix.',
            'Kerkouane is closed Mondays and has no shade at all.',
        ],
        packing: ['Swimwear', 'Reef shoes for Korbous rocks', 'Bubble wrap if you plan to buy ceramics'],
        anchors: [
            { prefer: ['hammamet'], city: 'Hammamet', governorate: 'Nabeul', tags: ['Beach', 'Medina'], kind: 'beach', why: 'The kasbah wall drops straight into the sand — swim, then climb it.', priority: 1, slot: 'afternoon' },
            { prefer: ['nabeul'], city: 'Nabeul', governorate: 'Nabeul', tags: ['Pottery', 'Market', 'Artisanat'], kind: 'craft', why: 'Painted ceramics by the crate. Haggle in the workshops, not the shops.', priority: 1, slot: 'morning' },
            { city: 'Nabeul', governorate: 'Nabeul', tags: ['Punic', 'Ruins', 'Hidden Gem'], kind: 'ruins', why: 'Kerkouane is the only Punic town Rome never rebuilt over. The bathtubs are still pink.', priority: 1, slot: 'morning' },
            { city: 'Nabeul', governorate: 'Nabeul', tags: ['Thermal', 'Nature', 'Hidden Gem'], kind: 'nature', why: 'Korbous: 50 °C spring water meeting the Mediterranean on a rock shelf.', priority: 2, slot: 'afternoon' },
            { city: 'Nabeul', governorate: 'Nabeul', tags: ['Beach', 'Island'], kind: 'beach', why: 'Kelibia’s fort looks over the clearest water on the peninsula.', priority: 2, slot: 'afternoon' },
        ],
    },
    {
        slug: 'tatooine-trail',
        title: 'The Tatooine Trail',
        tagline: 'Every Star Wars set still standing, in filming order',
        summary:
            'Lucas shot four films in southern Tunisia and most of the sets are still out there in the sand. This runs them in one line — Mos Espa, Lars homestead, the slave quarters, the Sidi Driss hotel — with the real Berber architecture they were built from.',
        theme: 'desert',
        region: 'south',
        difficulty: 'moderate',
        defaultDays: 4,
        dayRange: [3, 6],
        bestMonths: [10, 11, 12, 1, 2, 3, 4],
        avoidMonths: { months: [6, 7, 8], reason: 'The open sets have zero shade — midday there is genuinely unsafe in summer.' },
        carFree: false,
        stayBandTnd: 90,
        knowHow: [
            'Mos Espa is 20 km of piste off the Tozeur road — a 4×4 is not required but low clearance will hurt.',
            'The Lars homestead igloo sits at the edge of Chott el Jerid, unmarked. Save the pin offline.',
            'Sidi Driss in Matmata is a real hotel; you can sleep inside the Lars interior.',
        ],
        packing: ['Offline pins for unsigned sets', 'Dust mask', 'Two litres of water per person minimum'],
        anchors: [
            { prefer: ['chott-el-jerid'], city: 'Tozeur', governorate: 'Tozeur', tags: ['Star Wars', 'Salt Lake'], kind: 'desert', why: 'The Lars homestead dome sits on the salt crust, mostly unrestored.', priority: 1, slot: 'morning' },
            { city: 'Tozeur', governorate: 'Tozeur', tags: ['Star Wars', 'Desert', 'Film'], kind: 'desert', why: 'Mos Espa, still standing in the Ong Jemel dunes, slowly losing to the sand.', priority: 1, slot: 'morning' },
            { prefer: ['matmata-troglodyte'], city: 'Matmata', governorate: 'Gabès', tags: ['Star Wars', 'Troglodyte'], kind: 'sight', why: 'The Lars interior is a functioning hotel courtyard. Have lunch in it.', priority: 1, slot: 'midday' },
            { prefer: ['ksar-ouled-soltane'], city: 'Tataouine', governorate: 'Tataouine', tags: ['Star Wars', 'Ksar'], kind: 'ruins', why: 'The slave quarters of Mos Espa — and a real 15th-century granary.', priority: 1, slot: 'afternoon' },
            { city: 'Tataouine', governorate: 'Tataouine', tags: ['Ksar', 'Berber', 'Hidden Gem'], kind: 'sight', why: 'Ksar Hadada played Mos Espa’s streets before it was half rebuilt as a hotel.', priority: 2, slot: 'morning' },
        ],
    },
    {
        slug: 'unesco-eight',
        title: 'The UNESCO Eight',
        tagline: 'Every World Heritage site in the country',
        summary:
            'Tunisia holds eight UNESCO World Heritage sites — more than Egypt has per square kilometre. This circuit takes all of them, in the only sequence that does not double back.',
        theme: 'heritage',
        region: 'nationwide',
        difficulty: 'moderate',
        defaultDays: 8,
        dayRange: [6, 12],
        bestMonths: [3, 4, 5, 10, 11],
        carFree: false,
        stayBandTnd: 115,
        knowHow: [
            'Buy the multi-site pass in Tunis — it covers Carthage, Dougga and Kerkouane.',
            'Dougga and Ichkeul have no food on site. Carry lunch.',
            'Kairouan asks for shoulders and knees covered at the Great Mosque, for all visitors.',
        ],
        packing: ['Site pass in a zip bag', 'Packed lunch for the rural sites', 'Wide-angle lens if you carry one'],
        anchors: [
            { prefer: ['medina-tunis'], city: 'Tunis', governorate: 'Tunis', tags: ['UNESCO', 'Medina'], kind: 'medina', why: 'Site 1 — the medina, inscribed 1979.', priority: 1, slot: 'morning' },
            { prefer: ['carthage-archaeological-site'], city: 'Carthage', governorate: 'Tunis', tags: ['UNESCO'], kind: 'ruins', why: 'Site 2 — Carthage, inscribed the same year.', priority: 1, slot: 'afternoon' },
            { prefer: ['ichkeul-national-park'], city: 'Mateur', governorate: 'Bizerte', tags: ['UNESCO', 'Nature'], kind: 'nature', why: 'Site 3 — the only natural inscription of the eight.', priority: 1, slot: 'morning' },
            { prefer: ['dougga-thugga'], city: 'Téboursouk', governorate: 'Béja', tags: ['UNESCO', 'Roman'], kind: 'ruins', why: 'Site 4 — Dougga, and the finest of them all.', priority: 1, slot: 'morning' },
            { city: 'Nabeul', governorate: 'Nabeul', tags: ['UNESCO', 'Punic'], kind: 'ruins', why: 'Site 5 — Kerkouane, the Punic town Rome missed.', priority: 1, slot: 'afternoon' },
            { prefer: ['kairouan-great-mosque'], city: 'Kairouan', governorate: 'Kairouan', tags: ['UNESCO', 'Mosque'], kind: 'sight', why: 'Site 6 — Kairouan, inscribed 1988.', priority: 1, slot: 'morning' },
            { prefer: ['sousse'], city: 'Sousse', governorate: 'Sousse', tags: ['UNESCO', 'Medina'], kind: 'medina', why: 'Site 7 — the Sousse medina and its ribat.', priority: 1, slot: 'afternoon' },
            { prefer: ['amphitheatre-el-jem'], city: 'El Jem', governorate: 'Mahdia', tags: ['UNESCO', 'Roman'], kind: 'ruins', why: 'Site 8 — El Jem, and the loudest full stop available.', priority: 1, slot: 'morning' },
        ],
    },
    {
        slug: 'weekend-tunis',
        title: '48 Hours in Tunis',
        tagline: 'A weekend, no car, no rush',
        summary:
            'Two days for people with two days. Medina in the morning, mosaics in the afternoon, the cliff village at sunset, and enough street food in between to justify the second day.',
        theme: 'city',
        region: 'north',
        difficulty: 'easy',
        defaultDays: 2,
        dayRange: [1, 3],
        bestMonths: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12],
        carFree: true,
        stayBandTnd: 100,
        knowHow: [
            'Stay inside the medina or on Avenue Bourguiba — everything below is then walkable or one TGM stop away.',
            'Sunday morning the medina is quiet and half shut; use it for Carthage instead.',
            'The louage station at Bab Saadoun is the fastest exit if you extend the trip.',
        ],
        packing: ['Day bag', 'Coins for the TGM', 'Appetite'],
        anchors: [
            { prefer: ['medina-tunis'], city: 'Tunis', governorate: 'Tunis', tags: ['Medina', 'UNESCO'], kind: 'medina', why: 'Zitouna mosque, then the souks radiating out from it by trade.', priority: 1, slot: 'morning' },
            { prefer: ['bambalouni'], city: 'Tunis', governorate: 'Tunis', tags: ['Street Food', 'Dessert'], kind: 'food', why: 'Hot doughnut in sugar, one dinar, eaten standing up. Non-negotiable.', priority: 2, slot: 'midday' },
            { prefer: ['bardo-national-museum'], city: 'Le Bardo', governorate: 'Tunis', tags: ['Museum', 'Mosaics'], kind: 'museum', why: 'Metro line 4 straight to the door. Two hours minimum.', priority: 1, slot: 'afternoon' },
            { prefer: ['sidi-bou-said'], city: 'Sidi Bou Said', governorate: 'Tunis', tags: ['Village', 'Scenic'], kind: 'viewpoint', why: 'Last TGM back runs late — stay for the sunset, you have time.', priority: 1, slot: 'evening' },
            { prefer: ['carthage-archaeological-site'], city: 'Carthage', governorate: 'Tunis', tags: ['UNESCO'], kind: 'ruins', why: 'Byrsa hill and the Antonine baths, in that order, before the heat.', priority: 2, slot: 'morning' },
            { prefer: ['la-goulette'], city: 'La Goulette', governorate: 'Tunis', tags: ['Seafood', 'Port'], kind: 'food', why: 'Grilled fish on the port road, priced by the kilo at the counter.', priority: 3, slot: 'evening' },
        ],
    },
    {
        slug: 'table-tunisienne',
        title: 'La Table Tunisienne',
        tagline: 'Three days eating your way from the port to the desert',
        summary:
            'Built entirely around what is on the plate: harissa at source, brik from a street stall, grilled fish at the port, dates picked off the palm, and one proper sit-down dinner in a merchant’s house.',
        theme: 'food',
        region: 'nationwide',
        difficulty: 'easy',
        defaultDays: 3,
        dayRange: [2, 5],
        bestMonths: [1, 2, 3, 4, 5, 9, 10, 11, 12],
        carFree: false,
        stayBandTnd: 110,
        knowHow: [
            'Breakfast is lablabi or a brik, not a pastry. Eat where the queue is.',
            'Deglet Nour dates are harvested October–December; anything else is last year’s stock.',
            'Ask for harissa "3andek" (yours) and you will get the house version, not the tube.',
        ],
        packing: ['Antacids, honestly', 'Cash for stalls', 'A cool bag if you buy harissa to take home'],
        anchors: [
            { prefer: ['marche-central-tunis'], city: 'Tunis', governorate: 'Tunis', tags: ['Market', 'Spices', 'Seafood'], kind: 'craft', why: 'Start at the source: spice stalls, harissa by the ladle, fish on ice.', priority: 1, slot: 'morning' },
            { prefer: ['lablabi-street-food'], city: 'Tunis', governorate: 'Tunis', tags: ['Street Food', 'Breakfast'], kind: 'food', why: 'The national breakfast: broth, bread, egg, harissa, olive oil.', priority: 1, slot: 'midday' },
            { prefer: ['bambalouni'], city: 'Tunis', governorate: 'Tunis', tags: ['Street Food', 'Dessert'], kind: 'food', why: 'Sugar and hot oil. The correct afternoon decision.', priority: 3, slot: 'afternoon' },
            { prefer: ['dar-el-jeld'], city: 'Tunis', governorate: 'Tunis', tags: ['Fine Dining', 'Traditional'], kind: 'food', why: 'The formal end of the spectrum, in an 18th-century townhouse.', priority: 2, slot: 'evening' },
            { prefer: ['marche-central-tunis'], city: 'La Goulette', governorate: 'Tunis', tags: ['Seafood', 'Port'], kind: 'food', why: 'Pick the fish, they weigh it, it comes back grilled with slata mechouia.', priority: 2, slot: 'evening' },
            { city: 'Sousse', governorate: 'Sousse', tags: ['Market', 'Street Food'], kind: 'food', why: 'Sahel pastry and the sweet end: makroud soaked in date syrup.', priority: 3, slot: 'afternoon' },
            { prefer: ['tozeur-oasis'], city: 'Tozeur', governorate: 'Tozeur', tags: ['Oasis', 'Dates'], kind: 'nature', why: 'Deglet Nour straight off the palm, still warm from the sun.', priority: 3, slot: 'morning' },
        ],
    },
    {
        slug: 'oasis-montagne',
        title: 'Mountain Oases',
        tagline: 'Chebika, Tamerza, Mides — waterfalls in bare rock',
        summary:
            'A short, spectacular loop on the Algerian border where three villages cling to canyons above palm springs. Half-day drives, big scenery, and the coolest air in the south.',
        theme: 'nature',
        region: 'south',
        difficulty: 'moderate',
        defaultDays: 3,
        dayRange: [2, 4],
        bestMonths: [10, 11, 12, 1, 2, 3, 4],
        avoidMonths: { months: [7, 8], reason: 'Canyon walking in 45 °C with no shade is a bad plan.' },
        carFree: false,
        stayBandTnd: 100,
        knowHow: [
            'Flash floods are real here — do not enter the Mides gorge if rain is forecast upstream.',
            'The old villages were abandoned after the 1969 floods; the new ones sit above them.',
            'Border zone: carry your passport, there are checkpoints.',
        ],
        packing: ['Grippy shoes for wet rock', 'Passport for checkpoints', 'Swim kit for the falls'],
        anchors: [
            { prefer: ['tozeur-oasis'], city: 'Tozeur', governorate: 'Tozeur', tags: ['Oasis', 'Palm Trees'], kind: 'nature', why: 'Base here — everything below is within an hour’s drive.', priority: 1, slot: 'afternoon' },
            { city: 'Tozeur', governorate: 'Tozeur', tags: ['Oasis', 'Canyon', 'Waterfall'], kind: 'nature', why: 'Chebika’s spring runs out of the rock face into a palm pocket.', priority: 1, slot: 'morning' },
            { city: 'Tozeur', governorate: 'Tozeur', tags: ['Canyon', 'Mountain', 'Hidden Gem'], kind: 'nature', why: 'Tamerza’s abandoned village opposite its own waterfall.', priority: 1, slot: 'midday' },
            { city: 'Tozeur', governorate: 'Tozeur', tags: ['Canyon', 'Gorge', 'Hidden Gem'], kind: 'viewpoint', why: 'Mides gorge drops 60 m straight down, 200 m from Algeria.', priority: 2, slot: 'afternoon' },
            { prefer: ['chott-el-jerid'], city: 'Tozeur', governorate: 'Tozeur', tags: ['Salt Lake', 'Desert'], kind: 'desert', why: 'Finish on the salt on the way back out.', priority: 3, slot: 'morning' },
        ],
    },
];

export const CIRCUIT_BY_SLUG = new Map(CIRCUIT_TEMPLATES.map((c) => [c.slug, c]));
