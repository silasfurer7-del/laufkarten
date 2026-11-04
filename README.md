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

## Daten

- `rheintal-bodensee.pmtiles`: Shortbread-Vektorkacheln (© OpenStreetMap-Mitwirkende, ODbL; Extrakt via BBBike),
  Gebiet 9.35,47.33 – 9.75,47.57, Zoom 0–14
- `dem/13/`: Terrarium-Höhenkacheln z13 (Mapzen/AWS Terrain Tiles), geladen durch `.github/workflows/hoehendaten.yml`
- `cache/z14/`: dekodierte Kacheln (Strassen, Land, Wasser, Gebäude, Ortsnamen), vom Skript angelegt
