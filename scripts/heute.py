#!/usr/bin/env python3
"""Tagesplan vorbereiten (laeuft nachts automatisch): Karten rechnen und auf den Branch `heute` legen.

Lauftag:
    python3 scripts/heute.py --datum 2026-11-05 --einheit "Mi: Langer Lauf 14 km, 17:00" \\
        --vorgabe "6:30–7:00/km, Puls unter 154, Steigungen gehen, Stirnlampe" \\
        --km 14 --typ lang --start wolfhalden [--push]

Gym-Tag / Ruhetag (keine Karten, nur Text):
    python3 scripts/heute.py --datum 2026-11-06 --einheit "Fr: Beine, 17:30–20:00" --text pr.md [--push]

Ergebnis im Ordner heute/: heute.md (fertige Antwort), heute.json, heute_<profil>.png/.gpx.
--push ersetzt den Branch `heute` auf GitHub durch den neuen Stand (ein Commit, keine Historie).
Im Chat holt der Skill nur noch https://raw.githubusercontent.com/silasfurer7-del/laufkarten/heute/heute.md
"""
import argparse, json, os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'heute')
REMOTE = 'https://github.com/silasfurer7-del/laufkarten'

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--datum', required=True, help='YYYY-MM-DD')
    ap.add_argument('--einheit', required=True, help='erste Zeile der Antwort, z. B. "Mi: Langer Lauf 14 km, 17:00"')
    ap.add_argument('--vorgabe', default='', help='Pace/Puls-Vorgabe aus dem Kalender')
    ap.add_argument('--km', type=float, default=None, help='Distanz; ohne --km werden keine Karten gerechnet')
    ap.add_argument('--typ', choices=['locker', 'lang', 'intervall'], default='locker')
    ap.add_argument('--start', default='wolfhalden')
    ap.add_argument('--text', default=None, help='Datei mit Zusatztext (z. B. PR-Chancen), wird angehaengt')
    ap.add_argument('--push', action='store_true')
    a = ap.parse_args()

    shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
    md = [f'# {a.datum}', '', f'**{a.einheit}**' + (f' · {a.vorgabe}' if a.vorgabe else ''), '']
    info = dict(datum=a.datum, einheit=a.einheit, vorgabe=a.vorgabe, varianten=[])
    if a.km:
        cmd = [sys.executable, os.path.join(ROOT, 'scripts', 'karte.py'), '--start', a.start, '--km', str(a.km),
               '--typ', a.typ, '--plan', '--out', os.path.join(OUT, 'heute'), '--name', a.einheit.split(':', 1)[-1].strip()]
        subprocess.run(cmd, check=True)
        info['varianten'] = json.load(open(os.path.join(OUT, 'heute.json')))['varianten']
        md.append('Karten (Start ' + a.start + '):')
        for v in info['varianten']:
            md.append(f"- **{v['label']}** `heute_{v['profil']}.png`: {v['text']}")
        md.append('')
    if a.text:
        md += [open(a.text).read().strip(), '']
    open(os.path.join(OUT, 'heute.md'), 'w').write('\n'.join(md))
    json.dump(info, open(os.path.join(OUT, 'heute.json'), 'w'), ensure_ascii=False, indent=1)
    print('\n'.join(md))

    if a.push:
        # Orphan-Branch `heute` mit genau einem Commit, Force-Push: das Repo waechst nicht
        tmp = os.path.join(ROOT, '.heute-git')
        shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
        for f in os.listdir(OUT): shutil.copy(os.path.join(OUT, f), tmp)
        env = dict(os.environ, GIT_AUTHOR_NAME='laufkarten', GIT_AUTHOR_EMAIL='laufkarten@users.noreply.github.com',
                   GIT_COMMITTER_NAME='laufkarten', GIT_COMMITTER_EMAIL='laufkarten@users.noreply.github.com')
        g = lambda *x: subprocess.run(['git', '-C', tmp, *x], check=True, env=env)
        g('init', '-q', '-b', 'heute'); g('add', '-A'); g('commit', '-q', '-m', f'Tagesplan {a.datum}')
        remote = REMOTE
        if os.environ.get('GITHUB_TOKEN'):  # GitHub Actions
            remote = REMOTE.replace('https://', f"https://x-access-token:{os.environ['GITHUB_TOKEN']}@")
        g('push', '-q', '--force', remote, 'heute:heute')
        shutil.rmtree(tmp, ignore_errors=True)
        print(f'gepusht: {REMOTE}/tree/heute')

if __name__ == '__main__':
    main()
