import type { AppView } from '../types';

type Props = { current: AppView; onNavigate: (view: AppView) => void };

export function NavBar({ current, onNavigate }: Props) {
  const items: AppView[] = ['home', 'search', 'map'];
  return (
    <nav className="nav">
      <div className="nav-links">
        {items.map((item) => (
          <button key={item} className={current === item ? 'active' : ''} onClick={() => onNavigate(item)}>
            {item === 'home' ? 'Home' : item === 'search' ? 'Suche' : 'Karte'}
          </button>
        ))}
      </div>
    </nav>
  );
}
