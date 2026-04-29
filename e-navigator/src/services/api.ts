// api.ts
import type { ChargingCollection } from '../types';

const BASE_URL = 'https://ladestationen.api.bund.dev';

export async function fetchStations(bbox?: [number, number, number, number]): Promise<ChargingCollection> {
  const url = new URL(`${BASE_URL}/query`);

  if (bbox) {
    if (bbox.length !== 4) {
      throw new Error('bbox must be an array of four numbers: [minLon, minLat, maxLon, maxLat]');
    }
    url.searchParams.set('bbox', bbox.join(','));
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Ladesäulen API Fehler: ${response.status} ${response.statusText}`);
  }

  // Let the caller handle any runtime type mismatches; cast to expected type
  const data = (await response.json()) as ChargingCollection;
  return data;
}

export async function geocodeAddress(query: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  if (!query || !query.trim()) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      // Nominatim requires a valid User-Agent or Referer identifying the application
      'User-Agent': 'MyApp/1.0 (your-email@example.com)',
    },
  });

  if (!response.ok) {
    // return null for geocoding failures rather than throwing, to keep UX smooth
    return null;
  }

  const data = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;

  if (!data || !data[0]) return null;

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
    displayName: data[0].display_name,
  };
}
