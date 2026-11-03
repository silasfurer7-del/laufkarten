import pickle, networkx as nx, random, math, os, sys
sys.path.insert(0,'/home/claude/laufkarten/scripts')
from hoehe import elev
START=tuple(map(float,os.environ['START'].split(','))); T=float(os.environ['TARGET'])
G,feats,_=pickle.load(open(os.environ['GIN'],'rb'))
def hav(a,b):
    R=6371000; p1,p2=map(math.radians,(a[0],b[0])); dl=math.radians(b[1]-a[1]); dp=p2-p1
    h=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2; return 2*R*math.asin(math.sqrt(h))
G=G.subgraph([n for n in G.nodes if hav(n,START)<T/2.2]).copy()
G=G.subgraph(max(nx.connected_components(G),key=len)).copy()
H={n:elev(*n) for n in G.nodes}
CL=float(os.environ.get('CLIMB','0'))
for a,b,d in G.edges(data=True): d['w']=d['w']+CL*abs(H[a]-H[b])
home=min(G.nodes,key=lambda n:hav(n,START))
dist,paths=nx.single_source_dijkstra(G,home,weight='w')
def plen(p): return sum(G[a][b]['length'] for a,b in zip(p,p[1:]))
random.seed(2)
cands=[n for n in G.nodes if T*0.18<hav(n,home)<T*0.42 and G.degree(n)>=3]
best=[]
for _ in range(500):
    A,B=random.sample(cands,2)
    if not (T*0.1<hav(A,B)<T*0.4): continue
    p1=paths[A]; used={frozenset(e) for e in zip(p1,p1[1:])}
    try:
        p2=nx.dijkstra_path(G,A,B,weight=lambda u,v,d:d['w']*(6 if frozenset((u,v)) in used else 1))
        used2=used|{frozenset(e) for e in zip(p2,p2[1:])}
        p3=nx.dijkstra_path(G,B,home,weight=lambda u,v,d:d['w']*(6 if frozenset((u,v)) in used2 else 1))
    except nx.NetworkXNoPath: continue
    route=p1+p2[1:]+p3[1:]; L=plen(route)
    es=[frozenset(e) for e in zip(route,route[1:])]
    over=sum(G[tuple(e)[0]][tuple(e)[1]]['length'] for e in set(es) if es.count(e)>1)
    up=sum(max(0,H[b]-H[a]) for a,b in zip(route,route[1:]))
    best.append((abs(L-T)/100+over/100+up/15,L,over,route,up))
best.sort(key=lambda x:x[0])
for b in best[:3]: print(round(b[0],1),round(b[1]),round(b[2]),round(b[4]))
pickle.dump(best[:5],open(os.environ.get('BOUT','best.pkl'),'wb'))
