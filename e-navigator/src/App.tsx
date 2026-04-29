import { useMemo, useState } from 'react';
import './App.css';
import { NavBar } from './components/NavBar';
import { useHashView } from './hooks/useHashView';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { SearchPage } from './pages/SearchPage';
import type { ChargingFeature } from './types';

function App() {
  const { view, navigate } = useHashView();
  const [center, setCenter] = useState<[number, number]>([52.52, 13.405]);
  const [selected, setSelected] = useState<ChargingFeature | null>(null);
  const [stations, setStations] = useState<ChargingFeature[]>([]);

  const selectedId = useMemo(() => (selected ? String(selected.properties.id ?? '') : null), [selected]);

  return (
    <div className="layout">
      <NavBar current={view} onNavigate={navigate} />
      {view === 'home' && <HomePage />}
      {view === 'search' && (
        <SearchPage
          selectedId={selectedId}
          onCenterChange={setCenter}
          onSelect={(feature) => {
            setSelected(feature);
            setStations((prev) => (prev.some((f) => f === feature) ? prev : [feature, ...prev]));
            navigate('map');
          }}
        />
      )}
      {view === 'map' && <MapPage center={center} stations={stations} selected={selected} />}
    </div>
  );
}

export default App;
