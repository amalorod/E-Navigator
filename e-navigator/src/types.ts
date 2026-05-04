export type AppView = 'home' | 'search' | 'map';

export type AddressSuggestion = {
  displayName: string;
  lat: number;
  lon: number;
};

export type ChargingFeature = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: Record<string, unknown>;
};

export type ChargingCollection = {
  type: 'FeatureCollection';
  features: ChargingFeature[];
};