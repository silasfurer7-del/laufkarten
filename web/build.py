#!/usr/bin/env python3
"""Baut die Web-App für GitHub Pages: python3 web/build.py --out _site --karten _karten

_karten ist der ausgecheckte Branch `karten` (vorgerechnete Runden). Persönliche Trainingsdaten
kommen nicht in die Seite: Strava fragt der Browser nach der Anmeldung selbst ab."""
import argparse, json, os, re, shutil, sys

WEB = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(WEB)
sys.path.insert(0, WEB)
import plan  # noqa: E402


def routen(karten):
    aus = {}
    if not karten or not os.path.isdir(karten):
        return aus
    for name in sorted(os.listdir(karten)):
        d = os.path.join(karten, name)
        gpx, kz = os.path.join(d, 'karte0.gpx'), os.path.join(d, 'kennzahlen.txt')
        if not (os.path.isfile(gpx) and os.path.isfile(kz)):
            continue
        m = re.search(r'karte0: ([\d.]+) km, ↑(\d+) Hm', open(kz, encoding='utf-8').read())
        pts = [[round(float(a), 5), round(float(b), 5)] for a, b in re.findall(r'lat="([\d.]+)" lon="([\d.]+)"', open(gpx).read())]
        if not m or len(pts) < 2:
            continue
        schritt = max(1, -(-len(pts) // 240))
        aus[name] = {'km': m.group(1), 'hm': m.group(2), 'pts': pts[::schritt] + ([pts[-1]] if (len(pts) - 1) % schritt else [])}
    return aus


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='_site')
    ap.add_argument('--karten', default='_karten')
    a = ap.parse_args()
    profil = json.load(open(os.path.join(WEB, 'profil.json'), encoding='utf-8'))
    lies = lambda p: open(os.path.join(WEB, 'src', p), encoding='utf-8').read()
    js = lies('app.js') + '\n' + lies('direct.js')
    js = js.replace('/*PROFIL*/{}', json.dumps(profil, ensure_ascii=False), 1)
    relay = os.environ.get('GARMIN_RELAY', '').strip()
    if not relay:
        sys.path.insert(0, os.path.join(ROOT, 'worker'))
        import cf
        relay = cf.finde()[1] or ''
    js = js.replace("/*GARMIN_RELAY*/''", json.dumps(relay.rstrip('/')), 1)
    js = js.replace("/*STRAVA_CLIENT_ID*/''", json.dumps(re.sub(r'\D', '', os.environ.get('STRAVA_CLIENT_ID', ''))), 1)
    titel = f"{profil.get('name', '')} Sport".strip()
    html = f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{titel}</title>
<meta name="theme-color" content="#EDE7DA">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="{titel}">
<meta name="robots" content="noindex">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" href="icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&family=Geist:wght@400;600;700&family=Instrument+Serif&display=swap" rel="stylesheet">
<link rel="stylesheet" href="vendor/maplibre-gl.css">
<style>
{lies('style.css')}</style>
</head>
<body>
<div id="app"></div>
<script src="vendor/maplibre-gl.js"></script>
<script src="vendor/pmtiles.js"></script>
<script>
{js}</script>
</body>
</html>
"""
    out = a.out
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(out)
    open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(html)
    open(os.path.join(out, '.nojekyll'), 'w').close()
    shutil.copytree(os.path.join(WEB, 'vendor'), os.path.join(out, 'vendor'))
    for n in (180, 192, 512):
        shutil.copy(os.path.join(WEB, f'icon-{n}.png'), out)
    json.dump({'name': titel, 'short_name': 'Sport', 'start_url': '.', 'display': 'standalone', 'background_color': '#EDE7DA',
               'theme_color': '#EDE7DA', 'icons': [{'src': f'icon-{n}.png', 'sizes': f'{n}x{n}', 'type': 'image/png'} for n in (192, 512)]},
              open(os.path.join(out, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False)
    shutil.copy(os.path.join(ROOT, 'rheintal-bodensee.pmtiles'), os.path.join(out, 'karte.pmtiles'))
    r = routen(a.karten)
    json.dump(r, open(os.path.join(out, 'routes.json'), 'w'), separators=(',', ':'))
    plan.schreibe(os.path.join(out, 'plan.json'), WEB, profil.get('zeitzone', 'Europe/Zurich'))
    print('Seite:', out, '·', len(r), 'Routen ·', len(html) // 1024, 'KB index.html ·', 'Garmin-Vermittler' if relay else 'ohne Garmin-Vermittler')


if __name__ == '__main__':
    main()
