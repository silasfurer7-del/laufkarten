import pickle, networkx as nx, random, math
import math
HOME=(47.45131,9.55342)
def hav(a,b):
    R=6371000; p1,p2=map(math.radians,(a[0],b[0])); dl=math.radians(b[1]-a[1]); dp=p2-p1
    h=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2; return 2*R*math.asin(math.sqrt(h))
G,feats,_=pickle.load(open('g.pkl','rb'))
G=G.subgraph([n for n in G.nodes if n[0]<47.4575]).copy(); G=G.subgraph(max(__import__('networkx').connected_components(G),key=len)).copy()
home=min(G.nodes,key=lambda n:hav(n,HOME)); print('home',home,hav(home,HOME))
dist,paths=nx.single_source_dijkstra(G,home,weight='w')
def plen(p): return sum(G[a][b]['length'] for a,b in zip(p,p[1:]))
random.seed(1)
cands=[n for n in G.nodes if 1800<hav(n,home)<3800 and G.degree(n)>=3]
random.shuffle(cands)
best=[]
for A in cands[:2500]:
  for B in random.sample(cands,1):
    if not (1500<hav(A,B)<4000): continue
    p1=paths[A]
    used={frozenset(e) for e in zip(p1,p1[1:])}
    def w(u,v,d,used=used): return d['w']*(6 if frozenset((u,v)) in used else 1)
    try:
        p2=nx.dijkstra_path(G,A,B,weight=w)
        used2=used|{frozenset(e) for e in zip(p2,p2[1:])}
        def w2(u,v,d,used=used2): return d['w']*(6 if frozenset((u,v)) in used else 1)
        p3=nx.dijkstra_path(G,B,home,weight=w2)
    except nx.NetworkXNoPath: continue
    route=p1+p2[1:]+p3[1:]
    L=plen(route)
    es=[frozenset(e) for e in zip(route,route[1:])]
    over=sum(G[tuple(e)[0]][tuple(e)[1]]['length'] for e in set(es) if es.count(e)>1)
    kinds={}
    for a,b in zip(route,route[1:]): kinds[G[a][b]['kind']]=kinds.get(G[a][b]['kind'],0)+G[a][b]['length']
    sc=abs(L-12000)/100+over/100+kinds.get('path',0)/400+kinds.get('primary',0)/150
    best.append((sc,L,over,route,kinds))
  if len(best)>400: break
best.sort(key=lambda x:x[0])
for b in best[:5]: print(round(b[0],1),round(b[1]),round(b[2]),{k:round(v) for k,v in b[4].items()})
pickle.dump(best[:5],open('best.pkl','wb'))
