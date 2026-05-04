import { useEffect, useState } from 'react';
import type { AddressSuggestion, ChargingFeature } from '../types';
import { fetchAddressSuggestions, fetchStations } from '../services/api';



type Props = {
  selectedId: string | null;
  onSelect: (feature: ChargingFeature) => void;
  onCenterChange: (center: [number, number]) => void;
  onAddressPicked: (address: AddressSuggestion) => void;
  onStationsLoaded: (features: ChargingFeature[]) => void;
  onOpenMap: () => void;
};

function getStationId(feature: ChargingFeature): string {
  const props = feature.properties ?? {};
  const coordinates = feature.geometry?.coordinates ?? [];

  return String(
    props.id ??
      props.uuid ??
      props.objectid ??
      `${coordinates[0]}-${coordinates[1]}-${props.betreiber ?? ''}-${props.strasse ?? ''}`,
  );
}

function formatStationTitle(feature: ChargingFeature): string {
  return String(
    feature.properties?.betreiber ??
      feature.properties?.name ??
      feature.properties?.bezeichnung ??
      'Ladestation',
  );
}

function formatStationAddress(feature: ChargingFeature): string {
  const p = feature.properties ?? {};

  return [
    p.strasse,
    p.hausnummer,
    p.postleitzahl,
    p.ort,
  ]
    .filter(Boolean)
    .map(String)
    .join(' ');
}

export function SearchPage({
  selectedId,
  onSelect,
  onCenterChange,
  onAddressPicked,
  onStationsLoaded,
  onOpenMap,
}: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [items, setItems] = useState<ChargingFeature[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      setError(null);

      try {
        const result = await fetchAddressSuggestions(trimmed);

        if (!cancelled) {
          setSuggestions(result);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setError('Die Adresssuche konnte nicht geladen werden.');
        }
      } finally {
        if (!cancelled) {
          setLoadingSuggestions(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const handleAddressClick = async (address: AddressSuggestion) => {
    setLoadingStations(true);
    setError(null);
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

      const features = collection.features ?? [];

      setItems(features);
      onStationsLoaded(features);

      if (features.length > 0) {
        onSelect(features[0]);
      } else {
        onOpenMap();
      }
    } catch {
      setItems([]);
      onStationsLoaded([]);
      setError('Die Ladestationen konnten nicht geladen werden.');
    } finally {
      setLoadingStations(false);
    }
  };

  const handleStationClick = (feature: ChargingFeature) => {
    const [lon, lat] = feature.geometry.coordinates;

    onCenterChange([lat, lon]);
    onSelect(feature);
  };

  return (
    <section className="panel search-panel">
      <div className="section-heading">
        <p className="eyebrow">Suche</p>
        <h2>Adresse oder Standort suchen</h2>
        <p className="muted">
          Gib eine Adresse ein, wähle einen Vorschlag und öffne passende Ladepunkte auf der Karte.
        </p>
      </div>

      <div className="search-wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="z. B. Berlin Hauptbahnhof"
          autoComplete="off"
        />

        {loadingSuggestions && (
          <div className="dropdown dropdown-status">Suche läuft…</div>
        )}

        {!loadingSuggestions && suggestions.length > 0 && (
          <div className="dropdown">
            {suggestions.map((s) => (
              <button
                key={`${s.lat}-${s.lon}-${s.displayName}`}
                className="dropdown-item"
                onClick={() => handleAddressClick(s)}
              >
                {s.displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="notice error">{error}</div>}

      <div className="result-header">
        <h3>Gefundene Ladestationen</h3>

        {items.length > 0 && (
          <span className="badge">{items.length} Treffer</span>
        )}
      </div>

      <div className="list">
        {loadingStations && <div className="muted">Lade Stationsdaten…</div>}

        {!loadingStations && items.length === 0 && (
          <div className="empty-state">
            Noch keine Stationen geladen. Starte mit einer Adresssuche.
          </div>
        )}

        {items.map((feature) => {
          const id = getStationId(feature);
          const [lon, lat] = feature.geometry.coordinates;

          return (
            <button
              key={id}
              className={selectedId === id ? 'list-item active' : 'list-item'}
              onClick={() => handleStationClick(feature)}
            >
              <strong>{formatStationTitle(feature)}</strong>

              <span>
                {formatStationAddress(feature) || 'Adresse nicht verfügbar'}
              </span>

              <small>
                {lat.toFixed(5)}, {lon.toFixed(5)}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}