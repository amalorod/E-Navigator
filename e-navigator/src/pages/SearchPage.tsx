import { useEffect, useState } from 'react';
import type { AddressSuggestion, ChargingFeature } from '../types';
import { fetchAddressSuggestions, fetchStations } from '../services/api';

type Props = {
  selectedId: string | null;
  onSelect: (feature: ChargingFeature) => void;
  onCenterChange: (center: [number, number]) => void;
  onAddressPicked: (address: AddressSuggestion) => void;
  onStationsLoaded: (features: ChargingFeature[]) => void;
};

export function SearchPage({ selectedId, onSelect, onCenterChange, onAddressPicked, onStationsLoaded }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ChargingFeature[]>([]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const result = await fetchAddressSuggestions(query);
      setSuggestions(result);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleAddressClick = async (address: AddressSuggestion) => {
    setLoading(true);
    setQuery(address.displayName);
    setSuggestions([]);
    onAddressPicked(address);
    onCenterChange([address.lat, address.lon]);
    try {
      const delta = 0.15;
      const collection = await fetchStations([
        address.lon - delta,
        address.lat - delta,
        address.lon + delta,
        address.lat + delta,
      ]);
      setItems(collection.features);
      onStationsLoaded(collection.features);
      if (collection.features[0]) onSelect(collection.features[0]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>Adresse suchen</h2>
      <p className="muted">Adresse eintippen, Vorschlag wählen, dann werden passende Ladestationen geladen.</p>
      <div className="search-wrap">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="z. B. Berlin Hauptbahnhof" />
        {suggestions.length > 0 && (
          <div className="dropdown">
            {suggestions.map((s) => (
              <button key={`${s.lat}-${s.lon}`} className="dropdown-item" onClick={() => handleAddressClick(s)}>{s.displayName}</button>
            ))}
          </div>
        )}
      </div>

      <div className="list">
        {loading && <div className="muted">Lade Stationsdaten…</div>}
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
