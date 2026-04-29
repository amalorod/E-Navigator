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

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !window.L) return;
    const L = window.L;
    mapInstance.current = L.map(mapRef.current).setView(center, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance.current);
    clusterLayer.current = L.markerClusterGroup();
    mapInstance.current.addLayer(clusterLayer.current);
  }, []);

  useEffect(() => {
    if (!clusterLayer.current || !window.L) return;
    const L = window.L;
    clusterLayer.current.clearLayers();
    stations.forEach((feature, idx) => {
      const [lon, lat] = feature.geometry.coordinates;
      const marker = L.marker([lat, lon]);
      marker.bindPopup(`<b>${String(feature.properties.betreiber ?? 'Ladestation')}</b><br/>${String(feature.properties.strasse ?? '')}`);
      clusterLayer.current.addLayer(marker);
      if (selected && String(selected.properties.id ?? idx) === String(feature.properties.id ?? idx)) {
        marker.openPopup();
      }
    });
  }, [stations, selected]);

  useEffect(() => {
    if (mapInstance.current) mapInstance.current.setView(center, 13);
  }, [center]);

  return <section className="panel"><h2>Karte</h2><div className="map" ref={mapRef} /></section>;
}
