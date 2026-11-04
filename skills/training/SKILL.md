---
name: "training"
description: "Silas' Training. IMMER zuerst lesen, sobald es um Training, Workout, Gym, Push/Pull/Beine, PR, Lauf, Pace, Intervalle, Strava, Hevy, Laufkarte, Rundkurs, Wochenplan oder Ultra geht, und auch bei jeder Frage, was an einem Tag, Wochentag oder in dieser Woche ansteht («was steht am Freitag an», «was hab ich heute», «wie war mein Lauf», «wie läuft's im Gym»). Liefert kurze Antworten: Einheit aus dem Ultra-Plan (Google Calendar), PR-Chancen aus Strava, Laufkarte automatisch bei jedem Lauftag."
---

# Training (Kraft + Laufen)

## Grundregel: schnell und kurz

Silas will keine Übungslisten und keine Satz-für-Satz-Wiederholung. Er will wissen **was ansteht**, **wo er angreifen kann** und bei Läufen **die Karte**. Antwort in 4 bis 8 Zeilen, Deutsch, du-Form, keine Einleitung, kein Datum als Überschrift, keine Erklärung, warum etwas wegfällt, keine Rückfrage am Schluss.

Nie machen, ausser er fragt ausdrücklich («alle Übungen», «Details», «was hab ich genau gemacht»):
- alle Übungen eines Workouts aufzählen
- einzelne Sätze aufzählen
- das letzte Workout nacherzählen

## Zuerst: der fertige Tagesplan (Branch `heute`)

Jede Nacht um 00:01 bereitet ein Job den Tag vor und legt alles auf den Branch `heute` im Repo. Darum bei jeder Frage zu **heute** zuerst das hier, dauert 1 Sekunde:

```bash
curl -sL https://raw.githubusercontent.com/silasfurer7-del/laufkarten/heute/heute.md
```

- Erste Zeile ist `# YYYY-MM-DD`. Stimmt das Datum mit heute überein, ist das die Antwort: den Text 1:1 übernehmen (ohne die `#`-Zeile), bei einem Lauftag dazu die Karte `heute_normal.png` laden und zeigen:
  `curl -sLO https://raw.githubusercontent.com/silasfurer7-del/laufkarten/heute/heute_normal.png`
- Will er eine bestimmte Art («nur Strasse», «mit Höhenmetern», «flach», «Natur»/«kein Dorf»), die passende Datei zeigen: `heute_strasse.png`, `heute_huegel.png`, `heute_flach.png`, `heute_natur.png`. Alle vier auf einmal, wenn er «alle Varianten» sagt. GPX gleichnamig mit `.gpx`.
- Stimmt das Datum nicht oder die Frage betrifft einen anderen Tag: normal weiter wie unten (Kalender, Strava, Karte selber rechnen).

## Daten holen: höchstens zwei Aufrufe

1. **Google Calendar** `list_events` nur für den gefragten Tag (startTime und endTime auf diesen Tag), bei Wochenfragen für die Woche. Dort steht der Ultra-Plan mit Zeiten, Vorgaben und manchmal einem Ort.
2. **Strava** `list_activities(first=15, use_preferred_units=true)`, nur wenn ein Gym-Workout ansteht (PR-Chancen), er nach Läufen fragt oder den Gym-Fortschritt will.

Sonst nichts:
- Die Beschreibung jedes Kraft-Workouts in Strava enthält schon alle Hevy-Sätze («Übung / Set 1: 45 kg x 10 [Warm-up]»). Darum **nie** `get_strength_workout_details` aufrufen, das kostet nur Zeit.
- Keine weiteren Strava-Seiten laden, ausser die Frage betrifft mehr als die letzten 3 Wochen.
- `get_athlete_best_efforts` nur, wenn er nach Lauf-Bestzeiten über alle Zeiten fragt. Ob ein einzelner Lauf einen PR brachte, steht schon in `pr_count` der Aktivität.
- Profil nicht abrufen; bekannt (Strava-Fokus, Stand Nov 2026): St. Gallen, metrisch, Ziel 60-km-Ultra mit konstanter 6:00/km bis Mai 2027.

## Wochenplan (Ultra-Plan, fix)

| Tag | Einheit | Karte |
|---|---|---|
| Mo | Intervalle (z. B. 6×400 m @ 4:15) | `--typ intervall --start margrethen` |
| Di | Push 17:30–20:00 | – |
| Mi | Langer Lauf 12–14 km @ 6:30–7:00, Puls < 154 | `--typ lang --start wolfhalden` |
| Do | Pull 17:30–20:00 | – |
| Fr | Beine 17:30–20:00 | – |
| Sa | Lockerer Lauf 8 km @ 6:10–6:30 + Push | `--typ locker --start wolfhalden` |
| So | Pull 12:00 | – |

Der Kalender-Aufruf bestätigt den Plan und liefert Zeit, Vorgabe und allenfalls den Ort. Steht im Kalender ein Ort (z. B. «Eselschwanz, St. Margrethen»), diesen Start nehmen.

## Was steht an? (ein Tag)

Erste Zeile: Einheit und Zeit.

**Lauftag** (egal ob lang, locker, Intervalle oder Test): dazu die Vorgabe aus der Kalender-Beschreibung (Distanz, Pace, Puls) in derselben Zeile, dann **immer die Laufkarte**, ohne Nachfrage, ohne Erklärung. Distanz = Gesamtdistanz aus dem Kalender (bei Intervallen Einlaufen + Intervalle + Auslaufen, 6×400 m ≈ 7 km, 5×800 m ≈ 8 km).

**Gym-Tag**: danach die PR-Chancen. Strava-Workouts heissen «Push», «Pull (Rücken/Arme)», «LEG» (manchmal «Nachmittag Workout 💪», dann am Inhalt erkennen: Brustpresse = Push, Rudern/Latzug = Pull, Beinpresse = Leg). Das letzte Workout der gleichen Art nehmen.

## PR-Chancen

Pro Workout nur die 2 bis 4 Übungen nennen, bei denen ein PR realistisch ist. Nur Arbeitssätze zählen, Sätze mit [Warm-up] ignorieren.

Eine Übung ist PR-Kandidat, wenn im letzten Workout dieser Art eines zutrifft:
- oberster Arbeitssatz **ohne** [Failure] und mindestens 10 Wiederholungen → nächstes Mal +2.5 kg (Maschine/Kabel) bzw. +5 kg (Beinpresse)
- Wiederholungen beim gleichen Gewicht über die letzten 2 bis 3 Workouts gestiegen → +1 Wiederholung oder +2.5 kg
- Notiz in Hevy wie «hoch», «nöchstes mal 25», «hoch auf 27.5» → genau das vorschlagen

Kein Kandidat: oberster Satz mit [Failure] und weniger Wiederholungen als beim Mal davor. Dann allenfalls einmal nennen: «halten».

Format pro Zeile: `Übung: zuletzt Gewicht × Wdh → Vorschlag`. Zuletzt und Vorschlag reichen, keine Historie.

## Weitere Fragen

**«Was steht diese Woche an»**: Kalender für die ganze Woche, dann 7 Zeilen `Tag: Einheit, Zeit`, Lauftage mit Vorgabe. Danach die Karten für alle Lauftage der Woche, je eine (`--n 1`), nacheinander mit einem Wort als Titel (Mo Intervalle, Mi Lang, Sa Locker).

**«Wie war mein Lauf» / «letzter Lauf»**: Strava, letzter Run, und den Kalender-Eintrag dieses Tages. Eine Zeile Urteil: Pace im Fenster oder nicht (Abweichung in s/km), Hm, relative Anstrengung, «1 PR» wenn `pr_count` > 0. Dann eine Zeile Tipp, höchstens. Beispiel:
```
Mi 12 km in 6:22/km · Ziel 6:30–7:00 → 8 s zu schnell, 117 Hm, Anstrengung 48, 1 PR.
Nächstes Mal die ersten 3 km bewusst bei 6:45 halten.
```

**«Wie läuft's im Gym» / «Fortschritt»**: Strava, pro Art (Push, Pull, Leg) das letzte und das Workout von vor etwa 3 Wochen vergleichen, nur oberste Arbeitssätze. Eine Zeile pro Art mit ↑ (Gewicht oder Wdh rauf) und → (gleich), nur Übungsnamen, keine Zahlenreihen:
```
Push: ↑ Brustpresse, Butterfly · → Schulterpresse
Pull: ↑ Rudern, Latzug, Bizeps · → Seitheben
Leg: ↑ Beinpresse, Beinstrecken · → Beinbeugen
```

**«Wann ist der Ultra» / Countdown**: `search_events` im Kalender nach «Ultra». Eine Zeile: Datum, Tage bis dahin, Wochen-km laut Plan. Nichts erfinden, wenn kein Eintrag da ist.

**Lauf-Bestzeiten**: nur über `get_athlete_best_efforts`, nicht aus den Aktivitäten schätzen.

## Laufkarte (selber rechnen, wenn kein fertiger Tagesplan passt)

Bei jedem Lauftag automatisch, und natürlich wenn er explizit eine Karte will. Repo `silasfurer7-del/laufkarten`, ein Befehl, 5 bis 30 Sekunden. Keine eigene Routensuche bauen, keine Kartenbibliotheken ausprobieren.

```bash
git clone -q --depth 1 https://github.com/silasfurer7-del/laufkarten
pip install -q networkx matplotlib pillow
python3 laufkarten/scripts/karte.py --start wolfhalden --km 14 --typ lang --name "Langer Lauf"
```

- `--start`: Ortsname `wolfhalden` (Standard), `heiden`, `margrethen`, `eselschwanz`, `rheineck`, `stgallen`, oder `lat,lon`.
- `--typ`: `intervall` (flach, wenig Pfad), `lang` (Hügel erlaubt), `locker` (wenig Hm). Ersetzt `--climb`.
- `--profil`: `strasse` (nur Asphalt), `huegel` (viele Hm), `flach`, `natur` (kein Dorf). `--plan` rechnet alle fünf auf einmal.
- Ohne `--seed` kommt jede Kalenderwoche automatisch eine andere Runde. Will er eine Alternative: `--seed 7` oder `--n 3`.
- Startpunkte ausserhalb des Cache brauchen zusätzlich `pip install -q pmtiles mapbox_vector_tile` (das Skript sagt es, wenn es fehlt).
- Ausgabe: `karte.png` (Karte + Höhenprofil) und `karte.gpx`. Das PNG direkt zeigen, dazu die Kennzahlen-Zeile des Skripts (km, Hm, doppelt gelaufen, Pfadanteil). Nichts weiter beschreiben.

## Beispiele

«Was steht am Freitag an?»
```
**Fr: Beine, 17:30–20:00** (zuletzt Do 30.10.)
PR-Chancen:
- Beinpresse: 120 kg × 12 → 125 kg
- Wadenheben: 52.5 kg × 14 → 55 kg
- Hüftadduktion: 102.5 kg × 12 → 105 kg
Beinstrecken 60 kg halten (× 12 war Failure), Beinbeugen halten.
```

«Was steht am Mittwoch an?»
```
**Mi: Langer Lauf 14 km, 17:00** · 6:30–7:00/km, Puls unter 154, Steigungen gehen, Stirnlampe.
[karte.png]
13.9 km, ↑445 Hm, Pfad/Weg 25 %
```
