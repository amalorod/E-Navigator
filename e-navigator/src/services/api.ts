import type { AddressSuggestion, ChargingCollection } from '../types';

const CHARGING_STATIONS_QUERY_URL =
  'https://services2.arcgis.com/MGMXUAEQNWE1AVGS/ArcGIS/rest/services/Ladestationen/FeatureServer/150/query';

export async function fetchStations(
  bbox: [number, number, number, number],
): Promise<ChargingCollection> {
  const [xmin, ymin, xmax, ymax] = bbox;

  const geometry = {
    xmin,
    ymin,
    xmax,
    ymax,
    spatialReference: {
      wkid: 4326,
    },
  };

  const url = new URL(CHARGING_STATIONS_QUERY_URL);

  url.searchParams.set('f', 'geojson');
  url.searchParams.set('where', '1=1');
  url.searchParams.set('outFields', '*');
  url.searchParams.set('returnGeometry', 'true');
  url.searchParams.set('geometryType', 'esriGeometryEnvelope');
  url.searchParams.set('geometry', JSON.stringify(geometry));
  url.searchParams.set('inSR', '4326');
  url.searchParams.set('outSR', '4326');
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');

  console.log('Ladesäulen API URL:', url.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/geo+json, application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Ladesäulen API Fehler: ${response.status}`);
  }

  const data = (await response.json()) as ChargingCollection;

  return {
    type: 'FeatureCollection',
    features: Array.isArray(data.features) ? data.features : [],
  };
}

export async function fetchAddressSuggestions(
  query: string,
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

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

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