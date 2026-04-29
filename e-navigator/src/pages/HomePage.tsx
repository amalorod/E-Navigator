export function HomePage() {
  return (
    <section className="panel">
      <h2>Willkommen bei E‑Navigator</h2>
      <p>
        Diese App zeigt öffentliche E‑Ladestationen der Bundesnetzagentur auf Basis von
        Live-GeoJSON-Daten.
      </p>
      <ul>
        <li>Adresssuche mit Ergebnisliste</li>
        <li>Interaktive Karte mit Marker-Clustering und Popups</li>
        <li>Verknüpfte Auswahl zwischen Liste und Karte</li>
      </ul>
    </section>
  );
}
