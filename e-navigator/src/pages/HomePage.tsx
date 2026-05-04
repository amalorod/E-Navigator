export function HomePage() {
  return (
    <section className="panel hero-panel">
      <p className="eyebrow">Willkommen</p>

      <h2>Finde E‑Ladestationen rund um deinen Standort</h2>

      <p className="muted">
        Der E‑Navigator verbindet Adresssuche, Ergebnisliste und Kartenansicht.
        Wähle eine Adresse aus und sieh direkt passende Ladepunkte in der Umgebung.
      </p>

      <div className="feature-grid">
        <article className="feature-card">
          <strong>Adresse suchen</strong>
          <span>Finde Orte über eine komfortable Vorschlagsliste.</span>
        </article>

        <article className="feature-card">
          <strong>Karte öffnen</strong>
          <span>Zeige Ladepunkte dynamisch mit Leaflet und Clustering.</span>
        </article>

        <article className="feature-card">
          <strong>Station auswählen</strong>
          <span>Klick auf ein Ergebnis zentriert die Karte auf den Ladepunkt.</span>
        </article>
      </div>
    </section>
  );
}