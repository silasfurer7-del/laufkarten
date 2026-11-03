from tiles import *
import networkx as nx, math, pickle
HOME=(47.45131,9.55342)
z=14; cx,cy=deg2num(*HOME,z); cx,cy=int(cx),int(cy)
def tile2ll(tx,ty,px,py,ext=4096):
    n=2**z; X=tx+px/ext; Y=ty+(1-py/ext)  # mvt y flipped by decoder
    lon=X/n*360-180; lat=math.degrees(math.atan(math.sinh(math.pi*(1-2*Y/n))))
    return lat,lon
G=nx.Graph(); feats={}
ok={'residential','unclassified','tertiary','secondary','living_street','track','path','footway','pedestrian','service','cycleway','primary'}
cost={'path':1.15,'footway':1.1,'track':1.0,'primary':1.6,'secondary':1.3,'service':1.2}
def hav(a,b):
    R=6371000; p1,p2=map(math.radians,(a[0],b[0])); dl=math.radians(b[1]-a[1]); dp=p2-p1
    h=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2; return 2*R*math.asin(math.sqrt(h))
for tx in range(cx-3,cx+4):
  for ty in range(cy-3,cy+4):
    t=gettile(z,tx,ty); feats[(tx,ty)]=t
    for f in t.get('streets',{}).get('features',[]):
        p=f['properties']; k=p['kind']
        if k not in ok or p.get('rail') or p.get('tunnel'): continue
        if k=='service' and p.get('service') in ('driveway','parking_aisle'): continue
        g=f['geometry']; lines=[g['coordinates']] if g['type']=='LineString' else g['coordinates']
        for ln in lines:
            pts=[tile2ll(tx,ty,x,y) for x,y in ln]
            pts=[(round(a,6),round(b,6)) for a,b in pts]
            for a,b in zip(pts,pts[1:]):
                if a==b: continue
                d=hav(a,b); G.add_edge(a,b,length=d,w=d*cost.get(k,1),kind=k)
# snap near-duplicate nodes across tile borders
import collections
grid=collections.defaultdict(list)
for n in list(G.nodes): grid[(round(n[0]*2e4),round(n[1]*2e4))].append(n)
mp={}
for k,ns in grid.items():
    for n in ns: mp[n]=ns[0]
H=nx.Graph()
for a,b,d in G.edges(data=True):
    A,B=mp[a],mp[b]
    if A!=B and (not H.has_edge(A,B) or H[A][B]['length']>d['length']): H.add_edge(A,B,**d)
G=H
G=G.subgraph(max(nx.connected_components(G),key=len)).copy()
print(G.number_of_nodes(),G.number_of_edges())
pickle.dump((G,feats,(cx,cy)),open('g.pkl','wb'))
