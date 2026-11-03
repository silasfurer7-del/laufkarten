import sys,pickle,math; sys.path.insert(0,'/home/claude/laufkarten/scripts')
from hoehe import profil
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from PIL import Image
best,img,out,name=sys.argv[1:5]
def hav(a,b):
    R=6371000; p1,p2=map(math.radians,(a[0],b[0])); dl=math.radians(b[1]-a[1]); dp=p2-p1
    h=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2; return 2*R*math.asin(math.sqrt(h))
r=pickle.load(open(best,'rb'))[0][3]
d,h,up,dn=profil(r,hav); print(round(up),round(dn),round(min(h)),round(max(h)))
m=Image.open(img); W=m.width
fig=plt.figure(figsize=(W/200,1.6),dpi=200); ax=fig.add_axes([0.06,0.2,0.92,0.72])
D=[x/1000 for x in d]; lo=min(h)-20; hi=max(max(h)+20,lo+120)
ax.fill_between(D,h,lo,color='#FC4C02',alpha=.25,lw=0); ax.plot(D,h,color='#FC4C02',lw=1.8)
ax.set_xlim(0,D[-1]); ax.set_ylim(lo,hi); ax.set_xticks(range(0,int(D[-1])+1)); ax.tick_params(labelsize=6)
for s in ['top','right']: ax.spines[s].set_visible(False)
ax.text(0.01,0.97,f'↑ {round(up)} Hm   ↓ {round(dn)} Hm   ·   {D[-1]:.1f} km',transform=ax.transAxes,fontsize=7,va='top',weight='bold')
ax.set_ylabel('m ü. M.',fontsize=6); fig.savefig('prof.png',dpi=200); p=Image.open('prof.png').convert('RGB')
o=Image.new('RGB',(W,m.height+p.height),'white'); o.paste(m.convert('RGB'),(0,0)); o.paste(p,(0,m.height)); o.save(out+'.png')
s='<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Claude" xmlns="http://www.topografix.com/GPX/1/1">\n<trk><name>'+name+'</name><trkseg>\n'
s+=''.join(f'<trkpt lat="{a}" lon="{b}"/>\n' for a,b in r)+'</trkseg></trk>\n</gpx>\n'
open(out+'.gpx','w').write(s)
