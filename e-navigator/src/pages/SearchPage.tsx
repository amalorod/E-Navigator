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
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setItems([]);
    try {
      console.log('Suche nach:', query);
      const geo = await geocodeAddress(query);
      console.log('Geocode result:', geo);
      if (!geo) {
        setError('Adresse konnte nicht gefunden werden.');
        return;
      }

      // center: [lat, lon] — Map erwartet [lat, lon]
      onCenterChange([geo.lat, geo.lon]);

      const delta = 0.2;
      // fetchStations erwartet bbox: [minLon, minLat, maxLon, maxLat]
      const bbox: [number, number, number, number] = [
        geo.lon - delta,
        geo.lat - delta,
        geo.lon + delta,
        geo.lat + delta,
      ];
      console.log('Request bbox:', bbox);

      const collection = await fetchStations(bbox);
      console.log('Stations response:', collection);

      if (!collection || !Array.isArray(collection.features) || collection.features.length === 0) {
        setError('Keine Ladestationen in diesem Bereich gefunden.');
        setItems([]);
        return;
      }

      setItems(collection.features);
    } catch (err: any) {
      console.error('Fehler bei Suche:', err);
      setError(err?.message ?? 'Unbekannter Fehler');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>Suche nach Adresse</h2>

      <div className="search-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Adresse eingeben"
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Lädt...' : 'Suchen'}
        </button>
      </div>

      {error && <div className="error" style={{ color: 'crimson' }}>{error}</div>}

      <div className="list">
        {items.map((feature, idx) => {
          const id = String(feature.properties?.id ?? idx);
          const coords = feature.geometry?.coordinates ?? [0, 0];
          const [lon, lat] = coords;
          return (
            <button
              key={id}
              className={selectedId === id ? 'list-item active' : 'list-item'}
              onClick={() => onSelect(feature)}
            >
              <strong>{String(feature.properties?.betreiber ?? 'Ladestation')}</strong>
              <span>
                {String(feature.properties?.strasse ?? '')}{' '}
                {String(feature.properties?.hausnummer ?? '')}
              </span>
              <small>
                {Number(lat).toFixed(4)}, {Number(lon).toFixed(4)}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
