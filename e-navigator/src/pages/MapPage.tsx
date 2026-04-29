// MapPage.tsx
import { useEffect, useRef } from 'react';
import type { ChargingFeature } from '../types';

declare global {
  interface Window { L: any }
}

type Props = {
  center: [number, number];
  stations: ChargingFeature[];
  selected: ChargingFeature | null;
};

export function MapPage({ center, stations, selected }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const clusterLayer = useRef<any>(null);
  // Map of feature id -> marker instance
  const markersRef = useRef<Map<string, any>>(new Map());

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !window.L) return;
    const L = window.L;

    // Create map
    mapInstance.current = L.map(mapRef.current, { preferCanvas: true }).setView(center, 12);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance.current);

    // Create cluster layer (ensure markercluster plugin is loaded)
    if (typeof L.markerClusterGroup === 'function') {
      clusterLayer.current = L.markerClusterGroup();
      mapInstance.current.addLayer(clusterLayer.current);
    } else {
      // fallback: simple layer group if plugin missing
      clusterLayer.current = L.layerGroup();
      mapInstance.current.addLayer(clusterLayer.current);
    }

    // cleanup on unmount
    return () => {
      try {
        markersRef.current.clear();
        if (clusterLayer.current && mapInstance.current) {
          mapInstance.current.removeLayer(clusterLayer.current);
        }
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Update markers when stations change
  useEffect(() => {
    if (!clusterLayer.current || !window.L) return;
    const L = window.L;

    // Clear previous markers
    clusterLayer.current.clearLayers();
    markersRef.current.clear();

    stations.forEach((feature, idx) => {
      const coords = feature.geometry?.coordinates;
      if (!coords || coords.length < 2) return;
      const [lon, lat] = coords;
      const marker = L.marker([lat, lon]);

      const id = String(feature.properties?.id ?? idx);
      const title = String(feature.properties?.betreiber ?? 'Ladestation');
      const street = String(feature.properties?.strasse ?? '');

      marker.bindPopup(`<b>${title}</b><br/>${street}`);
      marker.featureId = id;

      markersRef.current.set(id, marker);
      clusterLayer.current.addLayer(marker);
    });

    // If a station is selected, open its popup (after markers added)
    if (selected) {
      const selId = String(selected.properties?.id ?? '');
      const marker = markersRef.current.get(selId);
      if (marker) {
        // ensure map view includes marker before opening popup
        if (mapInstance.current && typeof mapInstance.current.setView === 'function') {
          const latLng = marker.getLatLng();
          mapInstance.current.setView(latLng, Math.max(mapInstance.current.getZoom(), 13));
        }
        marker.openPopup();
      }
    }
  }, [stations, selected]);

  // Update center when prop changes
  useEffect(() => {
    if (mapInstance.current && typeof mapInstance.current.setView === 'function') {
      mapInstance.current.setView(center, mapInstance.current.getZoom() || 13);
    }
  }, [center]);

  return (
    <section className="panel">
      <h2>Karte</h2>
      <div
        className="map"
        ref={mapRef}
        style={{ width: '100%', height: '400px' }} // ensure container has height
      />
    </section>
  );
}
