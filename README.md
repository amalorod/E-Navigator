#E-Navigator
##Eine React + TypeScript Anwendung zur Suche und Visualisierung von E-Ladestationen auf Basis der öffentlichen Bundesnetzagentur-API.

#Features
Home View: Einführung und Nutzenübersicht
Search View: Adresssuche (Nominatim) + Abruf von Ladestationen (bund.dev) in der Umgebung
Map View: Interaktive Leaflet-Karte mit Marker-Clustering (Leaflet.markercluster) und Popups
Verknüpfte Interaktion: Auswahl in der Liste zentriert die Karte und öffnet passende Marker-Infos

#APIs
Ladestationen: GET https://ladestationen.api.bund.dev/query
Geocoding: GET https://nominatim.openstreetmap.org/search
KI-Dokumentation (Prompts)
Die wesentlichen Codeabschnitte wurden KI-gestützt erstellt. 

##Verwendete Hauptprompts:

„Erstelle ein Vite React TypeScript Projekt mit drei Views (Home, Suche, Karte) und Navigation.“
„Integriere die Bundesnetzagentur-Ladestations-API über fetch und zeige Ergebnisse als Liste an.“
„Baue eine Leaflet-Karte mit Leaflet.markercluster und verknüpfe Listenauswahl mit Marker/Centering.“
„Ergänze responsive UI und kurze Home-Beschreibung für eine nutzerfreundliche Struktur.“
Start
npm install
npm run dev

