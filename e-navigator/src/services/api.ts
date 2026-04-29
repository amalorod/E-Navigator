import type { AddressSuggestion, ChargingCollection } from '../types';

const BASE_URL = 'https://ladestationen.api.bund.dev';

export async function fetchStations(bbox?: [number, number, number, number]): Promise<ChargingCollection> {
  const url = new URL(`${BASE_URL}/query`);
  if (bbox) {
    url.searchParams.set('bbox', bbox.join(','));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Ladesäulen API Fehler: ${response.status}`);
  const data = (await response.json()) as ChargingCollection;
  if (!data?.features) return { type: 'FeatureCollection', features: [] };
  return data;
}

export async function fetchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
  if (query.trim().length < 3) return [];
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', 'de');

  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) return [];
  const data = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  return data.map((item) => ({ lat: Number(item.lat), lon: Number(item.lon), displayName: item.display_name }));
}
