import { useEffect, useState } from 'react';
import type { AppView } from '../types';

const validViews: AppView[] = ['home', 'search', 'map'];

function getViewFromHash(): AppView {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return validViews.includes(raw as AppView) ? (raw as AppView) : 'home';
}

export function useHashView() {
  const [view, setView] = useState<AppView>(() => getViewFromHash());

  useEffect(() => {
    const onHashChange = () => {
      setView(getViewFromHash());
    };

    window.addEventListener('hashchange', onHashChange);

    if (!window.location.hash) {
      window.location.hash = '/home';
    }

    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: AppView) => {
    window.location.hash = `/${next}`;
    setView(next);
  };

  return { view, navigate };
}