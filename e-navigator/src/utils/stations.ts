import type { ChargingFeature } from '../types';

function firstValue(
  properties: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = properties[key];

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  return '';
}

export function getStationId(feature: ChargingFeature): string {
  const p = feature.properties ?? {};
  const [lon, lat] = feature.geometry.coordinates;

  const knownId = firstValue(p, [
    'id',
    'ID',
    'objectid',
    'OBJECTID',
    'ObjectId',
    'uuid',
    'UUID',
  ]);

  if (knownId) return knownId;

  return `${lon}-${lat}-${getStationTitle(feature)}-${getStationAddress(feature)}`;
}

export function getStationTitle(feature: ChargingFeature): string {
  const p = feature.properties ?? {};

  return (
    firstValue(p, [
      'betreiber',
      'Betreiber',
      'BETREIBER',
      'operator',
      'Operator',
      'name',
      'Name',
      'bezeichnung',
      'Bezeichnung',
    ]) || 'Ladestation'
  );
}

export function getStationAddress(feature: ChargingFeature): string {
  const p = feature.properties ?? {};

  const street = firstValue(p, [
    'strasse',
    'straße',
    'Strasse',
    'Straße',
    'STRASSE',
    'street',
  ]);

  const houseNumber = firstValue(p, [
    'hausnummer',
    'Hausnummer',
    'HAUSNUMMER',
    'houseNumber',
  ]);

  const postcode = firstValue(p, [
    'postleitzahl',
    'Postleitzahl',
    'PLZ',
    'plz',
    'postcode',
  ]);

  const city = firstValue(p, [
    'ort',
    'Ort',
    'ORT',
    'stadt',
    'Stadt',
    'city',
  ]);

  return [street, houseNumber, postcode, city].filter(Boolean).join(' ');
}

export function getStationPower(feature: ChargingFeature): string {
  const p = feature.properties ?? {};

  return firstValue(p, [
    'anschlussleistung',
    'Anschlussleistung',
    'ANSCHLUSSLEISTUNG',
    'leistung',
    'Leistung',
    'power',
  ]);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function distanceInKm(
  a: [number, number], // [lat, lon]
  b: [number, number], // [lat, lon]
): number {
  const earthRadius = 6371;

  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;

  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}