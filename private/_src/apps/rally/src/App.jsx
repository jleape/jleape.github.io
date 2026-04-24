/* Extracted from Claude Design prototype — see scripts/extract.py */
import React, { useState, useEffect, useMemo, useCallback, useContext, createContext, useRef } from "react";
// ============================================================
// ICONS (inline SVG to keep portable)
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', className = '' }) => {
  const paths = {
    home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2V9z',
    compass: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3.5 6.5l-2 6-6 2 2-6 6-2z',
    calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM3 10h18M8 2v4M16 2v4',
    bus: 'M8 3h8a4 4 0 0 1 4 4v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a4 4 0 0 1 4-4zM4 10h16M7 18v2M17 18v2',
    dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
    domain: 'M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16zM9 8h2M9 12h2M9 16h2M13 8h2M13 12h2M13 16h2',
    check: 'M9 16l-4-4 1.4-1.4L9 13.2l8.6-8.6L19 6z',
    chevronLeft: 'M15 18l-6-6 6-6',
    chevronRight: 'M9 18l6-6-6-6',
    chevronDown: 'M6 9l6 6 6-6',
    chevronUp: 'M6 15l6-6 6 6',
    plus: 'M12 5v14M5 12h14',
    close: 'M18 6L6 18M6 6l12 12',
    bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 0 1-3.46 0',
    music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
    account: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    ticket: 'M20 12V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4M20 12v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4M20 12a2 2 0 1 0 0 4M4 12a2 2 0 1 1 0 4',
    share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    greeting: 'M10 14l-3 3h7l3-3H10zM15 8l3-3h-7l-3 3h7z',
    settings: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
    image: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8.5 12l2.5 3 3.5-4.5L19 17H5z',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    megaphone: 'M3 11l18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6',
    book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
    school: 'M22 10l-10-5-10 5 10 5 10-5zM6 12v5a6 3 0 0 0 12 0v-5M22 10v6',
    disc: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    magic: 'M4.8 3h6.4M8 3v18M4.8 21h6.4M19 14h-4l-1.5-3.5L12 14H8l3-3-3-3h4l1.5 3.5L15 8h4z',
    feather: 'M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z',
    dots: 'M5 12h.01M12 12h.01M19 12h.01',
    masks: 'M4 8a6 6 0 0 1 12 0v5a6 6 0 0 1-12 0zM8 19a6 6 0 0 0 12 0V14a6 6 0 0 0-6-6',
    cocktail: 'M8 21h8M12 15v6M4 3h16l-8 12L4 3z',
    fork: 'M8 2v20M16 2v7a5 5 0 0 1-5 5M16 14v8',
    store: 'M3 9l1-5h16l1 5M4 9v11h16V9M9 21V13h6v8',
    video: 'M22 8l-6 4 6 4V8zM2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2V6z',
    stadium: 'M5 21V7l7-4 7 4v14M9 21v-6h6v6',
    tree: 'M12 2L8 8h3v8h2V8h3z M12 22v-6',
    church: 'M12 2l-4 4v4h-2v12h4v-6h4v6h4V10h-2V6l-4-4z',
    palette: 'M12 2a10 10 0 1 0 0 20c1 0 2-1 2-2v-1a2 2 0 0 1 2-2h2a5 5 0 0 0 5-5 10 10 0 0 0-11-10z',
    apt: 'M4 21h16V3H4v18zM9 21v-6h6v6M9 7h1M14 7h1M9 11h1M14 11h1',
    house: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2V9z',
    fence: 'M3 22v-7h3v-4l2-2v6h3v-4l2-2v6h3v-4l2-2v6h3v7',
    stairs: 'M3 21h4v-4h4v-4h4v-4h4v-4h4',
    hand: 'M18 11V6a2 2 0 0 0-4 0v5M14 11V4a2 2 0 0 0-4 0v7M10 11V6a2 2 0 0 0-4 0v8M18 9a2 2 0 0 1 4 0v5a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
    decagram: 'M12 2l2.39 4.85L20 8.27l-3.9 3.8.92 5.38L12 14.77l-5.02 2.68.92-5.38L4 8.27l5.61-1.42L12 2z',
    checkCircle: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
    login: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
    party: 'M21 15.5l-3-3 3-3M3 8.5l3 3-3 3M11 7l2 10M17 4l2 3M5 20l2-3',
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={paths[name] ?? paths.dots} />
    </svg>
  );
};

// ============================================================
// CONSTANTS
// ============================================================
const TALENT_TYPES = [
  { value: 'musician', label: 'Musician', icon: 'music' },
  { value: 'comedian', label: 'Comedian', icon: 'megaphone' },
  { value: 'speaker', label: 'Speaker', icon: 'mic' },
  { value: 'author', label: 'Author', icon: 'book' },
  { value: 'instructor', label: 'Instructor', icon: 'school' },
  { value: 'dj', label: 'DJ', icon: 'disc' },
  { value: 'magician', label: 'Magician', icon: 'magic' },
  { value: 'poet', label: 'Poet', icon: 'feather' },
  { value: 'other', label: 'Other', icon: 'dots' },
];

const VENUE_TYPES = [
  { value: 'theatre', label: 'Theatre', icon: 'masks' },
  { value: 'bar', label: 'Bar', icon: 'cocktail' },
  { value: 'restaurant', label: 'Restaurant', icon: 'fork' },
  { value: 'studio', label: 'Studio', icon: 'video' },
  { value: 'arena', label: 'Arena', icon: 'stadium' },
  { value: 'park', label: 'Park', icon: 'tree' },
  { value: 'gallery', label: 'Gallery', icon: 'palette' },
  { value: 'apartment', label: 'Apartment', icon: 'apt' },
  { value: 'house', label: 'House', icon: 'house' },
  { value: 'backyard', label: 'Backyard', icon: 'fence' },
  { value: 'basement', label: 'Basement', icon: 'stairs' },
  { value: 'classroom', label: 'Classroom', icon: 'school' },
  { value: 'church', label: 'Church', icon: 'church' },
  { value: 'store', label: 'Store', icon: 'store' },
];

// ============================================================
// MOCK DATA
// ============================================================
const CITIES = [
  { name: 'New York', region: 'NY', lat: 40.71, lng: -74.01, pop: 8336 },
  { name: 'Los Angeles', region: 'CA', lat: 34.05, lng: -118.24, pop: 3979 },
  { name: 'Chicago', region: 'IL', lat: 41.88, lng: -87.63, pop: 2694 },
  { name: 'Houston', region: 'TX', lat: 29.76, lng: -95.37, pop: 2320 },
  { name: 'Phoenix', region: 'AZ', lat: 33.45, lng: -112.07, pop: 1681 },
  { name: 'Philadelphia', region: 'PA', lat: 39.95, lng: -75.17, pop: 1603 },
  { name: 'Dallas', region: 'TX', lat: 32.78, lng: -96.80, pop: 1344 },
  { name: 'Austin', region: 'TX', lat: 30.27, lng: -97.74, pop: 1025 },
  { name: 'San Francisco', region: 'CA', lat: 37.77, lng: -122.42, pop: 874 },
  { name: 'Seattle', region: 'WA', lat: 47.61, lng: -122.33, pop: 738 },
  { name: 'Denver', region: 'CO', lat: 39.74, lng: -104.99, pop: 716 },
  { name: 'Nashville', region: 'TN', lat: 36.16, lng: -86.78, pop: 689 },
  { name: 'Boston', region: 'MA', lat: 42.36, lng: -71.06, pop: 676 },
  { name: 'Portland', region: 'OR', lat: 45.52, lng: -122.68, pop: 653 },
  { name: 'Las Vegas', region: 'NV', lat: 36.17, lng: -115.14, pop: 641 },
  { name: 'Atlanta', region: 'GA', lat: 33.75, lng: -84.39, pop: 499 },
  { name: 'Miami', region: 'FL', lat: 25.76, lng: -80.19, pop: 443 },
  { name: 'Minneapolis', region: 'MN', lat: 44.98, lng: -93.27, pop: 429 },
  { name: 'New Orleans', region: 'LA', lat: 29.95, lng: -90.07, pop: 383 },
  { name: 'Salt Lake City', region: 'UT', lat: 40.76, lng: -111.89, pop: 200 },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const uid = (() => { let i = 0; return (p = 'id') => `${p}${++i}`; })();

function generateMockData() {
  const TALENT_NAMES = ['Luna Rivera','Marcus Chen','Aisha Patel','Diego Morales','Sienna Brooks','Kai Nakamura','Zoe Williams','Priya Sharma','Jasper Thornton','Mia Fontaine','Ethan Kowalski','Elena Volkov'];
  const FAN_NAMES = ['Alex Morgan','Casey Johnson','Jamie Rivera','Taylor Brooks','Morgan Lee','Riley Smith','Quinn Adams','Avery Taylor','Drew Campbell','Sage Mitchell','Cameron White','Hayden Clark','Dakota Evans','Reese Martin','Finley Garcia','Charlie Anderson','Parker Wilson','Rowan Martinez','Skyler Brown','Jesse Davis'];
  const VENUE_NAMES = ['The Blue Note','Starlight Theatre','Brick & Mortar','The Velvet Lounge','Underground Club','The Green Room','Moonlight Bar','Liberty Hall','The Jazz Corner','Crystal Ballroom','Warehouse 23','The Hive'];

  const profiles = [];
  const talents = [];
  const venues = [];
  const tours = [];
  const shows = [];
  const commitments = [];
  const follows = [];
  const tour_follows = [];
  const venue_follows = [];
  const venue_offers = [];
  const notifications = [];

  // Current user (the viewer)
  const me = {
    id: 'me',
    display_name: 'You (Sample User)',
    city: 'Austin', region: 'TX',
    is_talent: true, is_venue_owner: true,
    role: 'fan',
    fan_preferences: ['musician', 'comedian'],
    social_links: { instagram: '@sampleuser', twitter: '@sampleuser' },
    avatar_url: null,
  };
  profiles.push(me);

  // My own talent profile
  const myTalent = { id: uid('t'), owner_id: 'me', talent_type: 'musician', categories: ['indie', 'folk'], image_url: null };
  talents.push(myTalent);

  // My own venue
  const myVenue = { id: uid('v'), owner_id: 'me', name: 'The Austin Sessions', venue_type: 'bar', city: 'Austin', region: 'TX', capacity: 150, sqft: 900, price_per_night: 600, hosted_talent_types: ['musician', 'comedian', 'poet'], verified: true, description: 'Intimate live music venue in downtown Austin.' };
  venues.push(myVenue);

  // Generate talents (each with a profile)
  TALENT_NAMES.forEach((name, i) => {
    const id = uid('u');
    const loc = pick(CITIES);
    const type = pick(TALENT_TYPES).value;
    profiles.push({ id, display_name: name, city: loc.name, region: loc.region, is_talent: true, is_venue_owner: false, role: 'talent', fan_preferences: [], social_links: { instagram: '@' + name.toLowerCase().replace(/\s/g, '') }, avatar_url: null });
    talents.push({ id: uid('t'), owner_id: id, talent_type: type, categories: [pick(['rock','jazz','indie','pop','electronic','standup','improv'])], image_url: null });
  });

  // Generate venues
  VENUE_NAMES.forEach((name, i) => {
    const id = uid('u');
    const loc = pick(CITIES);
    profiles.push({ id, display_name: name + ' Management', city: loc.name, region: loc.region, is_talent: false, is_venue_owner: true, role: 'venue', fan_preferences: [], social_links: {}, avatar_url: null });
    venues.push({
      id: uid('v'), owner_id: id, name, venue_type: pick(VENUE_TYPES).value,
      city: loc.name, region: loc.region,
      capacity: pick([50, 100, 200, 300, 500, 1000]),
      sqft: randInt(500, 5000),
      price_per_night: pick([300, 500, 750, 1000, 2000]),
      hosted_talent_types: pickN(TALENT_TYPES.map(t => t.value), randInt(2, 5)),
      verified: Math.random() > 0.5,
      description: `A ${name} in ${loc.name}.`
    });
  });

  // Generate fans
  FAN_NAMES.forEach((name, i) => {
    const id = uid('u');
    const loc = pick(CITIES);
    profiles.push({ id, display_name: name, city: loc.name, region: loc.region, is_talent: false, is_venue_owner: false, role: 'fan', fan_preferences: pickN(TALENT_TYPES.map(t => t.value), randInt(1, 3)), social_links: {}, avatar_url: null });
  });

  // Generate tours & shows
  const now = Date.now();
  talents.forEach((talent, i) => {
    if (i > 6) return; // only first 7 talents have tours
    const talentOwner = profiles.find(p => p.id === talent.owner_id);
    const startOffset = randInt(7, 60);
    const duration = randInt(14, 60);
    const start = new Date(now + startOffset * 86400000);
    const end = new Date(start.getTime() + duration * 86400000);
    const ticketPrice = pick([20, 25, 30, 45, 60]);
    const tourCities = pickN(CITIES, randInt(3, 6));

    const tour = {
      id: uid('T'),
      talent_id: talent.id,
      title: `${talentOwner.display_name} — Summer 2026 Tour`,
      description: `Join ${talentOwner.display_name} on an unforgettable tour.`,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      ticket_price: ticketPrice,
      rally_discount_pct: 20,
      vip_perks: 'Meet & greet + signed poster',
      venue_types: pickN(VENUE_TYPES.map(v => v.value), 3),
      min_net_revenue: 500,
      status: 'active',
      image_url: null,
    };
    tours.push(tour);

    tourCities.forEach((c, idx) => {
      const date = new Date(start.getTime() + (duration / tourCities.length) * idx * 86400000);
      const status = pick(['proposed', 'proposed', 'gathering', 'tentative_venue', 'confirmed']);
      const venue = status === 'confirmed' || status === 'tentative_venue' ? pick(venues.filter(v => v.city === c.name)) ?? null : null;
      shows.push({
        id: uid('S'),
        tour_id: tour.id,
        talent_id: talent.id,
        show_date: date.toISOString().split('T')[0],
        start_time: '20:00',
        city: c.name,
        region: c.region,
        venue_id: venue?.id ?? null,
        rally_count: randInt(3, 45),
        status,
        ticket_price: ticketPrice,
        total_tickets: venue?.capacity ?? 0,
        tickets_sold: status === 'confirmed' ? randInt(0, 20) : 0,
        sequence_order: idx,
      });
    });
  });

  // Generate a tour for me (the current user) starting in 2 weeks
  const myTourStart = new Date(now + 14 * 86400000);
  const myTourEnd = new Date(now + 60 * 86400000);
  const myTour = {
    id: uid('T'),
    talent_id: myTalent.id,
    title: 'My First Tour — 2026',
    description: 'Testing the waters with some intimate shows.',
    start_date: myTourStart.toISOString().split('T')[0],
    end_date: myTourEnd.toISOString().split('T')[0],
    ticket_price: 25,
    rally_discount_pct: 20,
    vip_perks: 'Hand-written thank you note + early entry',
    venue_types: ['bar', 'theatre'],
    min_net_revenue: 300,
    status: 'active',
    image_url: null,
  };
  tours.push(myTour);
  ['Austin', 'Nashville', 'New Orleans', 'Dallas'].forEach((cityName, idx) => {
    const city = CITIES.find(c => c.name === cityName);
    const date = new Date(myTourStart.getTime() + idx * 14 * 86400000);
    shows.push({
      id: uid('S'),
      tour_id: myTour.id,
      talent_id: myTalent.id,
      show_date: date.toISOString().split('T')[0],
      start_time: '20:00',
      city: city.name, region: city.region,
      venue_id: idx === 0 ? myVenue.id : null,
      rally_count: randInt(5, 25),
      status: idx === 0 ? 'confirmed' : (idx === 1 ? 'tentative_venue' : 'proposed'),
      ticket_price: 25,
      total_tickets: idx === 0 ? myVenue.capacity : 0,
      tickets_sold: 0,
      sequence_order: idx,
    });
  });

  // Generate commitments (me rallying for shows)
  shows.slice(0, 5).forEach(s => {
    if (s.talent_id !== myTalent.id) {
      commitments.push({ id: uid('c'), fan_id: 'me', show_id: s.id, engagement_type: 'rally', status: 'active' });
      s.rally_count++;
    }
  });

  // Random fan rallies
  profiles.filter(p => p.role === 'fan').forEach(fan => {
    pickN(shows, randInt(1, 3)).forEach(s => {
      commitments.push({ id: uid('c'), fan_id: fan.id, show_id: s.id, engagement_type: 'rally', status: 'active' });
    });
  });

  // Me following some talent
  talents.slice(1, 5).forEach(t => {
    follows.push({ id: uid('f'), follower_id: 'me', following_id: t.owner_id });
  });

  // Fans following me + other talent
  profiles.filter(p => p.role === 'fan').forEach(fan => {
    pickN(talents, randInt(1, 4)).forEach(t => {
      follows.push({ id: uid('f'), follower_id: fan.id, following_id: t.owner_id });
    });
  });

  // Me following some venues
  venues.slice(1, 4).forEach(v => {
    venue_follows.push({ id: uid('vf'), user_id: 'me', venue_id: v.id });
  });

  // Some venue offers for my tour
  const myTourShows = shows.filter(s => s.tour_id === myTour.id);
  venues.filter(v => v.owner_id !== 'me').slice(0, 3).forEach(v => {
    const show = pick(myTourShows.filter(s => s.status !== 'confirmed'));
    if (show) {
      venue_offers.push({
        id: uid('vo'),
        venue_id: v.id,
        show_id: show.id,
        status: 'pending',
        is_tentative: false,
      });
    }
  });

  // Notifications
  notifications.push(
    { id: uid('n'), user_id: 'me', type: 'show_confirmed', title: 'Show confirmed!', body: 'Your Austin show is confirmed at The Austin Sessions.', read: false, created_at: new Date(now - 3600000).toISOString() },
    { id: uid('n'), user_id: 'me', type: 'venue_matched', title: 'Venue interested', body: 'Crystal Ballroom wants to host your Nashville show.', read: false, created_at: new Date(now - 7200000).toISOString() },
    { id: uid('n'), user_id: 'me', type: 'rally_reminder', title: 'Your rally is gaining momentum!', body: 'Luna Rivera\'s show in Austin has 12 more fans since you rallied.', read: true, created_at: new Date(now - 86400000).toISOString() },
    { id: uid('n'), user_id: 'me', type: 'tour_launched', title: 'New tour near you', body: 'Marcus Chen just launched a tour including Austin.', read: true, created_at: new Date(now - 172800000).toISOString() },
  );

  return { profiles, talents, venues, tours, shows, commitments, follows, tour_follows, venue_follows, venue_offers, notifications };
}

// ============================================================
// STATE MANAGEMENT
// ============================================================
const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

function AppProvider({ children }) {
  const [data, setData] = useState(() => {
    const stored = localStorage.getItem('rally_data');
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return generateMockData();
  });
  const [currentUserId] = useState('me');
  const [route, setRoute] = useState({ name: 'tabs', params: {} });
  const [activeTab, setActiveTab] = useState('home');

  // Save to localStorage on changes
  useEffect(() => { localStorage.setItem('rally_data', JSON.stringify(data)); }, [data]);

  const me = data.profiles.find(p => p.id === currentUserId);
  const myTalents = data.talents.filter(t => t.owner_id === currentUserId);
  const myVenues = data.venues.filter(v => v.owner_id === currentUserId);

  const updateProfile = (updates) => {
    setData(d => ({ ...d, profiles: d.profiles.map(p => p.id === currentUserId ? { ...p, ...updates } : p) }));
  };

  const switchRole = (role) => updateProfile({ role });

  const toggleTalent = (talentType) => {
    const existing = myTalents.find(t => t.talent_type === talentType);
    if (existing) {
      setData(d => ({ ...d, talents: d.talents.filter(t => t.id !== existing.id) }));
      if (myTalents.length === 1) updateProfile({ is_talent: false });
    } else {
      setData(d => ({
        ...d,
        talents: [...d.talents, { id: uid('t'), owner_id: currentUserId, talent_type: talentType, categories: [], image_url: null }],
      }));
      if (!me.is_talent) updateProfile({ is_talent: true });
    }
  };

  const enableVenue = () => updateProfile({ is_venue_owner: true, role: 'venue' });

  const togglePreference = (v) => {
    const prefs = me.fan_preferences ?? [];
    const updated = prefs.includes(v) ? prefs.filter(p => p !== v) : [...prefs, v];
    updateProfile({ fan_preferences: updated });
  };

  // Shows/rallies
  const toggleRally = (showId) => {
    const existing = data.commitments.find(c => c.fan_id === currentUserId && c.show_id === showId && c.status === 'active');
    if (existing) {
      setData(d => ({
        ...d,
        commitments: d.commitments.filter(c => c.id !== existing.id),
        shows: d.shows.map(s => s.id === showId ? { ...s, rally_count: Math.max(0, s.rally_count - 1) } : s),
      }));
    } else {
      setData(d => ({
        ...d,
        commitments: [...d.commitments, { id: uid('c'), fan_id: currentUserId, show_id: showId, engagement_type: 'rally', status: 'active' }],
        shows: d.shows.map(s => s.id === showId ? { ...s, rally_count: s.rally_count + 1 } : s),
      }));
    }
  };

  const isRallied = (showId) => data.commitments.some(c => c.fan_id === currentUserId && c.show_id === showId && c.status === 'active');

  // Follows
  const toggleFollow = (profileId) => {
    const existing = data.follows.find(f => f.follower_id === currentUserId && f.following_id === profileId);
    if (existing) {
      setData(d => ({ ...d, follows: d.follows.filter(f => f.id !== existing.id) }));
    } else {
      setData(d => ({ ...d, follows: [...d.follows, { id: uid('f'), follower_id: currentUserId, following_id: profileId }] }));
    }
  };
  const isFollowing = (profileId) => data.follows.some(f => f.follower_id === currentUserId && f.following_id === profileId);

  // Show follows
  const toggleShowFollow = (showId, tourId) => {
    const existing = data.tour_follows.find(f => f.fan_id === currentUserId && f.show_id === showId);
    if (existing) {
      setData(d => ({ ...d, tour_follows: d.tour_follows.filter(f => f.id !== existing.id) }));
    } else {
      setData(d => ({ ...d, tour_follows: [...d.tour_follows, { id: uid('tf'), fan_id: currentUserId, tour_id: tourId, show_id: showId }] }));
    }
  };
  const isFollowingShow = (showId) => data.tour_follows.some(f => f.fan_id === currentUserId && f.show_id === showId);

  // Venue follows
  const toggleVenueFollow = (venueId) => {
    const existing = data.venue_follows.find(v => v.user_id === currentUserId && v.venue_id === venueId);
    if (existing) {
      setData(d => ({ ...d, venue_follows: d.venue_follows.filter(v => v.id !== existing.id) }));
    } else {
      setData(d => ({ ...d, venue_follows: [...d.venue_follows, { id: uid('vf'), user_id: currentUserId, venue_id: venueId }] }));
    }
  };
  const isFollowingVenue = (venueId) => data.venue_follows.some(v => v.user_id === currentUserId && v.venue_id === venueId);

  // Venue offers
  const offerVenue = (venueId, showId) => {
    const existing = data.venue_offers.find(o => o.venue_id === venueId && o.show_id === showId);
    if (existing) return;
    setData(d => ({ ...d, venue_offers: [...d.venue_offers, { id: uid('vo'), venue_id: venueId, show_id: showId, status: 'pending', is_tentative: false }] }));
  };
  const withdrawOffer = (venueId, showId) => {
    setData(d => ({ ...d, venue_offers: d.venue_offers.filter(o => !(o.venue_id === venueId && o.show_id === showId)) }));
  };
  const confirmVenueForShow = (showId, venueId, capacity) => {
    setData(d => ({
      ...d,
      shows: d.shows.map(s => s.id === showId ? { ...s, status: 'confirmed', venue_id: venueId, total_tickets: capacity } : s),
      venue_offers: d.venue_offers.map(o => o.show_id === showId ? { ...o, status: o.venue_id === venueId ? 'accepted' : 'rejected', is_tentative: false } : o),
    }));
  };
  const rejectOffer = (offerId) => {
    setData(d => ({ ...d, venue_offers: d.venue_offers.map(o => o.id === offerId ? { ...o, status: 'rejected' } : o) }));
  };

  // Tours & venues
  const addTour = (tour, shows) => {
    const tourId = uid('T');
    const newTour = { ...tour, id: tourId, status: 'active' };
    const newShows = shows.map((s, i) => ({ ...s, id: uid('S'), tour_id: tourId, talent_id: tour.talent_id, status: 'proposed', rally_count: 0, tickets_sold: 0, total_tickets: 0, venue_id: null, sequence_order: i, start_time: '20:00' }));
    setData(d => ({ ...d, tours: [...d.tours, newTour], shows: [...d.shows, ...newShows] }));
  };

  const deleteTour = (tourId) => {
    setData(d => ({
      ...d,
      tours: d.tours.filter(t => t.id !== tourId),
      shows: d.shows.filter(s => s.tour_id !== tourId),
    }));
  };

  const addVenue = (venue) => {
    setData(d => ({ ...d, venues: [...d.venues, { ...venue, id: uid('v'), owner_id: currentUserId, verified: false }] }));
  };

  const deleteVenue = (venueId) => {
    setData(d => ({ ...d, venues: d.venues.filter(v => v.id !== venueId) }));
  };

  // Notifications
  const markNotificationRead = (id) => {
    setData(d => ({ ...d, notifications: d.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
  };

  const resetData = () => {
    localStorage.removeItem('rally_data');
    setData(generateMockData());
  };

  const value = {
    data, setData, me, myTalents, myVenues, currentUserId,
    route, setRoute, activeTab, setActiveTab,
    updateProfile, switchRole, toggleTalent, enableVenue, togglePreference,
    toggleRally, isRallied,
    toggleFollow, isFollowing,
    toggleShowFollow, isFollowingShow,
    toggleVenueFollow, isFollowingVenue,
    offerVenue, withdrawOffer, confirmVenueForShow, rejectOffer,
    addTour, deleteTour, addVenue, deleteVenue,
    markNotificationRead,
    resetData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================================
// HELPERS
// ============================================================
const formatDate = (iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!iso) return '—';
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', opts); } catch { return iso; }
};
const formatDateShort = (iso) => formatDate(iso, { month: 'short', day: 'numeric' });
const formatDateFull = (iso) => formatDate(iso, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const distanceMiles = (a, b) => {
  const R = 3959;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const optimizeRoute = (cities, start) => {
  const remaining = [...cities];
  const ordered = [];
  let current = start;
  while (remaining.length > 0) {
    let idx = 0, dist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = distanceMiles(current, { lat: remaining[i].lat, lng: remaining[i].lng });
      if (d < dist) { dist = d; idx = i; }
    }
    const nearest = remaining.splice(idx, 1)[0];
    ordered.push(nearest);
    current = { lat: nearest.lat, lng: nearest.lng };
  }
  return ordered;
};

const distributeDates = (count, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.max(1, Math.round((end - start) / 86400000));
  if (count === 1) return [new Date(start.getTime() + totalDays / 2 * 86400000).toISOString().split('T')[0]];
  const interval = totalDays / (count - 1);
  return Array.from({ length: count }, (_, i) =>
    new Date(start.getTime() + interval * i * 86400000).toISOString().split('T')[0]
  );
};

const STATUS_META = {
  proposed: { label: 'Proposed', color: '#6B7280', bg: '#6B728020' },
  gathering: { label: 'Gathering', color: '#F59E0B', bg: '#F59E0B20' },
  tentative_venue: { label: 'Tentative', color: '#F59E0B', bg: '#F59E0B20' },
  confirmed: { label: 'Confirmed', color: '#10B981', bg: '#10B98120' },
  sold_out: { label: 'Sold Out', color: '#6C63FF', bg: '#6C63FF20' },
  completed: { label: 'Completed', color: '#6B7280', bg: '#6B728020' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#EF444420' },
};

// ============================================================
// REUSABLE COMPONENTS
// ============================================================
const Avatar = ({ name, size = 40 }) => (
  <div className="rounded-full flex items-center justify-center font-semibold text-white" style={{ width: size, height: size, background: 'var(--primary)', fontSize: size * 0.4 }}>
    {(name ?? '??').substring(0, 2).toUpperCase()}
  </div>
);

const Chip = ({ children, selected, onClick, icon, style }) => (
  <button
    onClick={onClick}
    className={`chip ${selected ? 'chip-sel' : ''}`}
    style={style}
    type="button"
  >
    {icon && <Icon name={icon} size={12} />}
    {children}
  </button>
);

const StatusChip = ({ status }) => {
  const meta = STATUS_META[status] ?? STATUS_META.proposed;
  return (
    <span style={{ padding: '3px 8px', borderRadius: 10, background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
      {meta.label}
    </span>
  );
};

const TypePicker = ({ options, selected, onToggle, label, single }) => (
  <div className="mb-3">
    {label && <div className="label">{label}</div>}
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSel = selected.includes(opt.value);
        return (
          <button key={opt.value} type="button"
            className={`chip ${isSel ? 'chip-sel' : ''}`}
            onClick={() => onToggle(opt.value)}
          >
            <Icon name={opt.icon} size={14} />
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

// ============================================================
// DATE RANGE CALENDAR
// ============================================================
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDay = (y, m) => new Date(y, m, 1).getDay();
const toDateStr = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function DateRangeCalendar({ startDate, endDate, onChange }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectingEnd, setSelectingEnd] = useState(false);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const handleDay = (day) => {
    const d = toDateStr(year, month, day);
    if (d < todayStr) return;
    if (!startDate || (startDate && endDate) || !selectingEnd) {
      onChange(d, '');
      setSelectingEnd(true);
    } else {
      if (d < startDate) onChange(d, startDate);
      else onChange(startDate, d);
      setSelectingEnd(false);
    }
  };

  const goPrev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const goNext = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const isInRange = (d) => startDate && endDate && d >= startDate && d <= endDate;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className={`card flex-1 p-3 ${!startDate || !selectingEnd ? 'ring-2 ring-indigo-500' : ''}`}>
          <div className="text-xs text-gray-500 font-semibold">START</div>
          <div className="font-semibold">{startDate ? formatDate(startDate) : 'Select'}</div>
        </div>
        <Icon name="chevronRight" size={16} color="#6B7280" />
        <div className={`card flex-1 p-3 ${selectingEnd ? 'ring-2 ring-indigo-500' : ''}`}>
          <div className="text-xs text-gray-500 font-semibold">END</div>
          <div className="font-semibold">{endDate ? formatDate(endDate) : 'Select'}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <button type="button" onClick={goPrev}><Icon name="chevronLeft" size={24} /></button>
          <div className="font-semibold">{MONTHS[month]} {year}</div>
          <button type="button" onClick={goNext}><Icon name="chevronRight" size={24} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAY_LABELS.map((d, i) => <div key={i} className="text-center text-xs text-gray-500 font-semibold py-1">{d}</div>)}
          {Array.from({ length: totalCells }, (_, i) => {
            const day = i - firstDay + 1;
            if (day < 1 || day > daysInMonth) return <div key={i} />;
            const d = toDateStr(year, month, day);
            const isPast = d < todayStr;
            const isStart = d === startDate;
            const isEnd = d === endDate;
            const inRange = isInRange(d);
            const isToday = d === todayStr;
            return (
              <button key={i} type="button" onClick={() => handleDay(day)} disabled={isPast}
                className="aspect-square flex items-center justify-center text-sm rounded-full"
                style={{
                  background: (isStart || isEnd) ? 'var(--primary)' : inRange ? 'var(--primary)25' : 'transparent',
                  color: (isStart || isEnd) ? 'white' : isPast ? '#D1D5DB' : inRange ? 'var(--primary)' : 'var(--text)',
                  fontWeight: (isStart || isEnd) ? 700 : 400,
                  border: isToday && !isStart && !isEnd && !inRange ? '1.5px solid var(--primary)' : 'none',
                  opacity: isPast ? 0.5 : 1,
                  cursor: isPast ? 'not-allowed' : 'pointer',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {startDate && !endDate && (
        <div className="text-center text-sm font-medium mt-2" style={{ color: 'var(--primary)' }}>
          Now tap the end date
        </div>
      )}
    </div>
  );
}

// Month calendar with event dots
function MonthCalendar({ events, onDayClick }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const eventsByDate = useMemo(() => {
    const m = {};
    for (const e of events) {
      if (!m[e.date]) m[e.date] = [];
      m[e.date].push(e);
    }
    return m;
  }, [events]);

  const goPrev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const goNext = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-2">
        <button type="button" onClick={goPrev}><Icon name="chevronLeft" size={24} /></button>
        <div className="font-semibold">{MONTHS[month]} {year}</div>
        <button type="button" onClick={goNext}><Icon name="chevronRight" size={24} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d, i) => <div key={i} className="text-center text-xs text-gray-500 font-semibold py-1">{d}</div>)}
        {Array.from({ length: totalCells }, (_, i) => {
          const day = i - firstDay + 1;
          if (day < 1 || day > daysInMonth) return <div key={i} />;
          const d = toDateStr(year, month, day);
          const isToday = d === todayStr;
          const dayEvents = eventsByDate[d] ?? [];
          return (
            <button key={i} type="button"
              onClick={() => onDayClick && onDayClick(d, dayEvents)}
              className="aspect-square flex flex-col items-center justify-center text-sm rounded"
              style={{
                border: isToday ? '1.5px solid var(--primary)' : 'none',
                background: dayEvents.length > 0 ? 'var(--primary)08' : 'transparent',
                cursor: onDayClick ? 'pointer' : 'default',
              }}
            >
              <span>{day}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from(new Set(dayEvents.map(e => e.color))).slice(0, 3).map((c, idx) => (
                    <div key={idx} style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// SCREENS
// ============================================================

// ---------- HOME ----------
function HomeScreen() {
  const app = useApp();
  const { me, myTalents, myVenues, data } = app;
  const [showTalentPicker, setShowTalentPicker] = useState(false);

  const followers = data.follows.filter(f => f.following_id === me.id).length;
  const following = data.follows.filter(f => f.follower_id === me.id).length;
  const venueFollowsCount = data.venue_follows.filter(v => v.user_id === me.id).length;
  const myTours = data.tours.filter(t => myTalents.some(mt => mt.id === t.talent_id));

  const allRoles = [
    { key: 'fan', label: 'Fan', icon: 'account', enabled: true },
    { key: 'talent', label: 'Talent', icon: 'mic', enabled: me.is_talent },
    { key: 'venue', label: 'Host', icon: 'domain', enabled: me.is_venue_owner },
  ];

  const handleRoleSwitch = (role) => {
    if (role === 'talent' && !me.is_talent) { setShowTalentPicker(true); return; }
    if (role === 'venue' && !me.is_venue_owner) { app.enableVenue(); return; }
    app.switchRole(role);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={me.display_name} size={56} />
        <div className="flex-1">
          <div className="font-bold text-lg">{me.display_name}</div>
          <div className="text-sm text-gray-500">{me.city}, {me.region}</div>
        </div>
        <button className="btn btn-text" onClick={() => app.setRoute({ name: 'notifications' })}>
          <Icon name="bell" size={18} />
        </button>
      </div>

      {/* Dashboard stats */}
      <div className="card mb-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xl font-bold">{followers}</div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
          <div>
            <div className="text-xl font-bold">{following}</div>
            <div className="text-xs text-gray-500">Following</div>
          </div>
          <div>
            <div className="text-xl font-bold">{myVenues.length}</div>
            <div className="text-xs text-gray-500">Venues</div>
          </div>
          <div>
            <div className="text-xl font-bold">{myTours.length}</div>
            <div className="text-xs text-gray-500">Tours</div>
          </div>
        </div>
      </div>

      {/* Social accounts */}
      <div className="card mb-4">
        <div className="font-semibold mb-2">Social Accounts</div>
        {Object.entries(me.social_links ?? {}).length > 0 ? (
          <div className="space-y-1">
            {Object.entries(me.social_links).map(([k, v]) => (
              <div key={k} className="text-sm"><span className="font-medium capitalize">{k}:</span> <span className="text-gray-600">{v}</span></div>
            ))}
          </div>
        ) : <div className="text-sm text-gray-500">No accounts linked</div>}
      </div>

      {/* Role toggle */}
      <div className="font-semibold mb-2">Switch Role</div>
      <div className="flex gap-2 mb-4">
        {allRoles.map(r => (
          <button key={r.key} type="button"
            onClick={() => handleRoleSwitch(r.key)}
            className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-3xl font-semibold text-sm"
            style={{
              background: me.role === r.key ? 'var(--primary)' : 'var(--bg)',
              color: me.role === r.key ? 'white' : r.enabled ? 'var(--text2)' : '#D1D5DB',
              border: `1.5px ${!r.enabled && me.role !== r.key ? 'dashed' : 'solid'} ${me.role === r.key ? 'var(--primary)' : 'var(--border)'}`,
            }}
          >
            <Icon name={r.icon} size={18} />
            {r.label}
          </button>
        ))}
      </div>

      {/* Talent picker modal */}
      {showTalentPicker && (
        <div className="card mb-4 animate-slide-up">
          <div className="font-semibold mb-2">Share Your Talent</div>
          <div className="text-sm text-gray-500 mb-3">Pick a talent type to get started</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {TALENT_TYPES.map(t => (
              <button key={t.value} type="button" className="chip"
                onClick={() => {
                  app.toggleTalent(t.value);
                  setShowTalentPicker(false);
                  app.switchRole('talent');
                }}
              >
                <Icon name={t.icon} size={14} /> {t.label}
              </button>
            ))}
          </div>
          <button className="btn btn-text" onClick={() => setShowTalentPicker(false)}>Cancel</button>
        </div>
      )}

      {/* Role-specific section */}
      {me.role === 'fan' && (
        <div className="card">
          <div className="font-semibold mb-1">My Interests</div>
          <div className="text-sm text-gray-500 mb-3">Filters shows across the app</div>
          <TypePicker
            options={TALENT_TYPES}
            selected={me.fan_preferences ?? []}
            onToggle={app.togglePreference}
          />
        </div>
      )}

      {me.role === 'talent' && (
        <div className="card">
          <div className="font-semibold mb-1">My Talents</div>
          <div className="text-sm text-gray-500 mb-3">Tap to toggle — these determine tour options</div>
          <TypePicker
            options={TALENT_TYPES}
            selected={myTalents.map(t => t.talent_type)}
            onToggle={app.toggleTalent}
          />
        </div>
      )}

      {me.role === 'venue' && (
        <div className="card">
          <div className="font-semibold mb-1">Talents I Host</div>
          <div className="text-sm text-gray-500 mb-3">Filter shows to talent types your venues support</div>
          <TypePicker
            options={TALENT_TYPES}
            selected={me.fan_preferences ?? []}
            onToggle={app.togglePreference}
          />
        </div>
      )}

      <button className="btn btn-text w-full mt-6 text-sm" onClick={app.resetData}>Reset Demo Data</button>
      <div className="h-8" />
    </div>
  );
}

// ---------- EXPLORE (Fan) ----------
function ExploreScreen() {
  const app = useApp();
  const { data, me } = app;
  const [search, setSearch] = useState('');
  const [city, setCity] = useState(me.city ?? '');
  const [typeFilter, setTypeFilter] = useState(null);
  const [confirmedOnly, setConfirmedOnly] = useState(false);

  const followedTalentProfileIds = data.follows.filter(f => f.follower_id === me.id).map(f => f.following_id);

  const allShows = useMemo(() => {
    return data.shows.filter(s => ['proposed', 'gathering', 'tentative_venue', 'confirmed'].includes(s.status));
  }, [data.shows]);

  const filtered = useMemo(() => {
    let shows = allShows;
    if (typeFilter) {
      const talentIds = data.talents.filter(t => t.talent_type === typeFilter).map(t => t.id);
      shows = shows.filter(s => talentIds.includes(s.talent_id));
    }
    if (confirmedOnly) shows = shows.filter(s => s.status === 'confirmed');
    if (search.trim()) {
      const q = search.toLowerCase();
      shows = shows.filter(s => {
        const tour = data.tours.find(t => t.id === s.tour_id);
        const talent = data.talents.find(t => t.id === s.talent_id);
        const talentProfile = data.profiles.find(p => p.id === talent?.owner_id);
        return s.city.toLowerCase().includes(q) || tour?.title.toLowerCase().includes(q) || talentProfile?.display_name.toLowerCase().includes(q);
      });
    }
    return shows;
  }, [allShows, search, typeFilter, confirmedOnly]);

  const followedShows = filtered.filter(s => {
    const talent = data.talents.find(t => t.id === s.talent_id);
    return talent && followedTalentProfileIds.includes(talent.owner_id);
  });

  const cityShows = city.trim() ? filtered.filter(s => s.city.toLowerCase() === city.toLowerCase()) : [];

  const trendingShows = [...filtered].sort((a, b) => b.rally_count - a.rally_count).slice(0, 10);

  return (
    <div className="p-4">
      <div className="relative mb-2">
        <Icon name="search" size={18} color="#6B7280" className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input className="input pl-10" placeholder="Search shows, talent, cities..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-2 pb-1">
        {TALENT_TYPES.map(t => (
          <Chip key={t.value} icon={t.icon} selected={typeFilter === t.value} onClick={() => setTypeFilter(typeFilter === t.value ? null : t.value)}>
            {t.label}
          </Chip>
        ))}
        <Chip selected={confirmedOnly} onClick={() => setConfirmedOnly(!confirmedOnly)}>Confirmed</Chip>
      </div>

      <div className="mb-3">
        <div className="label">City</div>
        <input className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="Enter city..." />
      </div>

      {search.trim() && (
        <Section title="Search Results" count={filtered.length}>
          {filtered.map(s => <ShowCard key={s.id} show={s} />)}
          {filtered.length === 0 && <EmptyText>No shows match your search</EmptyText>}
        </Section>
      )}

      {followedShows.length > 0 && (
        <Section title="From Talent You Follow">
          {followedShows.map(s => <ShowCard key={s.id} show={s} />)}
        </Section>
      )}

      {city.trim() && (
        <Section title={`In ${city}`} count={cityShows.length}>
          {cityShows.map(s => <ShowCard key={s.id} show={s} />)}
          {cityShows.length === 0 && <EmptyText>No shows in {city}</EmptyText>}
        </Section>
      )}

      <Section title="Trending">
        {trendingShows.map(s => <ShowCard key={s.id} show={s} />)}
      </Section>
      <div className="h-8" />
    </div>
  );
}

// ---------- UPCOMING (Fan calendar) ----------
function UpcomingScreen() {
  const app = useApp();
  const { data, me } = app;

  const rallied = data.commitments.filter(c => c.fan_id === me.id && c.status === 'active');
  const followed = data.tour_follows.filter(f => f.fan_id === me.id && f.show_id);

  const events = useMemo(() => {
    const result = [];
    for (const c of rallied) {
      const show = data.shows.find(s => s.id === c.show_id);
      if (show) result.push({ date: show.show_date, show, kind: 'rallied', color: show.status === 'confirmed' ? 'var(--success)' : 'var(--primary)' });
    }
    for (const f of followed) {
      const show = data.shows.find(s => s.id === f.show_id);
      if (show && !result.some(r => r.show.id === show.id)) {
        result.push({ date: show.show_date, show, kind: 'following', color: show.status === 'confirmed' ? 'var(--success)' : '#5A52D5' });
      }
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [rallied, followed, data.shows]);

  return (
    <div className="p-4">
      <MonthCalendar events={events} />

      <div className="mt-4">
        <div className="font-semibold mb-2">Your Events ({events.length})</div>
        {events.length === 0 ? (
          <div className="card text-center text-gray-500 py-8">Rally for shows to see them here</div>
        ) : (
          events.map(e => {
            const tour = data.tours.find(t => t.id === e.show.tour_id);
            const talent = data.talents.find(t => t.id === e.show.talent_id);
            const talentProfile = data.profiles.find(p => p.id === talent?.owner_id);
            return (
              <div key={e.show.id} className="card mb-2" onClick={() => app.setRoute({ name: 'show', params: { id: e.show.id } })} style={{ cursor: 'pointer' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold">{tour?.title}</div>
                  <span className="text-xs font-bold capitalize" style={{ color: e.color }}>{e.kind}</span>
                </div>
                <div className="text-sm text-gray-600">{talentProfile?.display_name} · {e.show.city}</div>
                <div className="text-sm text-gray-500 mt-1">{formatDateFull(e.show.show_date)}</div>
                <StatusChip status={e.show.status} />
              </div>
            );
          })
        )}
      </div>
      <div className="h-8" />
    </div>
  );
}

// ---------- TOURS (Talent) ----------
function ToursScreen() {
  const app = useApp();
  const { data, myTalents } = app;
  const [expanded, setExpanded] = useState(null);

  const myTours = data.tours.filter(t => myTalents.some(mt => mt.id === t.talent_id));

  return (
    <div className="p-4 relative h-full">
      <div className="pb-20">
        {myTours.length === 0 ? (
          <div className="card text-center py-10">
            <Icon name="bus" size={40} color="#D1D5DB" className="mx-auto" />
            <div className="font-semibold mt-2">No tours yet</div>
            <div className="text-sm text-gray-500 mt-1">Create your first tour to let fans rally for you</div>
          </div>
        ) : (
          myTours.map(tour => {
            const shows = data.shows.filter(s => s.tour_id === tour.id).sort((a, b) => a.show_date.localeCompare(b.show_date));
            const isOpen = expanded === tour.id;
            return (
              <div key={tour.id} className="card mb-3">
                <div className="flex items-center cursor-pointer" onClick={() => setExpanded(isOpen ? null : tour.id)}>
                  <div className="flex-1">
                    <div className="font-bold">{tour.title}</div>
                    {tour.start_date && <div className="text-xs text-gray-500 mt-1">{formatDateShort(tour.start_date)} → {formatDateShort(tour.end_date)}</div>}
                    <div className="text-xs text-gray-500 mt-1">{shows.length} shows · ${tour.ticket_price}/ticket</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this tour?')) app.deleteTour(tour.id); }} className="p-2">
                    <Icon name="trash" size={16} color="#EF4444" />
                  </button>
                  <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={18} color="#6B7280" />
                </div>
                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {shows.map(s => {
                      const venue = s.venue_id ? data.venues.find(v => v.id === s.venue_id) : null;
                      return (
                        <div key={s.id} className="flex items-center py-2 border-b last:border-0 cursor-pointer" onClick={() => app.setRoute({ name: 'show', params: { id: s.id } })}>
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{s.city}, {s.region}</div>
                            <div className="text-xs text-gray-500">{formatDateShort(s.show_date)} · {venue?.name ?? 'Venue TBD'}</div>
                          </div>
                          <div className="text-xs text-indigo-500 font-medium mr-2">{s.rally_count} rallied</div>
                          <StatusChip status={s.status} />
                          <Icon name="chevronRight" size={16} color="#6B7280" className="ml-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => app.setRoute({ name: 'create-tour' })}
        className="absolute bottom-4 right-4 btn btn-primary shadow-lg"
        style={{ borderRadius: 28, padding: '14px 20px' }}
      >
        <Icon name="plus" size={20} color="white" /> Create Tour
      </button>
    </div>
  );
}

// ---------- DASHBOARD (Talent) ----------
function DashboardScreen() {
  const app = useApp();
  const { data, me, myTalents } = app;
  const myTours = data.tours.filter(t => myTalents.some(mt => mt.id === t.talent_id));
  const myShows = data.shows.filter(s => myTalents.some(mt => mt.id === s.talent_id));
  const totalRallied = myShows.reduce((sum, s) => sum + s.rally_count, 0);
  const confirmed = myShows.filter(s => s.status === 'confirmed').length;
  const followers = data.follows.filter(f => f.following_id === me.id).length;

  // Event dots for calendar
  const events = myShows.map(s => ({
    date: s.show_date, show: s,
    color: s.status === 'confirmed' ? 'var(--success)' : s.status === 'tentative_venue' ? 'var(--warning)' : 'var(--primary)',
  }));

  // Fan heatmap — cities where my followers live
  const followerCities = useMemo(() => {
    const m = {};
    data.follows.filter(f => f.following_id === me.id).forEach(f => {
      const p = data.profiles.find(pp => pp.id === f.follower_id);
      if (p?.city && p?.region) {
        const key = `${p.city}|${p.region}`;
        if (!m[key]) m[key] = { city: p.city, region: p.region, count: 0 };
        m[key].count++;
      }
    });
    return Object.values(m).sort((a, b) => b.count - a.count);
  }, [data.follows, data.profiles, me.id]);

  return (
    <div className="p-4">
      <div className="grid grid-cols-5 gap-2 mb-4 text-center">
        <Stat num={myTours.length} label="Tours" />
        <Stat num={myShows.length} label="Shows" />
        <Stat num={totalRallied} label="Rallied" />
        <Stat num={confirmed} label="Confirmed" />
        <Stat num={followers} label="Followers" />
      </div>

      <MonthCalendar events={events} />

      {myTours.map(tour => {
        const tourShows = myShows.filter(s => s.tour_id === tour.id).sort((a, b) => a.show_date.localeCompare(b.show_date));
        if (tourShows.length === 0) return null;
        const est = tourShows.reduce((sum, s) => sum + s.rally_count * tour.ticket_price * (1 - tour.rally_discount_pct / 100), 0);

        return (
          <div key={tour.id} className="mt-4">
            <div className="font-bold">{tour.title}</div>
            <div className="text-xs text-gray-500 mb-1">{formatDateShort(tour.start_date)} → {formatDateShort(tour.end_date)}</div>
            <div className="text-xs text-green-600 font-semibold mb-2">Est. Revenue: ${Math.round(est).toLocaleString()}</div>
            {tourShows.map(s => {
              const venue = s.venue_id ? data.venues.find(v => v.id === s.venue_id) : null;
              return (
                <div key={s.id} className="card mb-2 cursor-pointer" onClick={() => app.setRoute({ name: 'show', params: { id: s.id } })}>
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{s.city}, {s.region}</div>
                      <div className="text-xs text-gray-500">{formatDateShort(s.show_date)} · {venue?.name ?? 'Venue TBD'}</div>
                    </div>
                    <div className="text-xs text-indigo-500 font-medium mr-2">{s.rally_count} rallied</div>
                    <StatusChip status={s.status} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Fan heatmap */}
      {followerCities.length > 0 && (
        <div className="mt-6">
          <div className="font-bold mb-2">Fan Heatmap</div>
          <div className="card">
            {followerCities.slice(0, 10).map((fc, i) => {
              const max = followerCities[0].count;
              const hasShow = myShows.some(s => s.city === fc.city && s.region === fc.region);
              return (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${(fc.count / max) * 100}%`, background: hasShow ? 'var(--primary)' : 'var(--warning)' }} />
                  </div>
                  <div className="flex-1 text-sm">{fc.city}, {fc.region}</div>
                  <div className="text-xs text-gray-500">{fc.count}</div>
                  {hasShow && <Icon name="checkCircle" size={14} color="var(--success)" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}

// ---------- HOST EXPLORE ----------
function HostExploreScreen() {
  const app = useApp();
  const { data, myVenues } = app;
  const [selectedVenue, setSelectedVenue] = useState(myVenues[0]?.id ?? null);
  const [search, setSearch] = useState('');

  const offeredShows = useMemo(() => {
    const map = {};
    data.venue_offers.filter(o => myVenues.some(v => v.id === o.venue_id) && o.status === 'pending')
      .forEach(o => { map[o.show_id] = o.venue_id; });
    return map;
  }, [data.venue_offers, myVenues]);

  const shows = useMemo(() => {
    let result = data.shows.filter(s => ['proposed', 'gathering', 'tentative_venue'].includes(s.status));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => s.city.toLowerCase().includes(q));
    }
    return result.sort((a, b) => b.rally_count - a.rally_count);
  }, [data.shows, search]);

  const selectedVenueObj = myVenues.find(v => v.id === selectedVenue);

  if (myVenues.length === 0) {
    return (
      <div className="p-4">
        <div className="card text-center py-10">
          <Icon name="domain" size={40} color="#D1D5DB" className="mx-auto" />
          <div className="font-semibold mt-2">Add a venue to get started</div>
          <button className="btn btn-primary mt-3" onClick={() => app.setRoute({ name: 'add-venue' })}>Add Venue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-3">
        <div className="label">Offering as</div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {myVenues.map(v => (
            <Chip key={v.id} icon="domain" selected={selectedVenue === v.id} onClick={() => setSelectedVenue(v.id)}>
              {v.name} ({v.capacity})
            </Chip>
          ))}
        </div>
      </div>

      <div className="relative mb-3">
        <Icon name="search" size={18} color="#6B7280" className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input className="input pl-10" placeholder="Search shows by city..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {shows.map(s => {
        const tour = data.tours.find(t => t.id === s.tour_id);
        const talent = data.talents.find(t => t.id === s.talent_id);
        const talentProfile = data.profiles.find(p => p.id === talent?.owner_id);
        const isOffered = !!offeredShows[s.id];
        const offeredVenueName = isOffered ? myVenues.find(v => v.id === offeredShows[s.id])?.name : null;
        return (
          <div key={s.id} className="card mb-2 cursor-pointer" onClick={() => app.setRoute({ name: 'show', params: { id: s.id } })}>
            <div className="font-semibold">{tour?.title}</div>
            <div className="text-sm text-gray-600">{talentProfile?.display_name} · {s.city}, {s.region}</div>
            <div className="text-sm text-gray-500 mt-1">{formatDateShort(s.show_date)} · {s.rally_count} rallied</div>
            {isOffered ? (
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--success)' }}>
                  <Icon name="checkCircle" size={14} color="var(--success)" /> Offered: {offeredVenueName}
                </div>
                <button className="btn btn-text text-sm" onClick={(e) => { e.stopPropagation(); app.withdrawOffer(offeredShows[s.id], s.id); }}>
                  Withdraw
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-500">as {selectedVenueObj?.name}</div>
                <button className="btn btn-primary text-xs" onClick={(e) => { e.stopPropagation(); app.offerVenue(selectedVenue, s.id); }}>
                  Offer to Host
                </button>
              </div>
            )}
          </div>
        );
      })}
      <div className="h-8" />
    </div>
  );
}

// ---------- MY VENUES (Host) ----------
function VenuesScreen() {
  const app = useApp();
  const { myVenues } = app;
  return (
    <div className="p-4 relative h-full">
      <div className="pb-20">
        {myVenues.length === 0 ? (
          <div className="card text-center py-10">
            <Icon name="domain" size={40} color="#D1D5DB" className="mx-auto" />
            <div className="font-semibold mt-2">No venues yet</div>
            <div className="text-sm text-gray-500">Add your first venue to start hosting shows</div>
          </div>
        ) : (
          myVenues.map(v => {
            const typeInfo = VENUE_TYPES.find(vt => vt.value === v.venue_type);
            return (
              <div key={v.id} className="card mb-2 cursor-pointer" onClick={() => app.setRoute({ name: 'venue', params: { id: v.id } })}>
                <div className="flex items-center">
                  <Icon name={typeInfo?.icon ?? 'domain'} size={22} color="var(--primary)" />
                  <div className="flex-1 ml-3">
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-xs text-gray-500">{v.city}, {v.region} · {v.capacity} cap · {v.sqft} sqft</div>
                  </div>
                  {v.verified && <Icon name="decagram" size={14} color="var(--success)" />}
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete venue?')) app.deleteVenue(v.id); }} className="p-2">
                    <Icon name="trash" size={14} color="var(--error)" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <button onClick={() => app.setRoute({ name: 'add-venue' })} className="absolute bottom-4 right-4 btn btn-primary shadow-lg" style={{ borderRadius: 28, padding: '14px 20px' }}>
        <Icon name="plus" size={20} color="white" /> Add Venue
      </button>
    </div>
  );
}

// ---------- BOOKINGS (Host calendar) ----------
function BookingsScreen() {
  const app = useApp();
  const { data, myVenues } = app;
  const myOffers = data.venue_offers.filter(o => myVenues.some(v => v.id === o.venue_id));
  const events = useMemo(() => {
    const result = [];
    for (const o of myOffers) {
      const show = data.shows.find(s => s.id === o.show_id);
      if (show) {
        result.push({
          date: show.show_date, show, offer: o,
          color: o.is_tentative ? 'var(--warning)' : o.status === 'accepted' ? 'var(--success)' : 'var(--primary)',
        });
      }
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [myOffers, data.shows]);

  return (
    <div className="p-4">
      <MonthCalendar events={events} />
      <div className="mt-4">
        <div className="font-semibold mb-2">Your Bookings ({events.length})</div>
        {events.length === 0 ? (
          <div className="card text-center text-gray-500 py-8">Offer to host shows to see bookings here</div>
        ) : (
          events.map(e => {
            const tour = data.tours.find(t => t.id === e.show.tour_id);
            const venue = data.venues.find(v => v.id === e.offer.venue_id);
            const status = e.offer.status === 'accepted' ? 'Confirmed' : e.offer.is_tentative ? 'Tentative' : 'Pending';
            return (
              <div key={e.show.id} className="card mb-2 cursor-pointer" onClick={() => app.setRoute({ name: 'show', params: { id: e.show.id } })}>
                <div className="font-semibold">{tour?.title}</div>
                <div className="text-sm text-gray-600">{e.show.city} · {venue?.name}</div>
                <div className="text-sm text-gray-500">{formatDateShort(e.show.show_date)} · {e.show.rally_count} rallied</div>
                <div className="text-xs font-bold mt-1" style={{ color: e.color }}>{status}</div>
              </div>
            );
          })
        )}
      </div>
      <div className="h-8" />
    </div>
  );
}

// ---------- NOTIFICATIONS ----------
function NotificationsScreen() {
  const app = useApp();
  const notifs = app.data.notifications.filter(n => n.user_id === app.me.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const iconFor = (type) => ({
    tour_launched: 'bus', threshold_met: 'checkCircle', show_confirmed: 'party',
    venue_matched: 'domain', rally_reminder: 'greeting', ticket_available: 'ticket',
    follow_new: 'account', chat_message: 'mic', general: 'bell',
  }[type] ?? 'bell');
  return (
    <ScreenHeader title="Notifications" onBack={() => app.setRoute({ name: 'tabs' })}>
      <div className="p-4">
        {notifs.length === 0 ? (
          <div className="card text-center py-10">No notifications yet</div>
        ) : (
          notifs.map(n => (
            <div key={n.id} className="card mb-2 flex gap-3 items-start cursor-pointer" onClick={() => app.markNotificationRead(n.id)}
              style={{ borderLeft: n.read ? 'none' : '3px solid var(--primary)' }}>
              <Icon name={iconFor(n.type)} size={20} color="var(--primary)" />
              <div className="flex-1">
                <div className="font-semibold text-sm">{n.title}</div>
                <div className="text-sm text-gray-600 mt-0.5">{n.body}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />}
            </div>
          ))
        )}
      </div>
    </ScreenHeader>
  );
}

// ---------- TOUR DETAIL ----------
function TourDetailScreen({ tourId }) {
  const app = useApp();
  const { data, me, myTalents } = app;
  const tour = data.tours.find(t => t.id === tourId);
  if (!tour) return <div className="p-4">Tour not found</div>;
  const talent = data.talents.find(t => t.id === tour.talent_id);
  const talentProfile = data.profiles.find(p => p.id === talent?.owner_id);
  const shows = data.shows.filter(s => s.tour_id === tourId).sort((a, b) => a.show_date.localeCompare(b.show_date));
  const isOwner = myTalents.some(mt => mt.id === tour.talent_id);

  return (
    <ScreenHeader title="Tour" onBack={() => window.history.back()}>
      <div className="p-4">
        <div className="card">
          <div className="font-bold text-xl">{tour.title}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-indigo-600 font-semibold cursor-pointer" onClick={() => app.setRoute({ name: 'talent', params: { id: talent.id } })}>
              {talentProfile?.display_name}
            </div>
            {!isOwner && talentProfile && (
              <button className={`chip ${app.isFollowing(talentProfile.id) ? 'chip-sel' : ''}`} onClick={() => app.toggleFollow(talentProfile.id)}>
                {app.isFollowing(talentProfile.id) ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          <div className="text-sm text-gray-600 mt-2">{tour.description}</div>
          <div className="text-sm font-semibold mt-2">{formatDateShort(tour.start_date)} → {formatDateShort(tour.end_date)}</div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200">
            <div>
              <div className="text-xs text-gray-500">Ticket</div>
              <div className="font-bold">${tour.ticket_price}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Rally VIP ({tour.rally_discount_pct}% off)</div>
              <div className="font-bold text-green-600">${(tour.ticket_price * (1 - tour.rally_discount_pct / 100)).toFixed(2)}</div>
            </div>
          </div>
          {tour.vip_perks && (
            <div className="mt-3 p-2.5 rounded-lg flex gap-2" style={{ background: 'var(--warning)15' }}>
              <Icon name="star" size={16} color="var(--warning)" />
              <div>
                <div className="font-bold text-xs" style={{ color: 'var(--warning)' }}>Rally VIP Perks</div>
                <div className="text-xs">{tour.vip_perks}</div>
              </div>
            </div>
          )}
        </div>

        <div className="font-bold mt-4 mb-2">Shows ({shows.length})</div>
        {shows.map(s => {
          const venue = s.venue_id ? data.venues.find(v => v.id === s.venue_id) : null;
          return (
            <div key={s.id} className="card mb-2 cursor-pointer" onClick={() => app.setRoute({ name: 'show', params: { id: s.id } })}>
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold">{formatDateShort(s.show_date)}</div>
                <StatusChip status={s.status} />
              </div>
              <div className="text-sm text-gray-600">{s.city}, {s.region}</div>
              <div className="text-sm text-gray-500">{venue?.name ?? 'Venue TBD'}</div>
              <div className="text-xs text-indigo-600 font-semibold mt-1">{s.rally_count} rallied</div>
            </div>
          );
        })}
        <div className="h-8" />
      </div>
    </ScreenHeader>
  );
}

// ---------- SHOW DETAIL ----------
function ShowDetailScreen({ showId }) {
  const app = useApp();
  const { data, me, myTalents, myVenues } = app;
  const show = data.shows.find(s => s.id === showId);
  if (!show) return <div className="p-4">Show not found</div>;
  const tour = data.tours.find(t => t.id === show.tour_id);
  const talent = data.talents.find(t => t.id === show.talent_id);
  const talentProfile = data.profiles.find(p => p.id === talent?.owner_id);
  const venue = show.venue_id ? data.venues.find(v => v.id === show.venue_id) : null;
  const isOwner = myTalents.some(mt => mt.id === show.talent_id);
  const isHost = myVenues.length > 0;

  const venueOffers = data.venue_offers.filter(o => o.show_id === show.id && o.status === 'pending');
  const myOffers = data.venue_offers.filter(o => o.show_id === show.id && myVenues.some(v => v.id === o.venue_id));
  const matchingVenues = data.venues.filter(v => v.city === show.city && v.capacity >= show.rally_count);

  const rallied = app.isRallied(show.id);
  const following = app.isFollowingShow(show.id);
  const isConfirmed = show.status === 'confirmed';

  return (
    <ScreenHeader title="Show" onBack={() => window.history.back()}>
      <div className="p-4">
        <div className="card">
          <div className="font-bold text-xl">{formatDateFull(show.show_date)}</div>
          <div className="text-sm text-gray-500">{show.start_time}</div>
          <div className="flex items-center gap-2 mt-3">
            <div className="text-indigo-600 font-semibold cursor-pointer" onClick={() => tour && app.setRoute({ name: 'tour', params: { id: tour.id } })}>
              {talentProfile?.display_name}
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-1">{show.city}, {show.region}</div>
          {tour && <div className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">{tour.title}</div>}
          <div className="mt-2"><StatusChip status={show.status} /></div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Fan demand: {show.rally_count} rallied</div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full" style={{ width: `${Math.min(100, (show.rally_count / 50) * 100)}%`, background: 'var(--primary)' }} />
            </div>
          </div>
        </div>

        {/* Venue card */}
        <div className="card mt-3">
          <div className="font-semibold mb-2">{venue ? 'Venue' : 'Venue TBD'}</div>
          {venue ? (
            <div className="flex items-center gap-3">
              <Icon name="domain" size={20} color="var(--primary)" />
              <div className="flex-1">
                <div className="font-semibold">{venue.name}</div>
                <div className="text-xs text-gray-500">{venue.city}, {venue.region} · {venue.capacity} cap</div>
              </div>
            </div>
          ) : <div className="text-sm text-gray-500">No venue assigned yet</div>}
        </div>

        {/* Fan actions */}
        {!isOwner && (
          <div className="card mt-3 flex gap-2 flex-wrap">
            <button className={`btn ${following ? 'btn-outlined' : 'btn-text'}`} onClick={() => app.toggleShowFollow(show.id, show.tour_id)}>
              <Icon name="bell" size={14} /> {following ? 'Following' : 'Follow'}
            </button>
            {!isConfirmed && (
              <button className={`btn ${rallied ? 'btn-outlined' : 'btn-primary'}`} style={rallied ? { borderColor: 'var(--success)', color: 'var(--success)' } : {}} onClick={() => app.toggleRally(show.id)}>
                <Icon name={rallied ? 'checkCircle' : 'greeting'} size={14} /> {rallied ? 'Rallied! (VIP)' : 'Rally!'}
              </button>
            )}
            {isConfirmed && (
              <button className="btn btn-primary">
                <Icon name="ticket" size={14} /> Buy Ticket — ${rallied ? (show.ticket_price * 0.8).toFixed(2) : show.ticket_price}
              </button>
            )}
          </div>
        )}

        {/* Talent: venue offers */}
        {isOwner && !isConfirmed && (
          <>
            {venueOffers.length > 0 && (
              <div className="card mt-3">
                <div className="font-semibold mb-2">Venue Offers ({venueOffers.length})</div>
                {venueOffers.map(o => {
                  const v = data.venues.find(vv => vv.id === o.venue_id);
                  return (
                    <div key={o.id} className="flex items-center py-2 border-b last:border-0">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{v?.name}</div>
                        <div className="text-xs text-gray-500">{v?.capacity} cap · ${v?.price_per_night}/night</div>
                      </div>
                      <button className="btn btn-primary text-xs mr-1" style={{ background: 'var(--success)' }} onClick={() => app.confirmVenueForShow(show.id, v.id, v.capacity)}>
                        Confirm
                      </button>
                      <button className="p-2" onClick={() => app.rejectOffer(o.id)}>
                        <Icon name="close" size={14} color="var(--error)" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="card mt-3">
              <div className="font-semibold mb-2">Find a Venue</div>
              {matchingVenues.length === 0 ? (
                <div className="text-sm text-gray-500">No matching venues in {show.city}</div>
              ) : (
                matchingVenues.slice(0, 6).map(v => {
                  const alreadyRequested = data.venue_offers.some(o => o.venue_id === v.id && o.show_id === show.id);
                  const vtInfo = VENUE_TYPES.find(vt => vt.value === v.venue_type);
                  return (
                    <div key={v.id} className="flex items-center py-2 border-b last:border-0">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{v.name}</div>
                        <div className="text-xs text-gray-500">{vtInfo?.label} · {v.capacity} cap · ${v.price_per_night}/night</div>
                      </div>
                      <button className="btn btn-outlined text-xs" disabled={alreadyRequested} onClick={() => app.offerVenue(v.id, show.id)}>
                        {alreadyRequested ? 'Requested' : 'Request'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Host: offer your venue */}
        {isHost && !isOwner && !isConfirmed && (
          <div className="card mt-3">
            <div className="font-semibold mb-2">Offer Your Venue</div>
            {myVenues.map(v => {
              const offer = myOffers.find(o => o.venue_id === v.id);
              return (
                <div key={v.id} className="flex items-center py-2 border-b last:border-0">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{v.name}</div>
                    <div className="text-xs text-gray-500">{v.city}, {v.region} · {v.capacity} cap</div>
                  </div>
                  {offer ? (
                    <button className="btn btn-outlined text-xs" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => app.withdrawOffer(v.id, show.id)}>
                      Withdraw
                    </button>
                  ) : (
                    <button className="btn btn-primary text-xs" onClick={() => app.offerVenue(v.id, show.id)}>
                      Offer
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="h-8" />
      </div>
    </ScreenHeader>
  );
}

// ---------- CREATE TOUR ----------
function CreateTourScreen() {
  const app = useApp();
  const { myTalents, me } = app;
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ticketPrice, setTicketPrice] = useState('25');
  const [rallyDiscount, setRallyDiscount] = useState('20');
  const [vipPerks, setVipPerks] = useState('');
  const [minNetRevenue, setMinNetRevenue] = useState('500');
  const [venueTypes, setVenueTypes] = useState([]);
  const [cities, setCities] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [talentId, setTalentId] = useState(myTalents[0]?.id ?? null);

  const majorCities = CITIES.filter(c => c.pop >= 2000);
  const homeCity = CITIES.find(c => c.name === me.city);
  const nearbyCities = homeCity ? CITIES.filter(c => distanceMiles(homeCity, c) <= 800 && c.name !== me.city) : [];

  const addCity = (c) => {
    if (cities.some(cc => cc.name === c.name && cc.region === c.region)) return;
    setCities([...cities, c]);
  };

  const removeCity = (i) => setCities(cities.filter((_, idx) => idx !== i));

  const generateSchedule = () => {
    if (!homeCity || cities.length === 0 || !startDate || !endDate) return;
    const ordered = optimizeRoute(cities, homeCity);
    const dates = distributeDates(ordered.length, startDate, endDate);
    setSchedule(ordered.map((c, i) => ({ city: c.name, region: c.region, date: dates[i] })));
    setStep(4);
  };

  const launch = () => {
    const tour = {
      talent_id: talentId,
      title: title.trim(),
      description: description.trim() || null,
      start_date: startDate, end_date: endDate,
      ticket_price: parseFloat(ticketPrice),
      rally_discount_pct: parseInt(rallyDiscount) || 20,
      vip_perks: vipPerks.trim() || null,
      min_net_revenue: parseFloat(minNetRevenue) || 0,
      venue_types: venueTypes,
    };
    const shows = schedule.map((s, i) => ({
      show_date: s.date, city: s.city, region: s.region, ticket_price: parseFloat(ticketPrice),
    }));
    app.addTour(tour, shows);
    app.setRoute({ name: 'tabs' });
    app.setActiveTab('tours');
  };

  const canProceed = () => {
    if (step === 0) return title.trim() && talentId && startDate && endDate && startDate <= endDate;
    if (step === 1) return ticketPrice && minNetRevenue;
    if (step === 2) return venueTypes.length > 0;
    if (step === 3) return cities.length > 0;
    return true;
  };

  return (
    <ScreenHeader title="Create Tour" onBack={() => app.setRoute({ name: 'tabs' })}>
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-2">Step {step + 1} of 5</div>

        {step === 0 && (
          <div className="card">
            <div className="font-bold mb-3">Tour Details</div>
            {myTalents.length > 0 && (
              <div className="mb-3">
                <div className="label">Talent profile</div>
                <div className="flex flex-wrap gap-2">
                  {myTalents.map(t => {
                    const tt = TALENT_TYPES.find(x => x.value === t.talent_type);
                    return (
                      <Chip key={t.id} icon={tt?.icon} selected={talentId === t.id} onClick={() => setTalentId(t.id)}>
                        {tt?.label}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mb-3">
              <div className="label">Tour Name</div>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Summer 2026 Tour" />
            </div>
            <div className="mb-3">
              <div className="label">Description</div>
              <textarea className="input" rows="3" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this tour about?" />
            </div>
            <DateRangeCalendar
              startDate={startDate} endDate={endDate}
              onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
            />
          </div>
        )}

        {step === 1 && (
          <div className="card">
            <div className="font-bold mb-3">Pricing & VIP</div>
            <div className="mb-3">
              <div className="label">Ticket Price ($)</div>
              <input className="input" inputMode="decimal" value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} />
            </div>
            <div className="mb-3">
              <div className="label">Rally Discount (%)</div>
              <input className="input" inputMode="numeric" value={rallyDiscount} onChange={e => setRallyDiscount(e.target.value)} />
              <div className="text-xs text-gray-500 mt-1">Fans who rally early get this discount + VIP status</div>
            </div>
            <div className="mb-3">
              <div className="label">Min Net Revenue per Show ($)</div>
              <input className="input" inputMode="decimal" value={minNetRevenue} onChange={e => setMinNetRevenue(e.target.value)} />
              <div className="text-xs text-gray-500 mt-1">Min (tickets - venue cost) to confirm a show</div>
            </div>
            <div>
              <div className="label">VIP Perks (optional)</div>
              <textarea className="input" rows="2" value={vipPerks} onChange={e => setVipPerks(e.target.value)} placeholder="e.g. Meet & greet, signed merch" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card">
            <div className="font-bold mb-1">Venue Preferences</div>
            <div className="text-sm text-gray-500 mb-3">What types of venues are you looking for?</div>
            <TypePicker
              options={VENUE_TYPES}
              selected={venueTypes}
              onToggle={(v) => setVenueTypes(venueTypes.includes(v) ? venueTypes.filter(x => x !== v) : [...venueTypes, v])}
            />
          </div>
        )}

        {step === 3 && (
          <div className="card">
            <div className="font-bold mb-1">Target Cities</div>
            <div className="text-sm text-gray-500 mb-3">Select cities for your tour</div>
            <div className="flex gap-2 mb-3">
              <button className="btn btn-outlined text-xs" onClick={() => majorCities.forEach(addCity)}>Major Cities</button>
              <button className="btn btn-outlined text-xs" onClick={() => nearbyCities.forEach(addCity)}>Nearby Cities</button>
            </div>
            <div className="label">Tap to add</div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-3">
              {CITIES.filter(c => !cities.some(cc => cc.name === c.name)).map((c, i) => (
                <button key={i} className="chip" onClick={() => addCity(c)}>
                  <Icon name="plus" size={12} /> {c.name}, {c.region}
                </button>
              ))}
            </div>
            <div className="label">Selected ({cities.length})</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {cities.map((c, i) => (
                <button key={i} className="chip chip-sel" onClick={() => removeCity(i)}>
                  {c.name}, {c.region} <Icon name="close" size={12} color="white" />
                </button>
              ))}
            </div>
            {cities.length > 0 && (
              <button className="btn btn-text text-xs" style={{ color: 'var(--error)' }} onClick={() => setCities([])}>Clear All</button>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="card">
            <div className="font-bold mb-1">Show Schedule</div>
            <div className="text-sm text-gray-500 mb-3">Shows have been ordered by travel distance with evenly-spaced dates. Reorder as needed.</div>
            {schedule.map((s, i) => (
              <div key={i} className="flex items-center py-2 border-b last:border-0">
                <div className="flex flex-col w-8 items-center">
                  <button onClick={() => {
                    if (i === 0) return;
                    const updated = [...schedule];
                    const tmp = updated[i].date; updated[i].date = updated[i - 1].date; updated[i - 1].date = tmp;
                    [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
                    setSchedule(updated);
                  }} disabled={i === 0}><Icon name="chevronUp" size={16} color={i === 0 ? '#D1D5DB' : 'var(--text)'} /></button>
                  <div className="text-xs text-gray-500 font-bold">{i + 1}</div>
                  <button onClick={() => {
                    if (i === schedule.length - 1) return;
                    const updated = [...schedule];
                    const tmp = updated[i].date; updated[i].date = updated[i + 1].date; updated[i + 1].date = tmp;
                    [updated[i + 1], updated[i]] = [updated[i], updated[i + 1]];
                    setSchedule(updated);
                  }} disabled={i === schedule.length - 1}><Icon name="chevronDown" size={16} color={i === schedule.length - 1 ? '#D1D5DB' : 'var(--text)'} /></button>
                </div>
                <div className="flex-1 ml-3">
                  <div className="font-semibold text-sm">{s.city}, {s.region}</div>
                  <input type="date" className="text-xs text-indigo-500 font-medium bg-transparent border-none p-0"
                    value={s.date}
                    onChange={e => {
                      const newDate = e.target.value;
                      const conflict = schedule.findIndex((ss, idx) => idx !== i && ss.date === newDate);
                      const updated = [...schedule];
                      if (conflict >= 0) {
                        updated[conflict].date = updated[i].date;
                      }
                      updated[i].date = newDate;
                      updated.sort((a, b) => a.date.localeCompare(b.date));
                      setSchedule(updated);
                    }} />
                </div>
                <button onClick={() => setSchedule(schedule.filter((_, idx) => idx !== i))} className="p-2">
                  <Icon name="close" size={14} color="var(--text2)" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {step > 0 && <button className="btn btn-outlined flex-1" onClick={() => setStep(step - 1)}>Back</button>}
          {step < 3 && <button className="btn btn-primary flex-1" disabled={!canProceed()} onClick={() => setStep(step + 1)}>Next</button>}
          {step === 3 && <button className="btn btn-primary flex-1" disabled={!canProceed()} onClick={generateSchedule}>Next: Schedule</button>}
          {step === 4 && <button className="btn btn-primary flex-1" onClick={launch}>Launch Tour</button>}
        </div>
        <div className="h-8" />
      </div>
    </ScreenHeader>
  );
}

// ---------- ADD VENUE ----------
function AddVenueScreen() {
  const app = useApp();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [capacity, setCapacity] = useState('');
  const [sqft, setSqft] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [venueType, setVenueType] = useState([]);
  const [hostedTypes, setHostedTypes] = useState([]);

  const canSubmit = name.trim() && address.trim() && city.trim() && region.trim() && parseInt(capacity) > 0 && venueType.length > 0;

  const submit = () => {
    app.addVenue({
      name: name.trim(), address: address.trim(),
      city: city.trim(), region: region.trim(),
      capacity: parseInt(capacity), sqft: sqft ? parseInt(sqft) : null,
      price_per_night: price ? parseFloat(price) : null,
      venue_type: venueType[0], hosted_talent_types: hostedTypes,
      description: description.trim() || null,
    });
    app.setRoute({ name: 'tabs' });
    app.setActiveTab('venues');
  };

  return (
    <ScreenHeader title="Add Venue" onBack={() => app.setRoute({ name: 'tabs' })}>
      <div className="p-4">
        <div className="card">
          <div className="mb-3"><div className="label">Name</div><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="mb-3"><div className="label">Address</div><input className="input" value={address} onChange={e => setAddress(e.target.value)} /></div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1"><div className="label">City</div><input className="input" value={city} onChange={e => setCity(e.target.value)} /></div>
            <div style={{ width: 90 }}><div className="label">State</div><input className="input" value={region} onChange={e => setRegion(e.target.value)} /></div>
          </div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1"><div className="label">Capacity</div><input className="input" inputMode="numeric" value={capacity} onChange={e => setCapacity(e.target.value)} /></div>
            <div className="flex-1"><div className="label">Sqft</div><input className="input" inputMode="numeric" value={sqft} onChange={e => setSqft(e.target.value)} placeholder="Optional" /></div>
          </div>
          <div className="mb-3"><div className="label">Price per Night ($)</div><input className="input" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="Optional" /></div>
          <TypePicker label="Venue Type" options={VENUE_TYPES} selected={venueType} onToggle={(v) => setVenueType([v])} />
          <TypePicker label="Talent types you can host" options={TALENT_TYPES} selected={hostedTypes} onToggle={(v) => setHostedTypes(hostedTypes.includes(v) ? hostedTypes.filter(x => x !== v) : [...hostedTypes, v])} />
          <div className="mb-3"><div className="label">Description</div><textarea className="input" rows="3" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your venue..." /></div>
          <button className="btn btn-primary w-full" disabled={!canSubmit} onClick={submit}>Add Venue</button>
        </div>
        <div className="h-8" />
      </div>
    </ScreenHeader>
  );
}

// ---------- TALENT DETAIL ----------
function TalentDetailScreen({ talentId }) {
  const app = useApp();
  const talent = app.data.talents.find(t => t.id === talentId);
  if (!talent) return <div className="p-4">Not found</div>;
  const profile = app.data.profiles.find(p => p.id === talent.owner_id);
  const tours = app.data.tours.filter(t => t.talent_id === talentId);
  const typeInfo = TALENT_TYPES.find(tt => tt.value === talent.talent_type);
  const followers = app.data.follows.filter(f => f.following_id === profile?.id).length;

  return (
    <ScreenHeader title="Talent" onBack={() => window.history.back()}>
      <div className="p-4">
        <div className="card text-center">
          <Avatar name={profile?.display_name} size={72} />
          <div className="font-bold text-xl mt-3">{profile?.display_name}</div>
          <div className="flex justify-center gap-2 mt-2">
            <span className="chip"><Icon name={typeInfo?.icon} size={12} /> {typeInfo?.label}</span>
          </div>
          <div className="text-sm text-gray-500 mt-2">{followers} followers</div>
          {profile && app.me.id !== profile.id && (
            <button className={`btn ${app.isFollowing(profile.id) ? 'btn-outlined' : 'btn-primary'} mt-3`} onClick={() => app.toggleFollow(profile.id)}>
              {app.isFollowing(profile.id) ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        <div className="font-bold mt-4 mb-2">Tours ({tours.length})</div>
        {tours.map(t => (
          <div key={t.id} className="card mb-2 cursor-pointer" onClick={() => app.setRoute({ name: 'tour', params: { id: t.id } })}>
            <div className="font-semibold">{t.title}</div>
            <div className="text-xs text-gray-500">{formatDateShort(t.start_date)} → {formatDateShort(t.end_date)}</div>
          </div>
        ))}
        <div className="h-8" />
      </div>
    </ScreenHeader>
  );
}

// ---------- VENUE DETAIL ----------
function VenueDetailScreen({ venueId }) {
  const app = useApp();
  const venue = app.data.venues.find(v => v.id === venueId);
  if (!venue) return <div className="p-4">Not found</div>;
  const typeInfo = VENUE_TYPES.find(vt => vt.value === venue.venue_type);

  return (
    <ScreenHeader title="Venue" onBack={() => window.history.back()}>
      <div className="p-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="font-bold text-xl">{venue.name}</div>
            <button onClick={() => app.toggleVenueFollow(venue.id)}>
              <Icon name={app.isFollowingVenue(venue.id) ? 'checkCircle' : 'bell'} size={20} color={app.isFollowingVenue(venue.id) ? 'var(--success)' : 'var(--primary)'} />
            </button>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <Icon name="mapPin" size={14} />
            {venue.address}, {venue.city}, {venue.region}
          </div>
          {venue.description && <div className="text-sm mt-2">{venue.description}</div>}
          {venue.verified && (
            <div className="flex items-center gap-1 mt-2 text-xs font-bold" style={{ color: 'var(--success)' }}>
              <Icon name="decagram" size={14} color="var(--success)" /> Verified
            </div>
          )}
        </div>

        <div className="card mt-3">
          <div className="font-semibold mb-2">Details</div>
          <div className="flex justify-between py-1"><span className="text-gray-500">Type</span><span className="chip"><Icon name={typeInfo?.icon} size={12} />{typeInfo?.label}</span></div>
          <div className="flex justify-between py-1"><span className="text-gray-500">Capacity</span><span className="font-semibold">{venue.capacity}</span></div>
          {venue.sqft && <div className="flex justify-between py-1"><span className="text-gray-500">Square Feet</span><span className="font-semibold">{venue.sqft}</span></div>}
          {venue.price_per_night && <div className="flex justify-between py-1"><span className="text-gray-500">Price/Night</span><span className="font-semibold">${venue.price_per_night}</span></div>}
          {venue.hosted_talent_types?.length > 0 && (
            <>
              <div className="mt-2 mb-1 text-sm text-gray-500">Hosts</div>
              <div className="flex flex-wrap gap-1">
                {venue.hosted_talent_types.map(t => {
                  const ti = TALENT_TYPES.find(x => x.value === t);
                  return <span key={t} className="chip"><Icon name={ti?.icon} size={12} />{ti?.label}</span>;
                })}
              </div>
            </>
          )}
        </div>
        <div className="h-8" />
      </div>
    </ScreenHeader>
  );
}

// ============================================================
// REUSABLE LAYOUT COMPONENTS
// ============================================================
const Stat = ({ num, label }) => (
  <div>
    <div className="text-xl font-bold">{num}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

const Section = ({ title, count, children }) => (
  <div className="mt-4">
    <div className="flex items-center justify-between mb-2">
      <div className="font-bold">{title}</div>
      {count !== undefined && <div className="text-xs text-gray-500">{count}</div>}
    </div>
    {children}
  </div>
);

const EmptyText = ({ children }) => (
  <div className="card text-center text-gray-500 py-6 text-sm">{children}</div>
);

function ShowCard({ show }) {
  const app = useApp();
  const tour = app.data.tours.find(t => t.id === show.tour_id);
  const talent = app.data.talents.find(t => t.id === show.talent_id);
  const talentProfile = app.data.profiles.find(p => p.id === talent?.owner_id);
  const talentType = talent ? TALENT_TYPES.find(tt => tt.value === talent.talent_type) : null;
  const venue = show.venue_id ? app.data.venues.find(v => v.id === show.venue_id) : null;

  return (
    <div className="card mb-2 cursor-pointer" onClick={() => app.setRoute({ name: 'show', params: { id: show.id } })}>
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="font-bold">{formatDateShort(show.show_date)}</div>
          {show.start_time && <div className="text-xs text-gray-500">{show.start_time}</div>}
        </div>
        <StatusChip status={show.status} />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="font-semibold text-sm">{talentProfile?.display_name}</div>
        {talentType && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--primary)', background: 'var(--primary)15', padding: '2px 6px', borderRadius: 8 }}>
            <Icon name={talentType.icon} size={10} />{talentType.label}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
        <Icon name="mapPin" size={12} /> {show.city}, {show.region}
        <span>·</span>
        <Icon name="domain" size={12} /> {venue?.name ?? 'Venue TBD'}
      </div>
      <div className="flex gap-3 text-xs text-gray-500 mt-1">
        <span>{show.rally_count} rallied</span>
        {show.ticket_price > 0 && <span>${show.ticket_price}</span>}
      </div>
    </div>
  );
}

function ScreenHeader({ title, onBack, children }) {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex items-center px-2 py-3 bg-white border-b border-gray-200">
        <button onClick={onBack} className="p-2"><Icon name="chevronLeft" size={22} /></button>
        <div className="flex-1 font-bold text-lg">{title}</div>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

// ============================================================
// TAB BAR
// ============================================================
function TabBar() {
  const app = useApp();
  const role = app.me.role;

  const tabs = [
    { key: 'home', label: 'Home', icon: 'home', show: true },
    { key: 'explore', label: 'Explore', icon: 'compass', show: role === 'fan' },
    { key: 'commitments', label: 'Upcoming', icon: 'calendar', show: role === 'fan' },
    { key: 'tours', label: 'Tours', icon: 'bus', show: role === 'talent' },
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', show: role === 'talent' },
    { key: 'host-explore', label: 'Explore', icon: 'compass', show: role === 'venue' },
    { key: 'venues', label: 'My Venues', icon: 'domain', show: role === 'venue' },
    { key: 'bookings', label: 'Bookings', icon: 'checkCircle', show: role === 'venue' },
  ].filter(t => t.show);

  return (
    <div className="tab-bar">
      {tabs.map(t => {
        const isActive = app.activeTab === t.key;
        return (
          <button key={t.key} className={`tab ${isActive ? 'tab-active' : 'tab-inactive'}`} onClick={() => app.setActiveTab(t.key)}>
            <Icon name={t.icon} size={22} />
            <div className="text-xs font-medium">{t.label}</div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// APP
// ============================================================
function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

function AppInner() {
  const app = useApp();
  const { route, activeTab } = app;

  let content;
  if (route.name === 'tabs') {
    if (activeTab === 'home') content = <HomeScreen />;
    else if (activeTab === 'explore') content = <ExploreScreen />;
    else if (activeTab === 'commitments') content = <UpcomingScreen />;
    else if (activeTab === 'tours') content = <ToursScreen />;
    else if (activeTab === 'dashboard') content = <DashboardScreen />;
    else if (activeTab === 'host-explore') content = <HostExploreScreen />;
    else if (activeTab === 'venues') content = <VenuesScreen />;
    else if (activeTab === 'bookings') content = <BookingsScreen />;
    else content = <HomeScreen />;
  } else if (route.name === 'notifications') content = <NotificationsScreen />;
  else if (route.name === 'tour') content = <TourDetailScreen tourId={route.params.id} />;
  else if (route.name === 'show') content = <ShowDetailScreen showId={route.params.id} />;
  else if (route.name === 'create-tour') content = <CreateTourScreen />;
  else if (route.name === 'add-venue') content = <AddVenueScreen />;
  else if (route.name === 'talent') content = <TalentDetailScreen talentId={route.params.id} />;
  else if (route.name === 'venue') content = <VenueDetailScreen venueId={route.params.id} />;
  else content = <HomeScreen />;

  // Push state for back button support
  useEffect(() => {
    const handler = () => app.setRoute({ name: 'tabs' });
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return (
    <div className="phone">
      <div className="screen">{content}</div>
      {route.name === 'tabs' && <TabBar />}
    </div>
  );
}

export default App;
