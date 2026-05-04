import { useEffect, useState } from "react";
import type { AddressSuggestion, ChargingFeature } from "../types";
import { fetchAddressSuggestions, fetchStations } from "../services/api";

import {
  getStationAddress,
  getStationId,
  getStationTitle,
  getStationPower,
  distanceInKm,
} from "../utils/stations";

type Props = {
  selectedId: string | null;
  onSelect: (feature: ChargingFeature) => void;
  onCenterChange: (center: [number, number]) => void;
  onAddressPicked: (address: AddressSuggestion) => void;
  onStationsLoaded: (features: ChargingFeature[]) => void;
  onOpenMap: () => void;
};

type GroupedStation = {
  address: string;
  count: number;
  features: ChargingFeature[];
  distance: number;
};

function formatStationAddress(feature: ChargingFeature): string {
  const p = feature.properties ?? {};

  return [p.strasse, p.hausnummer, p.postleitzahl, p.ort]
    .filter(Boolean)
    .map(String)
    .join(" ");
}

function groupStationsByAddress(
  features: ChargingFeature[],
  centerLat: number,
  centerLon: number,
): GroupedStation[] {
  const addressMap = new Map<string, ChargingFeature[]>();

  // Group features by address
  for (const feature of features) {
    const address = getStationAddress(feature);
    if (!addressMap.has(address)) {
      addressMap.set(address, []);
    }
    addressMap.get(address)!.push(feature);
  }

  // Convert to GroupedStation array
  const grouped: GroupedStation[] = Array.from(addressMap.entries()).map(
    ([address, stationFeatures]) => {
      const [lon, lat] = stationFeatures[0].geometry.coordinates;
      const distance = distanceInKm([centerLat, centerLon], [lat, lon]);

      return {
        address,
        count: stationFeatures.length,
        features: stationFeatures,
        distance,
      };
    },
  );

  // Sort by distance
  grouped.sort((a, b) => a.distance - b.distance);

  return grouped;
}

export function SearchPage({
  selectedId,
  onSelect,
  onCenterChange,
  onAddressPicked,
  onStationsLoaded,
  onOpenMap,
}: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [items, setItems] = useState<ChargingFeature[]>([]);
  const [groupedItems, setGroupedItems] = useState<GroupedStation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] =
    useState<AddressSuggestion | null>(null);

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
          setError("Die Adresssuche konnte nicht geladen werden.");
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
    setSelectedAddress(address);

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

      console.log("Erste Station:", collection.features[0]?.properties);
      let features = collection.features ?? [];

      // Sort stations by distance from selected address
      features.sort((a, b) => {
        const [lonA, latA] = a.geometry.coordinates;
        const [lonB, latB] = b.geometry.coordinates;
        const distA = distanceInKm([address.lat, address.lon], [latA, lonA]);
        const distB = distanceInKm([address.lat, address.lon], [latB, lonB]);
        return distA - distB;
      });

      // Keep only the 200 closest stations
      features = features.slice(0, 200);

      setItems(features);
      onStationsLoaded(features);

      // Don't auto-select - let user choose from the list
    } catch {
      setItems([]);
      onStationsLoaded([]);
      setError("Die Ladestationen konnten nicht geladen werden.");
    } finally {
      setLoadingStations(false);
    }
  };

  const handleStationClick = (feature: ChargingFeature) => {
    const [lon, lat] = feature.geometry.coordinates;

    onCenterChange([lat, lon]);
    onSelect(feature);
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolokation wird von Ihrem Browser nicht unterstützt.");
      return;
    }

    setLoadingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          setQuery(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          setSuggestions([]);
          setSelectedAddress({ displayName: "Mein Standort", lat, lon });

          onAddressPicked({ displayName: "Mein Standort", lat, lon });
          onCenterChange([lat, lon]);

          // Load stations around the current location
          const delta = 0.15;
          const collection = await fetchStations([
            lon - delta,
            lat - delta,
            lon + delta,
            lat + delta,
          ]);

          let features = collection.features ?? [];

          // Sort stations by distance from current location
          features.sort((a, b) => {
            const [lonA, latA] = a.geometry.coordinates;
            const [lonB, latB] = b.geometry.coordinates;
            const distA = distanceInKm([lat, lon], [latA, lonA]);
            const distB = distanceInKm([lat, lon], [latB, lonB]);
            return distA - distB;
          });

          // Keep only the 200 closest stations
          features = features.slice(0, 200);

          setItems(features);
          onStationsLoaded(features);
        } catch {
          setItems([]);
          onStationsLoaded([]);
          setError("Die Ladestationen konnten nicht geladen werden.");
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        setLoadingLocation(false);
        setError(
          "Standortzugriff wurde verweigert. Bitte aktivieren Sie die Geolokation in den Browsereinstellungen.",
        );
      },
    );
  };

  return (
    <section className="panel search-panel">
      <div className="section-heading">
        <p className="eyebrow">Suche</p>
        <h2>Adresse oder Standort suchen</h2>
        <p className="muted">
          Gib eine Adresse ein, wähle einen Vorschlag und öffne passende
          Ladepunkte auf der Karte.
        </p>
      </div>

      <div className="search-wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="z. B. Berlin Hauptbahnhof"
          autoComplete="off"
        />

        <button
          onClick={handleUseMyLocation}
          disabled={loadingLocation || loadingStations}
          className="location-button"
          title="Aktuellen Standort verwenden"
        >
          {loadingLocation ? "Standort wird bestimmt…" : "📍 Mein Standort"}
        </button>

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
          const distance = selectedAddress
            ? distanceInKm(
                [selectedAddress.lat, selectedAddress.lon],
                [lat, lon],
              )
            : null;
          const power = getStationPower(feature);

          return (
            <button
              key={id}
              className={selectedId === id ? "list-item active" : "list-item"}
              onClick={() => handleStationClick(feature)}
            >
              <div className="station-header">
                <strong>{getStationTitle(feature)}</strong>
                {distance !== null && (
                  <span className="distance-badge">
                    {distance.toFixed(1)} km
                  </span>
                )}
              </div>

              <span className="address">
                {getStationAddress(feature) ||
                  "Adresse konnte nicht gefunden werden"}
              </span>

              {power && (
                <span className="power-info">⚡ Leistung: {power}</span>
              )}

              <small className="coordinates">
                {lat.toFixed(5)}, {lon.toFixed(5)}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
