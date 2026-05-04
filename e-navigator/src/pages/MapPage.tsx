import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import type { AddressSuggestion, ChargingFeature } from '../types';

type Props = {
  center: [number, number];
  stations: ChargingFeature[];
  selected: ChargingFeature | null;
  selectedAddress: AddressSuggestion | null;
};

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
});

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

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getStationPopup(feature: ChargingFeature): string {
  const p = feature.properties ?? {};

  const title = escapeHtml(
    p.betreiber ??
      p.name ??
      p.bezeichnung ??
      'Ladestation',
  );

  const address = [
    p.strasse,
    p.hausnummer,
    p.postleitzahl,
    p.ort,
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join(' ');

  const power = p.anschlussleistung
    ? `<br/><span>Leistung: ${escapeHtml(p.anschlussleistung)} kW</span>`
    : '';

  const plugs = p.steckertypen || p.stecker
    ? `<br/><span>Stecker: ${escapeHtml(p.steckertypen ?? p.stecker)}</span>`
    : '';

  return `
    <div class="popup">
      <strong>${title}</strong>
      ${address ? `<br/><span>${address}</span>` : ''}
      ${power}
      ${plugs}
    </div>
  `;
}

export function MapPage({
  center,
  stations,
  selected,
  selectedAddress,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const clusterLayer = useRef<L.MarkerClusterGroup | null>(null);
  const addressMarker = useRef<L.CircleMarker | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  const selectedId = useMemo(() => {
    return selected ? getStationId(selected) : null;
  }, [selected]);

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

    if (!map || !selectedAddress) return;

    if (addressMarker.current) {
      map.removeLayer(addressMarker.current);
      addressMarker.current = null;
    }

    addressMarker.current = L.circleMarker(
      [selectedAddress.lat, selectedAddress.lon],
      {
        radius: 9,
        color: '#dc2626',
        weight: 3,
        fillColor: '#ef4444',
        fillOpacity: 0.25,
      },
    )
      .addTo(map)
      .bindPopup(
        `<strong>Gewählte Adresse</strong><br/>${escapeHtml(selectedAddress.displayName)}`,
      );
  }, [selectedAddress]);

  return (
    <section className="panel map-panel">
      <div className="map-header">
        <div>
          <p className="eyebrow">Karte</p>
          <h2>Ladestationen in der Nähe</h2>
          <p className="muted">
            {stations.length > 0
              ? `${stations.length} Ladepunkte im aktuellen Suchbereich`
              : 'Noch keine Ladepunkte geladen. Starte zuerst eine Suche.'}
          </p>
        </div>
      </div>

      <div className="map" ref={mapRef} />
    </section>
  );
}
