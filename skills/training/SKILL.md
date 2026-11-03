---
name: "training"
description: "Kurze, schnelle Antworten zu Silas' Training: was heute/am Freitag ansteht (Push/Pull/Leg aus Hevy via Strava), wo ein PR drin liegt, wie die letzten Läufe waren, Laufkarte mit Rundkurs-Vorschlag. Bei jeder Frage zu Training, Workout, Gym, PR, Lauf, Pace, Strava oder Laufkarte nutzen."
---

# Training (Kraft + Laufen)

## Grundregel: schnell und kurz

Silas will keine Übungslisten und keine Satz-für-Satz-Wiederholung. Er will wissen **was ansteht** und **wo er angreifen kann**. Antwort in 5 bis 8 Zeilen, Deutsch, du-Form, keine Einleitung, keine Rückfrage am Schluss.

Nie machen, ausser er fragt ausdrücklich («alle Übungen», «Details», «was hab ich genau gemacht»):
- alle Übungen eines Workouts aufzählen
- einzelne Sätze aufzählen
- das letzte Workout nacherzählen

## Daten holen: genau ein Aufruf

`list_activities(first=15, use_preferred_units=true)` und sonst nichts.

- Die Beschreibung jedes Kraft-Workouts enthält schon alle Hevy-Sätze («Übung / Set 1: 45 kg x 10 [Warm-up]»). Darum **nie** `get_strength_workout_details` aufrufen, das kostet nur Zeit.
- Keine weiteren Seiten laden, ausser die Frage betrifft mehr als die letzten 3 Wochen.
- `get_athlete_best_efforts` nur, wenn er nach Lauf-Bestzeiten fragt.
- Profil nicht abrufen; bekannt (Strava-Fokus, Stand Nov 2026): St. Gallen, metrisch, Ziel 60-km-Lauf mit konstanter 6:00/km bis Mai 2027.

## Was steht an? (Kraft)

Workouts heissen in Strava «Push», «Pull (Rücken/Arme)», «LEG» (manchmal «Nachmittag Workout 💪», dann am Inhalt erkennen: Brustpresse = Push, Rudern/Latzug = Pull, Beinpresse = Leg).

Nächstes Workout = das von Push / Pull / Leg, das am längsten zurückliegt. Beispiel: Leg Do, Push Fr, Pull Sa → nächstes ist Leg. Für einen Tag weiter in der Zukunft die Reihenfolge weiterdrehen und die Reihenfolge in einer Klammer nennen, nicht als Liste.

Lauftage: zwischen den Gym-Tagen liegen Läufe (5 bis 8 km, Wolfhalden/Heiden). Fragt er nach einem Tag, an dem nach Muster eher ein Lauf dran ist, kurz beides nennen («eher Lauf, Gym wäre Leg»).

## PR-Chancen (das Wichtigste)

Pro Workout nur die 2 bis 4 Übungen nennen, bei denen ein PR realistisch ist. Nur Arbeitssätze zählen, Sätze mit [Warm-up] ignorieren.

Eine Übung ist PR-Kandidat, wenn im letzten Workout dieser Art eines zutrifft:
- oberster Arbeitssatz **ohne** [Failure] und mindestens 10 Wiederholungen → nächstes Mal +2.5 kg (Maschine/Kabel) bzw. +5 kg (Beinpresse)
- Wiederholungen beim gleichen Gewicht über die letzten 2 bis 3 Workouts gestiegen → +1 Wiederholung oder +2.5 kg
- Notiz in Hevy wie «hoch», «nöchstes mal 25», «hoch auf 27.5» → genau das vorschlagen

Kein Kandidat: oberster Satz mit [Failure] und weniger Wiederholungen als beim Mal davor. Dann allenfalls einmal nennen: «halten».

Format pro Zeile: `Übung: zuletzt Gewicht × Wdh → Vorschlag`. Zuletzt und Vorschlag reichen, keine Historie.

### Beispiel

Frage: «Was steht am Freitag an?»

```
**Fr: Leg** (zuletzt Do 30.10., danach Push, Pull)
PR-Chancen:
- Beinpresse: 120 kg × 12 → 125 kg
- Wadenheben: 52.5 kg × 14 → 55 kg
- Hüftadduktion: 102.5 kg × 12 → 105 kg
Beinstrecken 60 kg halten (× 12 war Failure), Beinbeugen halten.
```

## Laufen

- «Wie war der Lauf» / «letzte Läufe»: Distanz, Pace, Hm, relative Anstrengung in einer Zeile pro Lauf, maximal 3 Läufe.
- Einordnung immer am Ziel 6:00/km über 60 km messen: ist die Pace der lockeren Läufe bei 6:00 bis 6:30 stabil, passt es.
- Lauf-PRs nur über `get_athlete_best_efforts`, nicht aus den Aktivitäten schätzen.

## Laufkarte / Rundkurs-Vorschlag

Repo `silasfurer7-del/laufkarten`, ein Befehl, 10 bis 30 Sekunden. Keine eigene Routensuche bauen, keine Kartenbibliotheken ausprobieren.

```bash
git clone -q --depth 1 https://github.com/silasfurer7-del/laufkarten
pip install -q networkx matplotlib pillow
python3 laufkarten/scripts/karte.py --start 47.45131,9.55342 --km 12 --n 3 --name "Heiden Runde"
```

- `--start lat,lon`: Standard ist Wolfhalden. Bekannte Startpunkte: Wolfhalden 47.45131,9.55342 · Heiden 47.4427,9.5333 · St. Margrethen 47.4527,9.6375 · St. Gallen 47.4245,9.3767.
- `--km`: Ziel-Länge. `--climb 1` für flach, `--climb 0` wenn Höhenmeter egal sind (Standard 0.5).
- `--n 3`: drei Varianten (karte0.png ist die beste). `--no-render` für nur Kennzahlen.
- Startpunkte ausserhalb des Cache brauchen zusätzlich `pip install -q pmtiles mapbox_vector_tile` (das Skript sagt es, wenn es fehlt).
- Ausgabe: `karte.png` (Karte + Höhenprofil) und `karte.gpx`. Die PNGs direkt zeigen, dazu die Kennzahlen-Zeile des Skripts (km, Hm, doppelt gelaufen, Pfadanteil). Nichts weiter beschreiben.
