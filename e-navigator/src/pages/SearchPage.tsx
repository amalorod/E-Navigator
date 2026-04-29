import { useState } from 'react';
import type { ChargingFeature } from '../types';
import { fetchStations, geocodeAddress } from '../services/api';

type Props = {
  selectedId: string | null;
  onSelect: (feature: ChargingFeature) => void;
  onCenterChange: (center: [number, number]) => void;
};

export function SearchPage({ selectedId, onSelect, onCenterChange }: Props) {
  const [query, setQuery] = useState('Berlin Hauptbahnhof');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ChargingFeature[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const geo = await geocodeAddress(query);
      if (!geo) return;

      onCenterChange([geo.lat, geo.lon]);
      const delta = 0.2;
      const collection = await fetchStations([geo.lon - delta, geo.lat - delta, geo.lon + delta, geo.lat + delta]);
      setItems(collection.features);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>Suche nach Adresse</h2>
      <div className="search-row">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Adresse eingeben" />
        <button onClick={handleSearch} disabled={loading}>{loading ? 'Lädt...' : 'Suchen'}</button>
      </div>
      <div className="list">
        {items.map((feature, idx) => {
          const id = String(feature.properties.id ?? idx);
          const [lon, lat] = feature.geometry.coordinates;
          return (
            <button key={id} className={selectedId === id ? 'list-item active' : 'list-item'} onClick={() => onSelect(feature)}>
              <strong>{String(feature.properties.betreiber ?? 'Ladestation')}</strong>
              <span>{String(feature.properties.strasse ?? '')} {String(feature.properties.hausnummer ?? '')}</span>
              <small>{lat.toFixed(4)}, {lon.toFixed(4)}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
