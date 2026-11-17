# laufkarten

Rundkurs-Vorschläge als Laufkarte (Karte + Höhenprofil + GPX) für das Rheintal und den Bodensee,
dazu der Trainings-Skill (`skills/training/SKILL.md`).

```bash
pip install -q -r requirements.txt
python3 scripts/karte.py --start wolfhalden --km 12 --typ lang --name "Heiden Runde"
```

| Option | Bedeutung |
|---|---|
| `--start` | Ortsname (wolfhalden, heiden, margrethen, eselschwanz, rheineck, stgallen) oder lat,lon |
| `--typ` | intervall (flach), lang (Hügel ok), locker (wenig Hm); ersetzt `--climb` |
| `--km 12` | Ziel-Länge |
| `--climb 0.5` | Höhenmeter-Strafe: 0 = egal, 1 = möglichst flach |
| `--n 3` | Anzahl Varianten, `karte0.png` ist die beste |
| `--seed` | Standard: Kalenderwoche, darum jede Woche eine andere Runde |
| `--no-render` | nur Kennzahlen, keine Bilder |

Laufzeit rund 8 s (8 km) bis 30 s (20 km). Der Kachel-Cache in `cache/z14/` deckt den Raum
Wolfhalden/Heiden/St. Margrethen ab; andere Startpunkte dekodiert das Skript einmalig aus den PMTiles.

## Tagesplan (Branch `heute`)

`.github/workflows/tagesplan.yml` rechnet jede Nacht die Karten für den nächsten Tag (fünf Profile: normal,
nur Strasse, Höhenmeter, flach, Natur) und legt sie mit `scripts/heute.py` auf den Branch `heute`:
`https://raw.githubusercontent.com/silasfurer7-del/laufkarten/heute/heute.md`. Im Chat holt der Skill nur diese Dateien.

## Web-App (GitHub Pages)

Die Trainings-App liegt in `web/` und läuft ohne Claude: `https://<benutzer>.github.io/laufkarten/`.
Der Workflow `web.yml` baut sie bei jedem Push, nach dem Karten-Lauf und stündlich neu.

- **Plan**: aus dem Kalender. Secret `KALENDER_ICS` = geheime iCal-Adresse (Google Calendar → Einstellungen des Kalenders →
  «Privatadresse im iCal-Format»). Nur Termine mit Lauf, Intervalle, Push, Pull, Beine, Gym im Titel landen in `plan.json`.
  Ohne Secret gilt `web/plan-start.json`.
- **Strava**: der Browser fragt Strava selbst ab, beim Öffnen der App. Einmal pro Gerät unter «Ich → daten» anmelden.
  Die Daten bleiben auf dem Gerät, nichts davon liegt im Repo.
- **Karten**: werden in der App live aus `rheintal-bodensee.pmtiles` gezeichnet, geplante Runden kommen aus dem Branch `karten`.
- **Garmin** (Schlaf, Energie, HRV): über Garmins Personal API. Weil Garmin keine Aufrufe direkt aus dem Browser erlaubt,
  reicht ein kleiner Cloudflare Worker (`worker/garmin.js`, Workflow `worker.yml`) die Anfragen durch. Er speichert nichts.
  Den Schlüssel (connect.garmin.com → Einstellungen → Personal API Key) trägt man in der App ein; er bleibt auf dem Gerät.
  Ohne Vermittler lässt sich stattdessen der Garmin-Export (ZIP) in der App laden.

Für ein eigenes Exemplar: Repo kopieren, unter Settings → Pages die Quelle «GitHub Actions» wählen, auf strava.com/settings/api
eine API-App anlegen (Callback-Domain `<benutzer>.github.io`), Secrets `STRAVA_CLIENT_ID`, `KALENDER_ICS` und für Garmin
`CLOUDFLARE_API_TOKEN` (Cloudflare, Vorlage «Edit Cloudflare Workers») setzen,
`web/profil.json` anpassen. Das Client-Geheimnis von Strava gehört nicht ins Repo: es wird in der App eingetragen.

Lokal bauen: `python3 web/build.py --out _site --karten <Ordner mit Branch karten>`.

## Daten

- `rheintal-bodensee.pmtiles`: Shortbread-Vektorkacheln (© OpenStreetMap-Mitwirkende, ODbL; Extrakt via BBBike),
  Gebiet 9.35,47.33 – 9.75,47.57, Zoom 0–14
- `dem/13/`: Terrarium-Höhenkacheln z13 (Mapzen/AWS Terrain Tiles), geladen durch `.github/workflows/hoehendaten.yml`
- `cache/z14/`: dekodierte Kacheln (Strassen, Land, Wasser, Gebäude, Ortsnamen), vom Skript angelegt
