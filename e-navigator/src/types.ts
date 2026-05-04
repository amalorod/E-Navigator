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
    coordinates: [number, number];
  };
  properties: Record<string, unknown>;
};

export type ChargingFeatureCollection = {
  type: 'FeatureCollection';
  features: ChargingFeature[];
};



