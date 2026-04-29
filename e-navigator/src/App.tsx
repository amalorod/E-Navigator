import { useMemo, useState } from 'react';
import './App.css';
import { NavBar } from './components/NavBar';
import { useHashView } from './hooks/useHashView';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { SearchPage } from './pages/SearchPage';
import type { AddressSuggestion, ChargingFeature } from './types';

function App() {
  const { view, navigate } = useHashView();
  const [center, setCenter] = useState<[number, number]>([52.52, 13.405]);
  const [selected, setSelected] = useState<ChargingFeature | null>(null);
  const [stations, setStations] = useState<ChargingFeature[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);

  const selectedId = useMemo(() => (selected ? String(selected.properties.id ?? '') : null), [selected]);

  return (
    <div className="layout">
      <header className="app-header">
        <h1>E‑Navigator</h1>
        <p>Finde öffentliche Ladesäulen in der Nähe deiner Adresse.</p>
        <NavBar current={view} onNavigate={navigate} />
      </header>

      {view === 'home' && <HomePage />}
      {view === 'search' && (
        <SearchPage
          selectedId={selectedId}
          onCenterChange={setCenter}
          onAddressPicked={(address) => {
            setSelectedAddress(address);
            navigate('map');
          }}
          onStationsLoaded={(features) => {
            setStations(features);
          }}
          onSelect={(feature) => {
            setSelected(feature);
          }}
        />
      )}
      {view === 'map' && <MapPage center={center} stations={stations} selected={selected} selectedAddress={selectedAddress} />}
    </div>
  );
}

export default App;
