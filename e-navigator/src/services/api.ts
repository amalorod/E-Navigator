import type { AddressSuggestion, ChargingCollection, ChargingFeature } from '../types';

const CHARGING_STATIONS_QUERY_URL =
  'https://services2.arcgis.com/jUpNdisbWqRpMo35/arcgis/rest/services/Ladesaeulen_in_Deutschland/FeatureServer/0/query';

type ArcGisFeature = {
  attributes?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  geometry?: {
    x?: number;
    y?: number;
    longitude?: number;
    latitude?: number;
    coordinates?: [number, number];
  };
};

type ArcGisResponse = {
  features?: ArcGisFeature[];
  error?: {
    code?: number;
    message?: string;
    details?: string[];
  };
};

function arcGisToGeoJsonFeature(feature: ArcGisFeature): ChargingFeature | null {
  const geometry = feature.geometry;

  if (!geometry) return null;

  let lon: number | undefined;
  let lat: number | undefined;

  if (Array.isArray(geometry.coordinates)) {
    lon = geometry.coordinates[0];
    lat = geometry.coordinates[1];
  } else {
    lon = geometry.x ?? geometry.longitude;
    lat = geometry.y ?? geometry.latitude;
  }

  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null;
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lon as number, lat as number],
    },
    properties: feature.attributes ?? feature.properties ?? {},
  };
}

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

  url.searchParams.set('f', 'json');
  url.searchParams.set('where', '1=1');
  url.searchParams.set('outFields', '*');
  url.searchParams.set('returnGeometry', 'true');
  url.searchParams.set('geometryType', 'esriGeometryEnvelope');
  url.searchParams.set('geometry', JSON.stringify(geometry));
  url.searchParams.set('inSR', '4326');
  url.searchParams.set('outSR', '4326');
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  url.searchParams.set('resultRecordCount', '2000');

  console.log('Ladesäulen API URL:', url.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Ladesäulen API Fehler: ${response.status}`);
  }

  const data = (await response.json()) as ArcGisResponse;

  console.log('Ladesäulen API Antwort komplett:', data);

  if (data.error) {
    console.error('Ladesäulen API Error:', data.error);
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  const features =
    data.features
      ?.map(arcGisToGeoJsonFeature)
      .filter((feature): feature is ChargingFeature => feature !== null) ?? [];

  console.log('Konvertierte Ladepunkte:', features.length);
  console.log('Erster konvertierter Ladepunkt:', features[0]);

  return {
    type: 'FeatureCollection',
    features,
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