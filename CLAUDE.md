# laufkarten

Laufrouten-Karten (Rheintal/Bodensee) und der Trainings-Skill von Silas.

## Laufkarte erzeugen: ein Befehl, nichts anderes

```bash
pip install -q -r requirements.txt
python3 scripts/karte.py --start wolfhalden --km 12 --typ lang --name "Heiden Runde"
```

Ergebnis: `karte0.png` … (Karte + Höhenprofil), `karte0.gpx` …, eine Kennzahlen-Zeile pro Variante
(km, Hm, doppelt gelaufene Meter, Pfadanteil) und eine Zeitangabe auf stderr. 12 km dauern rund 15 s.

- Nicht die Routensuche, das Rendering oder die Höhendaten neu bauen. Alles steckt in `scripts/karte.py`.
- `cache/z14/` enthält dekodierte Vektorkacheln. Neue Kacheln (anderer Startpunkt) legt das Skript selbst ab;
  dafür braucht es `pmtiles` und `mapbox_vector_tile` (in `requirements.txt`). Neue Cache-Dateien mit einchecken.
- Fertige Karten nur zeigen, nicht beschreiben. Kennzahlen-Zeile genügt.

## Tagesplan

Branch `heute` (Workflow `tagesplan.yml` + `scripts/heute.py`): fertige Karten und Text für den Tag.
Vor jeder Frage zu «heute» zuerst `curl -sL https://raw.githubusercontent.com/silasfurer7-del/laufkarten/heute/heute.md`.

## Trainings-Fragen (Kraft, Laufen, PRs)

Regeln in `skills/training/SKILL.md`: ein Strava-Aufruf (`list_activities`, 15 Einträge), kurze Antwort,
nur PR-Chancen statt Übungslisten. Den Skill vor jeder Trainings-Antwort lesen.

## Daten

- `rheintal-bodensee.pmtiles`: Shortbread-Vektorkacheln (OSM, ODbL), 9.35,47.33 – 9.75,47.57, Zoom 0–14
- `dem/13/`: Terrarium-Höhenkacheln z13 (Mapzen/AWS Terrain Tiles), Workflow `.github/workflows/hoehendaten.yml`
