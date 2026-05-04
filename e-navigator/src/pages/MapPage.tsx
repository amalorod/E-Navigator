import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import type { AddressSuggestion, ChargingFeature } from '../types';
import { fetchStations } from '../services/api';
import {
  distanceInKm,
  escapeHtml,
  getBboxAroundPoint,
  getStationAddress,
  getStationId,
  getStationPower,
  getStationTitle,
} from '../utils/stations';

type Props = {
  center: [number, number];
  stations: ChargingFeature[];
  selected: ChargingFeature | null;
  selectedAddress: AddressSuggestion | null;
  onCenterChange: (center: [number, number]) => void;
  onAddressPicked: (address: AddressSuggestion | null) => void;
  onStationsLoaded: (features: ChargingFeature[]) => void;
  onSelectedStationChange: (feature: ChargingFeature | null) => void;
};

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
});

function getStationPopup(feature: ChargingFeature): string {
  const title = escapeHtml(getStationTitle(feature));
  const address = escapeHtml(getStationAddress(feature));
  const power = escapeHtml(getStationPower(feature));

  return `
    <div class="popup">
      <strong>${title}</strong>
      ${address ? `<br/><span>${address}</span>` : '<br/><span>Adresse konnte nicht gefunden werden</span>'}
      ${power ? `<br/><span>Leistung: ${power}</span>` : ''}
    </div>
  `;
}

export function MapPage({
  center,
  stations,
  selected,
  selectedAddress,
  onCenterChange,
  onAddressPicked,
  onStationsLoaded,
  onSelectedStationChange,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const clusterLayer = useRef<L.MarkerClusterGroup | null>(null);
  const addressMarker = useRef<L.CircleMarker | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const requestIdRef = useRef(0);

  const [loadingAroundPoint, setLoadingAroundPoint] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const selectedId = useMemo(() => {
    return selected ? getStationId(selected) : null;
  }, [selected]);

  const loadStationsAroundMapClick = useCallback(
    async (lat: number, lon: number) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      setLoadingAroundPoint(true);
      setMapError(null);

      const clickedPoint: AddressSuggestion = {
        lat,
        lon,
        displayName: `Gewählter Kartenpunkt: ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      };

      // Alte Auswahl und alte Ladesäulen sofort entfernen
      onSelectedStationChange(null);
      onStationsLoaded([]);

      // Neuen roten Marker setzen
      onAddressPicked(clickedPoint);
      onCenterChange([lat, lon]);

      try {
        const radiusKm = 10;
        const bbox = getBboxAroundPoint(lat, lon, radiusKm);

        const collection = await fetchStations(bbox);

        // Falls zwischenzeitlich erneut geklickt wurde, alte Antwort ignorieren
        if (requestId !== requestIdRef.current) {
          return;
        }

        const nearbyStations = collection.features
          .filter((feature) => {
            const [stationLon, stationLat] = feature.geometry.coordinates;

            return (
              Number.isFinite(stationLat) &&
              Number.isFinite(stationLon) &&
              distanceInKm([lat, lon], [stationLat, stationLon]) <= radiusKm
            );
          })
          .sort((a, b) => {
            const [aLon, aLat] = a.geometry.coordinates;
            const [bLon, bLat] = b.geometry.coordinates;

            return (
              distanceInKm([lat, lon], [aLat, aLon]) -
              distanceInKm([lat, lon], [bLat, bLon])
            );
          });

        onStationsLoaded(nearbyStations);

        const map = mapInstance.current;

        if (map) {
          map.flyTo([lat, lon], Math.max(map.getZoom(), 13), {
            animate: true,
            duration: 0.5,
          });
        }
      } catch (error) {
        if (requestId === requestIdRef.current) {
          console.error(error);
          onStationsLoaded([]);
          setMapError('Die Ladesäulen im Umkreis konnten nicht geladen werden.');
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoadingAroundPoint(false);
        }
      }
    },
    [
      onAddressPicked,
      onCenterChange,
      onSelectedStationChange,
      onStationsLoaded,
    ],
  );

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(center, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      chunkedLoading: true,
    });

    map.addLayer(cluster);

    mapInstance.current = map;
    clusterLayer.current = cluster;

    window.setTimeout(() => {
      map.invalidateSize();
    }, 0);

    return () => {
      map.remove();
      mapInstance.current = null;
      clusterLayer.current = null;
      markerRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;

    if (!map) return;

    const handleClick = (event: L.LeafletMouseEvent) => {
      loadStationsAroundMapClick(event.latlng.lat, event.latlng.lng);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [loadStationsAroundMapClick]);

  useEffect(() => {
    const cluster = clusterLayer.current;

    if (!cluster) return;

    cluster.clearLayers();
    markerRefs.current.clear();

    stations.forEach((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      const id = getStationId(feature);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

      const marker = L.marker([lat, lon]);
      marker.bindPopup(getStationPopup(feature));

      markerRefs.current.set(id, marker);
      cluster.addLayer(marker);
    });
  }, [stations]);

  useEffect(() => {
    const map = mapInstance.current;

    if (!map) return;

    map.setView(center, Math.max(map.getZoom(), 13));
  }, [center]);

  useEffect(() => {
    const map = mapInstance.current;

    if (!map || !selected || !selectedId) return;

    const [lon, lat] = selected.geometry.coordinates;
    const marker = markerRefs.current.get(selectedId);

    map.flyTo([lat, lon], Math.max(map.getZoom(), 15), {
      animate: true,
      duration: 0.6,
    });

    if (marker) {
      window.setTimeout(() => {
        marker.openPopup();
      }, 350);
    }
  }, [selected, selectedId]);

  useEffect(() => {
    const map = mapInstance.current;

    if (!map) return;

    if (addressMarker.current) {
      map.removeLayer(addressMarker.current);
      addressMarker.current = null;
    }

    if (!selectedAddress) return;

    addressMarker.current = L.circleMarker(
      [selectedAddress.lat, selectedAddress.lon],
      {
        radius: 10,
        color: '#dc2626',
        weight: 3,
        fillColor: '#ef4444',
        fillOpacity: 0.28,
      },
    )
      .addTo(map)
      .bindPopup(
        `<strong>Ausgewählter Punkt</strong><br/>${escapeHtml(selectedAddress.displayName)}`,
      )
      .openPopup();
  }, [selectedAddress]);

  return (
    <section className="panel map-panel">
      <div className="map-header">
        <div>
          <p className="eyebrow">Karte</p>
          <h2>Ladestationen im Umkreis</h2>
          <p className="muted">
            Klicke auf die Karte, um alle Ladesäulen im Umkreis von 10 km zu laden.
          </p>

          {loadingAroundPoint && (
            <p className="muted">Lade Ladesäulen im 10-km-Umkreis…</p>
          )}

          {!loadingAroundPoint && stations.length > 0 && (
            <p className="muted">
              {stations.length} Ladesäulen im Umkreis gefunden.
            </p>
          )}

          {mapError && (
            <p className="notice error">{mapError}</p>
          )}
        </div>
      </div>

      <div className="map" ref={mapRef} />
    </section>
  );
}