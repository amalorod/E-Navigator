import type { AddressSuggestion, ChargingCollection } from '../types';

const BASE_URL = 'https://ladestationen.api.bund.dev';

export async function fetchStations(bbox: [number, number, number, number]): Promise<ChargingCollection> {
  const [xmin, ymin, xmax, ymax] = bbox;
  const geometry = {
    xmin,
    ymin,
    xmax,
    ymax,
    spatialReference: { wkid: 4326 },
  };

  const url = new URL(`${BASE_URL}/query`);
  url.searchParams.set('f', 'geojson');
  url.searchParams.set('outFields', '*');
  url.searchParams.set('returnGeometry', 'true');
  url.searchParams.set('geometryType', 'esriGeometryEnvelope');
  url.searchParams.set('inSR', '4326');
  url.searchParams.set('outSR', '4326');
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  url.searchParams.set('geometry', JSON.stringify(geometry));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ladesäulen API Fehler: ${response.status}`);
  }

  const data = (await response.json()) as ChargingCollection;
  return data?.features ? data : { type: 'FeatureCollection', features: [] };
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
