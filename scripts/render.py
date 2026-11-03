import pickle, math, sys
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MP
from graph_helpers import *
G,feats,_=pickle.load(open('g.pkl','rb'))
idx=int(sys.argv[1]) if len(sys.argv)>1 else 0
best=pickle.load(open('best.pkl','rb'))
sc,L,over,route,kinds=best[idx]
xs=[merc(*p) for p in route]
minx=min(x for x,y in xs);maxx=max(x for x,y in xs);miny=min(y for x,y in xs);maxy=max(y for x,y in xs)
pad=350; minx-=pad;maxx+=pad;miny-=pad;maxy+=pad
fig=plt.figure(figsize=(8,8*(maxy-miny)/(maxx-minx)),dpi=200); ax=fig.add_axes([0,0,1,1])
ax.set_facecolor('#eef0e6')
landcol={'forest':'#c9dfb4','wood':'#c9dfb4','meadow':'#e3ecd2','grass':'#e3ecd2','farmland':'#eef0e0','residential':'#e6e3dd','orchard':'#d8e7c2'}
def rings(g):
    if g['type']=='Polygon': return [g['coordinates'][0]]
    if g['type']=='MultiPolygon': return [p[0] for p in g['coordinates']]
    return []
def lines(g):
    if g['type']=='LineString': return [g['coordinates']]
    if g['type']=='MultiLineString': return g['coordinates']
    return []
def P(tx,ty,ring): return [merc(*tile2ll(tx,ty,x,y)) for x,y in ring]
streetw={'primary':2.2,'secondary':2.0,'tertiary':1.7,'residential':1.2,'unclassified':1.2,'motorway':2.6,'trunk':2.4,'service':0.7,'track':0.6,'path':0.5,'footway':0.5,'cycleway':0.5}
for (tx,ty),t in feats.items():
    for f in t.get('land',{}).get('features',[]):
        c=landcol.get(f['properties']['kind'])
        if c:
            for r in rings(f['geometry']): ax.add_patch(MP(P(tx,ty,r),closed=True,fc=c,ec='none',zorder=1))
    for f in t.get('water_polygons',{}).get('features',[]):
        for r in rings(f['geometry']): ax.add_patch(MP(P(tx,ty,r),closed=True,fc='#aad3df',ec='none',zorder=2))
    for f in t.get('buildings',{}).get('features',[]):
        for r in rings(f['geometry']): ax.add_patch(MP(P(tx,ty,r),closed=True,fc='#d4cfc7',ec='none',zorder=3))
    for f in t.get('water_lines',{}).get('features',[]):
        if f['properties'].get('tunnel'): continue
        for l in lines(f['geometry']):
            q=P(tx,ty,l); ax.plot(*zip(*q),color='#aad3df',lw=0.8,zorder=2)
    for f in t.get('streets',{}).get('features',[]):
        k=f['properties']['kind']; w=streetw.get(k)
        if not w or f['properties'].get('rail'): continue
        dash=(0,(2,1.5)) if k in('track','path','footway','cycleway') else 'solid'
        for l in lines(f['geometry']):
            q=P(tx,ty,l); ax.plot(*zip(*q),color='#ffffff' if dash=='solid' else '#9a8f80',lw=w,ls=dash,zorder=4,solid_capstyle='round')
labels=[]
for (tx,ty),t in feats.items():
    for f in t.get('place_labels',{}).get('features',[]):
        p=f['properties']; 
        if p['kind'] not in ('village','town','hamlet','suburb'): continue
        g=f['geometry']; x,y=merc(*tile2ll(tx,ty,*g['coordinates']))
        if minx<x<maxx and miny<y<maxy and p['name'] not in labels:
            labels.append(p['name']); fs=10 if p['kind'] in('town','village') else 7
            ax.text(x,y,p['name'],fontsize=fs,ha='center',color='#444',zorder=8,weight='bold' if fs==10 else 'normal')
X,Y=zip(*xs)
ax.plot(X,Y,color='white',lw=5.5,zorder=9,solid_capstyle='round',solid_joinstyle='round')
ax.plot(X,Y,color='#FC4C02',lw=3.5,zorder=10,solid_capstyle='round',solid_joinstyle='round')
ax.scatter([X[0]],[Y[0]],s=90,c='#FC4C02',edgecolors='white',linewidths=2,zorder=11)
# km markers
acc=0;nk=1
for a,b in zip(route,route[1:]):
    acc+=G[a][b]['length']
    if acc>=nk*1000 and nk*1000<L-300:
        x,y=merc(*b); ax.scatter([x],[y],s=55,c='white',edgecolors='#FC4C02',linewidths=1.5,zorder=12)
        ax.text(x,y,str(nk),fontsize=5.5,ha='center',va='center',zorder=13,color='#FC4C02',weight='bold'); nk+=1
ax.set_xlim(minx,maxx);ax.set_ylim(miny,maxy);ax.set_aspect('equal');ax.axis('off')
ax.text(maxx-30,miny+30,'© OpenStreetMap-Mitwirkende',fontsize=5,ha='right',color='#666',zorder=14)
fig.savefig(f'route{idx}.png',dpi=200); print(L,over)
