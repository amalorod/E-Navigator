import { useMemo, useState } from 'react';
import './App.css';
import { NavBar } from './components/NavBar';
import { useHashView } from './hooks/useHashView';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { SearchPage } from './pages/SearchPage';
import type { AddressSuggestion, ChargingFeature } from './types';
import { getStationId } from './utils/stations';



function App() {
  const { view, navigate } = useHashView();

  const [center, setCenter] = useState<[number, number]>([52.52, 13.405]);
  const [selected, setSelected] = useState<ChargingFeature | null>(null);
  const [stations, setStations] = useState<ChargingFeature[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);

  const selectedId = useMemo(() => {
  return selected ? getStationId(selected) : null;
  }, [selected]);


  const selectStationAndOpenMap = (feature: ChargingFeature) => {
    const [lon, lat] = feature.geometry.coordinates;

    setSelected(feature);
    setCenter([lat, lon]);
    navigate('map');
  };

  return (
    <div className="layout">
      <header className="app-header">
        <div>
          <p className="eyebrow">E-Mobilität einfach finden</p>
          <h1>E‑Navigator</h1>
          <p className="header-copy">
            Suche eine Adresse und finde öffentliche Ladepunkte in der Nähe.
          </p>
        </div>

        <NavBar current={view} onNavigate={navigate} />
      </header>

      <main>
        {view === 'home' && <HomePage />}

        {view === 'search' && (
          <SearchPage
            selectedId={selectedId}
            onCenterChange={setCenter}
            onAddressPicked={setSelectedAddress}
            onStationsLoaded={setStations}
            onSelect={selectStationAndOpenMap}
            onOpenMap={() => navigate('map')}
          />
        )}

        {view === 'map' && (
          <MapPage
            center={center}
            stations={stations}
            selected={selected}
            selectedAddress={selectedAddress}
          />
        )}
      </main>
    </div>
  );
}

export default App;