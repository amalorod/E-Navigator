export type ChargingFeature = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: Record<string, unknown>;
};

export type ChargingCollection = {
  type: 'FeatureCollection';
  features: ChargingFeature[];
};

export type AddressSuggestion = {
  lat: number;
  lon: number;
  displayName: string;
};

export type AppView = 'home' | 'search' | 'map';
