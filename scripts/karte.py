#!/usr/bin/env python3
"""Laufkarte in einem Befehl: Rundkurs suchen, Karte + Hoehenprofil + GPX schreiben.

    python3 scripts/karte.py --start wolfhalden --km 12 --typ lang [--n 3] [--name "Heiden Runde"] [--out karte]

--start: Ortsname (wolfhalden, heiden, margrethen, eselschwanz, stgallen, rheineck) oder lat,lon.
--typ: locker / lang / intervall steuert Hoehenmeter- und Pfad-Strafe. Ohne --seed wechselt die Runde jede Kalenderwoche.

Ausgabe pro Variante: <out><i>.png (Karte + Profil), <out><i>.gpx, und eine Zeile mit
Laenge / Hoehenmetern / doppelt gelaufenen Metern / Pfadanteil. Variante 0 ist die beste.

Alles Noetige liegt im Repo: Vektorkacheln (rheintal-bodensee.pmtiles), Hoehendaten (dem/13)
und ein Kachel-Cache (cache/). Fuer Startpunkte ausserhalb des Caches werden die Kacheln
einmalig dekodiert (braucht `pip install pmtiles mapbox_vector_tile`) und im Cache abgelegt.
"""
import argparse, gzip, math, os, pickle, random, sys, time, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PMTILES = os.path.join(ROOT, 'rheintal-bodensee.pmtiles')
DEM = os.path.join(ROOT, 'dem', '13')
CACHE = os.path.join(ROOT, 'cache', 'z14')
Z = 14
LAYERS = ('streets', 'land', 'water_polygons', 'water_lines', 'buildings', 'place_labels')

# ---------------------------------------------------------------- Geometrie
def deg2num(lat, lon, z=Z):
    n = 2 ** z
    return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n

def tile2ll(tx, ty, px, py, ext=4096, z=Z):
    n = 2 ** z; X = tx + px / ext; Y = ty + (1 - py / ext)  # mvt y ist gespiegelt
    return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * Y / n)))), X / n * 360 - 180

def hav(a, b):
    R = 6371000; p1, p2 = math.radians(a[0]), math.radians(b[0])
    dl = math.radians(b[1] - a[1]); dp = p2 - p1
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def merc(lat, lon, lat0=47.45):
    return lon * 111320 * math.cos(math.radians(lat0)), lat * 111320

# ---------------------------------------------------------------- Kacheln (mit Cache)
_reader = None
def _decode(tx, ty):
    global _reader
    try:
        from pmtiles.reader import Reader, MmapSource
        import mapbox_vector_tile as mvt
    except ImportError:
        sys.exit(f'Kachel {tx}/{ty} ist nicht im Cache. Zum Dekodieren: pip install -q pmtiles mapbox_vector_tile')
    if _reader is None:
        _reader = Reader(MmapSource(open(PMTILES, 'rb')))
    d = _reader.get(Z, tx, ty)
    if d is None: return {}
    if d[:2] == b'\x1f\x8b': d = gzip.decompress(d)
    t = mvt.decode(d)
    return {l: t[l] for l in LAYERS if l in t}

def gettile(tx, ty):
    p = os.path.join(CACHE, f'{tx}_{ty}.pkl.gz')
    if os.path.exists(p):
        return pickle.load(gzip.open(p, 'rb'))
    t = _decode(tx, ty)
    os.makedirs(CACHE, exist_ok=True)
    pickle.dump(t, gzip.open(p, 'wb'), protocol=5)
    return t

# ---------------------------------------------------------------- Hoehe (Terrarium z13)
_dem = {}
def elev(lat, lon):
    from PIL import Image
    z = 13; n = 2 ** z
    X = (lon + 180) / 360 * n * 256; Y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n * 256
    def px(xx, yy):
        k = (xx // 256, yy // 256)
        if k not in _dem:
            p = os.path.join(DEM, f'{k[0]}_{k[1]}.png')
            if not os.path.exists(p):  # knapp ausserhalb der Hoehendaten: naechste vorhandene Kachel, Randpixel
                global _demrng
                if '_demrng' not in globals():
                    ks = [tuple(map(int, f[:-4].split('_'))) for f in os.listdir(DEM) if f.endswith('.png')]
                    _demrng = (min(a for a, _ in ks), max(a for a, _ in ks), min(b for _, b in ks), max(b for _, b in ks))
                x0_, x1_, y0_, y1_ = _demrng
                xx = min(max(xx, x0_ * 256), x1_ * 256 + 255); yy = min(max(yy, y0_ * 256), y1_ * 256 + 255)
                return px(xx, yy)
            _dem[k] = Image.open(p).convert('RGB').load()
        r, g, b = _dem[k][xx % 256, yy % 256]
        return r * 256 + g + b / 256 - 32768
    x0, y0 = int(X - .5), int(Y - .5); fx, fy = X - .5 - x0, Y - .5 - y0
    return (px(x0, y0) * (1 - fx) * (1 - fy) + px(x0 + 1, y0) * fx * (1 - fy)
            + px(x0, y0 + 1) * (1 - fx) * fy + px(x0 + 1, y0 + 1) * fx * fy)

def profil(route, step=25):
    d = [0]; pts = [route[0]]
    for a, b in zip(route, route[1:]):
        L = hav(a, b); k = max(1, int(L // step))
        for i in range(1, k + 1):
            t = i / k; pts.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)); d.append(d[-1] + L / k)
    h = [elev(*p) for p in pts]
    hs = [sum(h[max(0, i - 3):i + 4]) / len(h[max(0, i - 3):i + 4]) for i in range(len(h))]
    up = sum(max(0, b - a) for a, b in zip(hs, hs[1:])); dn = sum(max(0, a - b) for a, b in zip(hs, hs[1:]))
    return d, hs, up, dn

# ---------------------------------------------------------------- Graph
OK = {'residential', 'unclassified', 'tertiary', 'secondary', 'living_street', 'track', 'path',
      'footway', 'pedestrian', 'service', 'cycleway', 'primary'}
COST = {'path': 1.15, 'footway': 1.1, 'track': 1.0, 'primary': 1.6, 'secondary': 1.3, 'service': 1.2}

def build_graph(feats, center=None, radius=None):
    """Voller Graph (alle Stuetzpunkte) aus den Strassen-Features, optional nur im Umkreis."""
    import networkx as nx
    G = nx.Graph()
    if center:
        cx0, cy0 = merc(*center); r2 = radius * radius
        inside = lambda p: (lambda x, y: (x - cx0) ** 2 + (y - cy0) ** 2 < r2)(*merc(*p))
    for (tx, ty), t in feats.items():
        for f in t.get('streets', {}).get('features', []):
            p = f['properties']; k = p['kind']
            if k not in OK or p.get('rail') or p.get('tunnel'): continue
            if k == 'service' and p.get('service') in ('driveway', 'parking_aisle'): continue
            g = f['geometry']; lines = [g['coordinates']] if g['type'] == 'LineString' else g['coordinates']
            for ln in lines:
                pts = [tile2ll(tx, ty, x, y) for x, y in ln]
                pts = [(round(a, 6), round(b, 6)) for a, b in pts]
                for a, b in zip(pts, pts[1:]):
                    if a == b: continue
                    if center and not (inside(a) and inside(b)): continue
                    d = hav(a, b); G.add_edge(a, b, length=d, w=d * COST.get(k, 1), kind=k)
    # Knoten an Kachelgrenzen zusammenfuehren
    grid = collections.defaultdict(list)
    for n in G.nodes: grid[(round(n[0] * 2e4), round(n[1] * 2e4))].append(n)
    mp = {n: ns[0] for ns in grid.values() for n in ns}
    H = nx.Graph()
    for a, b, d in G.edges(data=True):
        A, B = mp[a], mp[b]
        if A != B and (not H.has_edge(A, B) or H[A][B]['length'] > d['length']): H.add_edge(A, B, **d)
    return H

def contract(G):
    """Grad-2-Ketten zu einer Kante zusammenfassen (Geometrie bleibt an der Kante)."""
    import networkx as nx
    keep = {n for n in G.nodes if G.degree(n) != 2}
    C = nx.MultiGraph(); seen = set()
    for s in keep:
        for nb in G[s]:
            if (s, nb) in seen: continue
            path = [s, nb]; prev, cur = s, nb
            while cur not in keep:
                nxt = [x for x in G[cur] if x != prev]
                if not nxt: break
                prev, cur = cur, nxt[0]; path.append(cur)
            seen.add((s, nb)); seen.add((cur, prev))
            if cur not in keep: continue
            L = sum(G[a][b]['length'] for a, b in zip(path, path[1:]))
            W = sum(G[a][b]['w'] for a, b in zip(path, path[1:]))
            kinds = collections.Counter()
            for a, b in zip(path, path[1:]): kinds[G[a][b]['kind']] += G[a][b]['length']
            C.add_edge(s, cur, length=L, w=W, kinds=dict(kinds), geom=path)
    # Mehrfachkanten: nur die kuerzeste behalten, Graph wird einfach
    S = nx.Graph()
    for a, b, d in C.edges(data=True):
        if a == b: continue
        if not S.has_edge(a, b) or S[a][b]['w'] > d['w']: S.add_edge(a, b, **d)
    return S

def geom(S, a, b):
    g = S[a][b]['geom']
    return g if g[0] == a else g[::-1]

# ---------------------------------------------------------------- Rundkurs-Suche
def _astar(adj, xy, src, dst, used):
    """A* auf Integer-Adjazenz; Kanten in `used` kosten 6x. Gibt Knotenfolge zurueck."""
    import heapq
    tx, ty = xy[dst]
    def h(i):
        x, y = xy[i]; return math.hypot(x - tx, y - ty)
    g = {src: 0.0}; prev = {}; pq = [(h(src), src)]; done = set()
    while pq:
        f, u = heapq.heappop(pq)
        if u == dst:
            p = [u]
            while u in prev: u = prev[u]; p.append(u)
            return p[::-1]
        if u in done: continue
        done.add(u)
        gu = g[u]
        for v, w, e in adj[u]:
            ng = gu + (w * 6 if e in used else w)
            if ng < g.get(v, 1e18):
                g[v] = ng; prev[v] = u; heapq.heappush(pq, (ng + h(v), v))
    return None

PFAD_STRAFE = 0.0

# Routen-Profile: cost = Faktor pro Strassenart (auf COST drauf), climb = Hm-Strafe pro m,
# up = Gewicht der Hoehenmeter im Score (negativ = Huegel belohnen), pfad = Strafe fuer Pfad/Weg
DORF = ('residential', 'living_street', 'service', 'pedestrian')
PROFILE = {
    'normal':  dict(cost={}, climb=None, up=1 / 15, score={}, label='Normal'),
    'strasse': dict(cost={'path': 3, 'track': 3, 'footway': 1.3}, climb=None, up=1 / 15,
                    score={'path': 1 / 60, 'track': 1 / 60}, label='Nur Strasse'),
    'huegel':  dict(cost={}, climb=-0.35, up=-1 / 25, score={}, label='Höhenmeter'),
    'flach':   dict(cost={}, climb=2.0, up=1 / 4, score={}, label='Flach'),
    'natur':   dict(cost={k: 4 for k in DORF} | {'primary': 5, 'secondary': 4, 'tertiary': 3, 'unclassified': 1.5,
                          'path': 0.8, 'track': 0.8, 'cycleway': 0.9},
                    climb=None, up=1 / 15, score={k: 1 / 40 for k in DORF} | {'primary': 1 / 30, 'secondary': 1 / 40, 'tertiary': 1 / 60},
                    label='Natur'),
}

def apply_profile(S, prof):
    """Kantengewicht w nach Profil neu berechnen (aus den Strassenarten der Kante)."""
    c = prof['cost']
    for a, b, d in S.edges(data=True):
        d['w'] = sum(L * COST.get(k, 1) * c.get(k, 1) for k, L in d['kinds'].items())

def search(S, start, T, climb, iters, seed, up_w=1 / 15, kind_w=None):
    import networkx as nx
    kind_w = dict(kind_w or {})
    if PFAD_STRAFE: kind_w = {'path': PFAD_STRAFE, 'track': PFAD_STRAFE} | kind_w
    H = {n: elev(*n) for n in S.nodes}
    for a, b, d in S.edges(data=True):
        d['wc'] = max(d['w'] * 0.3, d['w'] + climb * abs(H[a] - H[b]))
    home = min(S.nodes, key=lambda n: hav(n, start))
    dist, paths = nx.single_source_dijkstra(S, home, weight='wc')
    nodes = list(S.nodes); idx = {n: i for i, n in enumerate(nodes)}
    xy = [merc(*n) for n in nodes]
    adj = [[] for _ in nodes]
    for e, (a, b, d) in enumerate(S.edges(data=True)):
        adj[idx[a]].append((idx[b], d['wc'], e)); adj[idx[b]].append((idx[a], d['wc'], e))
    eid = {frozenset((a, b)): e for e, (a, b) in enumerate(S.edges())}
    cands = [n for n in S.nodes if n in dist and T * 0.18 < hav(n, home) < T * 0.42 and S.degree(n) >= 3]
    rnd = random.Random(seed); best = []; tried = 0
    while tried < iters and len(cands) > 1:
        A, B = rnd.sample(cands, 2)
        if not (T * 0.1 < hav(A, B) < T * 0.4): continue
        tried += 1
        p1 = paths[A]; used = {eid[frozenset(e)] for e in zip(p1, p1[1:])}
        p2 = _astar(adj, xy, idx[A], idx[B], used)
        if not p2: continue
        p2 = [nodes[i] for i in p2]
        used |= {eid[frozenset(e)] for e in zip(p2, p2[1:])}
        p3 = _astar(adj, xy, idx[B], idx[home], used)
        if not p3: continue
        p3 = [nodes[i] for i in p3]
        seq = p1 + p2[1:] + p3[1:]
        es = [frozenset(e) for e in zip(seq, seq[1:])]
        L = sum(S[a][b]['length'] for a, b in zip(seq, seq[1:]))
        if abs(L - T) > T * 0.25: continue
        cnt = collections.Counter(es)
        over = sum(S[tuple(e)[0]][tuple(e)[1]]['length'] for e, c in cnt.items() if c > 1)
        kinds = collections.Counter()
        for a, b in zip(seq, seq[1:]):
            for k, v in S[a][b]['kinds'].items(): kinds[k] += v
        route = []
        for a, b in zip(seq, seq[1:]):
            g = geom(S, a, b); route += g if not route else g[1:]
        up = sum(max(0, H[b] - H[a]) for a, b in zip(seq, seq[1:]))
        extra = sum(kinds.get(k, 0) * w for k, w in kind_w.items())
        score = abs(L - T) / 100 + over / 100 + up * up_w + kinds.get('primary', 0) / 150 + extra
        best.append(dict(score=score, L=L, over=over, up=up, kinds=dict(kinds), route=route))
    best.sort(key=lambda r: r['score'])
    # aehnliche Varianten (gleiche Kanten) nicht doppelt
    out = []
    for r in best:
        s = set(zip(r['route'], r['route'][1:]))
        if all(len(s & o) < 0.5 * len(s) for o in (set(zip(q['route'], q['route'][1:])) for q in out)):
            out.append(r)
        if len(out) >= 5: break
    return out

# ---------------------------------------------------------------- Rendern
LANDCOL = {'forest': '#c9dfb4', 'wood': '#c9dfb4', 'meadow': '#e3ecd2', 'grass': '#e3ecd2',
           'farmland': '#eef0e0', 'residential': '#e6e3dd', 'orchard': '#d8e7c2'}
STREETW = {'primary': 2.2, 'secondary': 2.0, 'tertiary': 1.7, 'residential': 1.2, 'unclassified': 1.2,
           'motorway': 2.6, 'trunk': 2.4, 'service': 0.7, 'track': 0.6, 'path': 0.5, 'footway': 0.5, 'cycleway': 0.5}
DASHED = {'track', 'path', 'footway', 'cycleway'}

def _rings(g):
    if g['type'] == 'Polygon': return [g['coordinates'][0]]
    if g['type'] == 'MultiPolygon': return [p[0] for p in g['coordinates']]
    return []

def _lines(g):
    if g['type'] == 'LineString': return [g['coordinates']]
    if g['type'] == 'MultiLineString': return g['coordinates']
    return []

def render(feats, route, L, out, name, profile):
    import matplotlib; matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.collections import PolyCollection, LineCollection
    from PIL import Image
    xs = [merc(*p) for p in route]
    minx = min(x for x, y in xs) - 350; maxx = max(x for x, y in xs) + 350
    miny = min(y for x, y in xs) - 350; maxy = max(y for x, y in xs) + 350
    fig = plt.figure(figsize=(8, 8 * (maxy - miny) / (maxx - minx)), dpi=200); ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor('#eef0e6')
    def P(tx, ty, ring): return [merc(*tile2ll(tx, ty, x, y)) for x, y in ring]
    land = collections.defaultdict(list); water = []; bld = []; wl = []; streets = collections.defaultdict(list)
    labels = []
    for (tx, ty), t in feats.items():
        # nur Kacheln, die den Ausschnitt beruehren
        x0, y0 = merc(*tile2ll(tx, ty, 0, 4096)); x1, y1 = merc(*tile2ll(tx + 1, ty + 1, 0, 4096))
        if x1 < minx or x0 > maxx or max(y0, y1) < miny or min(y0, y1) > maxy: continue
        for f in t.get('land', {}).get('features', []):
            c = LANDCOL.get(f['properties']['kind'])
            if c:
                for r in _rings(f['geometry']): land[c].append(P(tx, ty, r))
        for f in t.get('water_polygons', {}).get('features', []):
            for r in _rings(f['geometry']): water.append(P(tx, ty, r))
        for f in t.get('buildings', {}).get('features', []):
            for r in _rings(f['geometry']): bld.append(P(tx, ty, r))
        for f in t.get('water_lines', {}).get('features', []):
            if f['properties'].get('tunnel'): continue
            for l in _lines(f['geometry']): wl.append(P(tx, ty, l))
        for f in t.get('streets', {}).get('features', []):
            k = f['properties']['kind']; w = STREETW.get(k)
            if not w or f['properties'].get('rail'): continue
            for l in _lines(f['geometry']): streets[(w, k in DASHED)].append(P(tx, ty, l))
        for f in t.get('place_labels', {}).get('features', []):
            p = f['properties']
            if p['kind'] not in ('village', 'town', 'hamlet', 'suburb'): continue
            x, y = merc(*tile2ll(tx, ty, *f['geometry']['coordinates']))
            if minx < x < maxx and miny < y < maxy and p['name'] not in [l[0] for l in labels]:
                labels.append((p['name'], x, y, 10 if p['kind'] in ('town', 'village') else 7))
    for c, polys in land.items(): ax.add_collection(PolyCollection(polys, facecolors=c, edgecolors='none', zorder=1))
    if water: ax.add_collection(PolyCollection(water, facecolors='#aad3df', edgecolors='none', zorder=2))
    if bld: ax.add_collection(PolyCollection(bld, facecolors='#d4cfc7', edgecolors='none', zorder=3))
    if wl: ax.add_collection(LineCollection(wl, colors='#aad3df', linewidths=0.8, zorder=2))
    for (w, dashed), ls in streets.items():
        ax.add_collection(LineCollection(ls, colors='#9a8f80' if dashed else '#ffffff', linewidths=w,
                                         linestyles=(0, (2, 1.5)) if dashed else 'solid', zorder=4, capstyle='round'))
    for nm, x, y, fs in labels:
        ax.text(x, y, nm, fontsize=fs, ha='center', color='#444', zorder=8, weight='bold' if fs == 10 else 'normal')
    X, Y = zip(*xs)
    ax.plot(X, Y, color='white', lw=5.5, zorder=9, solid_capstyle='round', solid_joinstyle='round')
    ax.plot(X, Y, color='#FC4C02', lw=3.5, zorder=10, solid_capstyle='round', solid_joinstyle='round')
    ax.scatter([X[0]], [Y[0]], s=90, c='#FC4C02', edgecolors='white', linewidths=2, zorder=11)
    acc = 0; nk = 1
    for a, b in zip(route, route[1:]):
        acc += hav(a, b)
        if acc >= nk * 1000 and nk * 1000 < L - 300:
            x, y = merc(*b); ax.scatter([x], [y], s=55, c='white', edgecolors='#FC4C02', linewidths=1.5, zorder=12)
            ax.text(x, y, str(nk), fontsize=5.5, ha='center', va='center', zorder=13, color='#FC4C02', weight='bold'); nk += 1
    ax.set_xlim(minx, maxx); ax.set_ylim(miny, maxy); ax.set_aspect('equal'); ax.axis('off')
    ax.text(maxx - 30, miny + 30, '© OpenStreetMap-Mitwirkende', fontsize=5, ha='right', color='#666', zorder=14)
    fig.savefig(out + '_map.png', dpi=200); plt.close(fig)
    # Hoehenprofil
    d, h, up, dn = profile
    m = Image.open(out + '_map.png'); W = m.width
    fig = plt.figure(figsize=(W / 200, 1.6), dpi=200); ax = fig.add_axes([0.06, 0.2, 0.92, 0.72])
    D = [x / 1000 for x in d]; lo = min(h) - 20; hi = max(max(h) + 20, lo + 120)
    ax.fill_between(D, h, lo, color='#FC4C02', alpha=.25, lw=0); ax.plot(D, h, color='#FC4C02', lw=1.8)
    ax.set_xlim(0, D[-1]); ax.set_ylim(lo, hi); ax.set_xticks(range(0, int(D[-1]) + 1)); ax.tick_params(labelsize=6)
    for s in ('top', 'right'): ax.spines[s].set_visible(False)
    ax.text(0.01, 0.97, f'↑ {round(up)} Hm   ↓ {round(dn)} Hm   ·   {D[-1]:.1f} km', transform=ax.transAxes,
            fontsize=7, va='top', weight='bold')
    ax.set_ylabel('m ü. M.', fontsize=6); fig.savefig(out + '_prof.png', dpi=200); plt.close(fig)
    p = Image.open(out + '_prof.png').convert('RGB')
    o = Image.new('RGB', (W, m.height + p.height), 'white'); o.paste(m.convert('RGB'), (0, 0)); o.paste(p, (0, m.height))
    o.save(out + '.png'); os.remove(out + '_map.png'); os.remove(out + '_prof.png')
    s = ('<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="laufkarten" '
         'xmlns="http://www.topografix.com/GPX/1/1">\n<trk><name>' + name + '</name><trkseg>\n')
    s += ''.join(f'<trkpt lat="{a}" lon="{b}"/>\n' for a, b in route) + '</trkseg></trk>\n</gpx>\n'
    open(out + '.gpx', 'w').write(s)

# ---------------------------------------------------------------- main
ORTE = {'wolfhalden': (47.45131, 9.55342), 'heiden': (47.4427, 9.5333), 'margrethen': (47.4527, 9.6375),
        'eselschwanz': (47.4650, 9.6450), 'stgallen': (47.4245, 9.3767), 'rheineck': (47.4660, 9.5910)}

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--start', default='wolfhalden', help='lat,lon oder Name: ' + ', '.join(ORTE))
    ap.add_argument('--km', type=float, default=12)
    ap.add_argument('--climb', type=float, default=0.5, help='Hoehenmeter-Strafe pro m (0 = egal, 1 = sehr flach)')
    ap.add_argument('--n', type=int, default=1, help='Anzahl Varianten')
    ap.add_argument('--iters', type=int, default=400)
    ap.add_argument('--seed', type=int, default=None, help='Standard: Kalenderwoche, damit jede Woche eine andere Runde kommt')
    ap.add_argument('--typ', choices=['locker', 'lang', 'intervall'], default=None,
                    help='locker: wenig Hm; lang: Huegel erlaubt; intervall: flach und wenig Pfad')
    ap.add_argument('--profil', choices=list(PROFILE), default='normal',
                    help='normal | strasse (nur Asphalt) | huegel (viele Hm) | flach | natur (kein Dorf)')
    ap.add_argument('--plan', action='store_true', help='alle Profile auf einmal: <out>_<profil>.png + <out>.json')
    ap.add_argument('--name', default=None)
    ap.add_argument('--out', default='karte')
    ap.add_argument('--no-render', action='store_true', help='nur suchen und Kennzahlen ausgeben')
    a = ap.parse_args()
    t0 = time.time()
    key = a.start.lower().replace('st. ', '').replace(' ', '')
    start = ORTE[key] if key in ORTE else tuple(map(float, a.start.split(',')))
    T = a.km * 1000
    if a.typ:
        a.climb = {'locker': 0.7, 'lang': 0.3, 'intervall': 1.5}[a.typ]
        global PFAD_STRAFE; PFAD_STRAFE = 1 / 300 if a.typ == 'intervall' else 0.0
    if a.seed is None: a.seed = time.localtime().tm_yday // 7
    cx, cy = map(int, deg2num(*start))
    radius = T / 2.2
    r = max(2, math.ceil(radius / 1600))
    feats = {(tx, ty): gettile(tx, ty) for tx in range(cx - r, cx + r + 1) for ty in range(cy - r, cy + r + 1)}
    t1 = time.time()
    G = build_graph(feats, start, radius)
    import networkx as nx
    G = G.subgraph(max(nx.connected_components(G), key=len)).copy()
    S = contract(G)
    t2 = time.time()
    name = a.name or f'Runde {a.km:g} km'
    profile = list(PROFILE) if a.plan else [a.profil]
    summary = []; t_such = t_rend = 0
    for pi, pname in enumerate(profile):
        P = PROFILE[pname]; apply_profile(S, P)
        climb = P['climb'] if P['climb'] is not None else a.climb
        ts = time.time()
        res = search(S, start, T, climb, a.iters, a.seed + 7 * pi, P['up'], P['score'])
        t_such += time.time() - ts
        if not res:
            print(f'{pname}: keine Runde gefunden'); continue
        for i, rr in enumerate(res[:a.n]):
            prof = profil(rr['route'])
            pfad = (rr['kinds'].get('path', 0) + rr['kinds'].get('track', 0) + rr['kinds'].get('footway', 0)) / rr['L']
            out = a.out + (f'_{pname}' if a.plan else '') + (str(i) if a.n > 1 else '')
            tr = time.time()
            if not a.no_render: render(feats, rr['route'], rr['L'], out, f'{name} ({P["label"]})' if a.plan else name, prof)
            t_rend += time.time() - tr
            dorf = sum(rr['kinds'].get(k, 0) for k in DORF) / rr['L']
            line = (f"{rr['L']/1000:.1f} km, ↑{round(prof[2])} Hm, doppelt {round(rr['over'])} m, "
                    f"Pfad/Weg {round(pfad*100)} %, Dorf {round(dorf*100)} %, Hauptstrasse {round(rr['kinds'].get('primary',0))} m")
            print(f'{out}: {line}')
            summary.append(dict(profil=pname, label=P['label'], datei=out + '.png', gpx=out + '.gpx', km=round(rr['L'] / 1000, 1),
                                hm=round(prof[2]), doppelt=round(rr['over']), pfad_prozent=round(pfad * 100), text=line))
    if not summary:
        print('keine Runde gefunden (anderer Startpunkt / andere Distanz?)'); sys.exit(1)
    if a.plan:
        import json
        json.dump(dict(start=a.start, km=a.km, typ=a.typ, name=name, varianten=summary),
                  open(a.out + '.json', 'w'), ensure_ascii=False, indent=1)
    print(f"[kacheln {t1-t0:.1f}s, graph {t2-t1:.1f}s ({S.number_of_nodes()} knoten), suche {t_such:.1f}s, "
          f"render {t_rend:.1f}s, total {time.time()-t0:.1f}s]", file=sys.stderr)

if __name__ == '__main__':
    main()
