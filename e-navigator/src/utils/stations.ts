import type { ChargingFeature } from '../types';

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .replace(/[^a-z0-9]/g, '');
}

function getProperty(
  properties: Record<string, unknown>,
  possibleKeys: string[],
): string {
  const normalizedLookup = new Map<string, unknown>();

  for (const [key, value] of Object.entries(properties)) {
    normalizedLookup.set(normalizeKey(key), value);
  }

  for (const key of possibleKeys) {
    const value = normalizedLookup.get(normalizeKey(key));

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  return '';
}

export function getStationId(feature: ChargingFeature): string {
  const p = feature.properties ?? {};
  const [lon, lat] = feature.geometry.coordinates;

  const id = getProperty(p, [
    'id',
    'objectid',
    'OBJECTID',
    'uuid',
    'FID',
  ]);

  if (id) return id;

  return `${lat}-${lon}-${getStationTitle(feature)}-${getStationAddress(feature)}`;
}

export function getStationTitle(feature: ChargingFeature): string {
  const p = feature.properties ?? {};

  return (
    getProperty(p, [
      'betreiber',
      'Betreiber',
      'BETREIBER',
      'operator',
      'name',
      'Name',
      'Bezeichnung',
    ]) || 'Ladestation'
  );
}

export function getStationAddress(feature: ChargingFeature): string {
  const p = feature.properties ?? {};

  const fullAddress = getProperty(p, [
    'adresse',
    'Adresse',
    'anschrift',
    'Anschrift',
    'standort',
    'Standort',
  ]);

  if (fullAddress) return fullAddress;

  const street = getProperty(p, [
    'straße',
    'Straße',
    'strasse',
    'Strasse',
    'STRASSE',
    'street',
  ]);

  const houseNumber = getProperty(p, [
    'hausnummer',
    'Hausnummer',
    'HAUSNUMMER',
    'nr',
    'Nr',
  ]);

  const postcode = getProperty(p, [
    'postleitzahl',
    'Postleitzahl',
    'PLZ',
    'plz',
    'zip',
  ]);

  const city = getProperty(p, [
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

  return getProperty(p, [
    'anschlussleistung',
    'Anschlussleistung',
    'ladeleistung',
    'Ladeleistung',
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
