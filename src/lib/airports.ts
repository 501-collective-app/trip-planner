// IATA airport code -> IANA timezone. Flight times are always displayed in the
// airport's own local time, never the viewer's browser timezone.
export const AIRPORT_TIMEZONE: Record<string, string> = {
  // Pacific Northwest / this trip
  PDX: 'America/Los_Angeles',
  SEA: 'America/Los_Angeles',
  // Middle East
  DOH: 'Asia/Qatar',
  DXB: 'Asia/Dubai',
  AUH: 'Asia/Dubai',
  // East Africa
  NBO: 'Africa/Nairobi',
  MBA: 'Africa/Nairobi',
  ADD: 'Africa/Addis_Ababa',
  DAR: 'Africa/Dar_es_Salaam',
  EBB: 'Africa/Kampala',
  KGL: 'Africa/Kigali',
  // Other major US
  JFK: 'America/New_York',
  EWR: 'America/New_York',
  LGA: 'America/New_York',
  BOS: 'America/New_York',
  PHL: 'America/New_York',
  MIA: 'America/New_York',
  ATL: 'America/New_York',
  CLT: 'America/New_York',
  DTW: 'America/New_York',
  BWI: 'America/New_York',
  ORD: 'America/Chicago',
  MDW: 'America/Chicago',
  DFW: 'America/Chicago',
  DAL: 'America/Chicago',
  IAH: 'America/Chicago',
  MSP: 'America/Chicago',
  AUS: 'America/Chicago',
  DEN: 'America/Denver',
  PHX: 'America/Phoenix',
  LAX: 'America/Los_Angeles',
  SFO: 'America/Los_Angeles',
  SAN: 'America/Los_Angeles',
  LAS: 'America/Los_Angeles',
  HNL: 'Pacific/Honolulu',
  ANC: 'America/Anchorage',
  // Europe
  LHR: 'Europe/London',
  LGW: 'Europe/London',
  CDG: 'Europe/Paris',
  AMS: 'Europe/Amsterdam',
  FRA: 'Europe/Berlin',
  MUC: 'Europe/Berlin',
  IST: 'Europe/Istanbul',
  MAD: 'Europe/Madrid',
  FCO: 'Europe/Rome',
  ZRH: 'Europe/Zurich',
  // Asia Pacific
  SIN: 'Asia/Singapore',
  HKG: 'Asia/Hong_Kong',
  NRT: 'Asia/Tokyo',
  HND: 'Asia/Tokyo',
  ICN: 'Asia/Seoul',
  BKK: 'Asia/Bangkok',
  DEL: 'Asia/Kolkata',
  BOM: 'Asia/Kolkata',
  SYD: 'Australia/Sydney',
  MEL: 'Australia/Melbourne',
  // Southern Africa / other
  JNB: 'Africa/Johannesburg',
  CPT: 'Africa/Johannesburg',
  CAI: 'Africa/Cairo',
  LOS: 'Africa/Lagos',
  ACC: 'Africa/Accra',
}

export function airportTimeZone(code: string | undefined): string | undefined {
  if (!code) return undefined
  return AIRPORT_TIMEZONE[code.toUpperCase()]
}

// IATA airport code -> approximate coordinates, for "as the crow flies" distance.
export const AIRPORT_COORDS: Record<string, { lat: number; lon: number }> = {
  PDX: { lat: 45.5898, lon: -122.5951 },
  SEA: { lat: 47.4502, lon: -122.3088 },
  DOH: { lat: 25.2731, lon: 51.6081 },
  NBO: { lat: -1.3192, lon: 36.9278 },
  MBA: { lat: -4.0348, lon: 39.5942 },
  DXB: { lat: 25.2532, lon: 55.3657 },
  AUH: { lat: 24.433, lon: 54.6511 },
  ADD: { lat: 8.9779, lon: 38.7993 },
  DAR: { lat: -6.8781, lon: 39.2026 },
  EBB: { lat: 0.0424, lon: 32.4435 },
  KGL: { lat: -1.9686, lon: 30.1395 },
  JFK: { lat: 40.6413, lon: -73.7781 },
  EWR: { lat: 40.6895, lon: -74.1745 },
  LGA: { lat: 40.7769, lon: -73.874 },
  BOS: { lat: 42.3656, lon: -71.0096 },
  PHL: { lat: 39.8744, lon: -75.2424 },
  MIA: { lat: 25.7959, lon: -80.287 },
  ATL: { lat: 33.6407, lon: -84.4277 },
  CLT: { lat: 35.214, lon: -80.9431 },
  DTW: { lat: 42.2124, lon: -83.3534 },
  BWI: { lat: 39.1774, lon: -76.6684 },
  ORD: { lat: 41.9742, lon: -87.9073 },
  MDW: { lat: 41.786, lon: -87.7524 },
  DFW: { lat: 32.8998, lon: -97.0403 },
  DAL: { lat: 32.8471, lon: -96.8518 },
  IAH: { lat: 29.9902, lon: -95.3368 },
  MSP: { lat: 44.882, lon: -93.2218 },
  AUS: { lat: 30.1975, lon: -97.6664 },
  DEN: { lat: 39.8561, lon: -104.6737 },
  PHX: { lat: 33.4342, lon: -112.0116 },
  LAX: { lat: 33.9416, lon: -118.4085 },
  SFO: { lat: 37.6213, lon: -122.379 },
  SAN: { lat: 32.7338, lon: -117.1933 },
  LAS: { lat: 36.084, lon: -115.1537 },
  HNL: { lat: 21.3245, lon: -157.9251 },
  ANC: { lat: 61.1743, lon: -149.9963 },
  LHR: { lat: 51.47, lon: -0.4543 },
  LGW: { lat: 51.1537, lon: -0.1821 },
  CDG: { lat: 49.0097, lon: 2.5479 },
  AMS: { lat: 52.3105, lon: 4.7683 },
  FRA: { lat: 50.0379, lon: 8.5622 },
  MUC: { lat: 48.3538, lon: 11.7861 },
  IST: { lat: 41.2753, lon: 28.7519 },
  MAD: { lat: 40.4983, lon: -3.5676 },
  FCO: { lat: 41.8003, lon: 12.2389 },
  ZRH: { lat: 47.4647, lon: 8.5492 },
  SIN: { lat: 1.3644, lon: 103.9915 },
  HKG: { lat: 22.308, lon: 113.9185 },
  NRT: { lat: 35.7719, lon: 140.3929 },
  HND: { lat: 35.5494, lon: 139.7798 },
  ICN: { lat: 37.4602, lon: 126.4407 },
  BKK: { lat: 13.6900, lon: 100.7501 },
  DEL: { lat: 28.5562, lon: 77.1 },
  BOM: { lat: 19.0896, lon: 72.8656 },
  SYD: { lat: -33.9399, lon: 151.1753 },
  MEL: { lat: -37.669, lon: 144.841 },
  JNB: { lat: -26.1392, lon: 28.246 },
  CPT: { lat: -33.9715, lon: 18.6021 },
  CAI: { lat: 30.1219, lon: 31.4056 },
  LOS: { lat: 6.5774, lon: 3.3212 },
  ACC: { lat: 5.6052, lon: -0.1668 },
}

// Great-circle ("as the crow flies") distance in statute miles.
export function greatCircleMiles(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const EARTH_RADIUS_MI = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function airportCoords(code: string | undefined): { lat: number; lon: number } | undefined {
  if (!code) return undefined
  return AIRPORT_COORDS[code.toUpperCase()]
}
