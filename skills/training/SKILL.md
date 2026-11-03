---
name: "training"
description: "Silas' Training. IMMER zuerst lesen, sobald es um Training, Workout, Gym, Push/Pull/Beine, PR, Lauf, Pace, Intervalle, Strava, Hevy, Laufkarte oder Rundkurs geht, und auch bei jeder Frage, was an einem Tag oder Wochentag ansteht («was steht am Freitag an», «was hab ich heute»). Liefert kurze Antworten: Einheit aus dem Ultra-Plan (Google Calendar), PR-Chancen aus Strava, Laufkarte per Befehl."
---

# Training (Kraft + Laufen)

## Grundregel: schnell und kurz

Silas will keine Übungslisten und keine Satz-für-Satz-Wiederholung. Er will wissen **was ansteht** und **wo er angreifen kann**. Antwort in 4 bis 8 Zeilen, Deutsch, du-Form, keine Einleitung, kein Datum als Überschrift, keine Erklärung, warum etwas wegfällt, keine Rückfrage am Schluss.

Nie machen, ausser er fragt ausdrücklich («alle Übungen», «Details», «was hab ich genau gemacht»):
- alle Übungen eines Workouts aufzählen
- einzelne Sätze aufzählen
- das letzte Workout nacherzählen

## Daten holen: höchstens zwei Aufrufe

1. **Google Calendar** `list_events` nur für den gefragten Tag (startTime und endTime auf diesen Tag). Dort steht der Ultra-Plan mit Zeiten und Vorgaben.
2. **Strava** `list_activities(first=15, use_preferred_units=true)`, nur wenn ein Gym-Workout ansteht (für die PR-Chancen) oder er nach Läufen fragt.

Sonst nichts:
- Die Beschreibung jedes Kraft-Workouts in Strava enthält schon alle Hevy-Sätze («Übung / Set 1: 45 kg x 10 [Warm-up]»). Darum **nie** `get_strength_workout_details` aufrufen, das kostet nur Zeit.
- Keine weiteren Strava-Seiten laden, ausser die Frage betrifft mehr als die letzten 3 Wochen.
- `get_athlete_best_efforts` nur, wenn er nach Lauf-Bestzeiten fragt.
- Profil nicht abrufen; bekannt (Strava-Fokus, Stand Nov 2026): St. Gallen, metrisch, Ziel 60-km-Ultra mit konstanter 6:00/km bis Mai 2027.

## Was steht an?

Der Wochenplan im Kalender («Ultra-Plan», Stand Nov 2026) ist fix. Der Kalender-Aufruf bestätigt ihn und liefert Zeit und Vorgaben:

| Tag | Einheit |
|---|---|
| Mo | Intervalle (z. B. 6×400 m @ 4:15) |
| Di | Push 17:30–20:00 |
| Mi | Langer Lauf 12–14 km @ 6:30–7:00, Puls < 154 |
| Do | Pull 17:30–20:00 |
| Fr | Beine 17:30–20:00 |
| Sa | Lockerer Lauf 8 km @ 6:10–6:30 + Push |
| So | Pull 12:00 |

Erste Zeile der Antwort: Einheit und Zeit. Bei Lauftagen dazu die Vorgabe aus der Kalender-Beschreibung (Distanz, Pace, Puls) in einer Zeile, und **immer die Laufkarte** (siehe unten), egal ob langer Lauf, lockerer Lauf oder Intervalle. Ohne Nachfrage, ohne Erklärung, einfach erzeugen und zeigen. Bei Gym-Tagen folgen die PR-Chancen.

Strava-Workouts heissen «Push», «Pull (Rücken/Arme)», «LEG» (manchmal «Nachmittag Workout 💪», dann am Inhalt erkennen: Brustpresse = Push, Rudern/Latzug = Pull, Beinpresse = Leg). Für die PR-Chancen das letzte Workout der gleichen Art nehmen.

## PR-Chancen (das Wichtigste)

Pro Workout nur die 2 bis 4 Übungen nennen, bei denen ein PR realistisch ist. Nur Arbeitssätze zählen, Sätze mit [Warm-up] ignorieren.

Eine Übung ist PR-Kandidat, wenn im letzten Workout dieser Art eines zutrifft:
- oberster Arbeitssatz **ohne** [Failure] und mindestens 10 Wiederholungen → nächstes Mal +2.5 kg (Maschine/Kabel) bzw. +5 kg (Beinpresse)
- Wiederholungen beim gleichen Gewicht über die letzten 2 bis 3 Workouts gestiegen → +1 Wiederholung oder +2.5 kg
- Notiz in Hevy wie «hoch», «nöchstes mal 25», «hoch auf 27.5» → genau das vorschlagen

Kein Kandidat: oberster Satz mit [Failure] und weniger Wiederholungen als beim Mal davor. Dann allenfalls einmal nennen: «halten».

Format pro Zeile: `Übung: zuletzt Gewicht × Wdh → Vorschlag`. Zuletzt und Vorschlag reichen, keine Historie.

### Beispiele

Frage: «Was steht am Freitag an?»

```
**Fr: Beine, 17:30–20:00** (zuletzt Do 30.10.)
PR-Chancen:
- Beinpresse: 120 kg × 12 → 125 kg
- Wadenheben: 52.5 kg × 14 → 55 kg
- Hüftadduktion: 102.5 kg × 12 → 105 kg
Beinstrecken 60 kg halten (× 12 war Failure), Beinbeugen halten.
```

Frage: «Was steht am Mittwoch an?»

```
**Mi: Langer Lauf 12 km, 17:00** · 6:30–7:00/km, Puls unter 154, Steigungen gehen, Stirnlampe.
[karte0.png]
11.6 km, ↑291 Hm, Pfad/Weg 44 %
```

## Laufen

- «Wie war der Lauf» / «letzte Läufe»: Distanz, Pace, Hm, relative Anstrengung in einer Zeile pro Lauf, maximal 3 Läufe.
- Einordnung immer an der Kalender-Vorgabe und am Ziel 6:00/km über 60 km messen. Ist die Pace der lockeren Läufe im vorgegebenen Fenster, passt es.
- Lauf-PRs nur über `get_athlete_best_efforts`, nicht aus den Aktivitäten schätzen.

## Laufkarte / Rundkurs-Vorschlag

Kommt **bei jedem Lauftag automatisch** mit, und natürlich wenn er explizit eine Karte will. Repo `silasfurer7-del/laufkarten`, ein Befehl, 10 bis 30 Sekunden. Keine eigene Routensuche bauen, keine Kartenbibliotheken ausprobieren.

```bash
git clone -q --depth 1 https://github.com/silasfurer7-del/laufkarten
pip install -q networkx matplotlib pillow
python3 laufkarten/scripts/karte.py --start 47.45131,9.55342 --km 12 --n 3 --name "Heiden Runde"
```

- `--start lat,lon`: Standard ist Wolfhalden. Bekannte Startpunkte: Wolfhalden 47.45131,9.55342 · Heiden 47.4427,9.5333 · St. Margrethen 47.4527,9.6375 · St. Gallen 47.4245,9.3767.
- `--km`: Distanz aus dem Kalender (bei Intervallen die Gesamtdistanz: Einlaufen + Intervalle + Auslaufen, z. B. 6×400 m ≈ 7 km). `--climb 1` für flach, `--climb 0` wenn Höhenmeter egal sind (Standard 0.5).
- `--n 1` für den Tagesvorschlag (eine Karte reicht), `--n 3` nur wenn er Varianten will. `--no-render` für nur Kennzahlen.
- Startpunkte ausserhalb des Cache brauchen zusätzlich `pip install -q pmtiles mapbox_vector_tile` (das Skript sagt es, wenn es fehlt).
- Ausgabe: `karte.png` (Karte + Höhenprofil) und `karte.gpx`. Die PNGs direkt zeigen, dazu die Kennzahlen-Zeile des Skripts (km, Hm, doppelt gelaufen, Pfadanteil). Nichts weiter beschreiben.
