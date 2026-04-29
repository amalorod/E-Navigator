import { useEffect, useState } from 'react';
import type { AppView } from '../types';

const validViews: AppView[] = ['home', 'search', 'map'];

function getViewFromHash(): AppView {
  const value = window.location.hash.replace('#/', '') as AppView;
  return validViews.includes(value) ? value : 'home';
}

export function useHashView() {
  const [view, setView] = useState<AppView>(getViewFromHash());

  useEffect(() => {
    const onHashChange = () => setView(getViewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: AppView) => {
    window.location.hash = `/${next}`;
  };

  return { view, navigate };
}
