import type { AddressSuggestion, ChargingCollection, ChargingFeature } from '../types';

const BASE_URL = 'https://ladestationen.api.bund.dev';

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidChargingFeature(feature: unknown): feature is ChargingFeature {
  if (!feature || typeof feature !== 'object') return false;

  const candidate = feature as ChargingFeature;
  const coordinates = candidate.geometry?.coordinates;

  return (
    candidate.type === 'Feature' &&
    candidate.geometry?.type === 'Point' &&
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    isFiniteNumber(coordinates[0]) &&
    isFiniteNumber(coordinates[1])
  );
}

function normalizeChargingCollection(data: unknown): ChargingCollection {
  if (!data || typeof data !== 'object') {
    return { type: 'FeatureCollection', features: [] };
  }

  const candidate = data as Partial<ChargingCollection>;

  if (!Array.isArray(candidate.features)) {
    return { type: 'FeatureCollection', features: [] };
  }

  return {
    type: 'FeatureCollection',
    features: candidate.features.filter(isValidChargingFeature),
  };
}

export async function fetchStations(
  bbox: [number, number, number, number],
  signal?: AbortSignal,
): Promise<ChargingCollection> {
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

  const response = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/geo+json, application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Ladesäulen API Fehler: ${response.status}`);
  }

  const data = await response.json();

  return normalizeChargingCollection(data);
}

export async function fetchAddressSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();

  if (trimmed.length < 3) {
    return [];
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');

  url.searchParams.set('q', trimmed);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', 'de');

  const response = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as NominatimResult[];

  return data
    .map((item) => ({
      lat: Number(item.lat),
      lon: Number(item.lon),
      displayName: item.display_name,
    }))
    .filter((item) => {
      return (
        Number.isFinite(item.lat) &&
        Number.isFinite(item.lon) &&
        item.displayName.trim().length > 0
      );
    });
}