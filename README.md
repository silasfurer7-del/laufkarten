# laufkarten

Rundkurs-Vorschläge als Laufkarte (Karte + Höhenprofil + GPX) für das Rheintal und den Bodensee,
dazu der Trainings-Skill (`skills/training/SKILL.md`).

```bash
pip install -q -r requirements.txt
python3 scripts/karte.py --start 47.45131,9.55342 --km 12 --n 3 --name "Heiden Runde"
```

| Option | Bedeutung |
|---|---|
| `--start lat,lon` | Startpunkt (Standard Wolfhalden) |
| `--km 12` | Ziel-Länge |
| `--climb 0.5` | Höhenmeter-Strafe: 0 = egal, 1 = möglichst flach |
| `--n 3` | Anzahl Varianten, `karte0.png` ist die beste |
| `--no-render` | nur Kennzahlen, keine Bilder |

Laufzeit rund 8 s (8 km) bis 30 s (20 km). Der Kachel-Cache in `cache/z14/` deckt den Raum
Wolfhalden/Heiden/St. Margrethen ab; andere Startpunkte dekodiert das Skript einmalig aus den PMTiles.

## Daten

- `rheintal-bodensee.pmtiles`: Shortbread-Vektorkacheln (© OpenStreetMap-Mitwirkende, ODbL; Extrakt via BBBike),
  Gebiet 9.35,47.33 – 9.75,47.57, Zoom 0–14
- `dem/13/`: Terrarium-Höhenkacheln z13 (Mapzen/AWS Terrain Tiles), geladen durch `.github/workflows/hoehendaten.yml`
- `cache/z14/`: dekodierte Kacheln (Strassen, Land, Wasser, Gebäude, Ortsnamen), vom Skript angelegt
