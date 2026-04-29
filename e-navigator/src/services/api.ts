import type { ChargingCollection } from '../types';

const BASE_URL = 'https://ladestationen.api.bund.dev';

export async function fetchStations(bbox?: [number, number, number, number]): Promise<ChargingCollection> {
  const url = new URL(`${BASE_URL}/query`);

  if (bbox) {
    url.searchParams.set('bbox', bbox.join(','));
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ladesäulen API Fehler: ${response.status}`);
  }

  return response.json();
}

export async function geocodeAddress(query: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;

  if (!data[0]) return null;

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
    displayName: data[0].display_name,
  };
}
